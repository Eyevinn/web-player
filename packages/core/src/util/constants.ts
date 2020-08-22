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
	PLAY = "play",
	PAUSE = "pause",
	TIME_UPDATE = "timeupdate"
}
