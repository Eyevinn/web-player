import { h } from 'preact';
import style from './volume.module.css';

export default function VolumeSlider({ onInput, volume, muted }) {

  return (
    <div class={style.slider}>
      <input
        type="range"
        min="0"
        max="100"
        value={muted ? 0 : volume}
        step={10}
        onKeyDown={e => e.preventDefault()}
        onInput={(e) => onInput(
          parseInt(
          (e.target as HTMLInputElement).value)
          )
        }
      />
    </div>
  );
}