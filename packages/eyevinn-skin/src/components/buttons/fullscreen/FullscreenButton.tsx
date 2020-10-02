import { h } from 'preact';
import style from './fullscreen.module.css';

function ExitFullscreen() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-arrows-minimize"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<polyline points="5 9 9 9 9 5" />
			<line x1="3" y1="3" x2="9" y2="9" />
			<polyline points="5 15 9 15 9 19" />
			<line x1="3" y1="21" x2="9" y2="15" />
			<polyline points="19 9 15 9 15 5" />
			<line x1="15" y1="9" x2="21" y2="3" />
			<polyline points="19 15 15 15 15 19" />
			<line x1="15" y1="15" x2="21" y2="21" />
		</svg>
	);
}

function EnterFullscreen() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-arrows-maximize"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<polyline points="16 4 20 4 20 8" />
			<line x1="14" y1="10" x2="20" y2="4" />
			<polyline points="8 20 4 20 4 16" />
			<line x1="4" y1="20" x2="10" y2="14" />
			<polyline points="16 20 20 20 20 16" />
			<line x1="14" y1="14" x2="20" y2="20" />
			<polyline points="8 4 4 4 4 8" />
			<line x1="4" y1="4" x2="10" y2="10" />
		</svg>
	);
}

export default function FullcreenButton({ isFullscreen, onClick }) {
	return (
		<div class={style.container} onClick={onClick}>
			{isFullscreen ? <ExitFullscreen /> : <EnterFullscreen />}
		</div>
	);
}
