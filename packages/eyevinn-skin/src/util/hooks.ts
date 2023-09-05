import {
	useState,
	useEffect,
	useCallback,
	useMemo,
	useRef,
} from 'preact/hooks';
import { AirPlay, AirPlayEvent } from '@eyevinn/web-player-airplay';
import { CastSender, CastSenderEvent } from '@eyevinn/web-player-cast';
import {
	ReadyState,
	PlayerEvent,
	IPlayerState,
	PlaybackState,
	ManifestType,
} from '@eyevinn/web-player-core';
import type WebPlayer from '@eyevinn/web-player-core';

interface ISkinState extends IPlayerState {
	isCasting: boolean;
}

export function useCastSender(
	player: WebPlayer,
	castAppId?: string
): [CastSender, ISkinState] {
	const [state, setState] = useState<ISkinState>(null);
	const [castSender, setCastSender] = useState<CastSender>(null);

	useEffect(() => {
		const onReady = () => {
			if (
				castAppId !== null &&
				player.manifestType !== ManifestType.EYEVINN_WEBRTC_CHANNEL
			) {
				setCastSender(new CastSender(castAppId));
			}
		};
		player.on(PlayerEvent.READY, onReady);
		return () => player.off(PlayerEvent.READY, onReady);
	}, [player]);

	const castStateRef = useRef<ISkinState>(null);
	castStateRef.current = state;

	useEffect(() => {
		if (castSender) {
			castSender.on(CastSenderEvent.CONNECTED, () => {
				if (player.currentSrc) {
					castSender.load(player.currentSrc, player.currentTime);
				}
			});
			castSender.on(CastSenderEvent.DISCONNECTED, () => {
				setState((prevState) => ({ ...prevState, isCasting: false }));
				player.seekTo({ position: castStateRef.current?.currentTime });
			});
			castSender.on(CastSenderEvent.STATE_CHANGE, ({ state }) => {
				setState({
					isCasting: state.playbackState !== PlaybackState.IDLE,
					...state,
				});
			});
		}
	}, [castSender]);

	return [castSender, state];
}

export function usePlayer(webPlayer: WebPlayer, castAppId: string) {
	const [ready, setReady] = useState<boolean>(null);
	const [playerState, setPlayerState] = useState<ISkinState>(null);
	const [castSender, castState] = useCastSender(webPlayer, castAppId);
	const isCastingRef = useRef<boolean>(false);

	isCastingRef.current = castState?.isCasting ?? false;

	useEffect(() => {
		const onUnready = () => {
			setReady(null);
			setPlayerState(null);
		};
		const onReadying = () => {
			setReady(false);
		};
		const onReady = () => {
			setReady(true);
		};
		const onStateChange = ({ state }) => {
			if (isCastingRef.current && webPlayer.isPlaying) {
				webPlayer.pause();
			}
			setPlayerState({
				isCasting: false,
				...state,
			});
		};

		webPlayer.on(PlayerEvent.UNREADY, onUnready);
		webPlayer.on(PlayerEvent.READYING, onReadying);
		webPlayer.on(PlayerEvent.READY, onReady);
		webPlayer.on(PlayerEvent.STATE_CHANGE, onStateChange);

		// If the skin is rendered after the player has begun set the initial ready state
		switch (webPlayer.readyState) {
			case ReadyState.READYING:
				setReady(false);
				break;
			case ReadyState.READY:
				setReady(true);
				break;
		}

		return () => {
			webPlayer.off(PlayerEvent.UNREADY, onUnready);
			webPlayer.off(PlayerEvent.READYING, onReadying);
			webPlayer.off(PlayerEvent.READY, onReady);
			webPlayer.off(PlayerEvent.STATE_CHANGE, onStateChange);
		};
	}, [webPlayer]);

	let state, player;
	if (castState && castState.playbackState !== PlaybackState.IDLE) {
		player = castSender;
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
	const seekToLive = useCallback(() => player.seekToLive(), [player]);
	const setVolumeByPercentage = useCallback(
		(percentage: number) => player.setVolume({ percentage }),
		[player]
	);
	const setVolumeByChange = useCallback(
		(change: number) => player.setVolume({ change }),
		[player]
	);

	return [
		ready,
		state,
		togglePlayPause,
		toggleMute,
		changeAudioTrack,
		changeTextTrack,
		seekByPercentage,
		seekByChange,
		seekToLive,
		setVolumeByPercentage,
		setVolumeByChange,
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
