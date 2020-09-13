import { h } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { PlayerEvent, IPlayerState } from '@eyevinn/web-player-core';
import Logo from './components/logo/Logo';
import Timeline from './components/timeline/Timeline';
import PlayPauseButton from './components/buttons/PlayPauseButton';
import style from './skin.module.css';

function usePlayerState(player) {
	const [state, setState] = useState<IPlayerState | null>(null);
	useEffect(() => {
		console.log(PlayerEvent.STATE_CHANGE)
		player.on(PlayerEvent.STATE_CHANGE, ({ state }) => {
			setState({
				...state
			});
		});
	}, []);
	return state;
}

export default function EyevinnSkin({ player }) {
	const playerState = usePlayerState(player);
	const togglePlayPause = useCallback(() => player.isPlaying ? player.pause() : player.play(), []);
	return (
		<div class={style.container}>
			<Logo />
			<div class={style.bottomContainer}>
				<div class={style.controls}>
					<PlayPauseButton playbackState={playerState?.playbackState} onClick={togglePlayPause}/>
				</div>
				<Timeline
					currentTime={playerState?.currentTime}
					duration={playerState?.duration}
				/>
			</div>
		</div>
	);
}
