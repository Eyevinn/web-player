import { h } from 'preact';
import { PlaybackState } from '@eyevinn/web-player-core';
import style from './playPause.module.css';

function PlayIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height="24"
			viewBox="0 0 24 24"
			width="24"
		>
			<path d="M0 0h24v24H0z" fill="none" />
			<path d="M8 5v14l11-7z" />
		</svg>
	);
}

function PauseIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height="24"
			viewBox="0 0 24 24"
			width="24"
		>
			<path d="M0 0h24v24H0z" fill="none" />
			<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
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
