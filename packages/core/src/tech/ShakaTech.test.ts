import { PlayerEvent } from '../util/constants';

// Mock shaka-player
const mockShakaPlayer = {
  configure: jest.fn(),
  addEventListener: jest.fn(),
  attach: jest.fn().mockResolvedValue(undefined),
  load: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn(),
  isLive: jest.fn().mockReturnValue(false),
  seekRange: jest.fn().mockReturnValue({ start: 0, end: 100 }),
  getVariantTracks: jest.fn().mockReturnValue([]),
  getTextTracks: jest.fn().mockReturnValue([]),
  getAudioLanguages: jest.fn().mockReturnValue([]),
  selectAudioLanguage: jest.fn(),
  selectTextTrack: jest.fn(),
  setTextTrackVisibility: jest.fn(),
  isTextTrackVisible: jest.fn().mockReturnValue(false),
  selectVariantTrack: jest.fn(),
};

jest.mock('shaka-player', () => ({
  __esModule: true,
  default: {
    polyfill: {
      installAll: jest.fn(),
    },
    Player: jest.fn().mockImplementation(() => mockShakaPlayer),
  },
}));

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

import DashPlayer from './ShakaTech';
// @ts-ignore - shaka-player types don't export as module, but our mock does
import shaka from 'shaka-player';

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

