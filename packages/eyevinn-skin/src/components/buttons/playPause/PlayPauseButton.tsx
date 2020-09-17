import { h } from 'preact';
import { PlaybackState } from '@eyevinn/web-player-core';
import style from './playPause.module.css';

function PlayIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
			<path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z" />
		</svg>
	);
}

function PauseIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
			<path d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z" />
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
