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
	TIME_UPDATE = "timeupdate",
	BUFFERING = "buffering"
}