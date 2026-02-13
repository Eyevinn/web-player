import { PlayerEvent } from '../util/constants';

let mockMediaPlayer: any;

function createFreshMockMediaPlayer() {
  return {
    create: jest.fn(),
    initialize: jest.fn(),
    attachView: jest.fn(),
    attachSource: jest.fn(),
    on: jest.fn(),
    isDynamic: jest.fn().mockReturnValue(false),
    reset: jest.fn(),
    events: {
      MANIFEST_LOADED: 'manifestLoaded',
      ERROR: 'error',
    },
  };
}

// MediaPlayer() returns an object with create()
// MediaPlayer().create() returns the actual player instance
jest.mock('dashjs', () => ({
  MediaPlayer: Object.assign(
    jest.fn(() => ({
      create: jest.fn(() => {
        mockMediaPlayer = createFreshMockMediaPlayer();
        return mockMediaPlayer;
      }),
    })),
    {
      events: {
        MANIFEST_LOADED: 'manifestLoaded',
        ERROR: 'error',
      },
    }
  ),
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

import MssPlayer from './DashJsTech';

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

describe('DashJsTech (MssPlayer)', () => {
  let video: ReturnType<typeof createMockVideo>;
  let tech: MssPlayer;
  let destroyed: boolean;

  beforeEach(() => {
    jest.clearAllMocks();
    destroyed = false;
    video = createMockVideo();
    tech = new MssPlayer({ video, src: '' } as any);
  });

  afterEach(() => {
    // Only destroy if not already destroyed by the test
    // DashJsTech.destroy() sets mediaPlayer = null, which causes
    // BaseTech.destroy() -> stop() -> isLive -> mediaPlayer.isDynamic() to crash
    if (!destroyed) {
      try {
        tech.destroy();
      } catch (e) {
        // ignore — already destroyed
      }
    }
  });

  describe('constructor', () => {
    it('should initialize dash.js MediaPlayer', () => {
      expect(mockMediaPlayer.initialize).toHaveBeenCalled();
    });

    it('should attach video element', () => {
      expect(mockMediaPlayer.attachView).toHaveBeenCalledWith(video);
    });
  });

  describe('load()', () => {
    it('should attach source and resolve on MANIFEST_LOADED', async () => {
      const loadPromise = tech.load('http://example.com/stream.ism/Manifest');

      // Get the MANIFEST_LOADED callback
      const onCall = mockMediaPlayer.on.mock.calls.find(
        (c: any) => c[0] === 'manifestLoaded'
      );
      expect(onCall).toBeTruthy();
      // Trigger success
      onCall![1]();

      await loadPromise;
      expect(mockMediaPlayer.attachSource).toHaveBeenCalledWith(
        'http://example.com/stream.ism/Manifest'
      );
    });

    it('should reject on ERROR and emit PlayerEvent.ERROR with standardized format', async () => {
      const errorHandler = jest.fn();
      tech.on(PlayerEvent.ERROR, errorHandler);

      const loadPromise = tech.load('http://bad.url/stream.ism/Manifest');

      // Get the ERROR callback
      const errorCall = mockMediaPlayer.on.mock.calls.find(
        (c: any) => c[0] === 'error'
      );
      expect(errorCall).toBeTruthy();
      // Trigger error
      errorCall![1]({ error: { code: 25, message: 'Download error' } });

      await expect(loadPromise).rejects.toBe('Failed to load Mss Player');

      // Verify standardized error emission
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          errorData: expect.objectContaining({
            category: 'MEDIA',
            code: '25',
            message: 'Download error',
          }),
          fatal: true,
        })
      );
    });
  });

  describe('isLive', () => {
    it('should delegate to mediaPlayer.isDynamic()', () => {
      mockMediaPlayer.isDynamic.mockReturnValue(true);
      expect(tech.isLive).toBe(true);
      expect(mockMediaPlayer.isDynamic).toHaveBeenCalled();
    });

    it('should return false for VOD', () => {
      mockMediaPlayer.isDynamic.mockReturnValue(false);
      expect(tech.isLive).toBe(false);
    });
  });

  describe('destroy()', () => {
    it('should reset the media player', () => {
      const resetFn = mockMediaPlayer.reset;
      tech.destroy();
      destroyed = true;
      expect(resetFn).toHaveBeenCalled();
    });
  });
});
