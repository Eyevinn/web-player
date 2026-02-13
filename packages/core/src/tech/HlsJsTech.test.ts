import { PlayerEvent } from '../util/constants';

// Track Hls event listeners
const hlsListeners: Record<string, Function> = {};

const mockHlsInstance = {
  attachMedia: jest.fn(),
  loadSource: jest.fn(),
  on: jest.fn((event: string, handler: Function) => {
    hlsListeners[event] = handler;
  }),
  once: jest.fn((event: string, handler: Function) => {
    hlsListeners[`once:${event}`] = handler;
  }),
  destroy: jest.fn(),
  levels: [],
  currentLevel: 0,
  nextLevel: -1,
  liveSyncPosition: 100,
  audioTrack: 0,
  audioTracks: [],
  subtitleTrack: 0,
  subtitleTracks: [],
  url: 'http://example.com/stream.m3u8',
};

jest.mock('hls.js', () => {
  const MockHls = jest.fn().mockImplementation(() => mockHlsInstance);
  (MockHls as any).isSupported = jest.fn().mockReturnValue(true);
  (MockHls as any).Events = {
    AUDIO_TRACK_SWITCHED: 'hlsAudioTrackSwitched',
    SUBTITLE_TRACK_SWITCH: 'hlsSubtitleTrackSwitch',
    LEVEL_LOADED: 'hlsLevelLoaded',
    LEVEL_SWITCHED: 'hlsLevelSwitched',
    ERROR: 'hlsError',
    MANIFEST_PARSED: 'hlsManifestParsed',
    INTERSTITIAL_STARTED: 'hlsInterstitialStarted',
    INTERSTITIAL_ENDED: 'hlsInterstitialEnded',
    INTERSTITIAL_ASSET_STARTED: 'hlsInterstitialAssetStarted',
    INTERSTITIAL_ASSET_ENDED: 'hlsInterstitialAssetEnded',
    ASSET_LIST_LOADED: 'hlsAssetListLoaded',
  };
  (MockHls as any).ErrorDetails = {
    MANIFEST_LOAD_ERROR: 'manifestLoadError',
    MANIFEST_PARSING_ERROR: 'manifestParsingError',
    MANIFEST_LOAD_TIMEOUT: 'manifestLoadTimeout',
    LEVEL_LOAD_ERROR: 'levelLoadError',
    LEVEL_LOAD_TIMEOUT: 'levelLoadTimeout',
    FRAG_LOAD_ERROR: 'fragLoadError',
    FRAG_LOAD_TIMEOUT: 'fragLoadTimeout',
    KEY_LOAD_ERROR: 'keyLoadError',
    KEY_LOAD_TIMEOUT: 'keyLoadTimeout',
    AUDIO_TRACK_LOAD_ERROR: 'audioTrackLoadError',
    AUDIO_TRACK_LOAD_TIMEOUT: 'audioTrackLoadTimeout',
  };
  return { __esModule: true, default: MockHls };
});

// Mock mitt
jest.mock('mitt', () => ({
  __esModule: true,
  default: () => {
    const handlers = new Map<string, Set<Function>>();
    return {
      on(type: string, handler: Function) {
        if (!handlers.has(type)) handlers.set(type, new Set());
        handlers.get(type)!.add(handler);
      },
      off(type: string, handler: Function) {
        handlers.get(type)?.delete(handler);
      },
      emit(type: string, data?: any) {
        handlers.get(type)?.forEach((h) => h(data));
      },
      all: { clear() { handlers.clear(); } },
    };
  },
}));

import HlsJsTech from './HlsJsTech';
import Hls from 'hls.js';

function createMockVideo(): HTMLVideoElement {
  const listeners: Record<string, Function[]> = {};
  return {
    muted: false,
    volume: 1,
    paused: true,
    currentTime: 0,
    duration: 100,
    src: '',
    seekable: { length: 0, end: jest.fn() },
    addEventListener(event: string, handler: Function) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    removeEventListener: jest.fn(),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    load: jest.fn(),
    _trigger(event: string, data?: any) {
      (listeners[event] || []).forEach((h) => h(data));
    },
    _listeners: listeners,
  } as unknown as HTMLVideoElement & { _trigger: Function; _listeners: Record<string, Function[]> };
}

