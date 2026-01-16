export class NetworkMonitor {
  constructor(onRequestAdded = null) {
    this.onRequestAdded = onRequestAdded;
    this.allRequests = [];
    this.requestCounter = 0;
    this.currentFilter = 'all';
    this.processedUrls = new Set();
    this.observer = null;
    this.startTime = null;
    
    this.requestTableBody = document.getElementById('network-table-body');
    this.totalRequestsEl = document.getElementById('totalRequests');
    this.manifestCountEl = document.getElementById('manifestCount');
    this.segmentCountEl = document.getElementById('segmentCount');
    this.totalDataEl = document.getElementById('totalData');
    this.avgDurationEl = document.getElementById('avgDuration');
    
    this.initEventListeners();
  }

  initEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filterRequests(e.target.dataset.filter);
      });
    });

    // Clear log button
    const clearBtn = document.getElementById('clear-network-log');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearLog());
    }

    // Export button
    const exportBtn = document.getElementById('export-network-data');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }
  }

  start() {
    if (this.observer) {
      return; // Already started
    }

    this.startTime = performance.now();
    
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.processResourceEntry(entry);
          }
        }
      });

      this.observer.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.warn('PerformanceObserver not supported:', e);
    }
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  reset() {
    this.allRequests = [];
    this.requestCounter = 0;
    this.processedUrls.clear();
    this.startTime = null;
    this.updateStats();
    this.renderTable();
  }

  processResourceEntry(entry) {
    // Avoid duplicates
    const uniqueKey = entry.name + entry.startTime;
    if (this.processedUrls.has(uniqueKey)) return;
    this.processedUrls.add(uniqueKey);

    // Determine if this is likely a video-related request
    const url = entry.name.toLowerCase();
    const isVideoRelated =
      url.includes('.m3u8') ||
      url.includes('.ts') ||
      url.includes('.m4s') ||
      url.includes('.mp4') ||
      url.includes('.aac') ||
      url.includes('.vtt') ||
      url.includes('master') ||
      url.includes('playlist') ||
      url.includes('segment') ||
      url.includes('chunk') ||
      url.includes('init') ||
      entry.initiatorType === 'video' ||
      entry.initiatorType === 'xmlhttprequest';

    if (!isVideoRelated) return;

    const request = {
      id: ++this.requestCounter,
      url: entry.name,
      type: this.guessRequestType(entry.name),
      duration: Math.round(entry.duration),
      size: entry.transferSize || entry.encodedBodySize || 0,
      timestamp: entry.startTime,
      fetchStart: entry.fetchStart,
      responseStart: entry.responseStart,
      responseEnd: entry.responseEnd,
      initiatorType: entry.initiatorType,
      nextHopProtocol: entry.nextHopProtocol,
      status: entry.transferSize > 0 ? 200 : 0,
      responseText: null // Will be populated if available
    };

    this.allRequests.push(request);
    this.updateStats();
    this.addRequestToTable(request);
    
    // Notify network analysis if callback is provided
    if (this.onRequestAdded) {
      this.onRequestAdded(request);
    }
  }

  guessRequestType(url) {
    const lower = url.toLowerCase();

    if (lower.includes('.m3u8') || lower.includes('manifest') || lower.includes('master') || lower.includes('playlist')) {
      return 'manifest';
    }

    if (lower.includes('init') && (lower.includes('.mp4') || lower.includes('.m4'))) {
      return 'init';
    }

    if (lower.includes('.ts') || lower.includes('.m4s') ||
        lower.includes('segment') || lower.includes('chunk') ||
        lower.match(/\d+\.m4[sfv]/) || lower.match(/seg-\d+/)) {
      return 'segment';
    }

    return 'unknown';
  }

  updateStats() {
    const manifestCount = this.allRequests.filter(r => r.type === 'manifest').length;
    const segmentCount = this.allRequests.filter(r => r.type === 'segment').length;
    const totalSize = this.allRequests.reduce((sum, r) => sum + r.size, 0);
    const avgDuration = this.allRequests.length > 0
      ? Math.round(this.allRequests.reduce((sum, r) => sum + r.duration, 0) / this.allRequests.length)
      : 0;

    if (this.totalRequestsEl) this.totalRequestsEl.textContent = this.allRequests.length;
    if (this.manifestCountEl) this.manifestCountEl.textContent = manifestCount;
    if (this.segmentCountEl) this.segmentCountEl.textContent = segmentCount;
    if (this.totalDataEl) this.totalDataEl.textContent = this.formatBytes(totalSize);
    if (this.avgDurationEl) this.avgDurationEl.textContent = avgDuration + 'ms';
  }

  addRequestToTable(request) {
    // Apply filter
    if (this.currentFilter !== 'all' && request.type !== this.currentFilter) {
      return;
    }

    // Remove "no requests" message if present
    const noRequestsRow = this.requestTableBody.querySelector('.no-requests');
    if (noRequestsRow) {
      noRequestsRow.parentElement.remove();
    }

    const row = document.createElement('tr');
    row.className = 'clickable-row';
    row.dataset.requestId = request.id;

    const relativeTime = (request.timestamp / 1000).toFixed(2) + 's';
    const fileName = this.extractFileName(request.url);

    row.innerHTML = `
      <td>${request.id}</td>
      <td>${relativeTime}</td>
      <td><span class="type-badge type-${request.type}">${request.type}</span></td>
      <td class="url-cell" title="${request.url}">${request.url}</td>
      <td>${this.formatBytes(request.size)}</td>
      <td>${request.duration}ms</td>
      <td class="status-success">OK</td>
    `;

    row.addEventListener('click', () => this.toggleDetails(row, request));
    this.requestTableBody.insertBefore(row, this.requestTableBody.firstChild);

    // Limit table size
    if (this.requestTableBody.children.length > 200) {
      this.requestTableBody.removeChild(this.requestTableBody.lastChild);
    }
  }

  toggleDetails(row, request) {
    const existingDetails = row.nextElementSibling;

    if (existingDetails && existingDetails.classList.contains('details-row')) {
      existingDetails.remove();
      return;
    }

    const detailsRow = document.createElement('tr');
    detailsRow.className = 'details-row';

    const detailsCell = document.createElement('td');
    detailsCell.colSpan = 7;
    detailsCell.style.padding = '15px';
    detailsCell.style.backgroundColor = '#2a2a2a';

    const detailsDiv = document.createElement('div');
    detailsDiv.style.display = 'grid';
    detailsDiv.style.gridTemplateColumns = '150px 1fr';
    detailsDiv.style.gap = '10px';
    detailsDiv.style.fontSize = '11px';
    
    detailsDiv.innerHTML = `
      <div style="color: #999;">Full URL:</div>
      <div style="color: #ccc; word-break: break-all;">${request.url}</div>
      <div style="color: #999;">File Name:</div>
      <div style="color: #ccc;">${this.extractFileName(request.url)}</div>
      <div style="color: #999;">Type:</div>
      <div style="color: #ccc;">${request.type}</div>
      <div style="color: #999;">Initiator:</div>
      <div style="color: #ccc;">${request.initiatorType}</div>
      <div style="color: #999;">Protocol:</div>
      <div style="color: #ccc;">${request.nextHopProtocol || 'N/A'}</div>
      <div style="color: #999;">Size:</div>
      <div style="color: #ccc;">${this.formatBytes(request.size)} (${request.size} bytes)</div>
      <div style="color: #999;">Duration:</div>
      <div style="color: #ccc;">${request.duration}ms</div>
    `;

    detailsCell.appendChild(detailsDiv);
    detailsRow.appendChild(detailsCell);
    row.parentNode.insertBefore(detailsRow, row.nextSibling);
  }

  filterRequests(type) {
    this.currentFilter = type;
    this.renderTable();
  }

  renderTable() {
    this.requestTableBody.innerHTML = '';

    const filtered = this.currentFilter === 'all'
      ? this.allRequests
      : this.allRequests.filter(r => r.type === this.currentFilter);

    if (filtered.length === 0) {
      this.requestTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="no-requests">
            No ${this.currentFilter} requests found.
          </td>
        </tr>
      `;
    } else {
      filtered.reverse().forEach(req => this.addRequestToTable(req));
    }
  }

  clearLog() {
    this.reset();
  }

  exportData() {
    const dataStr = JSON.stringify(this.allRequests, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `network-requests-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  extractFileName(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      return path.split('/').pop() || path;
    } catch {
      return url.split('/').pop() || url;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
