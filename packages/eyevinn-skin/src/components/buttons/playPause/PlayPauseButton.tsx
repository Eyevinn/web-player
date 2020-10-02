import { h } from 'preact';
import { PlaybackState } from '@eyevinn/web-player-core';
import style from './playPause.module.css';

function PlayIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-player-play"
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
			<path d="M7 4v16l13 -8z" />
		</svg>
	);
}

function PauseIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-player-pause"
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
			<rect x="6" y="5" width="4" height="14" rx="1" />
			<rect x="14" y="5" width="4" height="14" rx="1" />
		</svg>
	);
}

export default function PlayPauseButton({ playbackState, onClick }) {
	return (
		<div class={style.container} onClick={onClick}>
			{playbackState !== PlaybackState.PLAYING ? <PlayIcon /> : <PauseIcon />}
		</div>
	);
}
