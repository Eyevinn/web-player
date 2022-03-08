import { h } from 'preact';
import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import WebPlayer, { PlaybackState } from '@eyevinn/web-player-core';
import classNames from 'classnames';
import Timeline from './components/timeline/Timeline';
import PlayPauseButton from './components/buttons/playPause/PlayPauseButton';
import VolumeButton from './components/buttons/volume/VolumeButton';
import AudioTrackButton from './components/buttons/audioTrack/AudioTrackButton';
import FullscreenButton from './components/buttons/fullscreen/FullscreenButton';

import style from './skin.module.scss';
import Loader from './components/loader/Loader';
import {
	exitFullscreen,
	isFullscreen,
	requestFullscreen,
} from './util/fullscreen';
import TextTrackButton from './components/buttons/textTrack/textTrackButton';
import AirPlayButton from './components/buttons/airplayButton/AirPlayButton';
import CastButton from './components/buttons/castButton/CastButton';
import { useAirPlay, usePlayer } from './util/hooks';
import ContextMenu from './components/contextMenu/ContextMenu';
import CastOverlay from './components/castOverlay/CastOverlay';
import LiveButton from './components/buttons/liveButton/LiveButton';

export default function EyevinnSkin({
	player,
	castAppId,
	rootElement,
}: {
	player: WebPlayer;
	castAppId: string;
	rootElement: HTMLElement;
}) {
	const skinContainerRef = useRef<HTMLDivElement>();
	const [
		ready,
		state,
		togglePlayPause,
		toggleMute,
		changeAudioTrack,
		changeTextTrack,
		seekByPercentage,
		seekByChange,
		seekToLive,
	] = usePlayer(player, castAppId);
	const [airplayAvailable, toggleAirPlay] = useAirPlay(player);

	const toggleFullscreen = useCallback(
		() =>
			isFullscreen()
				? exitFullscreen()
				: requestFullscreen(rootElement, player.video),
		[]
	);

	const [contextMenuState, setContextMenuState] = useState({
		visible: false,
		x: 0,
		y: 0,
	});
	const onContextMenu = useCallback((evt) => {
		evt.stopPropagation();
		evt.preventDefault();
		if (evt.target === evt.currentTarget) {
			setContextMenuState({
				visible: true,
				x: evt.offsetX,
				y: evt.offsetY,
			});
		} else {
			setContextMenuState({
				visible: false,
				x: 0,
				y: 0,
			});
		}
	}, []);

	useEffect(() => {
		let onClick;
		document.addEventListener(
			'click',
			(onClick = () => {
				setContextMenuState({
					visible: false,
					x: 0,
					y: 0,
				});
			})
		);
		() => document.removeEventListener('click', onClick);
	}, []);

	// Setup keyboard listener
	useEffect(() => {
		const skinContainer = skinContainerRef.current as HTMLDivElement;
		if (skinContainer) {
			const onKeyDown = (evt: KeyboardEvent) => {
				switch (evt.code) {
					case 'Space':
						togglePlayPause();
						break;
					case 'ArrowRight':
						seekByChange(5);
						break;
					case 'ArrowLeft':
						seekByChange(-5);
						break;
				}
			};
			skinContainer.addEventListener('keydown', onKeyDown);
			return () => skinContainer.removeEventListener('keydown', onKeyDown);
		}
	}, [skinContainerRef.current]);

	// setup detection of user activity, used to toggle overlay visiblity
	const timeoutRef = useRef(null);
	const [isUserActive, setIsUserActive] = useState(false);
	const onMouseMove = useCallback(() => {
		clearTimeout(timeoutRef.current);
		setIsUserActive(true);
		timeoutRef.current = setTimeout(() => setIsUserActive(false), 2500);
	}, []);

	const isSkinHidden =
		!isUserActive &&
		state?.playbackState !== PlaybackState.READY &&
		state?.playbackState !== PlaybackState.PAUSED;

	const isLoading =
		state?.playbackState === PlaybackState.LOADING ||
		state?.playbackState === PlaybackState.BUFFERING ||
		state?.playbackState === PlaybackState.SEEKING;

	if (ready === null) {
		// the player has no content and cannot play anything
		return null;
	}

	return (
		<div
			ref={skinContainerRef}
			tabIndex={0}
			class={classNames(style.container)}
			onMouseMove={onMouseMove}
			onContextMenu={onContextMenu}
			onPointerUp={useCallback(
				(evt) => {
					if (!isSkinHidden && evt.currentTarget === evt.target) {
						togglePlayPause();
					} else {
						setIsUserActive(true);
					}
				},
				[isSkinHidden]
			)}
		>
			{contextMenuState.visible && (
				<ContextMenu x={contextMenuState.x} y={contextMenuState.y} />
			)}
			{(isLoading || !ready) && <Loader />}
			{state?.isCasting && <CastOverlay />}
			<div
				class={classNames(style.bottomContainer, {
					[style.hidden]: isSkinHidden,
				})}
			>
				<div class={style.controls}>
					<PlayPauseButton
						playbackState={state?.playbackState}
						onClick={togglePlayPause}
					/>
					{state?.isLive && !state?.isSeekable && (
						<LiveButton
							onClick={seekToLive}
							isAtLiveEdge={state?.isAtLiveEdge}
							isSeekable={state?.isSeekable}
						/>
					)}
					<div class={style.divider} />
					<CastButton />
					{airplayAvailable && <AirPlayButton onClick={toggleAirPlay} />}
					{state?.isCasting === false && state?.textTracks.length > 0 && (
						<TextTrackButton
							textTracks={state?.textTracks}
							onChange={changeTextTrack}
						/>
					)}
					{state?.isCasting === false && state?.audioTracks.length > 1 && (
						<AudioTrackButton
							audioTracks={state?.audioTracks}
							onChange={changeAudioTrack}
						/>
					)}
					<VolumeButton muted={state?.isMuted} onClick={toggleMute} />
					<FullscreenButton
						isFullscreen={isFullscreen()}
						onClick={toggleFullscreen}
					/>
				</div>
				{(!state?.isLive || state?.isSeekable) && (
					<Timeline
						isLive={state?.isLive}
						isAtLiveEdge={state?.isAtLiveEdge}
						isSeekable={state?.isSeekable}
						handleSeek={seekByPercentage}
						handleSeekToLive={seekToLive}
						currentTime={state?.currentTime}
						duration={state?.duration}
					/>
				)}
			</div>
		</div>
	);
}
