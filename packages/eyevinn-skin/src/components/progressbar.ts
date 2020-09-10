import { createElement, IComponent } from "../util/element";
import styles from "./progressbar.module.scss";

export default function progressbar(): IComponent {
  const container = createElement("div", styles.progressbarContainer);
  const progress = createElement("div", styles.progress);
  const indicator = createElement("div", styles.indicator);
  container.appendChild(progress);
  progress.appendChild(indicator);

  let percentage = 0;

  let handler;
  let dragging = false;
  let startX = -1;
  let moveX = 0;
  indicator.addEventListener("mousedown", (downEvt) => {
    dragging = true;
    startX = downEvt.x;

    document.addEventListener(
      "mousemove",
      (handler = (moveEvt) => {
        moveX = moveEvt.x - startX;
        progress.style.width = `${ percentage + ((moveX / container.offsetWidth) * 100)}%`
      })
    );
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
    document.removeEventListener("mousemove", handler);
  });

  return {
    element: container,
    update: (currentTime: number, duration: number) => {
      if (!dragging) {
        percentage = (currentTime / duration) * 100 || 0;
        progress.style.width = `${percentage}%`;
      }
    },
    hide: () => {
      container.classList.add(styles.hidden);
    },
    show: () => {
      container.classList.remove(styles.hidden);
    },
  };
}
