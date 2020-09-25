import { h } from 'preact';
import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import {
	PlayerEvent,
	IPlayerState,
	PlaybackState,
} from '@eyevinn/web-player-core';
import classNames from 'classnames';
import Logo from './components/logo/Logo';
import Timeline from './components/timeline/Timeline';
import PlayPauseButton from './components/buttons/playPause/PlayPauseButton';
import VolumeButton from './components/buttons/volume/VolumeButton';
import AudioTrackButton from './components/buttons/audioTrack/AudioTrackButton';
import FullscreenButton from './components/buttons/fullscreen/FullscreenButton';

import style from './skin.module.css';
import Loader from './components/loader/Loader';
import { exitFullscreen, isFullscreen, requestFullscreen } from './util/fullscreen';
import TextTrackButton from './components/buttons/textTrack/textTrackButton';

function usePlayerState(player) {
	const [state, setState] = useState<IPlayerState | null>(null);
	useEffect(() => {
		player.on(PlayerEvent.STATE_CHANGE, ({ state }) => {
			setState({
				...state,
			});
		});
	}, []);
	return state;
}

export default function EyevinnSkin({ player, rootElement}) {
	const playerState = usePlayerState(player);
	const togglePlayPause = useCallback(
		() => (player.isPlaying ? player.pause() : player.play()),
		[]
	);
	const toggleMute = useCallback(
		() => (player.isMuted ? player.unmute() : player.mute()),
		[]
	);
	const changeAudioTrack = useCallback((id) => player.setAudioTrack(id), []);
	const changeTextTrack = useCallback((id) => player.setTextTrack(id), []);
	const seek = useCallback((percentage) => player.seekTo({ percentage }), []);
	const toggleFullscreen = useCallback(() => isFullscreen() ? exitFullscreen() : requestFullscreen(rootElement), []);

	const timeoutRef = useRef(null);
	const [isUserActive, setIsUserActive] = useState(true);
	const onMouseMove = useCallback(() => setIsUserActive(true), []);
	useEffect(() => {
		if (isUserActive) {
			timeoutRef.current = setTimeout(() => setIsUserActive(false), 2500);
			return () => clearTimeout(timeoutRef.current);
		}
	}, [isUserActive]);

	const isSkinHidden =
		!isUserActive &&
		playerState?.playbackState !== PlaybackState.READY &&
		playerState?.playbackState !== PlaybackState.PAUSED;

	const isLoading =
		playerState?.playbackState === PlaybackState.LOADING ||
		playerState?.playbackState === PlaybackState.BUFFERING ||
		playerState?.playbackState === PlaybackState.SEEKING;

	return (
		<div
			class={classNames(style.container, { [style.hidden]: isSkinHidden })}
			onMouseMove={onMouseMove}
		>
			<Logo />
			{isLoading && <Loader />}
			<div class={style.bottomContainer}>
				<div class={style.controls}>
					<PlayPauseButton
						playbackState={playerState?.playbackState}
						onClick={togglePlayPause}
					/>
					<div class={style.divider} />
					{playerState?.textTracks.length > 1 && (
						<TextTrackButton
							textTracks={playerState?.textTracks}
							onChange={changeTextTrack}
						/>
					)}
					{playerState?.audioTracks.length > 1 && (
						<AudioTrackButton
							audioTracks={playerState?.audioTracks}
							onChange={changeAudioTrack}
						/>
					)}
					<VolumeButton muted={playerState?.isMuted} onClick={toggleMute} />
					<FullscreenButton isFullscreen={isFullscreen()} onClick={toggleFullscreen} />
				</div>
				<Timeline
					isLive={playerState?.isLive}
					onSeek={seek}
					currentTime={playerState?.currentTime}
					duration={playerState?.duration}
				/>
			</div>
		</div>
	);
}
