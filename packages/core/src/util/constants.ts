export enum ManifestType {
	UNKNOWN,
	HLS,
	DASH,
	MSS,
}

export enum ErrorCode {
	UNKNOWN_MANIFEST_TYPE,
}

export enum PlayerEvent {
	// HTML5 Media Events
	PLAY = 'play',
	PAUSE = 'pause',
	PLAYING = 'playing',
	TIME_UPDATE = 'timeupdate',
	SEEKING = 'seeking',
	SEEKED = 'seeked',
	WAITING = 'waiting',
	STALLED = 'stalled',
	VOLUME_CHANGE = 'volumechange',
	ENDED = 'ended',

	// WebPlayer Events
	UNREADY = 'unready',
	READYING = 'readying',
	READY = 'ready',

	STATE_CHANGE = 'state_change',
	AUDIO_TRACK_CHANGE = 'audio_track_change',
	TEXT_TRACK_CHANGE = 'text_track_change',
	BUFFERING = 'buffering',
	LIVE_ENDED = 'live_ended',
	BITRATE_CHANGE = 'bitrate_change',
	PLAYER_STOPPED = 'player_stopped',
	ERROR = 'error',
}
