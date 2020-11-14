import EventEmitter from './util/EventEmitter';

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
						autoJoinPolicy || chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
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
	STATE_CHANGE = 'cast:state_change'
}

export class CastPlayer extends EventEmitter {
	private isReady = false;

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

	setupListeners() {
		const context = cast.framework.CastContext.getInstance();
		context.addEventListener(
			cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
			(event) => {
				switch (event.sessionState) {
					case cast.framework.SessionState.SESSION_STARTED:
					case cast.framework.SessionState.SESSION_RESUMED:
						this.emit(CastPlayerEvent.CONNECTED);
						break;
					case cast.framework.SessionState.SESSION_ENDED:
						this.emit(CastPlayerEvent.DISCONNECTED);
						break;
				}
			}
		);

		this.playerController.addEventListener(
			cast.framework.RemotePlayerEventType.ANY_CHANGE,
			(event) => {
				console.log(event);
			}
		);
	}

	load(src: string) {
		const castSession = cast.framework.CastContext.getInstance().getCurrentSession();

		const mediaInfo = new chrome.cast.media.MediaInfo(src, 'video/mp4');
		const request = new chrome.cast.media.LoadRequest(mediaInfo);
		return castSession.loadMedia(request);
	}

	togglePlayPause() {
		this.playerController.playOrPause();
	}

	stop() {
		this.playerController.stop();
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
