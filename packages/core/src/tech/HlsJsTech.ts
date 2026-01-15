import BaseTech, { IVideoLevel, PlaybackState } from './BaseTech';
import Hls from 'hls.js';
import { PlayerEvent } from '../util/constants';
import { IWebPlayerOptions } from '../WebPlayer';

const DEFAULT_CONFIG = {
  capLevelOnFPSDrop: true,
  capLevelToPlayerSize: true,
  enableInterstitialPlayback: true,
};

const LIVE_EDGE = 5; // seconds from liveEdge
const LIVE_SEEKABLE_MIN_DURATION = 300; // require 5 min to allow seeking on live content

export interface InterstitialAsset {
  identifier: string;
  uri: string;
  duration?: number;
  startOffset: number;
}

export interface InterstitialEvent {
  identifier: string;
  startTime: number;
  resumeTime: number;
  duration?: number;
  assetList: InterstitialAsset[];
  dateRange?: {
    attr: Record<string, string>;
  };
  assetListUrl?: string;
}

export interface InterstitialTrackingData {
  event: InterstitialEvent;
  asset?: InterstitialAsset;
  progress?: number;
  trackingUrls?: {
    start?: string[];
    firstQuartile?: string[];
    midpoint?: string[];
    thirdQuartile?: string[];
    complete?: string[];
  };
}

export default class HlsJsTech extends BaseTech {
  public name = 'HlsJsTech';
  static isSupported() {
    return Hls.isSupported();
  }

  private hls: Hls;

  private isLiveFlag: boolean;
  private playlistDuration = 0;

  
  private currentInterstitialAsset: InterstitialAsset | null = null;
  private currentInterstitialEvent: InterstitialEvent | null = null;
  private interstitialTrackingFired: Set<string> = new Set();
  private interstitialAssetStartTime: number = 0;
  private currentInterstitialSessionId: string | null = null;
  private trackingUrlsCache: Map<string, Promise<InterstitialTrackingData['trackingUrls']>> = new Map();
  private isPlayingAd: boolean = false;
  // Cache for signaling data captured from HLS.js asset list loads
  private assetListSignalingCache: Map<string, InterstitialTrackingData['trackingUrls']> = new Map();


  constructor(opts: IWebPlayerOptions) {
    super(opts);

    const conf = Object.assign({}, DEFAULT_CONFIG, {
      capLevelToPlayerSize: !opts.disablePlayerSizeLevelCap,
    });
    this.hls = new Hls(conf);

    this.hls.attachMedia(this.video);

    this.hls.on(
      Hls.Events.AUDIO_TRACK_SWITCHED,
      this.onAudioTrackChange.bind(this)
    );

    this.hls.on(
      Hls.Events.SUBTITLE_TRACK_SWITCH,
      this.onTextTrackChange.bind(this)
    );

    this.hls.on(Hls.Events.LEVEL_LOADED, this.onLevelLoaded.bind(this));

    this.hls.on(Hls.Events.LEVEL_SWITCHED, this.onBitrateChange.bind(this));
    this.hls.on(Hls.Events.ERROR, this.onErrorEvent.bind(this));

    
    this.hls.on(Hls.Events.INTERSTITIAL_STARTED, this.onInterstitialStarted.bind(this));
    this.hls.on(Hls.Events.INTERSTITIAL_ENDED, this.onInterstitialEnded.bind(this));
    this.hls.on(Hls.Events.INTERSTITIAL_ASSET_STARTED, this.onInterstitialAssetStarted.bind(this));
    this.hls.on(Hls.Events.INTERSTITIAL_ASSET_ENDED, this.onInterstitialAssetEnded.bind(this));

    // Capture signaling data when HLS.js loads the asset list (avoids duplicate fetch)
    this.hls.on(Hls.Events.ASSET_LIST_LOADED, this.onAssetListLoaded.bind(this));

    
  }

  load(src: string): Promise<void> {
    if (this.state.playbackState !== PlaybackState.IDLE) {
      this.stop();
    }
    super.setDefaultState();
    return new Promise((resolve) => {
      this.hls.loadSource(src);
      this.hls.once(Hls.Events.MANIFEST_PARSED, () => {
        this.removeUnsupportedLevels();
        resolve();
      });
    });
  }


