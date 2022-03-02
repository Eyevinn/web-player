import { h } from 'preact';
import style from './volume.module.css';
import { useState } from 'preact/hooks';

import VolumeButton from './VolumeButton';
import VolumeSlider from './VolumeSlider';

export default function VolumeControls({ muted, onClick, onSliderInput, volume }) {
  const [showVolSlider, setShowVolSlider] = useState(false);

  return (
    <div class = {style.controls}
      onMouseEnter={() => setShowVolSlider(true)}
      onMouseLeave={() => setShowVolSlider(false)}
    >
      <VolumeButton muted={muted} onClick={onClick} />

      {showVolSlider && <VolumeSlider onInput={onSliderInput} volume={volume} />}
    </div>
  );
}
