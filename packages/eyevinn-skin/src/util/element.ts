export interface IComponent {
	element: HTMLElement,
	update: Function
}

export function createElement(type, className) {
	const el = document.createElement(type);
	el.className = className;
	return el;
}
