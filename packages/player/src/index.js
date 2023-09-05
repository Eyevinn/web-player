import WebPlayer from '@eyevinn/web-player-core';
import { renderEyevinnSkin } from '@eyevinn/web-player-eyevinn-skin';
import '@eyevinn/web-player-eyevinn-skin/dist/index.css';

export default function webplayer(wrapper, opts) {
  const castAppId = opts && opts.castAppId ? opts.castAppId : undefined;
  const video = document.createElement('video');
  wrapper.appendChild(video);
  const player = new WebPlayer({ 
    video: video,
    disablePlayerSizeLevelCap: opts.disablePlayerSizeLevelCap,
    iceServers: opts.iceServers,
    enableCloudflareWhepBeta: opts.enableCloudflareWhepBeta
  });
  const destroySkin = renderEyevinnSkin({
    root: wrapper,
    player,
    castAppId
  });
  return {
    player,
    destroy: () => {
      player.destroy();
      destroySkin();
      wrapper.removeChild(video);
    }
  };
}
