# eyevinn-skin

The skin package is a simple skin written in preact for the Eyevinn WebPlayer, it uses [material icons](https://material.io/resources/icons/?style=baseline) for all icons.

## Usage 
To use it together with `@eyevinn/web-player-core` simply call `renderEyevinnSkin` as in the snippet below 
```html
<div id="player">
  <video></video>
</div>
```
```javascript
const video = document.querySelector('#player > video')
const player = new WebPlayer({ video });
renderEyevinnSkin({
  root: document.querySelector('#player'),
  player,
});
```

Note! The skin expects to be rendered in the same container as the video element.