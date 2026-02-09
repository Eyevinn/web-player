import { h } from 'preact';
import { useCallback, useState, useEffect } from 'preact/hooks';
import classNames from 'classnames';
import style from './videoQuality.module.css';

function CogIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 0 24 24"
      width="24"
    >
      <path d="M0 0h24v24H0z" fill="none" />
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );
}

export interface IVideoLevel {
  id: any;
  width: number;
  height: number;
  bitrate: number;
}

export default function VideoQualityButton({
  videoLevels = [],
  currentLevel,
  onChange,
}) {
  const [open, setOpen] = useState(false);

  const onRadioChange = useCallback(
    (evt) => {
      const target = evt.target;
      const value = target.value;
      if (value === 'auto') {
        onChange(null);
      } else {
        const levelIndex = parseInt(value, 10);
        const level = videoLevels[levelIndex];
        if (level) {
          onChange(level);
        }
      }
      setOpen(false);
    },
    [onChange, videoLevels]
  );

  const handleOptionClick = useCallback(
    (value) => {
      if (value === 'auto') {
        onChange(null);
      } else {
        const levelIndex = parseInt(value, 10);
        const level = videoLevels[levelIndex];
        if (level) {
          onChange(level);
        }
      }
      setOpen(false);
    },
    [onChange, videoLevels]
  );

  const formatLevelLabel = (level: IVideoLevel) => {
    return `${level.width}x${level.height}, ${Math.round(
      level.bitrate / 1024
    )}kbps`;
  };

  const getCurrentLevelLabel = () => {
    if (!currentLevel) {
      return 'AUTO';
    }
    return formatLevelLabel(currentLevel);
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target && !target.closest(`.${style.container}`)) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  if (!videoLevels || videoLevels.length === 0) {
    return null;
  }

  const handleLabelClick = useCallback(
    (e, value) => {
      e.stopPropagation();
      e.preventDefault();
      handleOptionClick(value);
    },
    [handleOptionClick]
  );

  return (
    <div
      class={style.container}
      onClick={useCallback(
        (e: MouseEvent) => {
          // Don't toggle if clicking inside the dropdown list
          const target = e.target as Element;
          if (target && target.closest(`.${style.list}`)) {
            return;
          }
          e.stopPropagation();
          setOpen(!open);
        },
        [open]
      )}
    >
      <CogIcon />
      <ul
        class={classNames(style.list, { [style.open]: open })}
        onClick={(e) => e.stopPropagation()}
      >
        <li>
          <label onClick={(e) => handleLabelClick(e, 'auto')}>
            <input
              type="radio"
              name="videoQuality"
              value="auto"
              checked={!currentLevel}
              onChange={onRadioChange}
              onClick={(e) => {
                e.stopPropagation();
                handleOptionClick('auto');
              }}
            />
            <span>AUTO</span>
          </label>
        </li>
        {videoLevels.map((level, index) => (
          <li key={level.id || index}>
            <label onClick={(e) => handleLabelClick(e, index.toString())}>
              <input
                type="radio"
                name="videoQuality"
                value={index.toString()}
                checked={currentLevel?.id === level.id}
                onChange={onRadioChange}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOptionClick(index.toString());
                }}
              />
              <span>{formatLevelLabel(level)}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
