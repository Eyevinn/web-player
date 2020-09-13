import { h, render } from 'preact';
import EyevinnSkin from './EyevinnSkin';
import style from './index.module.css';

export { EyevinnSkin };
export function renderEyevinnSkin({ root, player }) {
	root.classList.add(style.skinWrapper);
	render(<EyevinnSkin player={player} />, root);
}
