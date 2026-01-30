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
  // Read saved player debug mode (default: false)
  const savedDebug = localStorage.getItem('player-debug-mode') === 'true';
  // Hide or show debug pill based on saved debug setting
  (function initDebugPill() {
    const debugPill = document.querySelector(
      '.log-filter-pill[data-level="debug"]'
    );
    if (debugPill) {
      if (savedDebug) {
        debugPill.style.display = '';
        debugPill.classList.add('active');
        customLogger.activeFilters.add('debug');
      } else {
        debugPill.style.display = 'none';
        debugPill.classList.remove('active');
        customLogger.activeFilters.delete('debug');
      }
    }
  })();
  // Route global errors and unhandled rejections to custom logger
  (function attachGlobalErrorHandlers() {
    try {
      // Preserve original console.error
      const _consoleError = console.error.bind(console);
      console.error = (...args) => {
        try {
          const parts = args.map((a) =>
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
          );
          // Filter out empty objects/arrays and empty strings to avoid stray "[]" or "{}"
          const filtered = parts.filter(
            (p) =>
              p && p !== '{}' && p !== '[]' && p !== 'null' && p !== 'undefined'
          );
          const msg = filtered.join(' ');
          // Only include non-empty message; if everything was empty, pass no message
          if (msg) {
            customLogger.error(msg, { args: filtered });
          } else {
            // Fallback: log a generic error if no useful content
            customLogger.error('Error', { args: filtered });
          }
        } catch (e) {
          // swallow
        }
        _consoleError(...args);
      };

      // window.onerror
      window.onerror = (message, source, lineno, colno, err) => {
        try {
          const details = `${message} (${source}:${lineno}:${colno})`;
          customLogger.error(details, err ? err.stack || err : null);
        } catch (e) {}
        // Let browser handle default as well
        return false;
      };

      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        try {
          const reason = event.reason;
          const msg =
            typeof reason === 'object'
              ? JSON.stringify(reason, null, 2)
              : String(reason);
          customLogger.error('Unhandled Rejection: ' + msg, reason);
        } catch (e) {}
      });
    } catch (e) {
      // ignore if environment doesn't allow
    }
  })();

  // Player debug elements
  const playerDebugSection = document.querySelector('#player-debug-section');
  const playerDebug = new PlayerDebug(video, playerDebugSection);
  const networkAnalysis = new NetworkAnalysis(null);
  const networkMonitor = new NetworkMonitor(null, customLogger);

  // Sync log and network monitor heights with player + input section
  function syncHeights() {
    const playerCenterContainer = document.querySelector(
      '.player-center-container'
    );
    const logSection = document.getElementById('log-section');
    const networkSection = document.getElementById('network-monitor-section');

    if (playerCenterContainer && logSection && networkSection) {
      const containerHeight = playerCenterContainer.offsetHeight;
      // Set network section height first (match player center)
      networkSection.style.height = containerHeight + 'px';

      // Ensure left column matches the player+input container height
      const leftColumn = document.querySelector('.left-column');
      if (leftColumn) {
        leftColumn.style.height = containerHeight + 'px';
        leftColumn.style.overflow = 'hidden';
      }

      // Compute shared height: half of the network section height
      const sharedHeight = Math.round(containerHeight / 2);
      logSection.style.height = sharedHeight + 'px';
      // Make variant info panel the same height as logs (stacked under logs)
      const variantPanel = document.getElementById('variant-info-panel');
      if (variantPanel) {
        variantPanel.style.height = sharedHeight + 'px';
        variantPanel.style.overflow = 'auto';
      }
    }
  }

  // Sync heights on load and resize
  syncHeights();
  window.addEventListener('resize', syncHeights);
  const resizeObserver = new ResizeObserver(syncHeights);
  const playerCenterContainer = document.querySelector(
    '.player-center-container'
  );
  if (playerCenterContainer) {
    resizeObserver.observe(playerCenterContainer);
  }

  // Start player debug immediately to show default values
  playerDebug.start();
  networkMonitor.start();

  // Player debug logs (emit debug-level logs when Player Debug Mode enabled)
  (function attachPlayerDebugLogs() {
    const debugEvents = [
      PlayerEvent.PLAY,
      PlayerEvent.PAUSE,
      PlayerEvent.PLAYING,
      PlayerEvent.SEEKING,
      PlayerEvent.SEEKED,
      PlayerEvent.WAITING,
      PlayerEvent.STALLED,
      PlayerEvent.BUFFERING,
      PlayerEvent.STATE_CHANGE,
      PlayerEvent.AUDIO_TRACK_CHANGE,
      PlayerEvent.TEXT_TRACK_CHANGE,
      PlayerEvent.INTERSTITIAL_STARTED,
      PlayerEvent.INTERSTITIAL_ENDED,
      PlayerEvent.INTERSTITIAL_ASSET_STARTED,
      PlayerEvent.INTERSTITIAL_ASSET_ENDED,
    ];

    const debugEnabled = localStorage.getItem('player-debug-mode') === 'true';
    if (!debugEnabled) return;

    debugEvents.forEach((evt) => {
      try {
        player.on(evt, (payload) => {
          try {
            customLogger.debug(`Player event: ${evt}`, payload);
          } catch (e) {}
        });
      } catch (e) {
        // ignore if event not supported
      }
    });
  })();

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
    debug: savedDebug,
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
      // Reset variant info
      networkAnalysis.reset();

      try {
        playerAnalytics &&
          (await playerAnalytics.init({
            sessionId: `web-player-demo-${Date.now()}`,
          }));
      } catch (err) {
        console.warn('Failed to initiate analytics', err);
        customLogger.error('Failed to initiate analytics', err);
        playerAnalytics = null;
      }
      // Log load start
      customLogger.info('Loading manifest', {
        manifest: manifestInput.value,
        autoplay: autoplayEnabled,
      });
      await player.load(manifestInput.value, autoplayEnabled);
      // Log load success
      customLogger.info('Loaded manifest', {
        manifest: manifestInput.value,
        autoplay: autoplayEnabled,
        isLive: player.isLive,
      });
      playerAnalytics && playerAnalytics.load(video);

      // Update network analysis with player instance
      networkAnalysis.player = player;
      playerDebug.player = player;

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
          // Log metadata and update variant info when metadata is loaded
          customLogger.info('Loaded metadata', {
            live: player.isLive,
            duration: video.duration,
          });
          networkAnalysis.updateVariantInfo(video, player);
          player.off(PlayerEvent.LOADED_METADATA, metadataReporter);
        })
      );

      playerDebug.start();
      networkMonitor.start();

      // Update variant info periodically
      const variantUpdateInterval = setInterval(() => {
        networkAnalysis.updateVariantInfo(video, player);
      }, 1000);

      // Also update on bitrate changes
      player.on(PlayerEvent.BITRATE_CHANGE, () => {
        networkAnalysis.updateVariantInfo(video, player);
      });
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
        loadButton.disabled = false;
      }
    });
  }

  loadButton.onclick = async () => {
    await load();
  };

  // Autoplay button handler
  autoplayButton.onclick = () => {
    autoplayEnabled = !autoplayEnabled;
    updateAutoplayButton();
  };
  updateAutoplayButton(); // Initialize button state

  function updateAutoplayButton() {
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

  // Options modal functionality
  const optionsButton = document.querySelector('#options-button');
  const optionsModal = document.querySelector('#eventsink-modal');
  const optionsModalClose = document.querySelector('#eventsink-modal-close');
  const eventsinkUrlInput = document.querySelector('#eventsink-url-input');
  const playerDebugCheckbox = document.querySelector('#player-debug-checkbox');
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
      // Initialize checkbox from saved value
      if (playerDebugCheckbox) {
        playerDebugCheckbox.checked =
          localStorage.getItem('player-debug-mode') === 'true';
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
      // Save player debug mode
      if (playerDebugCheckbox) {
        const enabled = !!playerDebugCheckbox.checked;
        localStorage.setItem('player-debug-mode', enabled ? 'true' : 'false');
        // Toggle debug pill in logs
        const debugPill = document.querySelector(
          '.log-filter-pill[data-level="debug"]'
        );
        if (debugPill) {
          if (enabled) {
            debugPill.style.display = '';
            debugPill.classList.add('active');
            customLogger.activeFilters.add('debug');
          } else {
            debugPill.style.display = 'none';
            debugPill.classList.remove('active');
            customLogger.activeFilters.delete('debug');
          }
          customLogger.renderAllLogs();
        }
        // If HLS instance exists, try to set debug flag (may not affect existing instance fully)
        try {
          if (
            player &&
            player.tech &&
            player.tech.hls &&
            player.tech.hls.config
          ) {
            player.tech.hls.config.debug = enabled;
          }
        } catch (e) {}
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
  shareButton.onclick = () => {
    // Generate share URL and embed code
    const manifestUrl = manifestInput.value || '';
    const shareUrl = getShareUrl(manifestUrl);
    const embedCode = getEmbedCode(manifestUrl, autoplayEnabled);

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
    loadButton.disabled = !hasValue;
  };

  if (searchParams.get('manifest')) {
    manifestInput.value = searchParams.get('manifest');
    loadButton.disabled = false;
    load();
  }

  function formatTrackLabel(track, fallback) {
    if (!track || typeof track !== 'object') return fallback;
    const lang =
      track.lang || track.language || track.code || track.locale || '';
    const name = track.name || track.label || track.id || '';
    const parts = [lang, name]
      .map((part) => String(part || '').trim())
      .filter(Boolean);
    return parts.length > 0 ? parts.join(' / ') : fallback;
  }

  //Work on this one...
  player.on(PlayerEvent.READY, () => {
    customLogger.info('Player ready');
  });

  player.on(PlayerEvent.BITRATE_CHANGE, (data) => {
    if (analyticsInitiated) {
      playerAnalytics.reportBitrateChange({
        bitrate: data.bitrate / 1000, // bitrate in Kbps
        width: data.width, // optional, video width in pixels
        height: data.height, // optional, video height in pixels
      });
    }
    // Update variant info when bitrate changes
    networkAnalysis.updateVariantInfo(video, player);
    // Log bitrate change with human-readable value
    try {
      const kbps = Math.round((data && data.bitrate ? data.bitrate : 0) / 1000);
      customLogger.info(`Bitrate changed to ${kbps} kbps`, {
        bitrate: data.bitrate,
        width: data.width,
        height: data.height,
      });
    } catch (e) {
      customLogger.info('Bitrate change', {
        bitrate: data.bitrate,
        width: data.width,
        height: data.height,
      });
    }
  });

  video.addEventListener('volumechange', () => {
    const volumePct = Math.round(video.volume * 100);
    const muted = video.muted;
    customLogger.info(
      `Volume changed to ${volumePct}%${muted ? ' (muted)' : ''}`,
      { volume: video.volume, muted }
    );
  });

  player.on(PlayerEvent.AUDIO_TRACK_CHANGE, (data) => {
    console.log('audio track change', data);
    const label = formatTrackLabel(data, 'Audio track changed');
    customLogger.info(`Audio track changed: ${label}`, data);
  });

  player.on(PlayerEvent.TEXT_TRACK_CHANGE, (data) => {
    const label = formatTrackLabel(data, 'Subtitle track changed');
    customLogger.info(`Subtitle track changed: ${label}`, data);
  });

  player.on(PlayerEvent.PLAYER_STOPPED, () => {
    if (analyticsInitiated) {
      playerAnalytics.reportStop();
    }
    customLogger.info('Player stopped');
  });

  player.on(PlayerEvent.ERROR, ({ errorData, fatal }) => {
    console.warn('player reported error', errorData);
    if (fatal) {
      customLogger.error('Player error (fatal)', errorData);
    } else {
      customLogger.warn('Player warning (non-fatal)', errorData);
    }
    if (analyticsInitiated) {
      if (fatal) {
        playerAnalytics.reportError(errorData);
      } else {
        playerAnalytics.reportWarning(errorData);
      }
    }
    if (fatal) {
      player.destroy();
      customLogger.info('player destroyed due to fatal error');
    }
  });

  player.on(PlayerEvent.UNREADY, () => {
    customLogger.info('Player unready');
    if (analyticsInitiated) {
      playerAnalytics.deinit();
      analyticsInitiated = false;
    }
    playerDebug.stop();
    networkMonitor.stop();
  });
}
window.onload = main;
