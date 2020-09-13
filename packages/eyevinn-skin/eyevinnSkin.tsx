import { h, render } from 'preact';

export { EyevinnSkin };
export default function renderEyevinnSkin({ root, player }) {
	render(<EyevinnSkin player={player} />, root, true);
}
