import { h } from 'preact';
import style from './volume.module.css';
import { useState } from 'preact/hooks';

import VolumeButton from './VolumeButton';
import VolumeSlider from './VolumeSlider';

export default function VolumeControls({
  muted,
  toggleMute,
  onSliderInput,
  volume,
}) {
  const [showVolSlider, setShowVolSlider] = useState(false);

  return (
    <div
      class={style.controls}
      onMouseEnter={() => setShowVolSlider(true)}
      onMouseLeave={() => setShowVolSlider(false)}
    >
      <VolumeButton muted={muted} onClick={toggleMute} />
      {showVolSlider && (
        <VolumeSlider
          muted={muted}
          toggleMute={toggleMute}
          onClick={onSliderInput}
          value={volume}
        ></VolumeSlider>
      )}
    </div>
  );
}
