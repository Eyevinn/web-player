import WebPlayer from '@eyevinn/web-player-core';
interface WebPlayerOptions {
  castAppId?: string;
  disablePlayerSizeLevelCap?: boolean;
  iceServers?: RTCIceServer[];
  enableCloudflareWhepBeta?: boolean;
}
export default function webplayer(wrapper: HTMLElement, options: WebPlayerOptions): WebPlayer;
