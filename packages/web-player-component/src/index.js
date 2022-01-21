import webplayer from '@eyevinn/web-player';
import style from '@eyevinn/web-player/dist/webplayer.css';

export default class PlayerComponent extends HTMLElement {
  static get observedAttributes() {
    return ['source'];
  };
  constructor() {
    //Call constructor of HTMLElement
    super();
    //Attach CSS
    let styleTag = document.createElement('style');
    styleTag.innerHTML = style;
    this.appendChild(styleTag);
    //Create wrapper and attach to DOM
    const wrapper = document.createElement('div');
    this.appendChild(wrapper);
    //Init player with wrapper
    this.player = webplayer(wrapper);
  }
  attributeChangedCallback() {
    let attributeValue = this.getAttribute('source');
    this.player.load(attributeValue).then(() => {
      this.player.play()
    });
  }
  disconnectedCallback() {
    //Calls both player's reset function and 
    this.player.reset();
    console.log("Player destroyed");
  }


}
//Register custom element
customElements.define('player-component', PlayerComponent);
