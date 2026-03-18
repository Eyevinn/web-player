import {
  formatPlayerError,
  formatShakaError,
  formatHlsError,
  formatDashError,
  IPlayerError,
} from './errors';

describe('errors utility', () => {
  describe('formatPlayerError()', () => {
    it('should create error with all fields', () => {
      const error = formatPlayerError({
        category: 'NETWORK',
        code: 404,
        message: 'Not Found',
        data: { url: 'http://example.com' },
        fatal: true,
      });

      expect(error).toEqual({
        errorData: {
          category: 'NETWORK',
          code: '404',
          message: 'Not Found',
          data: { url: 'http://example.com' },
        },
        fatal: true,
      });
    });

    it('should use defaults for missing fields', () => {
      const error = formatPlayerError({});

      expect(error).toEqual({
        errorData: {
          category: 'unknown',
          code: '-1',
          message: '',
          data: null,
        },
        fatal: false,
      });
    });

    it('should convert numeric code to string', () => {
      const error = formatPlayerError({ code: 503 });
      expect(error.errorData.code).toBe('503');
    });

    it('should convert numeric category to string', () => {
      const error = formatPlayerError({ category: '3' });
      expect(error.errorData.category).toBe('3');
    });
  });

  describe('formatShakaError()', () => {
    it('should format a Shaka error with all fields', () => {
      const error = formatShakaError({
        severity: 2,
        category: 1,
        code: 1001,
        data: ['', 'Failed to fetch manifest'],
      });

      expect(error).toEqual({
        errorData: {
          category: '1',
          code: '1001',
          message: 'Failed to fetch manifest',
          data: ['', 'Failed to fetch manifest'],
        },
        fatal: true,
      });
    });

    it('should set fatal=false for severity <= 1', () => {
      const error = formatShakaError({ severity: 1, category: 2, code: 2001, data: [] });
      expect(error.fatal).toBe(false);
    });

    it('should handle null error', () => {
      const error = formatShakaError(null);
      expect(error.errorData.category).toBe('unknown');
      expect(error.errorData.code).toBe('-1');
      expect(error.errorData.message).toBe('Shaka error');
      expect(error.fatal).toBe(true); // default severity is 2
    });

    it('should handle empty error object', () => {
      const error = formatShakaError({});
      expect(error.errorData.category).toBe('unknown');
      expect(error.errorData.code).toBe('-1');
      expect(error.fatal).toBe(true);
    });
  });

  describe('formatHlsError()', () => {
    it('should format an HLS error with HTTP response', () => {
      const error = formatHlsError({
        type: 'networkError',
        details: 'manifestLoadError',
        fatal: true,
        response: { code: 404, text: 'Not Found' },
      });

      expect(error).toEqual({
        errorData: {
          category: 'networkError',
          code: '404',
          message: 'Not Found',
          data: expect.any(Object),
        },
        fatal: true,
      });
    });

    it('should format parsing error with reason', () => {
      const error = formatHlsError({
        type: 'networkError',
        details: 'manifestParsingError',
        fatal: true,
        reason: 'Malformed M3U8',
      });

      expect(error.errorData.message).toBe('Malformed M3U8');
    });

    it('should fall back to details as message', () => {
      const error = formatHlsError({
        type: 'mediaError',
        details: 'bufferStalledError',
        fatal: false,
      });

      expect(error.errorData.message).toBe('bufferStalledError');
      expect(error.fatal).toBe(false);
    });

    it('should handle null data', () => {
      const error = formatHlsError(null);
      expect(error.errorData.category).toBe('unknown');
      expect(error.errorData.code).toBe('-1');
      expect(error.fatal).toBe(false);
    });

    it('should set fatal from data.fatal', () => {
      const error = formatHlsError({ fatal: true, type: 'networkError' });
      expect(error.fatal).toBe(true);
    });
  });

  describe('formatDashError()', () => {
    it('should format a dash.js error event', () => {
      const error = formatDashError({
        error: { code: 25, message: 'Download error' },
      });

      expect(error).toEqual({
        errorData: {
          category: 'MEDIA',
          code: '25',
          message: 'Download error',
          data: expect.any(Object),
        },
        fatal: true,
      });
    });

    it('should handle direct error object', () => {
      const error = formatDashError({
        code: 10,
        message: 'Manifest parse error',
      });

      expect(error.errorData.code).toBe('10');
      expect(error.errorData.message).toBe('Manifest parse error');
    });

    it('should handle null event', () => {
      const error = formatDashError(null);
      expect(error.errorData.category).toBe('MEDIA');
      expect(error.errorData.message).toBe('DASH playback error');
      expect(error.fatal).toBe(true);
    });

    it('should always be fatal', () => {
      const error = formatDashError({ error: { code: 1 } });
      expect(error.fatal).toBe(true);
    });
  });

  describe('consistent error shape', () => {
    it('all formatters should produce the same interface shape', () => {
      const errors: IPlayerError[] = [
        formatShakaError({ severity: 2, category: 1, code: 1001, data: ['', 'test'] }),
        formatHlsError({ type: 'networkError', details: 'test', fatal: true }),
        formatDashError({ error: { code: 1, message: 'test' } }),
        formatPlayerError({ category: 'test', code: '1', message: 'test', fatal: true }),
      ];

      for (const error of errors) {
        expect(error).toHaveProperty('errorData');
        expect(error).toHaveProperty('fatal');
        expect(error.errorData).toHaveProperty('category');
        expect(error.errorData).toHaveProperty('code');
        expect(error.errorData).toHaveProperty('message');
        expect(error.errorData).toHaveProperty('data');
        expect(typeof error.errorData.category).toBe('string');
        expect(typeof error.errorData.code).toBe('string');
        expect(typeof error.errorData.message).toBe('string');
        expect(typeof error.fatal).toBe('boolean');
      }
    });
  });
});
