export class CustomLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.logContainer = document.getElementById('log-content');
    this.logSection = document.getElementById('log-section');
    this.logClear = document.getElementById('log-clear');
    // Default active filters: all levels active
    this.activeFilters = new Set(['all', 'error', 'warn', 'info', 'debug']);

    this.initEventListeners();
  }

  // Helper: produce a normalized string for data for comparison
  _normalizeData(data) {
    if (data === null || data === undefined) return '';
    try {
      if (typeof data === 'string') return data.trim();
      if (typeof data === 'object') {
        // Stable stringify keys sorted to help comparisons
        const replacer = (key, value) => value;
        return JSON.stringify(data, Object.keys(data).sort(), 2);
      }
      return String(data);
    } catch (e) {
      return String(data || '');
    }
  }

  // Helper: check if a log entry actually has a body worth showing
  _hasBody(data) {
    if (data === null || data === undefined) return false;
    if (typeof data === 'string') return data.trim().length > 0;
    if (typeof data === 'object') {
      try {
        return Object.keys(data).length > 0;
      } catch (e) {
        return String(data).trim().length > 0;
      }
    }
    return true;
  }

  initEventListeners() {
    if (this.logClear) {
      this.logClear.addEventListener('click', () => {
        this.clear();
      });
    }

    // Filter pill event listeners
    const filterPills = document.querySelectorAll('.log-filter-pill');
    filterPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const level = pill.dataset.level;

        if (level === 'all') {
          // Toggle all filters
          const allActive = pill.classList.contains('active');
          filterPills.forEach((p) => {
            if (allActive) {
              p.classList.remove('active');
              if (p.dataset.level !== 'all') {
                this.activeFilters.delete(p.dataset.level);
              }
            } else {
              p.classList.add('active');
              this.activeFilters.add(p.dataset.level);
            }
          });
        } else {
          // Toggle individual filter
          pill.classList.toggle('active');
          if (pill.classList.contains('active')) {
            this.activeFilters.add(level);
          } else {
            this.activeFilters.delete(level);
          }

          // Update "All" button state
          const allPill = document.querySelector(
            '.log-filter-pill[data-level="all"]'
          );
          const allLevels = ['error', 'warn', 'info', 'debug'];
          const allActive = allLevels.every((l) => this.activeFilters.has(l));
          if (allActive) {
            allPill.classList.add('active');
            this.activeFilters.add('all');
          } else {
            allPill.classList.remove('active');
            this.activeFilters.delete('all');
          }
        }

        this.renderAllLogs();
      });
    });
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
    };
    this.logs.push(logEntry);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.renderLog(logEntry);
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  error(message, data = null) {
    this.log('error', message, data);
  }

  debug(message, data = null) {
    this.log('debug', message, data);
  }

  renderLog(logEntry) {
    if (!this.logContainer) return;

    // Check if this log level should be displayed
    if (!this.shouldDisplayLog(logEntry.level)) {
      return;
    }

    const logElement = document.createElement('div');
    logElement.className = `log-entry log-${logEntry.level}`;

    const time = new Date(logEntry.timestamp).toLocaleTimeString();
    let content = `<span class="log-prompt">$</span>`;
    content += `<span class="log-time">[${time}]</span>`;
    content += `<span class="log-level">[${logEntry.level.toUpperCase()}]</span>`;
    content += `<span class="log-message">${this.escapeHtml(
      logEntry.message
    )}</span>`;

    logElement.innerHTML = content;
    // If there is data (non-empty), create a hidden expandable block and attach toggle on click
    if (this._hasBody(logEntry.data)) {
      try {
        const dataStr =
          typeof logEntry.data === 'object'
            ? JSON.stringify(logEntry.data, null, 2)
            : String(logEntry.data);
        const pre = document.createElement('pre');
        pre.className = 'log-data';
        pre.style.display = 'none';
        pre.textContent = dataStr;
        logElement.appendChild(pre);

        // Toggle expand/collapse on click
        logElement.style.cursor = 'pointer';
        logElement.addEventListener('click', (e) => {
          // Prevent clicks on links or interactive elements inside message from toggling
          const target = e.target;
          if (
            target &&
            (target.tagName === 'A' ||
              target.tagName === 'BUTTON' ||
              (target.closest && target.closest('.no-toggle')))
          ) {
            return;
          }
          if (pre.style.display === 'none') {
            pre.style.display = 'block';
            logElement.classList.add('expanded');
          } else {
            pre.style.display = 'none';
            logElement.classList.remove('expanded');
          }
        });
      } catch (e) {
        // ignore rendering error
      }
    }
    this.logContainer.appendChild(logElement);

    // Auto-scroll to bottom
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  shouldDisplayLog(level) {
    // If debug logs are globally disabled via the Player Debug Mode, never show them
    if (level === 'debug') {
      const debugEnabled =
        typeof localStorage !== 'undefined' &&
        localStorage.getItem('player-debug-mode') === 'true';
      if (!debugEnabled) return false;
    }
    return this.activeFilters.has('all') || this.activeFilters.has(level);
  }

  renderAllLogs() {
    if (!this.logContainer) return;

    this.logContainer.innerHTML = '';

    this.logs.forEach((logEntry) => {
      if (this.shouldDisplayLog(logEntry.level)) {
        const logElement = document.createElement('div');
        logElement.className = `log-entry log-${logEntry.level}`;

        const time = new Date(logEntry.timestamp).toLocaleTimeString();
        let content = `<span class="log-prompt">$</span>`;
        content += `<span class="log-time">[${time}]</span>`;
        content += `<span class="log-level">[${logEntry.level.toUpperCase()}]</span>`;
        content += `<span class="log-message">${this.escapeHtml(
          logEntry.message
        )}</span>`;

        logElement.innerHTML = content;
        // If there is data, create a hidden expandable block and attach toggle on click
        if (logEntry.data) {
          try {
            const dataStr =
              typeof logEntry.data === 'object'
                ? JSON.stringify(logEntry.data, null, 2)
                : String(logEntry.data);
            const pre = document.createElement('pre');
            pre.className = 'log-data';
            pre.style.display = 'none';
            pre.textContent = dataStr;
            logElement.appendChild(pre);

            // Toggle expand/collapse on click
            logElement.style.cursor = 'pointer';
            logElement.addEventListener('click', (e) => {
              const target = e.target;
              if (
                target &&
                (target.tagName === 'A' ||
                  target.tagName === 'BUTTON' ||
                  (target.closest && target.closest('.no-toggle')))
              ) {
                return;
              }
              if (pre.style.display === 'none') {
                pre.style.display = 'block';
                logElement.classList.add('expanded');
              } else {
                pre.style.display = 'none';
                logElement.classList.remove('expanded');
              }
            });
          } catch (e) {
            // ignore rendering error
          }
        }
        this.logContainer.appendChild(logElement);
      }
    });

    // Auto-scroll to bottom
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  clear() {
    this.logs = [];
    if (this.logContainer) {
      this.logContainer.innerHTML = '';
    }
  }

  getLogs() {
    return this.logs;
  }
}
