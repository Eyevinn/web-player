export function isFullscreen() {
	return !!(
		document.fullscreenElement || (document as any).webkitFullscreenElement
	);
}

export function requestFullscreen(skinElement: any, videoElement: any) {
	const element =
		skinElement.requestFullscreen || skinElement.webkitRequestFullscreen
			? skinElement
			: videoElement;
	(
		element.requestFullscreen ||
		(element as any).webkitRequestFullscreen ||
		(element as any).webkitEnterFullscreen
	)?.call(element);
}

export function exitFullscreen() {
	(document.exitFullscreen || (document as any).webkitExitFullscreen)?.call(
		document
	);
}
