import { h } from 'preact';
import style from './volume.module.css'

export default function VolumeSlider({ onInput, volume }) {

  return (
    <div class={style.slider} onInput={onInput}>
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        step={10}
        
        onInput={e => onInput(
          parseInt(
          (e.target as HTMLInputElement).value)
          )
        }
      />
    </div>
  );
}
