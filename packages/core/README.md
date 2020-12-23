# Core

This is the Core package of the @eyevinn/web-player, this package enables playback of HLS, MPEG-DASH and SmoothStreaming on any `HTMLMediaElement` in any browser.
It automagically detects what type of manifest the src is and selects the best underlying open-source or native tech to use.

## Usage
```html
<video controls></video>
```
```javascript
const player = new WebPlayer({ video: document.querySelector('video') });

// You're now ready to load any HLS, MPEG-DASH or SmoothStreaming manifest
player.load("https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8")

````
