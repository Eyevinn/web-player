document.fullscreenElement;

export function isFullscreen() {
	return (
		(document.fullscreenElement ||
			(document as any).webkitFullscreenElement) !== null
	);
}

export function requestFullscreen(element: HTMLElement) {
	(element.requestFullscreen || (element as any).webkitRequestFullscreen)?.call(element);
}

export function exitFullscreen() {
	(document.exitFullscreen || (document as any).webkitExitFullscreen)?.call(document);
}
