# Eyevinn WebPlayer
[![](https://data.jsdelivr.com/v1/package/npm/@eyevinn/web-player/badge)](https://www.jsdelivr.com/package/npm/@eyevinn/web-player)

The Eyevinn WebPlayer is a simplistic video (audio is on the roadmap) player for playback of ABR streams. It is free-to-use and currently supports the ABR streaming formats Apple HLS, MPEG-DASH.
The player is built using a modular approach which means that a lot of functionality is put into separate modules and can be used independently from each other, this module bundles it all together in a neat package.

Demo: https://web.player.eyevinn.technology/

## Getting started 

### NPM
```javascript
import webplayer from '@eyevinn/web-player';
import '@eyevinn/web-player/dist/webplayer.css'; // requires the use of a bundler supporting CSS 

// assumes the HTML contains an element <div id="player"></div>
const { player, destroy } = webplayer(document.querySelector('#player'));
player.load("<src-here>").then(() => {
  player.play()
});
...
// time to cleanup
destroy();
```

### API

```javascript
class webplayer {
  constructor(wrapper: HTMLElement, opts?: {
    castAppId?: string;
    disablePlayerSizeLevelCap?: boolean; // When disabled do not cap bandwidth based on player size
    iceServers?: RTCIceServer[]; // Override default list of ICE servers (for WebRTC based streaming)
    enableCloudflareWhepBeta?: boolean;
  });

  async load(src: string, autoplay?: boolean = false): Promise<void>;
  async play(): Promise<boolean>;
  pause();
  stop();
  mute();
  unmute();
  reset();

  seekTo(position: number, change: number, percentage:number );
  seekToLive();
  setAudioTrack(id: string);
  setTextTrack(id: string);
  setVolume(change: number, percentage: number);
  getVolume(): number;
  getVideoLevels(): IVideoLevel[];

  isPlaying: boolean; // read-only
  isMuted: boolean; // read-only
  isLive: boolean; // read-only
  currentTime: number; // read-only
  currentLevel: number;
}

```

### CDN 
Download the latest release of this package [from jsdelivr](https://registry.npmjs.org/@eyevinn/web-player/-/web-player-<version>.tgz) and include the javascript & css files in your HTML.

The snippet below shows an example on how to implement the player
```html
<html>
<head>
  <!-- Eyevinn WebPlayer CSS -->
  <link rel="stylesheet" href="webplayer.css"></link>
</head>
<body>
  <!-- The element where the player will be placed -->
  <div id="player-wrapper"></div>

  <!-- Eyevinn WebPlayer Javascript -->
  <script src="webplayer.min.js" type="text/javascript"></script>

  <!-- Initiate the player and auto-play (if allowed by browser) -->
  <script>
    document.addEventListener('DOMContentLoaded', function(event) {
      const { player } = webplayer(document.querySelector("#player-wrapper"));
      player.load(src).then(function() {
        player.play();
      });
    });
  </script>
</body>
</html>
```

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

# Support

Join our [community on Slack](http://slack.streamingtech.se) where you can post any questions regarding any of our open source projects. Eyevinn's consulting business can also offer you:

- Further development of this component
- Customization and integration of this component into your platform
- Support and maintenance agreement

Contact [sales@eyevinn.se](mailto:sales@eyevinn.se) if you are interested.

## About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!  
