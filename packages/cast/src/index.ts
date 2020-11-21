import EventEmitter from './util/EventEmitter';
import { PlaybackState } from '@eyevinn/web-player-core';
import type { IPlayerState } from '@eyevinn/web-player-core';

export function initializeCast(
	appId?: string,
	autoJoinPolicy?: chrome.cast.AutoJoinPolicy
) {
	return new Promise((resolve, reject) => {
		window['__onGCastApiAvailable'] = (isAvailable) => {
			if (isAvailable) {
				cast.framework.CastContext.getInstance().setOptions({
					receiverApplicationId:
						appId || chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
					autoJoinPolicy:
						autoJoinPolicy || chrome.cast.AutoJoinPolicy.PAGE_SCOPED,
				});
				resolve();
			} else {
				reject();
			}
		};

		const castScript = document.createElement('script');
		castScript.src =
			'//www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
		document.body.appendChild(castScript);
	});
}

export enum CastPlayerEvent {
	CONNECTED = 'cast:connected',
	DISCONNECTED = 'cast:disconnected',
	STATE_CHANGE = 'cast:state_change',
}

export class CastPlayer extends EventEmitter {
	private state: IPlayerState = {
		playbackState: PlaybackState.IDLE,
		currentTime: 0,
		duration: 0,
		isLive: false,
		isMuted: false,
		audioTracks: [],
		textTracks: [],
	};

	private player: cast.framework.RemotePlayer;
	private playerController: cast.framework.RemotePlayerController;

	constructor(appId: string, autoJoinPolicy?: chrome.cast.AutoJoinPolicy) {
		super();
		initializeCast(appId, autoJoinPolicy).then(
			() => {
				this.player = new cast.framework.RemotePlayer();
				this.playerController = new cast.framework.RemotePlayerController(
					this.player
				);

				this.setupListeners();
			},
			(e) => console.error(e)
		);
	}

	private setState(newState) {
		this.state = Object.assign({}, this.state, newState);
		this.emit(CastPlayerEvent.STATE_CHANGE, { state: this.state });
	}

	private getPlaybackStateFromPlayerState(playerState: string): PlaybackState {
		switch (playerState) {
			case chrome.cast.media.PlayerState.BUFFERING:
				return PlaybackState.BUFFERING;
			case chrome.cast.media.PlayerState.PAUSED:
				return PlaybackState.PAUSED;
			case chrome.cast.media.PlayerState.PLAYING:
				return PlaybackState.PLAYING;
			case chrome.cast.media.PlayerState.IDLE:
				return PlaybackState.IDLE;
		}
	}

	setupListeners() {
		const context = cast.framework.CastContext.getInstance();
		context.addEventListener(
			cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
			(event) => {
				switch (event.sessionState) {
					case cast.framework.SessionState.SESSION_STARTED:
					case cast.framework.SessionState.SESSION_RESUMED:
						this.emit(CastPlayerEvent.CONNECTED);
						this.setState({
							playbackState: PlaybackState.READY,
							isMuted: this.player.isMuted,
						});
						break;
					case cast.framework.SessionState.SESSION_ENDED:
						this.emit(CastPlayerEvent.DISCONNECTED);
						this.setState({
							playbackState: PlaybackState.IDLE,
						});
						break;
				}
			}
		);

		this.playerController.addEventListener(
			cast.framework.RemotePlayerEventType.ANY_CHANGE,
			({ field, value }) => {
				console.log(field, value);
				switch (field) {
					case 'currentTime':
						this.setState({ currentTime: value });
						break;
					case 'duration':
						this.setState({ duration: value });
						break;
					case 'playerState':
						{
							const playbackState = this.getPlaybackStateFromPlayerState(value);
							this.setState({
								playbackState,
							});
							if (playbackState === PlaybackState.IDLE) {
								this.stop();
							}
						}
						break;
					case 'liveSeekableRange':
						this.setState({
							isLive: true,
							duration: value.end,
						});
						break;
				}
			}
		);
	}

	load(src: string) {
		const castSession = cast.framework.CastContext.getInstance().getCurrentSession();

		const mediaInfo = new chrome.cast.media.MediaInfo(src, 'video/mp4');
		const request = new chrome.cast.media.LoadRequest(mediaInfo);
		return castSession.loadMedia(request);
	}

	play() {
		this.playerController.playOrPause();
	}

	pause() {
		this.playerController.playOrPause();
	}

	stop() {
		this.playerController.stop();
	}

	mute() {
		this.playerController.muteOrUnmute();
	}

	unmute() {
		this.playerController.muteOrUnmute();
	}

	setAudioTrack() {
		// no-op
	}

	setTextTrack() {
		// no-op
	}

	seekTo({
		position,
		change,
		percentage,
	}: {
		position?: number;
		change?: number;
		percentage?: number;
	}) {
		if (percentage) {
			position = (percentage / 100) * this.player.duration;
		} else if (change) {
			position = this.player.currentTime + change;
		}
		this.player.currentTime = position;
		this.playerController.seek();
	}
}
