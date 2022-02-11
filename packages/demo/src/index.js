// Comment out these imports if you want to demo the player package
import WebPlayer from '@eyevinn/web-player-core';
import { renderEyevinnSkin } from '@eyevinn/web-player-eyevinn-skin';
import { debugEvents } from '@eyevinn/web-player-debug';
import '@eyevinn/web-player-eyevinn-skin/dist/index.css';

// Uncomment this to demo the player package
// import webplayer from '@eyevinn/web-player';
// import '@eyevinn/web-player/dist/webplayer.css';

function isClipboardAvailable() {
  return !!navigator.clipboard;
}

async function writeToClipboard(text) {
  if (!isClipboardAvailable()) {
    throw new Error("clipboard not supported");
  }

  await navigator.clipboard.writeText(text);
}

let shareStatusTimeout;

function updateShareStatus(text) {
  const shareButton = document.querySelector('#share-button');

  shareButton.disabled = true;
  shareButton.textContent = text;

  clearTimeout(shareStatusTimeout);
  shareStatusTimeout = setTimeout(() => {
    shareButton.disabled = false;
    shareButton.textContent = 'Share 📋';
  }, 1500);
}

function updateEmbedStatus(text) {
  const embedButton = document.querySelector('#embed-button');
  embedButton.textContent = text;
}

function shareDemoUrl(manifestUrl) {
  const url = new URL(document.location.href);
  url.searchParams.set('manifest', manifestUrl);
  writeToClipboard(url.toString()).then(
    () => {
      updateShareStatus('Copied! ✅');
    },
    () => {
      updateShareStatus('Could not copy ❌');
    }
  );
}

async function main() {
  const hlsButton = document.querySelector('#hls-button');
  const dashButton = document.querySelector('#dash-button');
  const mssButton = document.querySelector('#mss-button');

  const manifestInput = document.querySelector('#manifest-input');
  const loadButton = document.querySelector('#load-button');
  const shareButton = document.querySelector('#share-button');
  const embedButton = document.querySelector('#embed-button');

  if (!manifestInput.value) {
    embedButton.disabled = true;
  }
  if (!manifestInput.value || !isClipboardAvailable()) {
    shareButton.disabled = true;
  }

  const qualityPicker = document.getElementById('level');

  const searchParams = new URL(window.location.href).searchParams;

  const root = document.querySelector('#player');
  const video = document.createElement('video');
  root.appendChild(video);

  const snackbar = document.querySelector('#snackbar');
  let embedCode = document.querySelector('#embed-code');
  let snackbarCloseButton = document.querySelector('#snackbar-close-button');

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
  // const player = webplayer(root);

  async function load() {
    await player.load(manifestInput.value);
    populateQualityPicker();
  }

  function populateQualityPicker() {
    // Reset/Clear-out the drop down menu.
    for (var i = qualityPicker.options.length - 1; i >= 0; i--) {
      if (qualityPicker.options[i].value != '-1') {
        qualityPicker.remove(i);
      }
    }

    const videoLevels = player.getVideoLevels();
    videoLevels.forEach((level, index) => {
      const option = document.createElement('option');
      option.text = `${level.width}x${level.height}, ${Math.round(
        level.bitrate / 1024
      )}kbps`;
      option.value = index;
      qualityPicker.add(option);
    });
  }
  hlsButton.onclick = async () => {
    manifestInput.value =
      'https://d2fz24s2fts31b.cloudfront.net/out/v1/6484d7c664924b77893f9b4f63080e5d/manifest.m3u8';
    load();
    resetEmbed();
    if (isClipboardAvailable()) {
      shareButton.disabled = false;
    } 

  };
  dashButton.onclick = async () => {
    manifestInput.value =
      'https://d2fz24s2fts31b.cloudfront.net/out/v1/3b6879c0836346c2a44c9b4b33520f4e/manifest.mpd';
    load();
    resetEmbed();
    if (isClipboardAvailable()) {
      shareButton.disabled = false;
    } 
  };

  mssButton.onclick = async () => {
    manifestInput.value =
      'http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest';
    load();
    resetEmbed();
    if (isClipboardAvailable()) {
      shareButton.disabled = false;
    } 
  };

  loadButton.onclick = () => {
    load();
  }
  shareButton.onclick = () => {
    shareDemoUrl(manifestInput.value);
  };

  embedButton.onclick = () => {
    const embedString = `<script type="text/javascript" src="https://unpkg.com/@eyevinn/web-player-component@0.1.1/dist/web-player.component.js"></script>
    <eyevinn-video source="${manifestInput.value}" muted autoplay ></eyevinn-video>`;
    updateEmbedStatus('Copy this code ➡️');
    embedPopUp(embedString);
  };

  snackbarCloseButton.onclick = () => {
    resetEmbed();
  };

  manifestInput.oninput = () => {
    resetEmbed();
    if (!manifestInput.value) {
      embedButton.disabled = true;
      shareButton.disabled = true;
    }
    else {
      embedButton.disabled = false;
      if (isClipboardAvailable()) {
        shareButton.disabled = false;
      }
    }
  }

  qualityPicker.onchange = () => {
    if (qualityPicker.value == -1) {
      console.log(`Switching from level ${player.currentLevel.id} to ABR`);
      player.currentLevel = null;
    } else {
      const selectedLevel = player.getVideoLevels()[qualityPicker.value];
      console.log(`Switching from level ${player.currentLevel.id} to ${selectedLevel.id}`);
      player.currentLevel = selectedLevel;
    }
  };

  if (searchParams.get('manifest')) {
    manifestInput.value = searchParams.get('manifest');
    load();
    if (manifestInput.value) {
      embedButton.disabled = false;
      if (isClipboardAvailable()) {
        shareButton.disabled = false;
      }
    }
  }

  function resetEmbed() {
    embedButton.disabled = false;
    embedButton.textContent = 'Embed 📋';
    snackbar.classList.remove("show");
  }

  function embedPopUp(embedString) {
    snackbar.className = "show";
    embedCode.innerText = embedString;
  }
}

window.onload = main;