describe('ShakaTech (DashPlayer)', () => {
  let video: ReturnType<typeof createMockVideo>;
  let tech: DashPlayer;

  beforeEach(() => {
    jest.clearAllMocks();
    video = createMockVideo();
    tech = new DashPlayer({ video } as any);
  });

  afterEach(() => {
    tech.destroy();
  });

  describe('constructor', () => {
    it('should call shaka.polyfill.installAll()', () => {
      expect(shaka.polyfill.installAll).toHaveBeenCalled();
    });

    it('should create a shaka.Player instance', () => {
      expect(shaka.Player).toHaveBeenCalled();
    });

    it('should have name "ShakaTech"', () => {
      expect(tech.name).toBe('ShakaTech');
    });

    it('should configure ABR restrictToElementSize based on options', () => {
      expect(mockShakaPlayer.configure).toHaveBeenCalledWith(
        expect.objectContaining({
          abr: expect.objectContaining({ restrictToElementSize: true }),
        })
      );
    });

    it('should register event listeners on shakaPlayer', () => {
      expect(mockShakaPlayer.addEventListener).toHaveBeenCalledWith(
        'variantchanged',
        expect.any(Function)
      );
      expect(mockShakaPlayer.addEventListener).toHaveBeenCalledWith(
        'adaptation',
        expect.any(Function)
      );
      expect(mockShakaPlayer.addEventListener).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
    });
  });

  describe('load()', () => {
    it('should attach and load the source', async () => {
      await tech.load('http://example.com/stream.mpd');
      expect(mockShakaPlayer.attach).toHaveBeenCalledWith(video);
      expect(mockShakaPlayer.load).toHaveBeenCalledWith('http://example.com/stream.mpd');
    });

    it('should emit ERROR on load failure', async () => {
      const loadError = {
        severity: 2,
        category: 1,
        code: 1001,
        data: ['', 'Failed to fetch manifest'],
      };
      mockShakaPlayer.load.mockRejectedValueOnce(loadError);

      const errorHandler = jest.fn();
      tech.on(PlayerEvent.ERROR, errorHandler);

      await expect(tech.load('http://bad.url/stream.mpd')).rejects.toEqual(loadError);

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          errorData: expect.objectContaining({
            category: '1',
            code: '1001',
            message: 'Failed to fetch manifest',
          }),
          fatal: true,
        })
      );
    });

    it('should set fatal=false for severity <= 1', async () => {
      const loadError = {
        severity: 1,
        category: 2,
        code: 2001,
        data: ['', 'Recoverable error'],
      };
      mockShakaPlayer.load.mockRejectedValueOnce(loadError);

      const errorHandler = jest.fn();
      tech.on(PlayerEvent.ERROR, errorHandler);

      await expect(tech.load('http://example.com/stream.mpd')).rejects.toEqual(loadError);

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({ fatal: false })
      );
    });

    it('should handle null error gracefully', async () => {
      mockShakaPlayer.load.mockRejectedValueOnce(null);

      const errorHandler = jest.fn();
      tech.on(PlayerEvent.ERROR, errorHandler);

      await expect(tech.load('http://example.com/stream.mpd')).rejects.toBeNull();

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          errorData: expect.objectContaining({
            category: 'unknown',
            code: '-1',
            message: 'Shaka error',
          }),
          fatal: true,
        })
      );
    });
  });

  describe('onError (runtime error)', () => {
    it('should emit ERROR on shaka error event', () => {
      const errorHandler = jest.fn();
      tech.on(PlayerEvent.ERROR, errorHandler);

      // Find the 'error' listener registered on shakaPlayer
      const errorListenerCall = mockShakaPlayer.addEventListener.mock.calls.find(
        (call) => call[0] === 'error'
      );
      expect(errorListenerCall).toBeTruthy();

      const onError = errorListenerCall![1];
      onError({
        detail: {
          severity: 2,
          category: 1,
          code: 1002,
          data: ['', 'Network error'],
        },
      });

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          errorData: expect.objectContaining({
            category: '1',
            code: '1002',
            message: 'Network error',
          }),
          fatal: true,
        })
      );
    });
  });

  describe('isLive', () => {
    it('should delegate to shakaPlayer.isLive()', () => {
      mockShakaPlayer.isLive.mockReturnValue(true);
      expect(tech.isLive).toBe(true);
      expect(mockShakaPlayer.isLive).toHaveBeenCalled();
    });
  });

  describe('duration', () => {
    it('should return seekRange end - start', () => {
      mockShakaPlayer.seekRange.mockReturnValue({ start: 10, end: 110 });
      expect(tech.duration).toBe(100);
    });

    it('should return 0 if seekRange is zero-length', () => {
      mockShakaPlayer.seekRange.mockReturnValue({ start: 0, end: 0 });
      expect(tech.duration).toBe(0);
    });
  });

  describe('audioTrack', () => {
    it('should return active track language', () => {
      mockShakaPlayer.getVariantTracks.mockReturnValue([
        { active: true, language: 'en' },
        { active: false, language: 'sv' },
      ]);
      expect(tech.audioTrack).toBe('en');
    });

    it('should set audio language', () => {
      tech.audioTrack = 'sv';
      expect(mockShakaPlayer.selectAudioLanguage).toHaveBeenCalledWith('sv');
    });
  });

  describe('audioTracks', () => {
    it('should return mapped audio languages', () => {
      mockShakaPlayer.getAudioLanguages.mockReturnValue(['en', 'sv']);
      mockShakaPlayer.getVariantTracks.mockReturnValue([
        { active: true, language: 'en' },
      ]);

      const tracks = tech.audioTracks;
      expect(tracks).toHaveLength(2);
      expect(tracks[0]).toEqual({
        id: 'en',
        language: 'en',
        label: 'en',
        enabled: true,
      });
      expect(tracks[1]).toEqual({
        id: 'sv',
        language: 'sv',
        label: 'sv',
        enabled: false,
      });
    });
  });

  describe('textTrack', () => {
    it('should return null when no text track visible', () => {
      mockShakaPlayer.getTextTracks.mockReturnValue([
        { active: true, id: '1', label: 'English', language: 'en' },
      ]);
      mockShakaPlayer.isTextTrackVisible.mockReturnValue(false);
      expect(tech.textTrack).toBeNull();
    });

    it('should return track id when visible', () => {
      mockShakaPlayer.getTextTracks.mockReturnValue([
        { active: true, id: '1', label: 'English', language: 'en' },
      ]);
      mockShakaPlayer.isTextTrackVisible.mockReturnValue(true);
      expect(tech.textTrack).toBe('1|English|en');
    });

    it('should set text track visibility and select track', () => {
      mockShakaPlayer.getTextTracks.mockReturnValue([
        { id: '1', label: 'English', language: 'en' },
        { id: '2', label: 'Swedish', language: 'sv' },
      ]);
      tech.textTrack = '2|Swedish|sv';
      expect(mockShakaPlayer.setTextTrackVisibility).toHaveBeenCalledWith(true);
      expect(mockShakaPlayer.selectTextTrack).toHaveBeenCalledWith(
        expect.objectContaining({ id: '2', label: 'Swedish', language: 'sv' })
      );
    });

    it('should hide text tracks when set to null/falsy', () => {
      tech.textTrack = null;
      expect(mockShakaPlayer.setTextTrackVisibility).toHaveBeenCalledWith(false);
    });
  });

  describe('textTracks', () => {
    it('should return deduplicated text tracks', () => {
      mockShakaPlayer.getTextTracks.mockReturnValue([
        { id: '1', label: 'English', language: 'en', active: false },
        { id: '2', label: 'English', language: 'en', active: false }, // duplicate
        { id: '3', label: 'Swedish', language: 'sv', active: false },
      ]);
      mockShakaPlayer.isTextTrackVisible.mockReturnValue(false);

      const tracks = tech.textTracks;
      expect(tracks).toHaveLength(2);
      expect(tracks.map((t) => t.language)).toEqual(['en', 'sv']);
    });
  });

  describe('currentLevel', () => {
    it('should return current active variant track', () => {
      mockShakaPlayer.getVariantTracks.mockReturnValue([
        { id: 1, width: 1920, height: 1080, bandwidth: 5000000, active: true },
        { id: 2, width: 1280, height: 720, bandwidth: 3000000, active: false },
      ]);
      const level = tech.currentLevel;
      expect(level).toEqual({
        id: 1,
        width: 1920,
        height: 1080,
        bitrate: 5000000,
      });
    });

    it('should enable ABR when set to null', () => {
      tech.currentLevel = null;
      expect(mockShakaPlayer.configure).toHaveBeenCalledWith(
        expect.objectContaining({ abr: { enabled: true } })
      );
    });

    it('should disable ABR and select specific track', () => {
      const level = { id: 2, width: 1280, height: 720, bitrate: 3000000 };
      mockShakaPlayer.getVariantTracks.mockReturnValue([
        { id: 1, width: 1920, height: 1080, bandwidth: 5000000, active: true },
        { id: 2, width: 1280, height: 720, bandwidth: 3000000, active: false },
      ]);
      tech.currentLevel = level;
      expect(mockShakaPlayer.configure).toHaveBeenCalledWith(
        expect.objectContaining({ abr: { enabled: false } })
      );
      expect(mockShakaPlayer.selectVariantTrack).toHaveBeenCalled();
    });
  });

  describe('getVideoLevels()', () => {
    it('should return mapped variant tracks', () => {
      mockShakaPlayer.getVariantTracks.mockReturnValue([
        { id: 1, width: 1920, height: 1080, bandwidth: 5000000 },
        { id: 2, width: 1280, height: 720, bandwidth: 3000000 },
      ]);
      const levels = tech.getVideoLevels();
      expect(levels).toEqual([
        { id: 1, width: 1920, height: 1080, bitrate: 5000000 },
        { id: 2, width: 1280, height: 720, bitrate: 3000000 },
      ]);
    });
  });

  describe('destroy()', () => {
    it('should destroy shaka player', () => {
      tech.destroy();
      expect(mockShakaPlayer.destroy).toHaveBeenCalled();
    });
  });

  describe('bitrate change', () => {
    it('should emit BITRATE_CHANGE on adaptation', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.BITRATE_CHANGE, handler);

      mockShakaPlayer.getVariantTracks.mockReturnValue([
        { active: true, type: 'variant', bandwidth: 5000000, width: 1920, height: 1080 },
      ]);

      // Find the 'adaptation' listener
      const adaptationCall = mockShakaPlayer.addEventListener.mock.calls.find(
        (call) => call[0] === 'adaptation'
      );
      expect(adaptationCall).toBeTruthy();
      adaptationCall![1]();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          bitrate: 5000000,
          width: 1920,
          height: 1080,
        })
      );
    });
  });
});
