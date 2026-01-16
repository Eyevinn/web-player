import WebPlayer, {
  PlayerEvent,
  getManifestType,
  canPlayManifestType,
} from '@eyevinn/web-player-core';
import { renderEyevinnSkin } from '@eyevinn/web-player-eyevinn-skin';
import { debugEvents } from '@eyevinn/web-player-debug';
import '@eyevinn/web-player-eyevinn-skin/dist/index.css';
import { PlayerAnalyticsConnector } from '@eyevinn/player-analytics-client-sdk-web';
import { PlayerDebug } from './player-debug';
import { NetworkMonitor } from './network-monitor';
import { NetworkAnalysis } from './network-analysis';
import { CustomLogger } from './custom-logger';
import { SegmentTimeline } from './segment-timeline';

// Uncomment this to demo the player package
// NOTE! you must also comment out some code in main()
// import webplayer from '@eyevinn/web-player';
// import '@eyevinn/web-player/dist/webplayer.css';

const EmbedVersion = '0.9.4';

const ExampleStreams = [
  {
    title: 'HLS VOD',
    url: 'https://lab.cdn.eyevinn.technology/osc/osc-reel/a4e1156e-f872-455f-9f1f-be73b5effba8/index.m3u8',
  },
  {
    title: 'MPD VOD',
    url: 'https://lab.cdn.eyevinn.technology/osc/osc-reel/a4e1156e-f872-455f-9f1f-be73b5effba8/manifest.mpd',
  },
  // { title: "HLS VOD SUBS & AUDIO", url: "http://sample.vodobox.com/planete_interdite/planete_interdite_alternate.m3u8"},
  {
    title: 'HLS LIVE',
    url: 'https://d2fz24s2fts31b.cloudfront.net/out/v1/6484d7c664924b77893f9b4f63080e5d/manifest.m3u8',
  },
  {
    title: 'MPD LIVE',
    url: 'https://d2fz24s2fts31b.cloudfront.net/out/v1/3b6879c0836346c2a44c9b4b33520f4e/manifest.mpd',
  },
  {
    title: 'HLS LIVE SSAI',
    url: 'https://edfaeed9c7154a20828a30a26878ade0.mediatailor.eu-west-1.amazonaws.com/v1/master/1b8a07d9a44fe90e52d5698704c72270d177ae74/AdTest/master.m3u8',
  },
  // { title: "WHEP", url: "https://srtwhep.lab.sto.eyevinn.technology:8443/channel" }
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

function getShareUrl(manifestUrl) {
  const url = new URL(document.location.href);
  url.searchParams.set('manifest', manifestUrl);
  return url.toString();
}

function getEmbedCode(manifestUrl, autoplay) {
  return `<script async type="text/javascript" src="https://unpkg.com/@eyevinn/web-player-component@${EmbedVersion}/dist/web-player.component.js"></script>
<eyevinn-video source="${manifestUrl}" ${
    autoplay ? 'muted autoplay' : ''
  }></eyevinn-video>`;
}

async function main() {
  const manifestInput = document.querySelector('#manifest-input');
  const autoplayButton = document.querySelector('#autoplay-button');
  const loadButton = document.querySelector('#load-button');
  const shareButton = document.querySelector('#share-button');
  
  // Autoplay state (default: false)
  let autoplayEnabled = false;
  const epasUrlInput = document.querySelector('#epas-eventsink-url');
  const dropdownToggle = document.querySelector('#dropdown-toggle');
  const exampleStreamsDropdown = document.querySelector(
    '#example-streams-dropdown'
  );
  populateExampleStreams();

  // Disable Load button initially if no stream is selected
  if (!manifestInput.value) {
    loadButton.disabled = true;
  }

  const searchParams = new URL(window.location.href).searchParams;

  const root = document.querySelector('#player');
  const video = document.createElement('video');
  root.appendChild(video);

  // Custom logger
  const customLogger = new CustomLogger();

  // Player debug elements
  const playerDebugSection = document.querySelector('#player-debug-section');
  const playerDebug = new PlayerDebug(video, playerDebugSection);
  const networkAnalysis = new NetworkAnalysis();
  const networkMonitor = new NetworkMonitor((request) => {
    // Forward requests to network analysis
    networkAnalysis.addRequest(request);
  });
  const segmentTimeline = new SegmentTimeline(video, networkMonitor);

  // Tab switching
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;

      // Update button states
      document
        .querySelectorAll('.tab-button')
        .forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      // Update tab content visibility
      document
        .querySelectorAll('.tab-content')
        .forEach((content) => content.classList.remove('active'));
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });

  // Start player debug immediately to show default values
  playerDebug.start();
  networkMonitor.start();
  segmentTimeline.start();

  // Share modal elements
  const shareModal = document.querySelector('#share-modal');
  const shareModalClose = document.querySelector('#share-modal-close');
  const shareLinkInput = document.querySelector('#share-link-input');
  const embedLinkInput = document.querySelector('#embed-link-input');
  const copyShareLinkButton = document.querySelector('#copy-share-link-button');
  const copyEmbedLinkButton = document.querySelector('#copy-embed-link-button');

  if (searchParams.get('debug') === 'true') {
    debugEvents(video);
  }

  let iceServers;

  if (process.env.ICE_SERVERS && process.env.ICE_SERVERS !== 'DEFAULT') {
    iceServers = [];
    process.env.ICE_SERVERS.split(',').forEach((server) => {
      // turn:<username>:<password>@turn.eyevinn.technology:3478
      const m = server.match(/^turn:(\S+):(\S+)@(\S+):(\d+)/);
      if (m) {
        const [_, username, credential, host, port] = m;
        iceServers.push({
          urls: 'turn:' + host + ':' + port,
          username: username,
          credential: credential,
        });
      }
    });
  }

  if (process.env.ANALYTICS_URL) {
    epasUrlInput.value = process.env.ANALYTICS_URL;
  }

  // Comment out this if you want to demo the player package
  const player = new WebPlayer({
    video: video,
    iceServers: iceServers,
    enableCloudflareWhepBeta: process.env.CLOUDFLARE_BETA === 'true',
  });
  renderEyevinnSkin({
    root,
    player,
  });

  // Uncomment out this if you want to demo the player package
  // const player = webplayer(root);

  let analyticsInitiated = false;
  let metadataReporter;
  let playerAnalytics;

  async function load() {
    try {
      if (epasUrlInput.value) {
        playerAnalytics = new PlayerAnalyticsConnector(epasUrlInput.value);
      }

      player.reset();

      // Reset player debug
      playerDebug.reset();
      networkMonitor.reset();
      networkAnalysis.reset();
      segmentTimeline.reset();

      try {
        playerAnalytics &&
          (await playerAnalytics.init({
            sessionId: `web-player-demo-${Date.now()}`,
          }));
      } catch (err) {
        console.error('Failed to initiate analytics', err);
        playerAnalytics = null;
      }
      await player.load(manifestInput.value, autoplayEnabled);
      playerAnalytics && playerAnalytics.load(video);

      // Save successful load to previous searches
      if (manifestInput.value && manifestInput.value.trim() !== '') {
        savePreviousSearch(manifestInput.value.trim());
        // Refresh dropdown to show new previous search
        refreshDropdown();
      }

      player.on(
        PlayerEvent.LOADED_METADATA,
        (metadataReporter = () => {
          if (analyticsInitiated) return;
          if (playerAnalytics) {
            playerAnalytics.reportMetadata({
              live: player.isLive,
              contentUrl: manifestInput.value,
            });
            analyticsInitiated = true;
          }
          player.off(PlayerEvent.LOADED_METADATA, metadataReporter);
        })
      );

      playerDebug.start();
      networkMonitor.start();
      segmentTimeline.start();
    } catch (err) {
      console.error(err);
      analyticsInitiated && playerAnalytics.deinit();
    }
  }

  // Functions to manage previously entered URLs
  function getPreviousSearches() {
    try {
      const stored = localStorage.getItem('webplayer-previous-searches');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function savePreviousSearch(url) {
    if (!url || url.trim() === '') return;

    // Check if URL is an example stream - don't save example streams
    const isExampleStream = ExampleStreams.some((stream) => stream.url === url);
    if (isExampleStream) return;

    const previousSearches = getPreviousSearches();
    // Remove if already exists
    const filtered = previousSearches.filter((s) => s !== url);
    // Add to beginning and limit to 10
    const updated = [url, ...filtered].slice(0, 10);

    try {
      localStorage.setItem(
        'webplayer-previous-searches',
        JSON.stringify(updated)
      );
    } catch (e) {
      console.warn('Failed to save previous search:', e);
    }
  }

  function refreshDropdown() {
    // Remove previous searches header and options
    const allSeparators = Array.from(
      exampleStreamsDropdown.querySelectorAll('.dropdown-separator')
    );
    const previousHeader = allSeparators.find(
      (el) => el.textContent === 'Previously Searched'
    );
    const previousOptions = exampleStreamsDropdown.querySelectorAll(
      '.dropdown-option-previous'
    );
    const exampleSeparator = allSeparators.find(
      (el) => el.textContent === 'Example streams'
    );

    if (previousHeader) previousHeader.remove();
    previousOptions.forEach((option) => option.remove());

    // Re-add previous searches at the beginning if they exist
    const previousSearches = getPreviousSearches();
    if (previousSearches.length > 0) {
      // Add header for previous searches
      const newPreviousHeader = document.createElement('div');
      newPreviousHeader.className = 'dropdown-separator';
      newPreviousHeader.textContent = 'Previously Searched';

      // Insert before example streams separator or at the beginning
      const insertBefore =
        exampleSeparator || exampleStreamsDropdown.firstChild;
      exampleStreamsDropdown.insertBefore(newPreviousHeader, insertBefore);

      // Add previous searches
      previousSearches.forEach((url) => {
        const option = document.createElement('div');
        option.className = 'dropdown-option dropdown-option-previous';
        option.textContent = url;
        option.dataset.value = url;
        option.title = url;
        exampleStreamsDropdown.insertBefore(option, insertBefore);
      });

      // Add or update example streams separator
      if (!exampleSeparator) {
        const newSeparator = document.createElement('div');
        newSeparator.className = 'dropdown-separator';
        newSeparator.textContent = 'Example streams';
        exampleStreamsDropdown.insertBefore(newSeparator, insertBefore);
      }
    } else if (exampleSeparator && !previousHeader) {
      // If no previous searches and no previous header, example separator stays
    }
  }

  async function populateExampleStreams() {
    const isIOS = /iPhone|iPod/.test(navigator.userAgent);
    const isIPadOS =
      /iPad/.test(navigator.userAgent) ||
      (/Macintosh/.test(navigator.userAgent) &&
        'ontouchstart' in document.documentElement);

    const playableStreams = await Promise.all(
      ExampleStreams.map(async (exampleStream) => {
        const manifestType = await getManifestType(exampleStream.url);
        const nativelySupportedManifestType = canPlayManifestType(manifestType);
        return (isIOS || isIPadOS) && !nativelySupportedManifestType
          ? false
          : exampleStream;
      })
    );

    // Add previous searches first if they exist
    const previousSearches = getPreviousSearches();
    if (previousSearches.length > 0) {
      // Add header for previous searches
      const previousHeader = document.createElement('div');
      previousHeader.className = 'dropdown-separator';
      previousHeader.textContent = 'Previously Searched';
      exampleStreamsDropdown.appendChild(previousHeader);

      previousSearches.forEach((url) => {
        const option = document.createElement('div');
        option.className = 'dropdown-option dropdown-option-previous';
        option.textContent = url;
        option.dataset.value = url;
        option.title = url; // Show full URL on hover
        exampleStreamsDropdown.appendChild(option);
      });

      // Add separator between previous searches and example streams
      const separator = document.createElement('div');
      separator.className = 'dropdown-separator';
      separator.textContent = 'Example streams';
      exampleStreamsDropdown.appendChild(separator);
    }

    // Add example streams
    playableStreams.forEach((exampleStream) => {
      if (!exampleStream) {
        return;
      }

      const option = document.createElement('div');
      option.className = 'dropdown-option';
      option.textContent = exampleStream.title;
      option.dataset.value = exampleStream.url;
      exampleStreamsDropdown.appendChild(option);
    });

    // Toggle dropdown visibility
    dropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      exampleStreamsDropdown.classList.toggle('hidden');
    });

    // Show dropdown when clicking in the input field
    manifestInput.addEventListener('click', (e) => {
      e.stopPropagation();
      exampleStreamsDropdown.classList.remove('hidden');
    });

    manifestInput.addEventListener('focus', (e) => {
      e.stopPropagation();
      exampleStreamsDropdown.classList.remove('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.input-with-dropdown')) {
        exampleStreamsDropdown.classList.add('hidden');
      }
    });

    // Handle option selection
    exampleStreamsDropdown.addEventListener('click', (e) => {
      const option = e.target.closest('.dropdown-option');
      if (option && option.dataset.value) {
        const url = option.dataset.value;
        manifestInput.value = url;
        exampleStreamsDropdown.classList.add('hidden');
        // Enable Load button when stream is selected
        if (loadButton) {
          loadButton.disabled = false;
        }
      }
    });
  }

  loadButton.onclick = async () => {
    await load();
  };

  // Autoplay button handler
  if (autoplayButton) {
    autoplayButton.onclick = () => {
      autoplayEnabled = !autoplayEnabled;
      updateAutoplayButton();
    };
    updateAutoplayButton(); // Initialize button state
  }

  function updateAutoplayButton() {
    if (autoplayButton) {
      const checkmark = autoplayButton.querySelector('.autoplay-checkmark');
      if (autoplayEnabled) {
        autoplayButton.classList.add('active');
        if (checkmark) {
          checkmark.style.display = 'inline-block';
        }
      } else {
        autoplayButton.classList.remove('active');
        if (checkmark) {
          checkmark.style.display = 'none';
        }
      }
    }
  }

  // Options modal functionality
  const optionsButton = document.querySelector('#options-button');
  const optionsModal = document.querySelector('#eventsink-modal');
  const optionsModalClose = document.querySelector('#eventsink-modal-close');
  const eventsinkUrlInput = document.querySelector('#eventsink-url-input');
  const optionsSaveButton = document.querySelector('#eventsink-save-button');
  const optionsCancelButton = document.querySelector(
    '#eventsink-cancel-button'
  );

  if (optionsButton) {
    optionsButton.onclick = () => {
      if (eventsinkUrlInput) {
        eventsinkUrlInput.value = epasUrlInput.value;
      }
      if (optionsModal) {
        optionsModal.classList.remove('hidden');
      }
    };
  }

  if (optionsModalClose) {
    optionsModalClose.onclick = () => {
      if (optionsModal) {
        optionsModal.classList.add('hidden');
      }
    };
  }

  if (optionsCancelButton) {
    optionsCancelButton.onclick = () => {
      if (optionsModal) {
        optionsModal.classList.add('hidden');
      }
    };
  }

  if (optionsSaveButton) {
    optionsSaveButton.onclick = () => {
      if (eventsinkUrlInput && epasUrlInput) {
        epasUrlInput.value = eventsinkUrlInput.value.trim();
      }
      if (optionsModal) {
        optionsModal.classList.add('hidden');
      }
    };
  }

  // Close modal when clicking outside
  if (optionsModal) {
    optionsModal.onclick = (e) => {
      if (e.target === optionsModal) {
        optionsModal.classList.add('hidden');
      }
    };
  }

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (optionsModal && !optionsModal.classList.contains('hidden')) {
        optionsModal.classList.add('hidden');
      }
      if (shareModal && !shareModal.classList.contains('hidden')) {
        shareModal.classList.add('hidden');
      }
    }
  });

  // Close dropdown when pressing Enter in the input field
  manifestInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault();
      exampleStreamsDropdown.classList.add('hidden');
    }
  });
  // Share modal handlers
  if (shareButton) {
    shareButton.onclick = () => {
      // Generate share URL and embed code
      const manifestUrl = manifestInput.value || '';
      const shareUrl = getShareUrl(manifestUrl);
      const embedCode = getEmbedCode(
        manifestUrl,
        autoplayEnabled
      );

      // Update input values
      if (shareLinkInput) {
        shareLinkInput.value = shareUrl;
      }
      if (embedLinkInput) {
        embedLinkInput.value = embedCode;
      }

      // Show modal
      if (shareModal) {
        shareModal.classList.remove('hidden');
      }
    };
  }

  // Copy share link button
  if (copyShareLinkButton && shareLinkInput) {
    copyShareLinkButton.onclick = async () => {
      try {
        await writeToClipboard(shareLinkInput.value);
        // Visual feedback - could add a toast notification here
        copyShareLinkButton.style.opacity = '0.6';
        setTimeout(() => {
          copyShareLinkButton.style.opacity = '1';
        }, 200);
      } catch (err) {
        console.error('Failed to copy share link:', err);
      }
    };
  }

  // Copy embed code button
  if (copyEmbedLinkButton && embedLinkInput) {
    copyEmbedLinkButton.onclick = async () => {
      try {
        await writeToClipboard(embedLinkInput.value);
        // Visual feedback - could add a toast notification here
        copyEmbedLinkButton.style.opacity = '0.6';
        setTimeout(() => {
          copyEmbedLinkButton.style.opacity = '1';
        }, 200);
      } catch (err) {
        console.error('Failed to copy embed code:', err);
      }
    };
  }

  // Close share modal
  if (shareModalClose) {
    shareModalClose.onclick = () => {
      if (shareModal) {
        shareModal.classList.add('hidden');
      }
    };
  }

  // Close share modal when clicking outside
  if (shareModal) {
    shareModal.onclick = (e) => {
      if (e.target === shareModal) {
        shareModal.classList.add('hidden');
      }
    };
  }


  manifestInput.oninput = () => {
    // Enable/disable Load button based on input value
    const hasValue = manifestInput.value && manifestInput.value.trim() !== '';
    if (loadButton) {
      loadButton.disabled = !hasValue;
    }
  };

  if (searchParams.get('manifest')) {
    manifestInput.value = searchParams.get('manifest');
    if (loadButton) {
      loadButton.disabled = false;
    }
    load();
  }

  //Work on this one...
  player.on(PlayerEvent.READY, () => {
    console.log('player ready');
  });

  player.on(PlayerEvent.BITRATE_CHANGE, (data) => {
    if (analyticsInitiated) {
      playerAnalytics.reportBitrateChange({
        bitrate: data.bitrate / 1000, // bitrate in Kbps
        width: data.width, // optional, video width in pixels
        height: data.height, // optional, video height in pixels
      });
    }
  });

  player.on(PlayerEvent.PLAYER_STOPPED, () => {
    if (analyticsInitiated) {
      playerAnalytics.reportStop();
    }
  });

  player.on(PlayerEvent.ERROR, ({ errorData, fatal }) => {
    console.error('player reported error', errorData);
    if (analyticsInitiated) {
      if (fatal) {
        playerAnalytics.reportError(errorData);
      } else {
        playerAnalytics.reportWarning(errorData);
      }
    }
    if (fatal) {
      player.destroy();
      console.log('player destroyed due to error');
    }
  });

  player.on(PlayerEvent.UNREADY, () => {
    console.log('player unready');
    if (analyticsInitiated) {
      playerAnalytics.deinit();
      analyticsInitiated = false;
    }
    playerDebug.stop();
    networkMonitor.stop();
    segmentTimeline.stop();
  });
}
window.onload = main;
