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
  return (
    <div
      class={style.controls}
    >
      <VolumeButton muted={muted} onClick={toggleMute} />     
        <VolumeSlider
          muted={muted}
          toggleMute={toggleMute}
          onClick={onSliderInput}
          value={volume}
        ></VolumeSlider>      
    </div>
  );
}
