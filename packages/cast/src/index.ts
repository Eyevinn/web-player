import EventEmitter from './util/EventEmitter';

export function initializeCast(
	appId?: string,
	autoJoinPolicy?: chrome.cast.AutoJoinPolicy
) {
	return new Promise((resolve, reject) => {
		if (window.chrome?.cast) {
			window['__onGCastApiAvailable'] = (isAvailable) => {
				if (isAvailable) {
					cast.framework.CastContext.getInstance().setOptions({
						receiverApplicationId:
							appId || chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
						autoJoinPolicy:
							autoJoinPolicy || chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
					});
					resolve();
				}
			};

			const castScript = document.createElement('script');
			castScript.src =
				'//www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
			document.body.appendChild(castScript);
		} else {
			reject();
		}
	});
}

export enum CastPlayerEvent {
	CONNECTED = 'connected',
	DISCONNECTED = 'disconnected',
}

export class CastPlayer extends EventEmitter {
	private isReady = false;

	constructor(appId: string, autoJoinPolicy: chrome.cast.AutoJoinPolicy) {
		super();
		initializeCast(appId, autoJoinPolicy).then(
			() => {
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
	}

	load(src: string) {
		const castSession = cast.framework.CastContext.getInstance().getCurrentSession();

		const mediaInfo = new chrome.cast.media.MediaInfo(src, 'video/mp4');
		const request = new chrome.cast.media.LoadRequest(mediaInfo);
		return castSession.loadMedia(request);
	}
}
