// Comment out these imports if you want to demo the player package
import WebPlayer, { PlayerEvent } from '@eyevinn/web-player-core';
import { renderEyevinnSkin } from '@eyevinn/web-player-eyevinn-skin';
import { debugEvents } from '@eyevinn/web-player-debug';
import '@eyevinn/web-player-eyevinn-skin/dist/index.css';
import { PlayerAnalyticsConnector } from '@eyevinn/player-analytics-client-sdk-web';

// Uncomment this to demo the player package
// import webplayer from '@eyevinn/web-player';
// import '@eyevinn/web-player/dist/webplayer.css';

function isClipboardAvailable() {
  return !!navigator.clipboard;
}

async function writeToClipboard(text) {
  if (!isClipboardAvailable()) {
    throw new Error('clipboard not supported');
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
  const playerAnalytics = new PlayerAnalyticsConnector(
    'https://sink.epas.eyevinn.technology/'
  );

  // Uncomment out this if you want to demo the player package
  // const player = webplayer(root);

  let analyticsInitiated = false;

  async function load() {
    await player.load(manifestInput.value);
    try {
      await playerAnalytics.init({
        sessionId: `demo-page-${Date.now()}`,
        live: player.isLive,
        contentId: manifestInput.value,
        contentUrl: manifestInput.value,
      });
      playerAnalytics.load(video);
      analyticsInitiated = true;
    } catch (err) {
      console.error(err);
    }
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
      'https://f53accc45b7aded64ed8085068f31881.egress.mediapackage-vod.eu-north-1.amazonaws.com/out/v1/1c63bf88e2664639a6c293b4d055e6bb/ade303f83e8444d69b7658f988abb054/2a647c0cf9b7409598770b9f11799178/manifest.m3u8';
    load();
    resetEmbed();
    if (isClipboardAvailable()) {
      shareButton.disabled = false;
    }
  };
  dashButton.onclick = async () => {
    manifestInput.value =
      'https://f53accc45b7aded64ed8085068f31881.egress.mediapackage-vod.eu-north-1.amazonaws.com/out/v1/1c63bf88e2664639a6c293b4d055e6bb/64651f16da554640930b7ce2cd9f758b/66d211307b7d43d3bd515a3bfb654e1c/manifest.mpd';
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
  };
  shareButton.onclick = () => {
    shareDemoUrl(manifestInput.value);
  };

  embedButton.onclick = () => {
    const embedString = `<script type="text/javascript" src="https://unpkg.com/@eyevinn/web-player-component@0.3.1/dist/web-player.component.js"></script>
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
    } else {
      embedButton.disabled = false;
      if (isClipboardAvailable()) {
        shareButton.disabled = false;
      }
    }
  };

  qualityPicker.onchange = () => {
    if (qualityPicker.value == -1) {
      console.log(`Switching from level ${player.currentLevel.id} to ABR`);
      player.currentLevel = null;
    } else {
      const selectedLevel = player.getVideoLevels()[qualityPicker.value];
      console.log(
        `Switching from level ${player.currentLevel.id} to ${selectedLevel.id}`
      );
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
    snackbar.classList.remove('show');
  }

  function embedPopUp(embedString) {
    snackbar.className = 'show';
    embedCode.innerText = embedString;
  }

  player.on(PlayerEvent.BITRATE_CHANGE, (data) => {
    playerAnalytics.reportBitrateChange({
      bitrate: (data.bitrate / 1000).toString(), // bitrate in Kbps
      width: data.width.toString(), // optional, video width in pixels
      height: data.height.toString(), // optional, video height in pixels
    });
  });

  player.on(PlayerEvent.PLAYER_STOPPED, () => {
    playerAnalytics.reportStop();
  });

  player.on(PlayerEvent.ERROR, ({ errorData, fatal }) => {
    if (fatal) {
      playerAnalytics.reportError(errorData);
    } else {
      playerAnalytics.reportWarning(errorData);
    }
  });

  player.on(PlayerEvent.UNREADY, () => {
    analyticsInitiated && playerAnalytics.deinit();
    analyticsInitiated = false;
  });
}
window.onload = main;
