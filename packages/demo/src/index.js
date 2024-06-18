import WebPlayer, { PlayerEvent, getManifestType, canPlayManifestType } from '@eyevinn/web-player-core';
import { renderEyevinnSkin } from '@eyevinn/web-player-eyevinn-skin';
import { debugEvents } from '@eyevinn/web-player-debug';
import '@eyevinn/web-player-eyevinn-skin/dist/index.css';

// Uncomment this to demo the player package
// NOTE! you must also comment out some code in main()
// import webplayer from '@eyevinn/web-player';
// import '@eyevinn/web-player/dist/webplayer.css';

const EmbedVersion = "0.8.4";

const ExampleStreams = [
  { title: "HLS VOD", url: "https://f53accc45b7aded64ed8085068f31881.egress.mediapackage-vod.eu-north-1.amazonaws.com/out/v1/6dfccb0406c74fa3ac21d262db7384b1/ade303f83e8444d69b7658f988abb054/2a647c0cf9b7409598770b9f11799178/manifest.m3u8" },
  { title: "MPD VOD", url: "https://f53accc45b7aded64ed8085068f31881.egress.mediapackage-vod.eu-north-1.amazonaws.com/out/v1/6dfccb0406c74fa3ac21d262db7384b1/64651f16da554640930b7ce2cd9f758b/66d211307b7d43d3bd515a3bfb654e1c/manifest.mpd" },
  // { title: "HLS VOD SUBS & AUDIO", url: "http://sample.vodobox.com/planete_interdite/planete_interdite_alternate.m3u8"},
  { title: "HLS LIVE", url: "https://d2fz24s2fts31b.cloudfront.net/out/v1/6484d7c664924b77893f9b4f63080e5d/manifest.m3u8" },
  { title: "MPD LIVE", url: "https://d2fz24s2fts31b.cloudfront.net/out/v1/3b6879c0836346c2a44c9b4b33520f4e/manifest.mpd" },
  { title: "HLS LIVE SSAI", url: "https://edfaeed9c7154a20828a30a26878ade0.mediatailor.eu-west-1.amazonaws.com/v1/master/1b8a07d9a44fe90e52d5698704c72270d177ae74/AdTest/master.m3u8" },
  { title: "WHEP", url: "https://srtwhep.lab.sto.eyevinn.technology:8443/channel" }
  // { title: "WEBRTC", url: "https://broadcaster.lab.sto.eyevinn.technology:8443/broadcaster/channel/sthlm" }
];

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

let adsManager;
let adsLoader;
let adDisplayContainer;
let intervalTimer;
let isAdPlaying;
let isContentFinished;
let manifestInput;
let loadButton;
let shareButton;
let embedButton;
let autoplayCheckbox;

