import mitt, { Emitter } from "mitt";

export default class EventEmitter {
	private emitter: Emitter = mitt();
	on(type: string, handler: Function) {
		this.emitter.on.apply(this, arguments);
	}
	off(type: string, handler: Function) {
		this.emitter.on.apply(this, arguments);
	}
	once(type: string, handler: Function) {
		const once = (data) => {
      handler(data);
      this.emitter?.off(type, once);
    };
    return this.emitter?.on(type, once);
	}
	emit(type: string, data?: any) {
		this.emitter.emit.apply(this, arguments);
	}
	destroy() {
		this.emitter.all.clear();
	}
}
