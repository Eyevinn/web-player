/**
 * Shared error formatting utility for all tech adapters.
 * Provides a consistent error shape across ShakaTech, HlsJsTech, and DashJsTech.
 *
 * Standard error shape emitted via PlayerEvent.ERROR:
 * {
 *   errorData: { category: string, code: string, message: string, data: any },
 *   fatal: boolean
 * }
 */

export interface IPlayerErrorData {
  /** Error category (e.g., 'NETWORK', 'MEDIA', 'MANIFEST', 'unknown') */
  category: string;
  /** Error code as string (e.g., HTTP status code, library error code, or '-1' for unknown) */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Raw error data from the underlying library */
  data: any;
}

export interface IPlayerError {
  errorData: IPlayerErrorData;
  fatal: boolean;
}

/**
 * Creates a standardized player error object from raw error data.
 * All tech adapters should use this to emit PlayerEvent.ERROR.
 */
export function formatPlayerError(opts: {
  category?: string;
  code?: string | number;
  message?: string;
  data?: any;
  fatal?: boolean;
}): IPlayerError {
  return {
    errorData: {
      category: opts.category?.toString() ?? 'unknown',
      code: opts.code?.toString() ?? '-1',
      message: opts.message?.toString() ?? '',
      data: opts.data ?? null,
    },
    fatal: opts.fatal ?? false,
  };
}

/**
 * Format a Shaka Player error into the standard error shape.
 * Shaka errors have: severity, category, code, data[]
 */
export function formatShakaError(error: any): IPlayerError {
  const errorDetails = error || {};
  const severity = errorDetails.severity ?? 2;
  const fatal = severity > 1;

  return formatPlayerError({
    category: errorDetails.category?.toString(),
    code: errorDetails.code?.toString(),
    message: errorDetails.data?.[1]?.toString() ?? 'Shaka error',
    data: errorDetails.data ?? [],
    fatal,
  });
}

/**
 * Format an HLS.js error into the standard error shape.
 * HLS.js errors have: type (category), details, fatal, response? { code, text }
 */
export function formatHlsError(data: any): IPlayerError {
  const errorData: IPlayerErrorData = {
    category: data?.type?.toString() ?? 'unknown',
    code: '-1',
    message: '',
    data: data ?? null,
  };

  const details = data?.details;
  // HTTP errors with response codes
  if (data?.response?.code !== undefined) {
    errorData.code = `${data.response.code}`;
    errorData.message = data.response?.text ?? '';
  } else if (data?.reason) {
    // Parsing errors with reason
    errorData.message = data.reason;
  }

  // If we still don't have a message, use the details string
  if (!errorData.message && details) {
    errorData.message = details.toString();
  }

  return {
    errorData,
    fatal: data?.fatal ?? false,
  };
}

/**
 * Format a dash.js error into the standard error shape.
 * dash.js errors have: error.code, error.message, event type
 */
export function formatDashError(event: any): IPlayerError {
  const error = event?.error || event;

  return formatPlayerError({
    category: 'MEDIA',
    code: error?.code?.toString(),
    message: error?.message?.toString() ?? 'DASH playback error',
    data: event ?? null,
    fatal: true,
  });
}
