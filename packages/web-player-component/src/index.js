import webplayer from '@eyevinn/web-player';
import style from '@eyevinn/web-player/dist/webplayer.css';

export default class PlayerComponent extends HTMLElement {
  static get observedAttributes() {
    return ['source'];
  }
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


    //Get attribute source
    let src = this.getAttribute('source');
    //Load video and play
    player.load(src).then(() => {
      player.play()
    });
  }
}
//Register custom element
customElements.define('player-component', PlayerComponent);
