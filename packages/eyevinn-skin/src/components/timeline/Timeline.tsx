import { h } from 'preact';
import { useCallback } from 'preact/hooks';
import classNames from 'classnames';
import style from './timeline.module.scss';
import LiveButton from '../buttons/liveButton/LiveButton';

function formatPlayerTime(sec = 0) {
	let h = Math.floor(sec / 3600) % 24;
	let m = Math.floor(sec / 60) % 60;
	let s = Math.floor(sec % 60);
	return [h, m, s]
		.map((v) => (v < 10 ? '0' + v : v))
		.filter((v, i) => v !== '00' || i > 0)
		.join(':');
}

function Time({ time }) {
	return <div class={style.time}>{formatPlayerTime(time)}</div>;
}

export default function Timeline({
	currentTime = 0,
	duration = 0,
	handleSeek,
	handleSeekToLive,
	isLive,
	isAtLiveEdge,
	isSeekable,
}) {
	const onProgressClick = useCallback(
		(evt: MouseEvent) => {
			if (isSeekable) {
				const width = (evt.currentTarget as HTMLDivElement).offsetWidth;
				handleSeek((evt.offsetX / width) * 100);
			}
		},
		[handleSeek, isSeekable]
	);

	const percentage =
		isLive && (isAtLiveEdge || !isSeekable)
			? 100
			: (currentTime / duration) * 100 || 0;
	return (
		<div
			class={classNames(style.container, { [style.seekDisabled]: !isSeekable })}
		>
			<Time time={currentTime} />
			<div class={style.progressbarWrapper} onClick={onProgressClick}>
				<div class={style.progressbarContainer}>
					<div class={style.progress} style={{ width: `${percentage}%` }} />
				</div>
			</div>
			{isLive ? (
				<LiveButton
					onClick={handleSeekToLive}
					isAtLiveEdge={isAtLiveEdge}
					isSeekable={isSeekable}
				/>
			) : (
				<Time time={duration} />
			)}
		</div>
	);
}