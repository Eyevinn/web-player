export enum ManifestType {
	UNKNOWN,
	HLS,
	DASH,
	MSS,	
};

export enum ErrorCode {
	UNKNOWN_MANIFEST_TYPE	
}

export enum PlayerEvent {
	STATE_CHANGE = "state_change",
	PLAY = "play",
	PAUSE = "pause",
	PLAYING = "playing",
	TIME_UPDATE = "timeupdate",
	SEEKING = "seeking",
	SEEKED = "seeked",
	WAITING = "waiting",
	STALLED = "stalled",
	BUFFERING = "buffering"
}