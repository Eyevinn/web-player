import { h } from 'preact';
import style from './cast.module.css';

export default function CastButton() {
	return (
		<div class={style.container}>
			{/* @ts-ignore */}
			<google-cast-launcher />
		</div>
	);
}
