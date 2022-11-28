import mitt, { Emitter } from "mitt";

export default class EventEmitter {
	private emitter: Emitter<any> = mitt();
	on(type: string, handler: Function) {
		this.emitter.on.apply(this, arguments);
	}
	off(type: string, handler: Function) {
		this.emitter.on.apply(this, arguments);
	}
	emit(type: string, data?: any) {
		this.emitter.emit.apply(this, arguments);
	}
	destroy() {
		this.emitter.all.clear();
	}
}
