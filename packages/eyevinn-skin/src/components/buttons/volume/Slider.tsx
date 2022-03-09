
import { h } from 'preact';
import style from './volume.module.css';
import { useCallback, useState } from 'preact/hooks';
import classNames from 'classnames';

// export default function Slider({ muted, onClick, value }) {
//     const [mousePos, setMousePos] = useState(-1);
//     const onMouseMove = useCallback((evt: MouseEvent) => {
//       evt.preventDefault();
//       const width = (evt.currentTarget as HTMLDivElement).offsetWidth;
//       setMousePos((evt.offsetX / width) * 100);
//     }, []);
//     const onMouseLeave = useCallback((evt: MouseEvent) => {
//       evt.preventDefault();
//       setMousePos(-1);
//     }, []);

//     const onProgressClick = useCallback(
// 		(evt: MouseEvent) => {
// 				const width = (evt.currentTarget as HTMLDivElement).offsetWidth;
//         console.log("Width: ", width)
// 				onClick((evt.offsetX / width) * 100);
// 		},
// 		[value]
// 	);
//     return (
//       <div
//         onMouseMove={onMouseMove}
//         onMouseLeave={onMouseLeave}
//         onClick={() => {
//           if (mousePos < 0) return;
//           onClick(mousePos);
//         }}
//         className={classNames(style.sliderContainer)}
//       >
//         <div className={style.sliderProgress} style={{ width: `${muted ? 0 : value * 100}%` }}></div>
//         <div class={style.knob}></div>
//         <div class={style.right}></div>
//       </div>
//     );
//   }

export default function Slider({ muted, onClick, toggleMute, value }) {
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
      <div
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={() => {
          if (mousePos < 5 && !muted) {
             toggleMute(); 
            return;
          }
          if(mousePos > 5 && muted) {
              toggleMute();
          }
          onClick(mousePos);
        }}
        className={classNames(style.sliderContainer)}
      >
        <div className={style.sliderProgress} style={{ height: `${muted ? 0 : value * 100}%` }}>
            </div>
      </div>
    );
  }