//import webplayer from '@eyevinn/web-player';
//import { textChangeRangeIsUnchanged } from 'typescript';
import style from '@eyevinn/web-player/dist/webplayer.css';
import WebPlayer from '@eyevinn/web-player-core';
import { renderEyevinnSkin } from '@eyevinn/web-player-eyevinn-skin';

export default class PlayerComponent extends HTMLElement {
  static get observedAttributes() {
    return ['source', 'muted', 'autoplay'];
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
    //Create video element and attach to DOM
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
  
  //Handles changed attributes of player-component. Changes video attributes directly (not through player functions).
  attributeChangedCallback(name) {
    console.log(name);
    if (name === 'source') {
      this.player.load(this.getAttribute('source'));
    }
    if (name === 'muted') {
      if (this.getAttribute('muted') === 'true') {
        this.video.muted = true;
      }
      else if (this.getAttribute('muted') === 'false') {
        this.video.muted = false;
      }
    }
    if (name === 'autoplay') {
      if (this.getAttribute('autoplay') === 'true') {
        this.video.setAttributeNode(document.createAttribute('autoplay'));
      }
      else if (this.getAttribute('autoplay') === 'false') {
        this.video.removeAttribute('autoplay');
      }
    }
  }

  connectedCallback() {
    console.log("Connected!");
  }

  disconnectedCallback() {
    this.player.reset();
    console.log("Player destroyed");
  }
}
//Register custom element
customElements.define('player-component', PlayerComponent);