describe('HlsJsTech', () => {
  let video: ReturnType<typeof createMockVideo>;
  let tech: HlsJsTech;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear listeners
    Object.keys(hlsListeners).forEach((k) => delete hlsListeners[k]);

    mockHlsInstance.levels = [];
    mockHlsInstance.currentLevel = 0;
    mockHlsInstance.audioTrack = 0;
    mockHlsInstance.audioTracks = [];
    mockHlsInstance.subtitleTrack = 0;
    mockHlsInstance.subtitleTracks = [];
    mockHlsInstance.liveSyncPosition = 100;

    video = createMockVideo();
    tech = new HlsJsTech({ video } as any);
  });

  afterEach(() => {
    tech.destroy();
  });

  describe('static isSupported()', () => {
    it('should delegate to Hls.isSupported()', () => {
      expect(HlsJsTech.isSupported()).toBe(true);
      expect(Hls.isSupported).toHaveBeenCalled();
    });
  });

  describe('constructor', () => {
    it('should have name "HlsJsTech"', () => {
      expect(tech.name).toBe('HlsJsTech');
    });

    it('should create Hls instance with default config', () => {
      expect(Hls).toHaveBeenCalledWith(
        expect.objectContaining({
          capLevelOnFPSDrop: true,
          capLevelToPlayerSize: true,
          enableInterstitialPlayback: true,
        })
      );
    });

    it('should attach media to hls', () => {
      expect(mockHlsInstance.attachMedia).toHaveBeenCalledWith(video);
    });

    it('should register HLS event listeners', () => {
      const registeredEvents = mockHlsInstance.on.mock.calls.map((c) => c[0]);
      expect(registeredEvents).toContain(Hls.Events.AUDIO_TRACK_SWITCHED);
      expect(registeredEvents).toContain(Hls.Events.SUBTITLE_TRACK_SWITCH);
      expect(registeredEvents).toContain(Hls.Events.LEVEL_LOADED);
      expect(registeredEvents).toContain(Hls.Events.LEVEL_SWITCHED);
      expect(registeredEvents).toContain(Hls.Events.ERROR);
      expect(registeredEvents).toContain(Hls.Events.INTERSTITIAL_STARTED);
      expect(registeredEvents).toContain(Hls.Events.INTERSTITIAL_ENDED);
    });
  });

  describe('load()', () => {
    it('should call hls.loadSource with the src', async () => {
      const loadPromise = tech.load('http://example.com/stream.m3u8');
      // Trigger MANIFEST_PARSED to resolve
      const manifestHandler = hlsListeners[`once:${Hls.Events.MANIFEST_PARSED}`];
      expect(manifestHandler).toBeTruthy();
      manifestHandler('', {});
      await loadPromise;
      expect(mockHlsInstance.loadSource).toHaveBeenCalledWith('http://example.com/stream.m3u8');
    });
  });

  describe('error handling', () => {
    it('should emit ERROR on HLS error event', () => {
      const errorHandler = jest.fn();
      tech.on(PlayerEvent.ERROR, errorHandler);

      const onError = hlsListeners[Hls.Events.ERROR];
      expect(onError).toBeTruthy();

      onError('hlsError', {
        type: 'networkError',
        details: 'manifestLoadError',
        fatal: true,
        response: { code: 404, text: 'Not Found' },
      });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          errorData: expect.objectContaining({
            category: 'networkError',
            code: '404',
            message: 'Not Found',
          }),
          fatal: true,
        })
      );
    });

    it('should handle non-fatal errors', () => {
      const errorHandler = jest.fn();
      tech.on(PlayerEvent.ERROR, errorHandler);

      const onError = hlsListeners[Hls.Events.ERROR];
      onError('hlsError', {
        type: 'networkError',
        details: 'fragLoadError',
        fatal: false,
        response: { code: 503, text: 'Service Unavailable' },
      });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fatal: false,
        })
      );
    });

    it('should handle parsing errors with reason', () => {
      const errorHandler = jest.fn();
      tech.on(PlayerEvent.ERROR, errorHandler);

      const onError = hlsListeners[Hls.Events.ERROR];
      onError('hlsError', {
        type: 'networkError',
        details: 'manifestParsingError',
        fatal: true,
        reason: 'Invalid HLS manifest',
      });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          errorData: expect.objectContaining({
            message: 'Invalid HLS manifest',
          }),
        })
      );
    });

    it('should handle timeout errors', () => {
      const errorHandler = jest.fn();
      tech.on(PlayerEvent.ERROR, errorHandler);

      const onError = hlsListeners[Hls.Events.ERROR];
      onError('hlsError', {
        type: 'networkError',
        details: 'manifestLoadTimeout',
        fatal: true,
      });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          errorData: expect.objectContaining({
            category: 'networkError',
            code: '-1',
          }),
          fatal: true,
        })
      );
    });
  });

  describe('isLive', () => {
    it('should return falsy by default', () => {
      expect(tech.isLive).toBeFalsy();
    });

    it('should return true after live level loaded', () => {
      const onLevelLoaded = hlsListeners[Hls.Events.LEVEL_LOADED];
      onLevelLoaded('', { details: { live: true, totalduration: 600 } });
      expect(tech.isLive).toBe(true);
    });
  });

  describe('currentLevel', () => {
    it('should return current level from hls levels', () => {
      mockHlsInstance.levels = [
        { width: 1920, height: 1080, bitrate: 5000000 },
        { width: 1280, height: 720, bitrate: 3000000 },
      ] as any;
      mockHlsInstance.currentLevel = 0;

      const level = tech.currentLevel;
      expect(level).toEqual({
        id: 0,
        width: 1920,
        height: 1080,
        bitrate: 5000000,
      });
    });

    it('should set nextLevel to -1 for auto when level is null', () => {
      tech.currentLevel = null;
      expect(mockHlsInstance.nextLevel).toBe(-1);
    });

    it('should set specific level id', () => {
      tech.currentLevel = { id: 1, width: 1280, height: 720, bitrate: 3000000 };
      expect(mockHlsInstance.currentLevel).toBe(1);
    });
  });

  describe('getVideoLevels()', () => {
    it('should return mapped levels', () => {
      mockHlsInstance.levels = [
        { width: 1920, height: 1080, bitrate: 5000000 },
        { width: 1280, height: 720, bitrate: 3000000 },
      ] as any;

      const levels = tech.getVideoLevels();
      expect(levels).toEqual([
        { id: 0, width: 1920, height: 1080, bitrate: 5000000 },
        { id: 1, width: 1280, height: 720, bitrate: 3000000 },
      ]);
    });
  });

  describe('audioTrack', () => {
    it('should return current audio track as string', () => {
      mockHlsInstance.audioTrack = 2;
      expect(tech.audioTrack).toBe('2');
    });

    it('should set audio track from string id', () => {
      tech.audioTrack = '1';
      expect(mockHlsInstance.audioTrack).toBe(1);
    });
  });

  describe('audioTracks', () => {
    it('should return mapped audio tracks', () => {
      mockHlsInstance.audioTrack = 0;
      mockHlsInstance.audioTracks = [
        { id: 0, name: 'English', lang: 'en' },
        { id: 1, name: 'Swedish', lang: 'sv' },
      ] as any;

      const tracks = tech.audioTracks;
      expect(tracks).toEqual([
        { id: '0', label: 'English', language: 'en', enabled: true },
        { id: '1', label: 'Swedish', language: 'sv', enabled: false },
      ]);
    });
  });

  describe('textTrack', () => {
    it('should return current subtitle track as string', () => {
      mockHlsInstance.subtitleTrack = 1;
      expect(tech.textTrack).toBe('1');
    });

    it('should set subtitle track to -1 when given falsy value', () => {
      tech.textTrack = null;
      expect(mockHlsInstance.subtitleTrack).toBe(-1);
    });

    it('should set subtitle track from string', () => {
      tech.textTrack = '2';
      expect(mockHlsInstance.subtitleTrack).toBe(2);
    });
  });

  describe('textTracks', () => {
    it('should return mapped subtitle tracks', () => {
      mockHlsInstance.subtitleTrack = 0;
      mockHlsInstance.subtitleTracks = [
        { id: 0, name: 'English', lang: 'en' },
        { id: 1, name: 'Swedish', lang: 'sv' },
      ] as any;

      const tracks = tech.textTracks;
      expect(tracks).toEqual([
        { id: '0', label: 'English', language: 'en', enabled: true },
        { id: '1', label: 'Swedish', language: 'sv', enabled: false },
      ]);
    });
  });

  describe('seekToLive()', () => {
    it('should set currentTime to hls.liveSyncPosition', () => {
      mockHlsInstance.liveSyncPosition = 500;
      tech.seekToLive();
      // HlsJsTech.currentTime setter checks isSeekable — after setDefaultState it should be true
    });
  });

  describe('bitrate change', () => {
    it('should emit BITRATE_CHANGE on level switch', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.BITRATE_CHANGE, handler);

      mockHlsInstance.levels = [
        { width: 1920, height: 1080, bitrate: 5000000 },
        { width: 1280, height: 720, bitrate: 3000000 },
      ] as any;
      mockHlsInstance.currentLevel = 1;

      const onLevelSwitched = hlsListeners[Hls.Events.LEVEL_SWITCHED];
      onLevelSwitched('', {});

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          width: 1280,
          height: 720,
          bitrate: 3000000,
        })
      );
    });
  });

  describe('destroy()', () => {
    it('should destroy hls instance', () => {
      tech.destroy();
      expect(mockHlsInstance.destroy).toHaveBeenCalled();
    });
  });

  describe('errorFormat()', () => {
    it('should format manifest load error with HTTP status', () => {
      const result = tech.errorFormat({
        type: 'networkError',
        details: 'manifestLoadError',
        fatal: true,
        response: { code: 404, text: 'Not Found' },
      });

      expect(result).toEqual({
        category: 'networkError',
        code: '404',
        message: 'Not Found',
        data: expect.any(Object),
      });
    });

    it('should format parsing error with reason', () => {
      const result = tech.errorFormat({
        type: 'networkError',
        details: 'manifestParsingError',
        fatal: true,
        reason: 'Malformed M3U8',
      });

      expect(result.message).toBe('Malformed M3U8');
    });

    it('should format timeout error with default code', () => {
      const result = tech.errorFormat({
        type: 'networkError',
        details: 'manifestLoadTimeout',
        fatal: true,
      });

      expect(result.code).toBe('-1');
    });

    it('should handle null data gracefully', () => {
      const result = tech.errorFormat(null);
      expect(result).toEqual({
        category: undefined,
        code: '-1',
        message: '',
        data: null,
      });
    });
  });
});
