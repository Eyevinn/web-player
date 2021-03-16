# Core

This is the Core package of the [@eyevinn/web-player](https://www.npmjs.com/package/@eyevinn/web-player), this package enables playback of HLS, MPEG-DASH and SmoothStreaming on any `HTMLMediaElement` in any browser.
It automagically detects what type of manifest the src is and selects the best underlying open-source or native tech to use. This package can be used without any of the other packages from the @eyevinn/web-player.

## Usage
```html
<video controls></video>
```
```javascript
const player = new WebPlayer({ video: document.querySelector('video') });

// You're now ready to load any HLS, MPEG-DASH or SmoothStreaming manifest
player.load("https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8")

````

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