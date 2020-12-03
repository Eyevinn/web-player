import WebPlayer from '@eyevinn/web-player-core';
import { renderEyevinnSkin } from '@eyevinn/web-player-eyevinn-skin';
import '@eyevinn/web-player-eyevinn-skin/dist/index.css';

export default function webplayer(wrapper, { castAppId }) {
  const video = document.createElement('video');
  wrapper.appendChild(video);
  const player = new WebPlayer({ video });
  renderEyevinnSkin({
    root: wrapper,
    player,
    castAppId
  });
  return player;
}
