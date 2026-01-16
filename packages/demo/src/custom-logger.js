export class CustomLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.logContainer = document.getElementById('log-content');
    this.logSection = document.getElementById('log-section');
    this.logToggle = document.getElementById('log-toggle');
    this.logClear = document.getElementById('log-clear');
    this.isExpanded = false; // Start collapsed

    this.initEventListeners();
    // Initialize as collapsed
    this.initializeCollapsed();
  }

  initializeCollapsed() {
    const logContent = document.getElementById('log-content');
    const toggleText = this.logToggle.querySelector('.log-toggle-text');
    const toggleIcon = this.logToggle.querySelector('.log-toggle-icon');

    if (logContent) {
      // Show approximately 3 rows of logs (each row is ~24px with line-height 1.6 and font-size 12px)
      // 3 rows * 24px = 72px, plus padding = ~96px
      logContent.style.maxHeight = '72px';
      logContent.style.padding = '12px';
      logContent.style.overflowY = 'auto';
      if (toggleText) toggleText.textContent = 'Expand';
      if (toggleIcon) toggleIcon.textContent = '▼';
    }
  }

  initEventListeners() {
    if (this.logToggle) {
      this.logToggle.addEventListener('click', () => {
        this.toggle();
      });
    }

    if (this.logClear) {
      this.logClear.addEventListener('click', () => {
        this.clear();
      });
    }
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

    const logElement = document.createElement('div');
    logElement.className = `log-entry log-${logEntry.level}`;

    const time = new Date(logEntry.timestamp).toLocaleTimeString();
    let content = `<span class="log-prompt">$</span>`;
    content += `<span class="log-time">[${time}]</span>`;
    content += `<span class="log-level">[${logEntry.level.toUpperCase()}]</span>`;
    content += `<span class="log-message">${this.escapeHtml(
      logEntry.message
    )}</span>`;

    if (logEntry.data) {
      const dataStr =
        typeof logEntry.data === 'object'
          ? JSON.stringify(logEntry.data, null, 2)
          : String(logEntry.data);
      content += `<pre class="log-data">${this.escapeHtml(dataStr)}</pre>`;
    }

    logElement.innerHTML = content;
    this.logContainer.appendChild(logElement);

    // Auto-scroll to bottom
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  toggle() {
    this.isExpanded = !this.isExpanded;
    const logContent = document.getElementById('log-content');
    const toggleText = this.logToggle.querySelector('.log-toggle-text');
    const toggleIcon = this.logToggle.querySelector('.log-toggle-icon');

    if (logContent) {
      if (this.isExpanded) {
        logContent.style.maxHeight = '200px';
        logContent.style.padding = '12px';
        logContent.style.overflowY = 'auto';
        if (toggleText) toggleText.textContent = 'Collapse';
        if (toggleIcon) toggleIcon.textContent = '▲';
      } else {
        // Show approximately 3 rows of logs when collapsed
        logContent.style.maxHeight = '72px';
        logContent.style.padding = '12px';
        logContent.style.overflowY = 'auto';
        if (toggleText) toggleText.textContent = 'Expand';
        if (toggleIcon) toggleIcon.textContent = '▼';
      }
    }
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
