import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import style from './volume.module.css';
import VolumeButton from './VolumeButton';
import VolumeSlider from './VolumeSlider';

export default function VolumeControls({
  muted,
  toggleMute,
  onSliderInput,
  volume,
}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (
      /iPhone|iPod|iPad|Android/.test(navigator.userAgent) ||
      (/Macintosh/.test(navigator.userAgent) &&
        'ontouchstart' in document.documentElement)
    ) {
      setIsMobile(true);
    }
  }, []);
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
