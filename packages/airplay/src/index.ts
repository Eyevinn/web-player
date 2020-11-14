import EventEmitter from './util/EventEmitter';

export enum AirPlayEvent {
	AVAILABILITY_CHANGED = 'airplay:availability_changed',
	TARGET_CHANGED = 'airplay:target_changed'
} 

export class AirPlay extends EventEmitter {
	private video: HTMLVideoElement;

	constructor(video: HTMLVideoElement) {
		super();
		this.video = video;
		if (!(window as any).WebKitPlaybackTargetAvailabilityEvent) {
			this.emit(AirPlayEvent.AVAILABILITY_CHANGED, { available: false });
		} else {
			video.addEventListener('webkitplaybacktargetavailabilitychanged', this.onAvailabilityChanged = this.onAvailabilityChanged.bind(this));
			video.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', this.onTargetChanged = this.onTargetChanged.bind(this));
		}
	}

	onAvailabilityChanged({ availability }: any) {
			this.emit(AirPlayEvent.AVAILABILITY_CHANGED, { available: availability === 'available' });
	}

	onTargetChanged(event: any) {
		this.emit(AirPlayEvent.TARGET_CHANGED, { wireless: true })
	}

	toggleAirPlay() {
		(this.video as any).webkitShowPlaybackTargetPicker();	
	}

	destroy() {
		this.video.removeEventListener('webkitplaybacktargetavailabilitychanged', this.onAvailabilityChanged);
	}
}