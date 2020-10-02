import { h } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import classNames from 'classnames';
import style from './audioTrack.module.css';

function Icon({ onClick }) {
	return (
		<svg
			onClick={onClick}
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-language"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<path d="M5 7h7m-2 -2v2a5 8 0 0 1 -5 8m1 -4a7 4 0 0 0 6.7 4" />
			<path d="M11 19l4 -9l4 9m-.9 -2h-6.2" />
		</svg>
	);
}

export default function AudioTrackButton({ audioTracks = [], onChange }) {
	const [open, setOpen] = useState(false);
	const onRadioChange = useCallback(
		(evt) => {
			onChange(evt.target.value);
		},
		[onChange]
	);
	return (
		<div class={style.container}>
			<Icon onClick={useCallback(() => setOpen(!open), [open])} />
			<ul class={classNames(style.list, { [style.open]: open })}>
				{audioTracks.map((audioTrack) => (
					<li>
						<label>
							<input
								type="radio"
								name="audioTrack"
								value={audioTrack.id}
								checked={audioTrack.enabled}
								onClick={onRadioChange}
							/>
							<span>{audioTrack.label}</span>
						</label>
					</li>
				))}
			</ul>
		</div>
	);
}
