import { h } from 'preact';
import Logo from '../logo/Logo';
import style from './context-menu.module.css';

export default function ContextMenu({ x, y }: { x: number; y: number }) {
  return (
    <div
      class={style.container}
      style={{
        top: `${y}px`,
        left: `${x}px`,
      }}
    >
      <a href="https://www.eyevinntechnology.se/" target="_blank">
        <span>Powered by the Eyevinn WebPlayer</span>
        <Logo className={style.logo} />
      </a>
    </div>
  );
}
