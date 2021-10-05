import { MediaPlayer, MediaPlayerClass } from 'dashjs';
import BaseTech, { IBaseTechOptions, PlaybackState } from './BaseTech';

export default class MssPlayer extends BaseTech {
  private mediaPlayer: MediaPlayerClass;

  constructor(opts: IBaseTechOptions) {
    super(opts);
    this.mediaPlayer = MediaPlayer().create();
    // this.mediaPlayer.initialize();
    // this.mediaPlayer.attachView(this.video);
  }

  load(src: string): Promise<void> {
    this.updateState({
      playbackState: PlaybackState.LOADING,
    });
    return new Promise((resolve, reject) => {
      this.mediaPlayer.initialize(this.video, src, false);
      // this.mediaPlayer.setInitialMediaSettingsFor('audio', {
      //   audioChannelConfiguration: ['F801']
      // })
      this.mediaPlayer.attachView(this.video);
      this.mediaPlayer.attachSource(src);
      this.mediaPlayer.on(MediaPlayer.events.MANIFEST_LOADED, () => {
        resolve();
      });
      this.mediaPlayer.on(MediaPlayer.events.STREAM_INITIALIZED, () => {
        console.log(
          'Stream is initialized!',
          this.mediaPlayer.getCurrentTrackFor('audio')
        );
        let audioTracks = this.mediaPlayer.getTracksFor('audio');
        console.log('(-.-)__.: yo DASH, audioTracks', audioTracks);
        this.state.audioTracks = audioTracks.map((track, idx) => ({
          id: track.index.toString(),
          label: `Track-${1 + idx}`,
          language: track.lang,
          enabled: this.audioTrack === track.index.toString(),
        }));
        audioTracks.map((t) => console.log(t.labels));
      });
      this.mediaPlayer.on(MediaPlayer.events.ERROR, (ev) => {
        reject(`Failed to load Mss Player`);
      });
    });
  }

  get isLive() {
    return this.mediaPlayer.isDynamic();
  }

  get audioTrack() {
    let audioTrackId = '0';
    let track = this.mediaPlayer.getCurrentTrackFor('audio');
    audioTrackId = track.index.toString();
    return audioTrackId;
  }

  set audioTrack(id) {
    let audioTracks = this.mediaPlayer.getTracksFor('audio');
    console.log('set audioTrack(id), id=', id);
    let track = audioTracks.find((t) => t.index === parseInt(id));
    console.log('Imma Try to set this track,', track);
    console.log('Codex BufferSink Error now?');

    this.mediaPlayer.setCurrentTrack(track);
  }

  get audioTracks() {
    return this.state.audioTracks;
  }

  // get textTrack() {

  // }

  // set textTrack(id) {

  // }

  // get textTracks() {

  // }

  // set currentLevel(level: IVideoLevel) {

  // }

  // get currentLevel() {

  // }

  // getVideoLevels() {

  // }

  destroy() {
    if (this.mediaPlayer) {
      this.mediaPlayer.reset();
      this.mediaPlayer = null;
    }
    super.destroy();
  }
}
