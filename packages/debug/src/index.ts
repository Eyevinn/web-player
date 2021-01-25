const MEDIA_EVENTS = [
  'abort',
  'canplay',
  'canplaythrough',
  'durationchange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'interruptbegin',
  'interruptend',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'mozaudioavailable',
  'pause',
  'play',
  'playing',
  'progress',
  'ratechange',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  'timeupdate',
  'volumechange',
  'waiting',
];

export function debugEvents(media: HTMLMediaElement) {
    MEDIA_EVENTS.forEach((evt) => {
        const log = evt === 'timeupdate' || evt === 'progress' ? console.debug : console.info;
        media.addEventListener(evt, () => log(`[Debug] Event: '${evt}'`));
    });
}
