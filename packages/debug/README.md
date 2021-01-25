# Debug

A simple `HTMLMediaElement` debug util module.

## Usage

To log every single event that the provided media element dispatches
```javascript
import { debugEvents } from '@eyevinn/web-player-debug';
debugEvents(document.querySelector('video'));
```
This will log all `timeupdate` & `progress` events to `console.debug` and the rest of the events to `console.info`, this makes it easier
to filter out the noise since `timeupdate` and `progress` is quite noisy.