import WebPlayer from '@eyevinn/web-player-core';
import { renderEyevinnSkin } from '@eyevinn/web-player-eyevinn-skin';
import style from '@eyevinn/web-player-eyevinn-skin/dist/index.css';

export default class PlayerComponent extends HTMLElement {
  static get observedAttributes() {
    return ['source', 'starttime', 'muted', 'autoplay'];
  };
  constructor() {
    //Call constructor of HTMLElement
    super();
    //Attach shadow DOM
    this.attachShadow({mode: 'open'});
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
    //Init player and skin
    this.player = new WebPlayer({ video: this.video });
    renderEyevinnSkin({
      root: wrapper,
      player: this.player,
      castAppId: {}
    });
  }

  attributeChangedCallback(name) {
    if (name === 'source') {
      if (this.hasAttribute('source')) {
        this.player.load(this.getAttribute('source')).then(() => {
          if (this.hasAttribute('autoplay')) {
            this.player.play();
          }
          if (this.hasAttribute('starttime')) {
            this.video.currentTime = this.getAttribute('starttime');
          }
        });
      }
      else {
        console.log("Invalid source was provided to <eyevinn-video> element");
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
    console.log("Player destroyed");
  }

  setupEventProxy() {
    if(!this.player) return;
    this.player.on('*', (event, data) => {
      this.dispatchEvent(new CustomEvent(event, {detail: data}));
    });
  }
}
//Register custom element
customElements.define('eyevinn-video', PlayerComponent);
