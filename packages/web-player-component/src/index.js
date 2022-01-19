import webplayer from '@eyevinn/web-player';
import style from '@eyevinn/web-player/dist/webplayer.css';

export default class PlayerComponent extends HTMLElement {
  constructor() {
    //Call constructor of HTMLElement
    super();
    //Create shadow root
    this.attachShadow({ mode: 'open' });
    const { shadowRoot } = this;
    //Attach CSS
    let styleTag = document.createElement('style');
    styleTag.innerHTML = style;
    shadowRoot.appendChild(styleTag);
    //Create wrapper and attach to shadow DOM
    const wrapper = document.createElement('div');
    shadowRoot.appendChild(wrapper);
    //Init player with wrapper
    const player = webplayer(wrapper);
    //Load video and play
    player.load("https://storage.googleapis.com/shaka-demo-assets/sintel-mp4-only/dash.mpd").then(() => {
      player.play()
    });
  }
}
//Register custom element
customElements.define('player-component', PlayerComponent);