  private removeUnsupportedLevels() {
    const unsupportedLevelIndex = this.hls.levels.findIndex((level) => {
      return !MediaSource.isTypeSupported(
        `video/mp4; codecs="${level.attrs.CODECS}"`
      );
    });
    if (unsupportedLevelIndex !== -1) {
      this.hls.removeLevel(unsupportedLevelIndex);
      this.removeUnsupportedLevels();
    }
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

    this.checkInterstitialQuartiles();
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
    this.emit(PlayerEvent.LOADED_METADATA, this.state);
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

  protected onBitrateChange() {
    this.emit(PlayerEvent.BITRATE_CHANGE, this.currentLevel);
  }

  protected onErrorEvent(event, data) {
    const fatal = data?.fatal;
    const errorData = this.errorFormat(data);

    this.emit(PlayerEvent.ERROR, { errorData, fatal });
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

  get isPlayingInterstitial() {
    return this.isPlayingAd;
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
    );
  }

  get textTrack() {
    return this.hls?.subtitleTrack?.toString();
  }

  set textTrack(id) {
    if (this.hls) {
      if (!id) {
        this.hls.subtitleTrack = -1;
      } else {
        this.hls.subtitleTrack = parseInt(id);
      }
    }
  }

  get textTracks() {
    return (
      this.hls?.subtitleTracks.map((textTrack) => ({
        id: textTrack.id.toString(),
        label: textTrack.name,
        language: textTrack.lang,
        enabled: this.textTrack === textTrack.id.toString(),
      })) || []
    );
  }

  seekToLive() {
    this.currentTime = this.hls.liveSyncPosition;
  }

  errorFormat(data) {
    let errorData = {
      category: data?.type, // optional, eg. NETWORK, DECODER, etc.
      code: '-1',
      message: '', // optional
      data: data, // optional
    };
    const errorDetails = data?.details;
    switch (errorDetails) {
      //All Fatal
      case Hls.ErrorDetails.MANIFEST_LOAD_ERROR:
      case Hls.ErrorDetails.LEVEL_LOAD_ERROR:
      case Hls.ErrorDetails.FRAG_LOAD_ERROR: //fatal = true || false
        (errorData.code = `${data.response.code}`),
          (errorData.message = data.response.text);
        break;
      case Hls.ErrorDetails.MANIFEST_PARSING_ERROR:
        errorData.message = data.reason;
        break;
      case Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT:
      case Hls.ErrorDetails.FRAG_LOAD_TIMEOUT: //fatal = true || false
      case Hls.ErrorDetails.KEY_LOAD_TIMEOUT:
        break;
      //Non Fatal
      case Hls.ErrorDetails.AUDIO_TRACK_LOAD_ERROR:
      case Hls.ErrorDetails.KEY_LOAD_ERROR:
        (errorData.code = `${data.response.code}`),
          (errorData.message = data.response.text);
        break;
      case Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT:
      case Hls.ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT:
      default:
    }

    return errorData;
  }

  // Interstitial handlers

  /**
   * Capture signaling data when HLS.js loads asset list (no duplicate fetch needed)
   */
  private onAssetListLoaded(_event: string, data: any) {

    const interstitialId = data?.event?.identifier;
    const assetListResponse = data?.assetListResponse;

    if (interstitialId && assetListResponse) {
      // Extract signaling data from HLS.js's fetch response
      // Check ASSETS array first (where tracking URLs actually are), then top level
      let signaling = assetListResponse.ASSETS?.[0]?.['X-AD-CREATIVE-SIGNALING'];
      if (!signaling?.payload?.tracking) {
        signaling = assetListResponse['X-AD-CREATIVE-SIGNALING'];
      }
      if (signaling?.payload?.tracking) {
        const trackingUrls: InterstitialTrackingData['trackingUrls'] = {
          start: [],
          firstQuartile: [],
          midpoint: [],
          thirdQuartile: [],
          complete: [],
        };

        for (const trackItem of signaling.payload.tracking) {
          const type = trackItem.type;
          const urls = trackItem.urls || [];
          if (type === 'start') trackingUrls.start.push(...urls);
          else if (type === 'firstQuartile') trackingUrls.firstQuartile.push(...urls);
          else if (type === 'midpoint') trackingUrls.midpoint.push(...urls);
          else if (type === 'thirdQuartile') trackingUrls.thirdQuartile.push(...urls);
          else if (type === 'complete') trackingUrls.complete.push(...urls);
        }

        this.assetListSignalingCache.set(interstitialId, trackingUrls);

        // If an asset is already playing, update its tracking URLs and fire start tracking
        if (this.currentInterstitialAsset && this.currentInterstitialEvent?.identifier === interstitialId) {
          (this.currentInterstitialEvent as any)._trackingUrls = trackingUrls;

          // Fire start tracking now (since onInterstitialAssetStarted already fired without URLs)
          this.fireTrackingUrls(trackingUrls.start, this.currentInterstitialAsset.identifier, 'start');
        }
      }
    }
  }

  private async onInterstitialStarted(_event: string, data: { event: InterstitialEvent }) {
    const interstitialEvent = data.event;
    
    
    const sessionId = `${interstitialEvent.identifier}-${Date.now()}`;
    
    if (this.currentInterstitialSessionId !== sessionId) {
      this.interstitialTrackingFired.clear();
      this.currentInterstitialSessionId = sessionId;
    }

    const ic = (this.hls as any).interstitialsController;

    const hlsUrl = this.hls.url;
    const primaryIdMatch = hlsUrl?.match(/_HLS_primary_id=([^&]+)/);


    const trackingData: InterstitialTrackingData = {
      event: interstitialEvent,
      trackingUrls: (interstitialEvent as any)._trackingUrls,
    };

    this.emit(PlayerEvent.INTERSTITIAL_STARTED, trackingData);
  }

  private onInterstitialEnded(_event: string, data: { event: InterstitialEvent }) {
    const interstitialEvent = data.event;

    const trackingData: InterstitialTrackingData = {
      event: interstitialEvent,
    };

    this.emit(PlayerEvent.INTERSTITIAL_ENDED, trackingData);
    this.currentInterstitialAsset = null;
    this.currentInterstitialEvent = null;
    this.currentInterstitialSessionId = null;
    
    // Clear caches
    this.trackingUrlsCache.delete(interstitialEvent.identifier);
    this.assetListSignalingCache.delete(interstitialEvent.identifier);
  }

  private async onInterstitialAssetStarted(_event: string, data: { event: InterstitialEvent; asset: InterstitialAsset }) {
    const { event: interstitialEvent, asset } = data;
    this.currentInterstitialAsset = asset;
    this.currentInterstitialEvent = interstitialEvent;
    this.isPlayingAd = true;  
    
    
    this.interstitialAssetStartTime = 0;

    // Get tracking URLs from ASSET_LIST_LOADED cache (should be populated by now)
    let trackingUrls = this.assetListSignalingCache.get(interstitialEvent.identifier);
    if (trackingUrls) {
      (interstitialEvent as any)._trackingUrls = trackingUrls;
    }

    // Fallback: try extracting from event data
    if (!trackingUrls) {
      trackingUrls = this.extractTrackingUrls(interstitialEvent);
      if (trackingUrls) {
        (interstitialEvent as any)._trackingUrls = trackingUrls;
      }
    }


    // Fire 'start' tracking URLs
    this.fireTrackingUrls(trackingUrls?.start, asset.identifier, 'start');

    // Store tracking URLs on the current event so checkQuartiles can use them
    (this.currentInterstitialEvent as any)._trackingUrls = trackingUrls;

    const trackingData: InterstitialTrackingData = {
      event: interstitialEvent,
      asset,
      progress: 0,
      trackingUrls,
    };

    this.emit(PlayerEvent.INTERSTITIAL_ASSET_STARTED, trackingData);
  }

  private onInterstitialAssetEnded(_event: string, data: { event: InterstitialEvent; asset: InterstitialAsset }) {
    const { event: interstitialEvent, asset } = data;

    // Use tracking URLs stored on the event
    const trackingUrls = (this.currentInterstitialEvent as any)?._trackingUrls;

    // Fire 'complete' tracking URLs
    this.fireTrackingUrls(trackingUrls?.complete, asset.identifier, 'complete');

    const trackingData: InterstitialTrackingData = {
      event: interstitialEvent,
      asset,
      progress: 100,
      trackingUrls,
    };

    this.emit(PlayerEvent.INTERSTITIAL_ASSET_ENDED, trackingData);
    this.currentInterstitialAsset = null;
    this.currentInterstitialEvent = null;
    this.interstitialAssetStartTime = 0;
    this.isPlayingAd = false;  // clear the ad playing flag
  }

  private async fetchTrackingFromAssetListUrl(assetListUrl: string): Promise<InterstitialTrackingData['trackingUrls']> {
    try {
      const response = await fetch(assetListUrl, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'  
      });
      
      if (!response.ok) {
        return undefined;
      }
      
      const data = await response.json();
      
      // Extract tracking from the ASSETS array
      if (data.ASSETS && Array.isArray(data.ASSETS)) {
        const allTrackingUrls: InterstitialTrackingData['trackingUrls'] = {
          start: [],
          firstQuartile: [],
          midpoint: [],
          thirdQuartile: [],
          complete: [],
        };

        for (const asset of data.ASSETS) {
          const signaling = asset['X-AD-CREATIVE-SIGNALING'];
          if (signaling?.payload?.tracking) {
            for (const trackItem of signaling.payload.tracking) {
              const type = trackItem.type;
              const urls = trackItem.urls || [];
              if (type === 'start') allTrackingUrls.start.push(...urls);
              else if (type === 'firstQuartile') allTrackingUrls.firstQuartile.push(...urls);
              else if (type === 'midpoint') allTrackingUrls.midpoint.push(...urls);
              else if (type === 'thirdQuartile') allTrackingUrls.thirdQuartile.push(...urls);
              else if (type === 'complete') allTrackingUrls.complete.push(...urls);
            }
          }
        }

        if (allTrackingUrls.start.length > 0) {
          console.log('[Interstitials] Successfully extracted tracking URLs from asset list');
          return allTrackingUrls;
        }
      }
    } catch (e) {
      console.warn('[Interstitials] Failed to fetch tracking from asset list URL:', e);
    }
    return undefined;
  }