async function main() {
  manifestInput = document.querySelector('#manifest-input');
  autoplayCheckbox = document.querySelector('#autoplay');
  loadButton = document.querySelector('#load-button');
  shareButton = document.querySelector('#share-button');
  embedButton = document.querySelector('#embed-button');
  embedButton = document.querySelector('#embed-button');

  loadButton = document.querySelector('#load-button');
  loadButton.addEventListener('click', load);
  renderExampleButtons();
  
  if (!manifestInput.value) {
    embedButton.disabled = true;
  }
  if (!manifestInput.value || !isClipboardAvailable()) {
    shareButton.disabled = true;
  }

  const qualityPicker = document.getElementById('level');
  const playerControlsBlock = document.querySelector('#player-controls-block');

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

  let iceServers;
  
  if (process.env.ICE_SERVERS && process.env.ICE_SERVERS !== 'DEFAULT') {
    iceServers = [];
    process.env.ICE_SERVERS.split(",").forEach(server => {
      // turn:<username>:<password>@turn.eyevinn.technology:3478
      const m = server.match(/^turn:(\S+):(\S+)@(\S+):(\d+)/);
      if (m) {
        const [ _, username, credential, host, port ] = m;
        iceServers.push({ urls: "turn:" + host + ":" + port, username: username, credential: credential });
      }
    });
  }

  // Comment out this if you want to demo the player package
  const player = new WebPlayer({ 
    video: video, 
    iceServers: iceServers,
    enableCloudflareWhepBeta: process.env.CLOUDFLARE_BETA === "true",
  });
  renderEyevinnSkin({
    root,
    player,
  });

  // Uncomment out this if you want to demo the player package
  // const player = webplayer(root);

  let metadataReporter;

  async function load() {
    setUpIMA();
    try {
      player.reset();

      await player.load(manifestInput.value, autoplayCheckbox.checked);

      player.on(PlayerEvent.LOADED_METADATA, metadataReporter = () => {
        player.off(PlayerEvent.LOADED_METADATA, metadataReporter);
      });

      populateQualityPicker();
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Sets up IMA ad display container, ads loader, and makes an ad request.
   */
  function setUpIMA() {
    // Create the ad display container.
    createAdDisplayContainer();
    // Create ads loader.
    adsLoader = new google.ima.AdsLoader(adDisplayContainer);
    // Listen and respond to ads loaded and error events.
    adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded,
      false
    );
    adsLoader.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError,
      false
    );

    // An event listener to tell the SDK that our content video
    // is completed so the SDK can play any post-roll ads.
    const contentEndedListener = function () {
      // An ad might have been playing in the content element, in which case the
      // content has not actually ended.
      if (isAdPlaying) return;
      isContentFinished = true;
      adsLoader.contentComplete();
    };
    video.onended = contentEndedListener;

    // Request video ads.
    const adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = 'https://demo-website.eyevinn-test-adserver.auto.prod.osaas.io/api/v1/vast?dur=30';

    // Specify the linear and nonlinear slot sizes. This helps the SDK to
    // select the correct creative if multiple are returned.
    adsRequest.linearAdSlotWidth = 640;
    adsRequest.linearAdSlotHeight = 400;

    adsRequest.nonLinearAdSlotWidth = 640;
    adsRequest.nonLinearAdSlotHeight = 150;

    adsLoader.requestAds(adsRequest);
  }

  /**
   * Sets the 'ad-container' div as the IMA ad display container.
   */
  function createAdDisplayContainer() {
    // We assume the ad-container is the DOM id of the element that will house
    // the ads.
    adDisplayContainer = new google.ima.AdDisplayContainer(
      document.getElementById('ad-container'),
      video
    );
  }

  /**
   * Loads the video content and initializes IMA ad playback.
   */
  async function playAds() {
    adDisplayContainer.initialize();

    try {
      // Initialize the ads manager. Ad rules playlist will start at this time.
      adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
      // Call play to start showing the ad. Single video and overlay ads will
      // start at this time; the call will be ignored for ad rules.
      adsManager.start();
    } catch (adError) {
      // An error may be thrown if there was a problem with the VAST response.
      playerControlsBlock.style.display = 'block'
      video.play();
    }
  }

  /**
   * Handles the ad manager loading and sets ad event listeners.
   * @param {!google.ima.AdsManagerLoadedEvent} adsManagerLoadedEvent
   */
  function onAdsManagerLoaded(adsManagerLoadedEvent) {
    // Get the ads manager.
    const adsRenderingSettings = new google.ima.AdsRenderingSettings();
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
    // videoContent should be set to the content video element.
    adsManager = adsManagerLoadedEvent.getAdsManager(
      video,
      adsRenderingSettings
    );

    // Add listeners to the required events.
    adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
    adsManager.addEventListener(
      google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
      onContentPauseRequested
    );
    adsManager.addEventListener(
      google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
      onContentResumeRequested
    );
    adsManager.addEventListener(
      google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
      onAdEvent
    );

    // Listen to any additional events, if necessary.
    adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, onAdEvent);
    adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, onAdEvent);
    adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdEvent);
  }

  /**
   * Handles actions taken in response to ad events.
   * @param {!google.ima.AdEvent} adEvent
   */
  function onAdEvent(adEvent) {
    // Retrieve the ad from the event. Some events (for example,
    // ALL_ADS_COMPLETED) don't have ad object associated.
    const ad = adEvent.getAd();
    switch (adEvent.type) {
      case google.ima.AdEvent.Type.LOADED:
        // This is the first event sent for an ad - it is possible to
        // determine whether the ad is a video ad or an overlay.
        if (!ad.isLinear()) {
          // Position AdDisplayContainer correctly for overlay.
          // Use ad.width and ad.height.
          playerControlsBlock.style.display = 'block'
          video.play();
        }
        break;
      case google.ima.AdEvent.Type.STARTED:
        // This event indicates the ad has started - the video player
        // can adjust the UI, for example display a pause button and
        // remaining time.
        if (ad.isLinear()) {
          // For a linear ad, a timer can be started to poll for
          // the remaining time.
          intervalTimer = setInterval(function () {
            // Example: const remainingTime = adsManager.getRemainingTime();
          }, 300); // every 300ms
        }
        break;
      case google.ima.AdEvent.Type.COMPLETE:
        // This event indicates the ad has finished - the video player
        // can perform appropriate UI actions, such as removing the timer for
        // remaining time detection.
        if (ad.isLinear()) {
          clearInterval(intervalTimer);
        }
        break;
    }
  }

  /**
   * Handles ad errors.
   * @param {!google.ima.AdErrorEvent} adErrorEvent
   */
  function onAdError(adErrorEvent) {
    // Handle the error logging.
    console.log(adErrorEvent.getError());
    adsManager.destroy();
  }

  /**
   * Pauses video content and sets up ad UI.
   */
  function onContentPauseRequested() {
    isAdPlaying = true;
    playerControlsBlock.style.display = 'none'
    video.pause();
    // This function is where you should setup UI for showing ads (for example,
    // display ad timer countdown, disable seeking and more.)
    // setupUIForAds();
  }

  // Handle page visibility change events, so add is paused when user is redirected,
  // and when the user returns the ad resumes playing
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      if (isAdPlaying) {
        adsManager.pause();
        isAdPlaying = false;
      }
    } else {
      if (!isAdPlaying && adsManager) {
        adsManager.resume();
        isAdPlaying = true;
      }
    }
  });

  /**
   * Resumes video content and removes ad UI.
   */
  function onContentResumeRequested() {
    isAdPlaying = false;

    if (!isContentFinished) {
      playerControlsBlock.style.display = 'block'
      video.play();
    }
    // This function is where you should ensure that your UI is ready
    // to play content. It is the responsibility of the Publisher to
    // implement this function when necessary.
    // setupUIForContent();
  }

  video.addEventListener('play', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (isAdPlaying) {
      video.pause();
    }
    playAds();
  }, true);  

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

  async function renderExampleButtons() {
    const buttonContainer = document.querySelector('#example-streams');
    const isIOS = /iPhone|iPod/.test(navigator.userAgent);
    const isIPadOS = /iPad/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && 'ontouchstart' in document.documentElement);

    const playableStreams = await Promise.all(
      ExampleStreams.map(async (exampleStream) => {
        const manifestType = await getManifestType(exampleStream.url);
        const nativelySupportedManifestType = canPlayManifestType(manifestType);
        return (isIOS || isIPadOS) && !nativelySupportedManifestType ? false : exampleStream;
      })
    );

    playableStreams.forEach((exampleStream) => {
      if (!exampleStream) {
        return;
      }

      const btn = document.createElement('button');
      btn.innerHTML = exampleStream.title;
      buttonContainer.appendChild(btn);

      btn.addEventListener('click', async () => {
        manifestInput.value = exampleStream.url;
        await load();
        resetEmbed();
        if (isClipboardAvailable()) {
          shareButton.disabled = false;
        }
      });
    });
  }

  loadButton.onclick = async () => {
    await load();
  };
  shareButton.onclick = () => {
    shareDemoUrl(manifestInput.value);
  };

  embedButton.onclick = () => {
    const embedString = `<script async type="text/javascript" src="https://unpkg.com/@eyevinn/web-player-component@${EmbedVersion}/dist/web-player.component.js"></script>
    <eyevinn-video source="${manifestInput.value}" ${autoplayCheckbox.checked ? 'muted autoplay' : ''} ></eyevinn-video>`;
    updateEmbedStatus('Copy code below ⬇️');
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

  //Work on this one...
  player.on(PlayerEvent.READY, () => {
    console.log('player ready');
  });

  player.on(PlayerEvent.BITRATE_CHANGE, (data) => {
  });

  player.on(PlayerEvent.PLAYER_STOPPED, () => {
  });

  player.on(PlayerEvent.ERROR, ({ errorData, fatal }) => {
    console.error('player reported error', errorData);
    if (fatal) {
      player.destroy();
      console.log('player destroyed due to error');
    }
  });

  player.on(PlayerEvent.UNREADY, () => {
    console.log('player unready');
  });
}
window.onload = main;
