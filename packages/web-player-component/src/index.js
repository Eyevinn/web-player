//import webplayer from '@eyevinn/web-player';
//import { textChangeRangeIsUnchanged } from 'typescript';
import style from '@eyevinn/web-player/dist/webplayer.css';
import WebPlayer from '@eyevinn/web-player-core';
import { renderEyevinnSkin } from '@eyevinn/web-player-eyevinn-skin';

export default class PlayerComponent extends HTMLElement {
  static get observedAttributes() {
    return ['source', 'starttime', 'muted', 'autoplay'];
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
    console.log("attributeChangedCallback: " + name);
    if (name === 'source') {
      if (this.hasAttribute('source')) {
        this.player.load(this.getAttribute('source'));
      }
      else {
        console.log("Please provide a valid source!");
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
    if (name === 'autoplay') {
      if (this.hasAttribute('autoplay')) {
        this.video.setAttribute('autoplay', 'autoplay');
      }
      else {
        this.video.removeAttribute('autoplay');
      }
    }
  }
  //Only applies starttime on page load
  connectedCallback() {
    this.video.currentTime = this.getAttribute('starttime');
    console.log("connectedCallback");
  }

  disconnectedCallback() {
    this.player.reset();
    console.log("Player destroyed");
  }
}
//Register custom element
customElements.define('player-component', PlayerComponent);
