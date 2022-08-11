import WebPlayer, { IWebPlayerAdOptions } from '@eyevinn/web-player-core';
interface WebPlayerOptions {
  castAppId?: string;
  ads?: IWebPlayerAdOptions
}
export default function webplayer(wrapper: HTMLElement, options: WebPlayerOptions): WebPlayer;
