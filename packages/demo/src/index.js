// Comment out these imports if you want to demo the player package
import WebPlayer from '@eyevinn/web-player-core';
import { renderEyevinnSkin } from '@eyevinn/web-player-eyevinn-skin';
import { debugEvents } from '@eyevinn/web-player-debug';
import '@eyevinn/web-player-eyevinn-skin/dist/index.css';

// Uncomment this to demo the player package
//import webplayer from '@eyevinn/web-player';
//import '@eyevinn/web-player/dist/webplayer.css';

async function main() {
  const hlsButton = document.querySelector('#hls-button');
  const dashButton = document.querySelector('#dash-button');
  const mssButton = document.querySelector('#mss-button');

  const manifestInput = document.querySelector('#manifest-input');
  const loadButton = document.querySelector('#load-button');
  const qualityPicker = document.getElementById('level');

  const searchParams = new URL(window.location.href).searchParams;

  if (searchParams.get('manifest')) {
    manifestInput.value = searchParams.get('manifest');
  }

  const root = document.querySelector('#player');
  const video = document.createElement('video');
  root.appendChild(video);

  if (searchParams.get('debug') === 'true') {
    debugEvents(video);
  }

  // Comment out this if you want to demo the player package
  const player = new WebPlayer({ video });
  renderEyevinnSkin({
    root,
    player,
  });

  // Uncomment out this if you want to demo the player package
  //const player = webplayer(root);

  async function load() {
    await player.load(manifestInput.value);
    populateQualityPicker();
  }

  function populateQualityPicker() {
    // Reset/Clear-out the drop down menu.
    for (var i = qualityPicker.options.length - 1; i >= 0; i--) {
      if (qualityPicker.options[i].value != '-1') qualityPicker.remove(i);
    }

    const videoLevels = player.getVideoLevels();
    videoLevels.forEach((level) => {
      const option = document.createElement('option');
      option.text = `${level.width}x${level.height}, ${Math.round(
        level.bitrate / 1024
      )}kbps`;
      option.value = level.id;
      qualityPicker.add(option);
    });
  }
  // Quality picker fails with:
  // https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8
  hlsButton.onclick = async () => {
    manifestInput.value =
      'https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8';
    load();
  };
  dashButton.onclick = async () => {
    manifestInput.value =
      'https://storage.googleapis.com/shaka-demo-assets/sintel-mp4-only/dash.mpd';
    load();
  };

  mssButton.onclick = async () => {
    manifestInput.value =
      'http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest';
    load();
  };

  loadButton.onclick = () => load();

  qualityPicker.onchange = () => {
    if (qualityPicker.value == -1) player.currentLevel = null;
    else {
      const selectedLevel = player
        .getVideoLevels()
        .find((level) => level.id == qualityPicker.value);
      console.log(
        `Switching from level ${player.currentLevel.id} to ${selectedLevel.id}`
      );
      player.currentLevel = selectedLevel;
    }
  };
}

window.onload = main;
