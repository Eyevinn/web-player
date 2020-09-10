import { createElement, IComponent } from "../util/element";
import styles from "./progressbar.module.scss";

export default function progressbar(): IComponent {
  const container = createElement("div", styles.progressbarContainer);
  const progress = createElement("div", styles.progress);
  container.appendChild(progress);

  return {
    element: container,
    update: (currentTime: number, duration: number) => {
      progress.style.width = `${((currentTime / duration) * 100) || 0}%`;
    },
    hide: () => {
      container.classList.add(styles.hidden);
    },
    show: () => {
      container.classList.remove(styles.hidden);
    },
  };
}
