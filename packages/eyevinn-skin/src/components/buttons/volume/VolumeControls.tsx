import { h } from 'preact';
import style from './volume.module.css';
import VolumeButton from './VolumeButton';
import VolumeSlider from './VolumeSlider';

export default function VolumeControls({
  muted,
  toggleMute,
  onSliderInput,
  volume,
}) {
  const isMobile = /iPhone|iPod|iPad|Android/.test(navigator.userAgent)
    ? true
    : /Macintosh/.test(navigator.userAgent) &&
      'ontouchstart' in document.documentElement
    ? true
    : false;

  return (
    <div class={style.controls}>
      <VolumeButton muted={muted} onClick={toggleMute} />
      {!isMobile && (
        <VolumeSlider
          muted={muted}
          toggleMute={toggleMute}
          onClick={onSliderInput}
          value={volume}
        />
      )}
    </div>
  );
}
