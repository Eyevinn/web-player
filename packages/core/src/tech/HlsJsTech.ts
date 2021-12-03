import BaseTech, {
  IBaseTechOptions,
  IVideoLevel,
  PlaybackState,
} from './BaseTech';
import Hls from 'hls.js';
import { PlayerEvent } from '../util/constants';

const DEFAULT_CONFIG = {
  capLevelOnFPSDrop: true,
  capLevelToPlayerSize: true,
};

const LIVE_EDGE = 5; // seconds from liveEdge
const LIVE_SEEKABLE_MIN_DURATION = 300; // require 5 min to allow seeking on live content

function parseMetaDataStringToObject(str: string) {
  const parsedObject = {};
  const objArr = str
    .replace(/["\\"]/g, '')
    .split(',')
    .map((entry) => entry.split('='));

  //TODO: Probably parse this differently.
  objArr.forEach((row) => {
    const key = row[0];
    const value = row[1];
    parsedObject[key] = value;
  });
  return parsedObject;
}

export default class HlsJsTech extends BaseTech {
  static isSupported() {
    return Hls.isSupported();
  }

  private hls: Hls;

  private isLiveFlag: boolean;
  private playlistDuration = 0;

  //Cacheing PDT to calculate startTime of EXT-X-DATE-RANGE
  //milliseconds
  private internalProgramDateTime = 0;

  constructor(opts: IBaseTechOptions) {
    super(opts);
    this.hls = new Hls(DEFAULT_CONFIG);

    this.hls.attachMedia(this.video);

    this.hls.on(
      Hls.Events.AUDIO_TRACK_SWITCHED,
      this.onAudioTrackChange.bind(this)
    );

    this.hls.on(Hls.Events.LEVEL_LOADED, this.onLevelLoaded.bind(this));

    //The other option would be onLevelPTSUpdated. FragBuffered is les "spammy"
    this.hls.on(Hls.Events.FRAG_BUFFERED, this.onFragBuffered.bind(this));
  }

  protected onFragBuffered(_, { frag }) {
    const tagList: string[] = frag.tagList;
    //TODO: This should be metaDataCue: Record<string, unknown> and not include .find()
    const metaData = tagList
      .filter((tag) => tag[0] === 'EXT-X-DATERANGE')
      .map((tag) => parseMetaDataStringToObject(tag[1]))
      .find((tag) => tag);

    //This is milliseconds
    const rawProgramDateTime = new Date(frag.rawProgramDateTime).getTime();

    if (!!rawProgramDateTime) {
      this.internalProgramDateTime = rawProgramDateTime;
    } else if (!this.internalProgramDateTime && !rawProgramDateTime) {
      //If rawProgramDateTime isn't available, fragPDT - fragStart get's similar result.
      const fragPDT = new Date(frag.programDateTime).getTime(); //ms
      const fragStart = new Date(frag.start / 1000).getTime(); //sec hence (/ 1000)
      this.internalProgramDateTime = fragPDT - fragStart;
    } else {
      //no-op
    }

    //Start should be bigger than PDT hence .abs()
    const metaDataStart = Math.abs(
      this.internalProgramDateTime - new Date(metaData['START-DATE']).getTime()
    );
    //Start should be bigger than PDT hence .abs()
    const metaDataEnd = Math.abs(
      this.internalProgramDateTime - new Date(metaData['END-DATE']).getTime()
    );
    //Havn't seen this yet, assuming it's milliseconds.
    const metaDataDuration = new Date(metaData['DURATION']).getTime();
    //Seconds. videoPlayer current time;
    const currentTime = this.currentTime;

    //If there's an active metaData-tag:
    //stringify object and embedd on track.ActiveCues[0]['text']
    if (metaData) {
      //TODO: Create a metaDataCue and do: (for x in y) => add cue;
      this.video
        .addTextTrack('metadata', metaData['CLASS'])
        .addCue(
          new VTTCue(
            metaDataStart, //this should match player format (seconds) now in MS
            metaDataStart + 20, // -||-
            JSON.stringify(metaData)
          )
        );
    }
  }

  load(src: string): Promise<void> {
    if (this.state.playbackState !== PlaybackState.IDLE) {
      this.stop();
    }
    this.updateState({
      playbackState: PlaybackState.LOADING,
    });
    return new Promise((resolve) => {
      this.hls.loadSource(src);
      this.hls.once(Hls.Events.MANIFEST_PARSED, () => {
        resolve();
      });
    });
  }

  protected onTimeUpdate() {
    this.updateState({
      currentTime: this.currentTime,
      duration: this.duration,
      isAtLiveEdge: this.currentTime >= this.hls.liveSyncPosition - LIVE_EDGE,
      isSeekable: this.isLive
        ? this.playlistDuration >= LIVE_SEEKABLE_MIN_DURATION
        : true,
    });
    this.emit(PlayerEvent.TIME_UPDATE, {
      currentTime: this.currentTime,
      duration: this.duration,
    });
  }

  private onLevelLoaded(event, data) {
    const isLive = data?.details?.live;
    if (this.isLiveFlag !== isLive) {
      this.isLiveFlag = isLive;
      this.updateState({
        isLive,
      });
    }

    this.playlistDuration = data?.details?.totalduration;
  }

  getVideoLevels() {
    if (this.hls) {
      const levels: IVideoLevel[] = this.hls.levels.map((level, idx) => ({
        id: idx,
        width: level.width,
        height: level.height,
        bitrate: level.bitrate,
      }));
      return levels;
    }
  }

  get currentLevel() {
    let videoLevel: IVideoLevel;
    if (this.hls) {
      videoLevel = this.getVideoLevels().find(
        (level) => level.id === this.hls.currentLevel
      );
      return videoLevel;
    }
  }

  set currentLevel(level: IVideoLevel) {
    if (this.hls) {
      if (!level) {
        this.hls.nextLevel = -1;
      } else {
        this.hls.currentLevel = level.id;
      }
    }
  }

  get currentTime() {
    return this.video.currentTime;
  }

  set currentTime(newpos: number) {
    if (this.state.isSeekable) {
      this.video.currentTime = this.isLive
        ? Math.min(newpos, this.hls.liveSyncPosition ?? newpos)
        : newpos;
    }
  }

  get isLive() {
    if (this.hls) {
      return this.isLiveFlag;
    } else {
      return isNaN(this.video.duration);
    }
  }

  get audioTrack() {
    return this.hls?.audioTrack?.toString();
  }

  set audioTrack(id) {
    if (this.hls) {
      this.hls.audioTrack = parseInt(id);
    }
  }

  get audioTracks() {
    return (
      this.hls?.audioTracks.map((audioTrack) => ({
        id: audioTrack.id.toString(),
        label: audioTrack.name,
        language: audioTrack.lang,
        enabled: this.audioTrack === audioTrack.id.toString(),
      })) || []
    )
      .reverse() // if there are duplicate languages the latest should be kept
      .filter(
        (track, index, arr) =>
          arr.findIndex(
            (comparisonTrack) => track.language === comparisonTrack.language
          ) === index
      );
  }

  seekToLive() {
    this.currentTime = this.hls.liveSyncPosition;
  }

  destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    super.destroy();
  }
}
