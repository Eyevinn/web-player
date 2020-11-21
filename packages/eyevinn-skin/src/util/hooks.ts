import {
	useState,
	useEffect,
	useCallback,
	useMemo,
	useRef,
} from 'preact/hooks';
import { AirPlay, AirPlayEvent } from '@eyevinn/web-player-airplay';
import { CastPlayer, CastPlayerEvent } from '@eyevinn/web-player-cast';
import {
	PlayerEvent,
	IPlayerState,
	PlaybackState,
} from '@eyevinn/web-player-core';
import type WebPlayer from '@eyevinn/web-player-core';
import { exitFullscreen, isFullscreen, requestFullscreen } from './fullscreen';

interface ISkinState extends IPlayerState {
	isCasting: boolean;
}

export function useCastPlayer(
	player: WebPlayer,
	castAppId?: string
): [CastPlayer, ISkinState] {
	const [state, setState] = useState<ISkinState>(null);
	const castPlayer = useMemo(
		() => castAppId !== null && new CastPlayer(castAppId),
		[]
	);

	const castStateRef = useRef<ISkinState>(null);
	castStateRef.current = state;

	useEffect(() => {
		if (castPlayer) {
			castPlayer.on(CastPlayerEvent.CONNECTED, () => {
				if (player.currentSrc) {
					castPlayer.load(player.currentSrc);
				}
			});
			castPlayer.on(CastPlayerEvent.DISCONNECTED, () => {
				setState((prevState) => ({ ...prevState, isCasting: false }));
				player.seekTo({ position: castStateRef.current?.currentTime });
			});
			castPlayer.on(CastPlayerEvent.STATE_CHANGE, ({ state }) => {
				setState({
					isCasting: state.playbackState !== PlaybackState.IDLE,
					...state,
				});
			});
		}
	}, []);
	return [castPlayer, state];
}

export function usePlayer(webPlayer: WebPlayer, castAppId: string) {
	const [playerState, setPlayerState] = useState<ISkinState>(null);
	const [castPlayer, castState] = useCastPlayer(webPlayer, castAppId);
	const isCastingRef = useRef<boolean>(false);

	isCastingRef.current = castState?.isCasting ?? false;

	useEffect(() => {
		webPlayer.on(PlayerEvent.STATE_CHANGE, ({ state }) => {
			if (isCastingRef.current && webPlayer.isPlaying) {
				webPlayer.pause();
			}
			setPlayerState({
				isCasting: false,
				...state,
			});
		});
	}, []);

	let state, player;
	if (castState && castState.playbackState !== PlaybackState.IDLE) {
		player = castPlayer;
		state = castState;
	} else {
		player = webPlayer;
		state = playerState;
	}

	const togglePlayPause = useCallback(
		() => (player.isPlaying ? player.pause() : player.play()),
		[player]
	);
	const toggleMute = useCallback(
		() => (player.isMuted ? player.unmute() : player.mute()),
		[player]
	);
	const changeAudioTrack = useCallback((id) => player.setAudioTrack(id), [
		player,
	]);
	const changeTextTrack = useCallback((id) => player.setTextTrack(id), [
		player,
	]);
	const seekByPercentage = useCallback(
		(percentage: number) => player.seekTo({ percentage }),
		[player]
	);
	const seekByChange = useCallback(
		(change: number) => player.seekTo({ change }),
		[player]
	);

	return [
		state,
		togglePlayPause,
		toggleMute,
		changeAudioTrack,
		changeTextTrack,
		seekByPercentage,
		seekByChange,
	];
}

export function useAirPlay(player: WebPlayer) {
	const [available, setAvailable] = useState(false);
	const airplay = useMemo(() => new AirPlay(player.video), []);
	const toggleAirPlay = useCallback(() => airplay.toggleAirPlay(), []);

	useEffect(() => {
		airplay.on(AirPlayEvent.AVAILABILITY_CHANGED, ({ available }) =>
			setAvailable(available)
		);
	}, []);
	return [available, toggleAirPlay];
}
