import { createElement, IComponent } from "../util/element";
import styles from "./progressbar.module.scss";

function formatPlayerTime(sec: number) {
  let h = Math.floor(sec / 3600) % 24;
  let m = Math.floor(sec / 60) % 60;
  let s = sec % 60;
  return [h, m, s]
    .map((v) => (v < 10 ? "0" + v : v))
    .filter((v, i) => v !== "00" || i > 0)
    .join(":");
}

export default function progressbar(onChange): IComponent {
  const container = createElement("div", styles.progressbarContainer);
  const progress = createElement("div", styles.progress);
  const indicator = createElement("div", styles.indicator);
  container.appendChild(progress);
  progress.appendChild(indicator);

  let offsetWidth = 0;
  function setOffsetWidth() {
    if (!offsetWidth) {
      offsetWidth = container.offsetWidth;
    }
  }

  let percentage = 0;

  let handler;
  let dragging = false;
  let startX = -1;
  let moveX = 0;
  indicator.addEventListener("mousedown", (downEvt) => {
    downEvt.stopPropagation();
    dragging = true;
    startX = downEvt.x;

    document.addEventListener(
      "mousemove",
      (handler = (moveEvt) => {
        setOffsetWidth();
        moveX = moveEvt.x - startX;
        const newPercentage = percentage + (moveX / offsetWidth) * 100;
        progress.style.width = `${newPercentage}%`;
      })
    );
  });

  document.addEventListener("mouseup", (evt) => {
    if (dragging) {
      moveX = evt.x - startX;
      const newPercentage = percentage + (moveX / offsetWidth) * 100;
      onChange?.(newPercentage);
      dragging = false;
      document.removeEventListener("mousemove", handler);
    }
  });

  container.addEventListener("mousedown", (evt) => {
    setOffsetWidth();
    const newPercentage = (evt.offsetX / offsetWidth) * 100;
    progress.style.width = `${newPercentage}%`;
    onChange?.(newPercentage);
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
