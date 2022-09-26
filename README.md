# Eyevinn WebPlayer
The Eyevinn WebPlayer is a simplistic video (audio is on the roadmap) player for playback of ABR streams. It is free-to-use and currently supports the ABR streaming formats Apple HLS, MPEG-DASH.
The player is built using a modular approach which means that a lot of functionality is put into separate modules and can be used independently from each other, we also provide a player module that bundles it all together in a neat package.

Demo: https://web.player.eyevinn.technology/
NPM: https://www.npmjs.com/package/@eyevinn/web-player

## Development
- `npm install`
- `npm run dev`

## Run Unit and E2E Tests
- `npm test`
- `npm run test:e2e`

## Modules

| Module | Description |
| ------ | ----------- |
| [@eyevinn/web-player-component](https://www.npmjs.com/package/@eyevinn/web-player-component) | Eyevinn Video Web Component |
| [@eyevinn/web-player](https://www.npmjs.com/package/@eyevinn/web-player) | Ready-to-use Javascript Web Player with support for HLS and MPEG-DASH |
| [@eyevinn/web-player-core](https://www.npmjs.com/package/@eyevinn/web-player-core) | Core package that enables playback of HLS and MPEG-DASH on any HTMLMediaElement in any browser |
| [@eyevinn/web-player-eyevinn-skin](https://www.npmjs.com/package/@eyevinn/web-player-eyevinn-skin) | The skin package is a simple skin written in preact for the @eyevinn/web-player, it uses material icons for all icons. |
| [@eyevinn/web-player-cast](https://www.npmjs.com/package/@eyevinn/web-player-cast) | Provides a `CastSender` class for switching between casting & playing locally |
| [@eyevinn/web-player-airplay](https://www.npmjs.com/package/@eyevinn/web-player-airplay) | Handle switching between airplay & local playback |
| [@eyevinn/web-player-demo](https://www.npmjs.com/package/@eyevinn/web-player-demo) | [Demo page](https://web.player.eyevinn.technology) |

### Web Player Web Component

The simplest way to use the Eyevinn WebPlayer is to use the `<eyevinn-video>` web component.

```html
<script async type="text/javascript" src="https://unpkg.com/@eyevinn/web-player-component@latest/dist/web-player.component.js"></script>
<eyevinn-video source="https://lab.cdn.eyevinn.technology/VINN-OpbZjryxa3.mp4/manifest.m3u8" starttime="30" muted autoplay></eyevinn-video>
```

### Web Player Javascript

Download the latest release of this package from [jsdelivr](https://registry.npmjs.org/@eyevinn/web-player/-/web-player-0.7.6.tgz) and include the javascript & css files in your HTML.

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
      const player = webplayer(document.querySelector("#player-wrapper"));
      player.load(src).then(function() {
        player.play();
      });
    });
  </script>
</body>
</html>
```

### Web Player Core Component

This is the Core package of the `@eyevinn/web-player`, this package enables playback of HLS and MPEG-DASH on any HTMLMediaElement in any browser. It automagically detects what type of manifest the src is and selects the best underlying open-source or native tech to use. This package can be used without any of the other packages from the `@eyevinn/web-player`.


## Authors

This open source project is maintained by Eyevinn Technology

## Contributors

- Benjamin Wallberg (benjamin.wallberg@eyevinn.se)
- Jonas Birmé (jonas.birme@eyevinn.se)
- Erik Hoffman (erik.hoffman@eyevinn.se)

You are welcome to either contribute to this project or spin-off a fork of your own. This code is released under the Apache 2.0 license.

In addition to contributing code, you can help to triage issues. This can include reproducing bug reports, or asking for vital information such as version numbers or reproduction instructions.

## License (Apache-2.0)

```
Copyright 2021 Eyevinn Technology AB

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

## Support

Join our [community on Slack](http://slack.streamingtech.se) where you can post any questions regarding any of our open source projects. Eyevinn's consulting business can also offer you:

- Further development of this component
- Customization and integration of this component into your platform
- Support and maintenance agreement

Contact [sales@eyevinn.se](mailto:sales@eyevinn.se) if you are interested.

## About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!