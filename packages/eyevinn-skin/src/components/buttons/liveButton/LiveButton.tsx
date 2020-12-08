import classNames from 'classnames';
import { h } from 'preact';
import style from './liveButton.module.scss';

export default function LiveButton({ onClick, isAtLiveEdge, isSeekable }) {
  return (
    <div
      class={classNames(style.liveButton, {
        [style.dvr]: !isAtLiveEdge && isSeekable,
      })}
      onClick={onClick}
    >
      LIVE
    </div>
  );
}