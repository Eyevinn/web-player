import WebPlayer from '@eyevinn/web-player-core';
interface WebPlayerOptions {
  castAppId?: string;
  disablePlayerSizeLevelCap?: boolean;
  iceServers?: RTCIceServer[];
  enableCloudflareWhepBeta?: boolean;
}

export * from '@eyevinn/web-player-core';

export default function webplayer(
  wrapper: HTMLElement,
  options: WebPlayerOptions
): {
  player: WebPlayer;
  destroy: () => void;
};
