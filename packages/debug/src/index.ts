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

export function getMediaStats(media: HTMLMediaElement) {
    return {
        currentTime: media.currentTime,
        duration: media.duration,
        audioTracks: (media as any).audioTracks,
        textTracks: media.textTracks
    }
}

export function debugEvents(media: HTMLMediaElement) {
    MEDIA_EVENTS.forEach((evt) => {
        const log = evt === 'timeupdate' || evt === 'progress' ? console.debug : console.info;
        media.addEventListener(evt, () => log(`[Debug] Event: '${evt}'`, getMediaStats(media)));
    });
}
