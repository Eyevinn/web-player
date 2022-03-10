import { h } from 'preact';
import style from './volume.module.css';
import { useCallback, useState } from 'preact/hooks';

export default function VolumeSlider({ muted, onClick, toggleMute, value }) {
  const [mousePos, setMousePos] = useState(-1);
  const onMouseMove = useCallback((evt: MouseEvent) => {
    evt.preventDefault();
    const height = (evt.currentTarget as HTMLDivElement).offsetHeight;
    setMousePos(evt.offsetY / height * 100);
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
        let newVolumePercentage = mousePos < 5 ? 0 : mousePos > 95 ? 100: mousePos;
        if((muted && newVolumePercentage) || (!muted && !newVolumePercentage)) {
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
