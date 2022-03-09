import { h } from 'preact';
import style from './volume.module.css';
import { useCallback } from 'preact/hooks';
import classNames from 'classnames';
//import style from '../../timeline/timeline.module.scss';

export default function VolumeSlider({ onInput, volume, muted }) {

    const onProgressClick = useCallback(
		(evt: MouseEvent) => {
				const width = (evt.currentTarget as HTMLDivElement).offsetWidth;
        console.log("Width: ", width)
				onInput((evt.offsetX / width) * 100);
		},
		[volume]
	);
//     const percentage = currentTime / duration) * 100
  return (
    <div class={style.slider}>
        {/* <div class={style.volumeSliderWrapper} onClick={onProgressClick}>
				  <div class={style.progressbarContainer}>
            <div class={style.knob} id="knob"/>
					  <div class={style.progress} style={{ width: `${muted ? 0 : volume}%` }} />
				  </div>
		    </div> */}
      {/* <div style="display: flex; justify-content: center; padding: 0.25em">
            <div style="width: 7em" class={style.sliderContainer}>
                <div class="left"></div>
                <div class="knob" id="knob"></div>
                <div class="right"></div>
            </div>
        </div> */}
      <input
        type="range"
        min="0"
        max="100"
        value={muted ? 0 : volume}
        step={10}
        style={"-webkit-appearance: slider-vertical"}
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