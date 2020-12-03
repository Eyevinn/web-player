import WebPlayer from '@eyevinn/web-player-core';
interface WebPlayerOptions {
  castAppId?: string
}
export default function webplayer(wrapper: HTMLElement, options: WebPlayerOptions): WebPlayer;
