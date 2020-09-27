import WebPlayer from '@eyevinn/web-player-core';
import { renderEyevinnSkin } from '@eyevinn/web-player-eyevinn-skin';
import { debugEvents } from '@eyevinn/web-player-debug';
import '@eyevinn/web-player-eyevinn-skin/dist/index.css';

async function main() {
  const hlsButton = document.querySelector('#hls-button');
  const dashButton = document.querySelector('#dash-button');
  const mssButton = document.querySelector('#mss-button');

  const manifestInput = document.querySelector('#manifest-input');
  const loadButton = document.querySelector('#load-button');


  const searchParams = new URL(window.location.href).searchParams;

  if (searchParams.get('manifest')) {
    manifestInput.value = searchParams.get('manifest');
  }

  const video = document.querySelector('video');
  if (searchParams.get('debug') === 'true') {
    debugEvents(video);
  }
  const player = new WebPlayer({ video });
  renderEyevinnSkin({
    root: document.querySelector('#player'),
    player,
  });

  function load() {
    player.load(manifestInput.value);
  }

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
}

window.onload = main;
