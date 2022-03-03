import { h } from 'preact';
import style from './volume.module.css';
import { useState } from 'preact/hooks';

import VolumeButton from './VolumeButton';
import VolumeSlider from './VolumeSlider';

// function toggleMuteAndSlider() {
//   console.log("toggle!!");
//   this.volume = 0;
//   onClick;
//}

export default function VolumeControls({ muted, onVolumeButtonClick, onSliderInput, volume }) {
  const [showVolSlider, setShowVolSlider] = useState(false);

  return (
    <div class = {style.controls}
      onMouseEnter={() => setShowVolSlider(true)}
      onMouseLeave={() => setShowVolSlider(false)}
    >
      <VolumeButton muted={muted} onClick={onVolumeButtonClick} />

      {showVolSlider && <VolumeSlider muted={muted} onInput={onSliderInput} volume={volume} />}
    </div>
  );
}