  private extractTrackingUrls(interstitialEvent: InterstitialEvent): InterstitialTrackingData['trackingUrls'] {
    try {
      
      // extract tracking from assetList
      const assetList = interstitialEvent.assetList;
      if (assetList && assetList.length > 0) {
        const allTrackingUrls: InterstitialTrackingData['trackingUrls'] = {
          start: [],
          firstQuartile: [],
          midpoint: [],
          thirdQuartile: [],
          complete: [],
        };

        for (const asset of assetList) {
          // The X-AD-CREATIVE-SIGNALING 
          const signaling = (asset as any)['X-AD-CREATIVE-SIGNALING'];
          if (signaling?.payload?.tracking) {
            const trackingArray = signaling.payload.tracking;
            for (const trackItem of trackingArray) {
              const type = trackItem.type;
              const urls = trackItem.urls || [];
              if (type === 'start') allTrackingUrls.start.push(...urls);
              else if (type === 'firstQuartile') allTrackingUrls.firstQuartile.push(...urls);
              else if (type === 'midpoint') allTrackingUrls.midpoint.push(...urls);
              else if (type === 'thirdQuartile') allTrackingUrls.thirdQuartile.push(...urls);
              else if (type === 'complete') allTrackingUrls.complete.push(...urls);
            }
          }
        }

        if (allTrackingUrls.start.length > 0 || allTrackingUrls.complete.length > 0) {
          return allTrackingUrls;
        }
      }

      const attr = interstitialEvent.dateRange?.attr;
      if (attr) {
        const signalingData = attr['X-AD-CREATIVE-SIGNALING'];
        if (signalingData) {
          const parsed = typeof signalingData === 'string' ? JSON.parse(signalingData) : signalingData;

          if (parsed?.payload?.tracking) {
            const allTrackingUrls: InterstitialTrackingData['trackingUrls'] = {
              start: [],
              firstQuartile: [],
              midpoint: [],
              thirdQuartile: [],
              complete: [],
            };

            for (const trackItem of parsed.payload.tracking) {
              const type = trackItem.type;
              const urls = trackItem.urls || [];
              if (type === 'start') allTrackingUrls.start.push(...urls);
              else if (type === 'firstQuartile') allTrackingUrls.firstQuartile.push(...urls);
              else if (type === 'midpoint') allTrackingUrls.midpoint.push(...urls);
              else if (type === 'thirdQuartile') allTrackingUrls.thirdQuartile.push(...urls);
              else if (type === 'complete') allTrackingUrls.complete.push(...urls);
            }

            return allTrackingUrls;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse interstitial tracking data:', e);
    }
    return undefined;
  }

  private fireTrackingUrls(urls: string[] | undefined, assetId: string, eventType: string) {
    if (!urls || urls.length === 0) return;

    for (const url of urls) {
      const trackingKey = `${url}-${eventType}`;
      if (this.interstitialTrackingFired.has(trackingKey)) {
        return; // if already fired, duplicate
      }

      this.interstitialTrackingFired.add(trackingKey);

      fetch(url, { mode: 'no-cors', keepalive: true }).catch(() => {
        // ignore tracking failures
      });
    }
  }

  private checkInterstitialQuartiles() {
    if (!this.currentInterstitialAsset || !this.currentInterstitialEvent) return;

    const asset = this.currentInterstitialAsset;
    const assetDuration = asset.duration;
    if (!assetDuration || assetDuration <= 0) return;

    const elapsed = this.video.currentTime - this.interstitialAssetStartTime;
    const progress = (elapsed / assetDuration) * 100;

    const trackingUrls = (this.currentInterstitialEvent as any)._trackingUrls;
    if (!trackingUrls) {
      return;
    }

    if (progress >= 25 && progress < 50) {
      this.fireTrackingUrls(trackingUrls.firstQuartile, asset.identifier, 'firstQuartile');
    } else if (progress >= 50 && progress < 75) {
      this.fireTrackingUrls(trackingUrls.midpoint, asset.identifier, 'midpoint');
    } else if (progress >= 75 && progress < 100) {
      this.fireTrackingUrls(trackingUrls.thirdQuartile, asset.identifier, 'thirdQuartile');
    }
  }

  destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    super.destroy();
  }
}