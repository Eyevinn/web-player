import WebPlayer from '@eyevinn/web-player-core';
import { h, render } from 'preact';
import EyevinnSkin from './EyevinnSkin';
import style from './index.module.css';

export { EyevinnSkin };
export function renderEyevinnSkin({
	root,
	player,
	castAppId,
}: {
	root: HTMLElement;
	player: WebPlayer;
	castAppId?: string;
}) {
	root.classList.add(style.skinWrapper);
	render(
		<EyevinnSkin player={player} rootElement={root} castAppId={castAppId} />,
		root
	);
}
