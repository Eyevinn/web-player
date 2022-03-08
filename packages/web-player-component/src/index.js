import WebPlayer, { PlayerEvent } from '@eyevinn/web-player-core';
import { renderEyevinnSkin } from '@eyevinn/web-player-eyevinn-skin';
import style from '@eyevinn/web-player-eyevinn-skin/dist/index.css';
import { PlayerAnalyticsConnector } from '@eyevinn/player-analytics-client-sdk-web';

const ComponentAttribute = {
  DYNAMIC: {
    SOURCE: 'source',
    STARTTIME: 'starttime',
    AUTOPLAY: 'autoplay',
    MUTED: 'muted',
  },
  STATIC: {
    AUTOPLAY_VISIBLE: 'autoplay-visible',
    INCOGNITO: 'incognito',
    EPAS_URL: 'epas-url',
  }
}

const isSet = (value) => value === "" || !!value;

export default class PlayerComponent extends HTMLElement {
  static get observedAttributes() {
    const dynamicAttributes = Object.values(ComponentAttribute.DYNAMIC);
    return dynamicAttributes;
  };
  constructor() {
    //Call constructor of HTMLElement
    super();
    const wrapper = this.setupDOM();

    // if we only want to play when in view, init observer
    const autoplay = this.getAttribute(ComponentAttribute.DYNAMIC.AUTOPLAY);
    const autoplayVisible = this.getAttribute(ComponentAttribute.STATIC.AUTOPLAY_VISIBLE);
    if (!isSet(autoplay) && isSet(autoplayVisible)) {
      this.observer = new IntersectionObserver(this.inview.bind(this));
      this.observer.observe(this.video);
    }

    this.setupPlayer(wrapper);

    this.setupAnalytics({
      incognito: this.getAttribute(ComponentAttribute.STATIC.INCOGNITO),
      epasUrl: this.getAttribute(ComponentAttribute.STATIC.EPAS_URL)
    });

    this.setupPlayerEventListener();
  }

  setupDOM() {
    //Attach shadow DOM
    this.attachShadow({ mode: 'open' });
    const { shadowRoot } = this;
    //Create style and attach to shadow DOM
    let styleTag = document.createElement('style');
    styleTag.innerHTML = style;
    shadowRoot.appendChild(styleTag);
    //Create wrapper and attach to shadow DOM
    const wrapper = document.createElement('div');
    shadowRoot.appendChild(wrapper);
    //Create video element and attach to shadow DOM
    this.video = document.createElement('video');
    wrapper.appendChild(this.video);

    return wrapper;
  }

  setupPlayer(wrapper) {
    //Init player and skin
    this.player = new WebPlayer({ video: this.video });
    renderEyevinnSkin({
      root: wrapper,
      player: this.player,
      castAppId: {}
    });
  }

  setupAnalytics({ incognito, epasUrl }) {
    // initiate EPAS analytics unless in incognito mode
    this.playerAnalytics = null;
    if (isSet(incognito)) {
      this.playerAnalytics = new PlayerAnalyticsConnector(epasUrl || "https://sink.epas.eyevinn.technology");
    }
  }

  setupPlayerEventListener() {
    this.player.on(PlayerEvent.ERROR, ({ errorData, fatal }) => {
      console.error('player reported error', errorData);
      if (this.playerAnalytics) {
        if (fatal) {
          this.playerAnalytics.reportError(errorData);
        } else {
          this.playerAnalytics.reportWarning(errorData);
        }
      }
      if (fatal) {
        this.player.destroy();
        console.log('player destroyed due to error');
      }
    });

    this.player.on(PlayerEvent.BITRATE_CHANGE, (data) => {
      if (!this.playerAnalytics) return;
      this.playerAnalytics.reportBitrateChange({
        bitrate: data.bitrate / 1000,
        width: data.width,
        height: data.height,
      });
    });
  }

  async initAnalytics() {
    if (!this.playerAnalytics) return;
    try {
      await this.playerAnalytics.init({
        sessionId: `${window.location.hostname}-${Date.now()}`
      });
    } catch (err) {
      console.error(err);
      this.playerAnalytics.deinit();
      this.playerAnalytics = null;
    }
  }

  loadAnalytics() {
    if (!this.playerAnalytics) return;
    this.playerAnalytics.load(this.video);

    this.player.on(PlayerEvent.LOADED_METADATA, this.metadataReporter = () => {
      this.playerAnalytics.reportMetadata({
        live: this.player.isLive,
        contentUrl: this.getAttribute(ComponentAttribute.DYNAMIC.SOURCE),
      });
      this.player.off(PlayerEvent.LOADED_METADATA, this.metadataReporter);
    })
  }

  async attributeChangedCallback(name) {
    const src = this.getAttribute(ComponentAttribute.DYNAMIC.SOURCE);
    const starttime = this.getAttribute(ComponentAttribute.DYNAMIC.STARTTIME);
    const autoplay = this.getAttribute(ComponentAttribute.DYNAMIC.AUTOPLAY);
    const muted = this.getAttribute(ComponentAttribute.DYNAMIC.MUTED);

    if (name === ComponentAttribute.DYNAMIC.SOURCE) {
      if (isSet(src)) {
        await this.initAnalytics();
        await this.player.load(src);
        this.loadAnalytics();
        if (isSet(starttime)) {
          this.video.currentTime = starttime;
        }
        if (isSet(autoplay)) {
          this.video.muted = isSet(muted);
          this.video.autoplay = true;
          this.player.play();
        }
      }
      else {
        console.error("Invalid source was provided to <eyevinn-video> element");
      }
    }
    if (name === ComponentAttribute.DYNAMIC.MUTED) {
      this.video.muted = isSet(muted);
    }
  }

  connectedCallback() {
    this.setupEventProxy();
  }

  disconnectedCallback() {
    this.player.reset();
  }

  setupEventProxy() {
    if (!this.player) return;
    this.player.on('*', (event, data) => {
      this.dispatchEvent(new CustomEvent(event, { detail: data }));
    });
  }

  inview(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.video.muted = true;
        this.video.autoplay = true;
        this.player.play();
      } else if (
        this.player.isPlaying && !entry.isIntersecting
      ) {
        this.player.pause();
      }
    });
  }
}
//Register custom element
customElements.define('eyevinn-video', PlayerComponent);
