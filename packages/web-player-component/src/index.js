import WebPlayer from '@eyevinn/web-player-core';
import { renderEyevinnSkin } from '@eyevinn/web-player-eyevinn-skin';
import style from '@eyevinn/web-player-eyevinn-skin/dist/index.css';
import { PlayerAnalyticsConnector } from '@eyevinn/player-analytics-client-sdk-web';

export default class PlayerComponent extends HTMLElement {
  static get observedAttributes() {
    return ['source', 'starttime', 'muted', 'autoplay'];
  };
  constructor() {
    //Call constructor of HTMLElement
    super();
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

    // if we only want to play when in view, init observer
    if (!this.hasAttribute('autoplay') && this.hasAttribute('autoplay-visible')) {
      this.observer = new IntersectionObserver(this.inview.bind(this));
      this.observer.observe(this.video);
    }

    //Init player and skin
    this.player = new WebPlayer({ video: this.video });
    renderEyevinnSkin({
      root: wrapper,
      player: this.player,
      castAppId: {}
    });

    // initiate EPAS analytics when specified
    this.playerAnalytics = null;
    if (this.hasAttribute('epas')) {
      this.playerAnalytics = new PlayerAnalyticsConnector(this.getAttribute('epas'));
    }    
  }

  initAnalytics() {
    return new Promise((resolve, reject) => {
      if (this.playerAnalytics) {
        this.playerAnalytics.init({
          sessionId: `${window.location.hostname}-${Date.now()}`
        }).then(() => {
          resolve();
        }).catch(err => {
          console.error(err);
          this.playerAnalytics.deinit();
          resolve();
        });
      } else {
        resolve();
      }
    })
  }

  attributeChangedCallback(name) {
    if (name === 'source') {
      if (this.hasAttribute('source')) {
        this.initAnalytics().then(() => {
          this.player.load(this.getAttribute('source')).then(() => {
            if (this.playerAnalytics) {
              this.playerAnalytics.load(this.video);
              this.playerAnalytics.reportMetadata({
                live: this.player.isLive,
                contentUrl: this.getAttribute('source'),
              });
            }
            if (this.hasAttribute('starttime')) {
              this.video.currentTime = this.getAttribute('starttime');
            }
            if (this.hasAttribute('autoplay')) {
              this.player.play();
            }
          });
        });
      }
      else {
        console.error("Invalid source was provided to <eyevinn-video> element");
      }
    }
    if (name === 'muted') {
      if (this.hasAttribute("muted")) {
        this.video.muted = true;
      }
      else {
        this.video.muted = false;
      }
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
