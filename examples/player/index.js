import WebPlayer, { PlayerEvent } from '@eyevinn/web-player-core';

async function main() {
  const manifestInput = document.querySelector('#manifest-input');
  const loadButton = document.querySelector('#load-button');

  const root = document.querySelector('#player');
  const video = document.createElement('video');
  root.appendChild(video);

  const player = new WebPlayer({ 
    video: video
  });


  player.on(PlayerEvent.ERROR, ({ errorData, fatal }) => {
    console.error(JSON.stringify(errorData));
  });

  async function load() {
    console.log('Loading manifest:', manifestInput.value);
    await player.load(manifestInput.value, true);
  }

  loadButton.onclick = async () => {
    await load();
  };
}

window.onload = main;
