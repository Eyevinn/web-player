import ShakaTech from './ShakaTech';
import { PlayerEvent } from '../util/constants';

// Mock shaka-player
jest.mock('shaka-player', () => {
  const mockShakaPlayer = {
    configure: jest.fn(),
    load: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    getTextTracks: jest.fn().mockReturnValue([]),
    selectTextTrack: jest.fn(),
    setTextTrackVisibility: jest.fn(),
    isTextTrackVisible: jest.fn().mockReturnValue(false),
    getVariantTracks: jest.fn().mockReturnValue([]),
    getAudioLanguages: jest.fn().mockReturnValue([]),
    selectVariantTrack: jest.fn(),
    selectAudioLanguage: jest.fn(),
    getConfiguration: jest.fn().mockReturnValue({}),
    getManifest: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  return {
    Player: jest.fn(() => mockShakaPlayer),
    polyfill: {
      installAll: jest.fn(),
    },
  };
});

describe('ShakaTech - Text Track (Subtitle) Functionality', () => {
  let shakaTech: ShakaTech;
  let mockVideoElement: HTMLVideoElement;
  let mockShakaPlayer: any;

  beforeEach(() => {
    // Create mock video element
    mockVideoElement = document.createElement('video');

    // Mock audioTracks to prevent BaseTech constructor errors
    Object.defineProperty(mockVideoElement, 'audioTracks', {
      value: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        length: 0
      },
      writable: true
    });

    // Create ShakaTech instance
    shakaTech = new ShakaTech({ video: mockVideoElement });

    // Get the mocked shaka player instance
    mockShakaPlayer = (shakaTech as any).shakaPlayer;

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('textTrack setter', () => {
    it('should call setTextTrackVisibility(true) when enabling a text track', () => {
      const mockTrack = { id: '0', language: 'en', label: 'English', active: false };
      mockShakaPlayer.getTextTracks.mockReturnValue([mockTrack]);

      shakaTech.textTrack = '0';

      expect(mockShakaPlayer.setTextTrackVisibility).toHaveBeenCalledWith(true);
    });

    it('should call selectTextTrack with the correct track', () => {
      const mockTrack = { id: '0', language: 'en', label: 'English', active: false };
      mockShakaPlayer.getTextTracks.mockReturnValue([mockTrack]);

      shakaTech.textTrack = '0';

      expect(mockShakaPlayer.selectTextTrack).toHaveBeenCalledWith(mockTrack);
    });

    it('should call setTextTrackVisibility(false) when disabling text tracks', () => {
      shakaTech.textTrack = null;

      expect(mockShakaPlayer.setTextTrackVisibility).toHaveBeenCalledWith(false);
    });

    it('CRITICAL REGRESSION TEST: should call onTextTrackChange when enabling a track', () => {
      const mockTrack = { id: '0', language: 'en', label: 'English', active: false };
      mockShakaPlayer.getTextTracks.mockReturnValue([mockTrack]);

      const onTextTrackChangeSpy = jest.spyOn(shakaTech as any, 'onTextTrackChange');

      shakaTech.textTrack = '0';

      expect(onTextTrackChangeSpy).toHaveBeenCalled();
      expect(onTextTrackChangeSpy).toHaveBeenCalledTimes(1);
    });

    it('CRITICAL REGRESSION TEST: should call onTextTrackChange when disabling tracks', () => {
      const onTextTrackChangeSpy = jest.spyOn(shakaTech as any, 'onTextTrackChange');

      shakaTech.textTrack = null;

      expect(onTextTrackChangeSpy).toHaveBeenCalled();
      expect(onTextTrackChangeSpy).toHaveBeenCalledTimes(1);
    });

    it('CRITICAL REGRESSION TEST: should emit TEXT_TRACK_CHANGE event when enabling', (done) => {
      const mockTrack = { id: '0', language: 'en', label: 'English', active: true };
      mockShakaPlayer.getTextTracks.mockReturnValue([mockTrack]);
      mockShakaPlayer.isTextTrackVisible.mockReturnValue(true);

      shakaTech.on(PlayerEvent.TEXT_TRACK_CHANGE, (track) => {
        expect(track).toBeDefined();
        done();
      });

      shakaTech.textTrack = '0';
    });

    it('CRITICAL REGRESSION TEST: should emit TEXT_TRACK_CHANGE event when disabling', (done) => {
      shakaTech.on(PlayerEvent.TEXT_TRACK_CHANGE, (track) => {
        expect(track).toBeUndefined();
        done();
      });

      shakaTech.textTrack = null;
    });

    it('should handle multiple text tracks correctly', () => {
      const mockTracks = [
        { id: '0', language: 'en', label: 'English', active: false },
        { id: '1', language: 'es', label: 'Spanish', active: false },
        { id: '2', language: 'fr', label: 'French', active: false },
      ];
      mockShakaPlayer.getTextTracks.mockReturnValue(mockTracks);

      shakaTech.textTrack = '1';

      expect(mockShakaPlayer.selectTextTrack).toHaveBeenCalledWith(mockTracks[1]);
    });
  });

  describe('textTrack getter', () => {
    it('should return null when no text track is active', () => {
      mockShakaPlayer.getTextTracks.mockReturnValue([
        { id: '0', language: 'en', label: 'English', active: false },
      ]);
      mockShakaPlayer.isTextTrackVisible.mockReturnValue(false);

      expect(shakaTech.textTrack).toBeNull();
    });

    it('should return track ID when a text track is active and visible', () => {
      mockShakaPlayer.getTextTracks.mockReturnValue([
        { id: '0', language: 'en', label: 'English', active: true },
      ]);
      mockShakaPlayer.isTextTrackVisible.mockReturnValue(true);

      expect(shakaTech.textTrack).toBe('0');
    });

    it('should return null when track is active but not visible', () => {
      mockShakaPlayer.getTextTracks.mockReturnValue([
        { id: '0', language: 'en', label: 'English', active: true },
      ]);
      mockShakaPlayer.isTextTrackVisible.mockReturnValue(false);

      expect(shakaTech.textTrack).toBeNull();
    });
  });

  describe('textTracks getter', () => {
    it('should return an empty array when no text tracks are available', () => {
      mockShakaPlayer.getTextTracks.mockReturnValue([]);

      expect(shakaTech.textTracks).toEqual([]);
    });

    it('should return formatted text tracks', () => {
      mockShakaPlayer.getTextTracks.mockReturnValue([
        { id: '0', language: 'en', label: 'English', active: false },
        { id: '1', language: 'es', label: 'Spanish', active: false },
      ]);
      mockShakaPlayer.isTextTrackVisible.mockReturnValue(false);

      const tracks = shakaTech.textTracks;

      expect(tracks).toHaveLength(2);
      expect(tracks[0]).toEqual({
        id: '0',
        label: 'English',
        language: 'en',
        enabled: false,
      });
      expect(tracks[1]).toEqual({
        id: '1',
        label: 'Spanish',
        language: 'es',
        enabled: false,
      });
    });

    it('should mark the active track as enabled', () => {
      mockShakaPlayer.getTextTracks.mockReturnValue([
        { id: '0', language: 'en', label: 'English', active: true },
        { id: '1', language: 'es', label: 'Spanish', active: false },
      ]);
      mockShakaPlayer.isTextTrackVisible.mockReturnValue(true);

      const tracks = shakaTech.textTracks;

      expect(tracks[0].enabled).toBe(true);
      expect(tracks[1].enabled).toBe(false);
    });

    it('should filter duplicate tracks with same language and label', () => {
      mockShakaPlayer.getTextTracks.mockReturnValue([
        { id: '0', language: 'en', label: 'English', active: false },
        { id: '1', language: 'en', label: 'English', active: false },
        { id: '2', language: 'es', label: 'Spanish', active: false },
      ]);
      mockShakaPlayer.isTextTrackVisible.mockReturnValue(false);

      const tracks = shakaTech.textTracks;

      expect(tracks).toHaveLength(2);
      expect(tracks.filter(t => t.language === 'en')).toHaveLength(1);
    });
  });

  describe('Event propagation', () => {
    it('CRITICAL: should update player state when text track changes', (done) => {
      const mockTrack = { id: '0', language: 'en', label: 'English', active: true };
      mockShakaPlayer.getTextTracks.mockReturnValue([mockTrack]);
      mockShakaPlayer.isTextTrackVisible.mockReturnValue(true);

      // Listen for STATE_CHANGE event (which should be emitted after TEXT_TRACK_CHANGE)
      let stateChanged = false;
      shakaTech.on('state_change', (state) => {
        if (state.textTracks) {
          stateChanged = true;
        }
      });

      shakaTech.on(PlayerEvent.TEXT_TRACK_CHANGE, () => {
        // Give a tick for state change to propagate
        setTimeout(() => {
          expect(stateChanged).toBe(true);
          done();
        }, 10);
      });

      shakaTech.textTrack = '0';
    });

    it('should handle rapid text track changes without errors', () => {
      const mockTracks = [
        { id: '0', language: 'en', label: 'English', active: false },
        { id: '1', language: 'es', label: 'Spanish', active: false },
      ];
      mockShakaPlayer.getTextTracks.mockReturnValue(mockTracks);

      // Rapidly change tracks
      expect(() => {
        for (let i = 0; i < 10; i++) {
          shakaTech.textTrack = String(i % 2);
          shakaTech.textTrack = null;
        }
      }).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle setting text track when track does not exist', () => {
      mockShakaPlayer.getTextTracks.mockReturnValue([
        { id: '0', language: 'en', label: 'English', active: false },
      ]);

      // Try to set a track ID that doesn't exist
      expect(() => {
        shakaTech.textTrack = '99';
      }).not.toThrow();

      // Should NOT call selectTextTrack when track is not found
      expect(mockShakaPlayer.selectTextTrack).not.toHaveBeenCalled();

      // But should still call onTextTrackChange and set visibility
      expect(mockShakaPlayer.setTextTrackVisibility).toHaveBeenCalledWith(true);
    });

    it('should handle undefined text track value', () => {
      expect(() => {
        shakaTech.textTrack = undefined as any;
      }).not.toThrow();

      expect(mockShakaPlayer.setTextTrackVisibility).toHaveBeenCalledWith(false);
    });
  });
});
