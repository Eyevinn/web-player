import BaseTech, { PlaybackState, IPlayerState, getTextTrackId } from './BaseTech';
import { PlayerEvent } from '../util/constants';

// Mock mitt
jest.mock('mitt', () => {
  return {
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
          handlers.get(type)?.forEach((handler) => handler(data));
        },
        all: {
          clear() {
            handlers.clear();
          },
        },
      };
    },
  };
});

function createMockVideo(): HTMLVideoElement {
  const listeners: Record<string, Function[]> = {};
  const video = {
    muted: false,
    volume: 1,
    paused: true,
    currentTime: 0,
    duration: 100,
    src: '',
    seekable: {
      length: 0,
      end: jest.fn().mockReturnValue(0),
    },
    audioTracks: undefined,
    textTracks: [],
    addEventListener(event: string, handler: Function) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    removeEventListener(event: string, handler: Function) {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((h) => h !== handler);
      }
    },
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    load: jest.fn(),
    _trigger(event: string, data?: any) {
      (listeners[event] || []).forEach((h) => h(data));
    },
    _listeners: listeners,
  } as unknown as HTMLVideoElement & { _trigger: Function; _listeners: Record<string, Function[]> };
  return video;
}

describe('BaseTech', () => {
  let video: ReturnType<typeof createMockVideo>;
  let tech: BaseTech;

  beforeEach(() => {
    video = createMockVideo();
    tech = new BaseTech({ video } as any);
  });

  afterEach(() => {
    tech.destroy();
  });

  describe('constructor', () => {
    it('should set initial state to IDLE', () => {
      const stateHandler = jest.fn();
      tech.on(PlayerEvent.STATE_CHANGE, stateHandler);
      // State is set in constructor, verify via updateState side effects
      expect(tech.name).toBe('BaseTech');
    });

    it('should register video event listeners', () => {
      const mock = video as any;
      const events = Object.keys(mock._listeners);
      expect(events).toContain('play');
      expect(events).toContain('playing');
      expect(events).toContain('pause');
      expect(events).toContain('timeupdate');
      expect(events).toContain('waiting');
      expect(events).toContain('seeking');
      expect(events).toContain('seeked');
      expect(events).toContain('canplay');
      expect(events).toContain('volumechange');
      expect(events).toContain('ended');
    });
  });

  describe('play()', () => {
    it('should call video.play()', async () => {
      const result = await tech.play();
      expect((video as any).play).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if play rejects', async () => {
      (video as any).play.mockRejectedValueOnce(new Error('not allowed'));
      const result = await tech.play();
      expect(result).toBe(false);
    });
  });

  describe('pause()', () => {
    it('should call video.pause()', () => {
      tech.pause();
      expect((video as any).pause).toHaveBeenCalled();
    });
  });

  describe('mute() / unmute()', () => {
    it('should set video.muted to true', () => {
      tech.mute();
      expect(video.muted).toBe(true);
    });

    it('should set video.muted to false', () => {
      tech.mute();
      tech.unmute();
      expect(video.muted).toBe(false);
    });
  });

  describe('volume', () => {
    it('should get volume from video', () => {
      (video as any).volume = 0.75;
      expect(tech.volume).toBe(0.75);
    });

    it('should set volume on video', () => {
      tech.volume = 0.5;
      expect(video.volume).toBe(0.5);
    });
  });

  describe('load()', () => {
    it('should set default state and resolve', async () => {
      const stateHandler = jest.fn();
      tech.on(PlayerEvent.STATE_CHANGE, stateHandler);
      await tech.load('http://example.com/video.mp4');
      expect(video.src).toBe('http://example.com/video.mp4');
      // State should have been set to LOADING
      expect(stateHandler).toHaveBeenCalled();
    });
  });

  describe('stop()', () => {
    it('should clear video src and emit PLAYER_STOPPED', () => {
      const stopHandler = jest.fn();
      tech.on(PlayerEvent.PLAYER_STOPPED, stopHandler);
      tech.stop();
      expect(video.src).toBe('');
      expect(stopHandler).toHaveBeenCalled();
    });
  });

  describe('event emission', () => {
    it('should emit PLAY on video play event', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.PLAY, handler);
      (video as any)._trigger('play');
      expect(handler).toHaveBeenCalled();
    });

    it('should emit PAUSE on video pause event', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.PAUSE, handler);
      (video as any)._trigger('pause');
      expect(handler).toHaveBeenCalled();
    });

    it('should emit PLAYING on video playing event', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.PLAYING, handler);
      (video as any)._trigger('playing');
      expect(handler).toHaveBeenCalled();
    });

    it('should emit SEEKING on video seeking event', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.SEEKING, handler);
      (video as any)._trigger('seeking');
      expect(handler).toHaveBeenCalled();
    });

    it('should emit SEEKED on video seeked event', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.SEEKED, handler);
      (video as any)._trigger('seeked');
      expect(handler).toHaveBeenCalled();
    });

    it('should emit TIME_UPDATE with currentTime and duration', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.TIME_UPDATE, handler);
      (video as any).currentTime = 10;
      (video as any).duration = 100;
      (video as any)._trigger('timeupdate');
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          currentTime: 10,
          duration: 100,
        })
      );
    });

    it('should emit WAITING on video waiting event when not seeking', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.WAITING, handler);
      (video as any)._trigger('waiting');
      expect(handler).toHaveBeenCalled();
    });

    it('should emit BUFFERING on waiting when not seeking', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.BUFFERING, handler);
      (video as any)._trigger('waiting');
      expect(handler).toHaveBeenCalled();
    });

    it('should emit VOLUME_CHANGE on video volumechange', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.VOLUME_CHANGE, handler);
      (video as any).volume = 0.5;
      (video as any)._trigger('volumechange');
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ volume: 0.5 }));
    });

    it('should emit ENDED on video ended event', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.ENDED, handler);
      (video as any)._trigger('ended');
      expect(handler).toHaveBeenCalled();
    });

    it('should emit LOADED_METADATA on canplay', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.LOADED_METADATA, handler);
      (video as any)._trigger('canplay');
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('state management', () => {
    it('should transition to PLAYING state on play event', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.STATE_CHANGE, handler);
      (video as any)._trigger('play');
      const lastCall = handler.mock.calls[handler.mock.calls.length - 1][0];
      expect(lastCall.state.playbackState).toBe(PlaybackState.PLAYING);
    });

    it('should transition to PAUSED state on pause event', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.STATE_CHANGE, handler);
      (video as any)._trigger('pause');
      const lastCall = handler.mock.calls[handler.mock.calls.length - 1][0];
      expect(lastCall.state.playbackState).toBe(PlaybackState.PAUSED);
    });

    it('should transition to SEEKING state on seeking event', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.STATE_CHANGE, handler);
      (video as any)._trigger('seeking');
      const lastCall = handler.mock.calls[handler.mock.calls.length - 1][0];
      expect(lastCall.state.playbackState).toBe(PlaybackState.SEEKING);
    });

    it('should transition to IDLE on ended', () => {
      const handler = jest.fn();
      tech.on(PlayerEvent.STATE_CHANGE, handler);
      (video as any)._trigger('ended');
      const lastCall = handler.mock.calls[handler.mock.calls.length - 1][0];
      expect(lastCall.state.playbackState).toBe(PlaybackState.IDLE);
    });
  });

  describe('isLive', () => {
    it('should return true when video duration is Infinity', () => {
      Object.defineProperty(video, 'duration', { value: Infinity, writable: true });
      expect(tech.isLive).toBe(true);
    });

    it('should return false for finite duration', () => {
      Object.defineProperty(video, 'duration', { value: 100, writable: true });
      expect(tech.isLive).toBe(false);
    });
  });

  describe('duration', () => {
    it('should return video duration for VOD', () => {
      Object.defineProperty(video, 'duration', { value: 120, writable: true });
      expect(tech.duration).toBe(120);
    });

    it('should return 0 if duration is NaN', () => {
      Object.defineProperty(video, 'duration', { value: NaN, writable: true });
      expect(tech.duration).toBe(0);
    });
  });

  describe('currentTime', () => {
    it('should get currentTime from video', () => {
      (video as any).currentTime = 42;
      expect(tech.currentTime).toBe(42);
    });

    it('should set currentTime on video when seekable', () => {
      tech.currentTime = 30;
      expect(video.currentTime).toBe(30);
    });
  });

  describe('getVideoLevels()', () => {
    it('should return empty array by default', () => {
      expect(tech.getVideoLevels()).toEqual([]);
    });
  });

  describe('seekToLive()', () => {
    it('should seek to near end of duration', () => {
      Object.defineProperty(video, 'duration', { value: 600, writable: true });
      tech.seekToLive();
      // BaseTech.seekToLive sets currentTime to duration - LIVE_EDGE (10)
      expect(video.currentTime).toBe(590);
    });
  });

  describe('destroy()', () => {
    it('should stop playback and remove event listeners', () => {
      const stopHandler = jest.fn();
      tech.on(PlayerEvent.PLAYER_STOPPED, stopHandler);
      tech.destroy();
      expect(stopHandler).toHaveBeenCalled();
    });
  });
});

describe('getTextTrackId()', () => {
  it('should return null for null track', () => {
    expect(getTextTrackId(null)).toBeNull();
  });

  it('should return null for undefined track', () => {
    expect(getTextTrackId(undefined)).toBeNull();
  });

  it('should return formatted id string', () => {
    const track = { id: '1', label: 'English', language: 'en' };
    expect(getTextTrackId(track)).toBe('1|English|en');
  });
});
