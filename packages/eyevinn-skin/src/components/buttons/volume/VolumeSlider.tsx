import { h } from 'preact';
import style from './volume.module.css';
import { useCallback, useState } from 'preact/hooks';

export default function VolumeSlider({ muted, onClick, toggleMute, value }) {
  const [mousePos, setMousePos] = useState(-1);
  const onMouseMove = useCallback((evt: MouseEvent) => {
    evt.preventDefault();
    const height = (evt.currentTarget as HTMLDivElement).offsetHeight;
    setMousePos((evt.offsetY / height) * 100);
  }, []);
  const onMouseLeave = useCallback((evt: MouseEvent) => {
    evt.preventDefault();
    setMousePos(-1);
  }, []);
  return (
    <div class={style.sliderWrapper}>
    <div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={() => {
        let newVolumePercentage = mousePos;
        if (mousePos < 5) {
          newVolumePercentage = 0;
          if (!muted) {
            toggleMute();
          }
        }
        else if (mousePos > 95) {
          newVolumePercentage = 100;
        }
        if (muted) {
          toggleMute();
        }
        onClick(newVolumePercentage);
      }}
      class={style.sliderContainer}
    >
      <div
        class={style.sliderProgress}
        style={{ height: `${muted ? 0 : value * 100}%` }}
      ></div>
    </div>
    </div>
  );
}
