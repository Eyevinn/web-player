import { h } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import classNames from 'classnames';
import style from './textTrack.module.css';

function IconEnabled() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-message-dots"
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
			<path d="M4 21v-13a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-9l-4 4" />
			<line x1="12" y1="11" x2="12" y2="11.01" />
			<line x1="8" y1="11" x2="8" y2="11.01" />
			<line x1="16" y1="11" x2="16" y2="11.01" />
		</svg>
	);
}

function IconDisabled() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-message-off"
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
			<line x1="3" y1="3" x2="21" y2="21" />
			<path d="M17 17h-9l-4 4v-13c0 -1.086 .577 -2.036 1.44 -2.563m3.561 -.437h8a3 3 0 0 1 3 3v6c0 .575 -.162 1.112 -.442 1.568" />
		</svg>
	);
}

export default function TextTrackButton({ textTracks = [], onChange }) {
	const [open, setOpen] = useState(false);
	const onRadioChange = useCallback(
		(evt) => {
			onChange(evt.target.value);
			evt.stopPropagation();
		},
		[onChange]
	);
	return (
		<div
			class={style.container}
			onClick={useCallback(() => setOpen(!open), [open])}
		>
			<IconDisabled />
			<ul class={classNames(style.list, { [style.open]: open })}>
				{textTracks.map((textTrack) => (
					<li>
						<label>
							<input
								type="radio"
								name="audioTrack"
								value={textTrack.id}
								checked={textTrack.enabled}
								onClick={onRadioChange}
							/>
							<span>{textTrack.label}</span>
						</label>
					</li>
				))}
			</ul>
		</div>
	);
}
