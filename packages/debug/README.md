# Debug

A simple `HTMLMediaElement` debug util module.

## Usage

To get some useful information about the provided media element
```javascript
import { getMediaStats } from '@eyevinn/web-player-debug';
console.log(getMediaStats(document.querySelector('video')));
```

It currently only exposes `currentTime`, `duration`, `audioTracks`, `textTracks` but this will be expanded upon in time.

To log every single event that the provided media element dispatches
```javascript
import { debugEvents } from '@eyevinn/web-player-debug';
debugEvents(document.querySelector('video'));
```
This will log all `timeupdate` & `progress` events to `console.debug` and the rest of the events to `console.info`, this makes it easier
to filter out the noise since `timeupdate` and `progress` is quite noisy.