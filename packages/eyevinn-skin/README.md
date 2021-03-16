# eyevinn-skin

See [@eyevinn/web-player](https://www.npmjs.com/package/@eyevinn/web-player).

The skin package is a simple skin written in preact for the [@eyevinn/web-player](https://www.npmjs.com/package/@eyevinn/web-player), it uses [material icons](https://material.io/resources/icons/?style=baseline) for all icons.

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

## Contribution

You are welcome to either contribute to this project or spin-off a fork of your own. This code is released under the Apache 2.0 license.

```
Copyright 2018 Eyevinn Technology

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!  