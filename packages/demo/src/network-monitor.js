export class NetworkMonitor {
  constructor(onRequestAdded = null, customLogger = null) {
    this.onRequestAdded = onRequestAdded;
    this.customLogger = customLogger;
    this.allRequests = [];
    this.requestCounter = 0;
    this.currentFilter = 'all';
    this.processedUrls = new Set();
    this.observer = null;
    this.startTime = null;
    this.originalFetch = null;
    this.originalXHR = null;
    
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
            this.processResourceEntry(entry.toJSON());
          }
        }
      });

      // Use buffered: true to get all entries including completed ones
      this.observer.observe({ entryTypes: ['resource'], buffered: true });

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
      entry.initiatorType === 'xmlhttprequest' ||
      entry.initiatorType === 'fetch';

    // (Previously logged performance entries here; removed to avoid noisy debug logs)

    if (!isVideoRelated) return;

    // Calculate size - try multiple properties in order of preference
    const size = this.getSizeFromEntry(entry) || 0;
    
    // (Previously logged network resource entries here; removed to avoid noisy debug logs)

    // Determine status from entry.responseStatus if available
    let status = null;
    
    // Check if responseStatus is available on the entry
    if (entry.responseStatus !== undefined && entry.responseStatus !== null) {
      status = entry.responseStatus;
    } else if (entry.responseEnd === 0) {
      // Only infer failure if responseEnd is 0 (no response received)
      status = 0; // Failed
    }

    const request = {
      id: ++this.requestCounter,
      url: entry.name,
      type: this.guessRequestType(entry.name),
      duration: Math.round(entry.duration),
      size: size,
      timestamp: entry.startTime,
      fetchStart: entry.fetchStart,
      responseStart: entry.responseStart,
      responseEnd: entry.responseEnd,
      initiatorType: entry.initiatorType,
      nextHopProtocol: entry.nextHopProtocol,
      status: status,
      responseText: null, // Will be populated if available
      entryName: entry.name // Store for later updates
    };

    this.allRequests.push(request);
    this.updateStats();
    this.addRequestToTable(request);
    
    // Notify network analysis if callback is provided
    if (this.onRequestAdded) {
      this.onRequestAdded(request);
    }
  }

  getSizeFromEntry(entry) {
    // Try multiple size properties in order of preference
    // transferSize includes headers, encodedBodySize is after content-codings,
    // decodedBodySize is after removing all encodings
    
    // Check if entry has the size properties (they might be 0 due to CORS)
    // If transferSize is 0 but we have encodedBodySize or decodedBodySize, use those
    if (entry.transferSize !== undefined && entry.transferSize > 0) {
      return entry.transferSize;
    }
    if (entry.encodedBodySize !== undefined && entry.encodedBodySize > 0) {
      return entry.encodedBodySize;
    }
    if (entry.decodedBodySize !== undefined && entry.decodedBodySize > 0) {
      return entry.decodedBodySize;
    }
    
    // If all are 0 or undefined, return 0
    // Note: transferSize can be 0 for cached resources, but encodedBodySize should still work
    // If all are 0, it's likely a CORS restriction
    return 0;
  }

  guessRequestType(url) {
    const lower = url.toLowerCase();

    if (lower.includes('.m3u8') || lower.includes('manifest') || lower.includes('master') || lower.includes('playlist')) {
      return 'manifest';
    }

    if (lower.includes('init') && (lower.includes('.mp4') || lower.includes('.m4'))) {
      return 'init';
    }

    if (lower.includes('.vtt')) {
      return 'subtitle';
    }

    const isSegment =
      lower.includes('.mp4') ||
      lower.includes('.ts') ||
      lower.includes('.m4s') ||
      lower.includes('.aac') ||
      lower.includes('segment') ||
      lower.includes('chunk') ||
      lower.match(/\d+\.m4[sfv]/) ||
      lower.match(/seg-\d+/);

    if (isSegment) {
      const fileLower = this.extractFileName(url).toLowerCase();
      if (fileLower.startsWith('a-') || fileLower.includes('aac')) {
        return 'audio-segment';
      }
      if (fileLower.startsWith('v-')) {
        return 'video-segment';
      }
      return 'segment';
    }

    return 'unknown';
  }

  updateStats() {
    const manifestCount = this.allRequests.filter(r => r.type === 'manifest').length;
    const segmentCount = this.allRequests.filter(r => this.isSegmentType(r.type)).length;
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
    if (
      this.currentFilter !== 'all' &&
      !(this.currentFilter === 'segment' && this.isSegmentType(request.type)) &&
      request.type !== this.currentFilter
    ) {
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

    // Determine status class and text
    let statusClass = 'status-success';
    let statusText = 'N/A';
    if (request.status === null || request.status === undefined) {
      statusClass = '';
      statusText = 'N/A';
    } else if (request.status === 0) {
      statusClass = 'status-error';
      statusText = 'FAILED';
    } else if (request.status >= 400) {
      statusClass = 'status-error';
      statusText = request.status.toString();
    } else if (request.status >= 300) {
      statusClass = 'status-warning';
      statusText = request.status.toString();
    } else if (request.status >= 200) {
      statusClass = 'status-success';
      statusText = request.status.toString();
    }

    const urlDisplay = this.extractFileName(request.url);
    const typeLabel = this.getTypeLabel(request.type);
    row.innerHTML = `
      <td class="col-small">${request.id}</td>
      <td class="col-small"><span class="type-badge type-${request.type}">${typeLabel}</span></td>
      <td class="url-cell" title="${request.url}">${urlDisplay}</td>
      <td class="col-small">${request.duration ? `${request.duration}ms` : '-'}</td>
      <td class="col-small ${statusClass}">${statusText}</td>
    `;

    row.addEventListener('click', () => this.toggleDetails(row, request));
    
    // Insert in descending order by ID
    // Find the correct position to maintain descending order
    const rows = Array.from(this.requestTableBody.children);
    let insertIndex = rows.findIndex(r => {
      const rowId = parseInt(r.dataset.requestId || '0');
      return request.id > rowId;
    });
    
    if (insertIndex === -1) {
      // Append to end if this is the smallest ID
      this.requestTableBody.appendChild(row);
    } else {
      // Insert before the row with smaller ID
      this.requestTableBody.insertBefore(row, rows[insertIndex]);
    }

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

    // Close any other open details rows
    const allDetailsRows = this.requestTableBody.querySelectorAll('.details-row');
    allDetailsRows.forEach(detailsRow => {
      detailsRow.remove();
    });

    const detailsRow = document.createElement('tr');
    detailsRow.className = 'details-row';

    const detailsCell = document.createElement('td');
    detailsCell.colSpan = 5;
    detailsCell.className = 'details-cell';
    detailsCell.style.padding = '20px';
    detailsCell.style.textAlign = 'left';
    // Make the expanded details area a unified background color and add a border
    detailsCell.style.backgroundColor = '#252525';
    detailsCell.style.border = '1px solid #3a3a3a';
    detailsCell.style.borderRadius = '6px';
    detailsCell.style.boxSizing = 'border-box';
    detailsCell.style.marginTop = '8px';

    const detailsDiv = document.createElement('div');
    detailsDiv.style.display = 'grid';
    // Make the first column tight to the label content
    detailsDiv.style.gridTemplateColumns = 'max-content 1fr';
    detailsDiv.style.gap = '0';
    detailsDiv.style.fontSize = '12px';
    detailsDiv.style.textAlign = 'left';
    
    // Build rows dynamically, only showing fields with data
    const rows = [];
    const typeLabel = this.getTypeLabel(request.type);
    
    // Type
    rows.push({
      label: 'Type',
      value: `<span class="type-badge type-${request.type}">${typeLabel}</span>`
    });
    
    // File (full URL)
    if (request.url) {
      const safeUrl = request.url;
      rows.push({
        label: 'URL',
        value: `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`
      });
    }
    
    // Protocol
    if (request.nextHopProtocol) {
      rows.push({
        label: 'Protocol',
        value: request.nextHopProtocol
      });
    }
    
    // Size
    if (request.size > 0) {
      rows.push({
        label: 'Size',
        value: `${this.formatBytes(request.size)} <span style="color: #999;">(${request.size.toLocaleString()} bytes)</span>`
      });
    }
    
    // Duration
    if (request.duration) {
      rows.push({
        label: 'Duration',
        value: `${request.duration}ms`
      });
    }
    
    // Status
    if (request.status !== null && request.status !== undefined) {
      let statusDisplay;
      if (request.status === 0) {
        statusDisplay = '<span style="color: #f44336; font-weight: 600;">FAILED</span>';
      } else if (request.status >= 400) {
        statusDisplay = `<span style="color: #f44336; font-weight: 600;">${request.status}</span>`;
      } else if (request.status >= 300) {
        statusDisplay = `<span style="color: #ff9800; font-weight: 600;">${request.status}</span>`;
      } else {
        statusDisplay = `<span style="color: #00c853; font-weight: 600;">${request.status}</span>`;
      }
      rows.push({
        label: 'Status',
        value: statusDisplay
      });
    }
    
    // Build HTML with separators
    let html = '';
    rows.forEach((row, index) => {
      const borderTop = index > 0 ? 'border-top: 1px solid #2a2a2a; padding-top: 12px; margin-top: 12px;' : '';
      html += `
        <div style="color: #999; font-weight: 500; ${borderTop}">${row.label}:</div>
        <div style="color: #e0e0e0; padding-left: 10px; ${borderTop}">${row.value}</div>
      `;
    });
    
    detailsDiv.innerHTML = html;

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
      : this.allRequests.filter(r =>
          this.currentFilter === 'segment'
            ? this.isSegmentType(r.type)
            : r.type === this.currentFilter
        );

    if (filtered.length === 0) {
      this.requestTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="no-requests">
            No ${this.currentFilter} requests found.
          </td>
        </tr>
      `;
    } else {
      // Sort by ID in descending order
      filtered.sort((a, b) => b.id - a.id).forEach(req => this.addRequestToTable(req));
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

  isSegmentType(type) {
    return type === 'segment' || type === 'audio-segment' || type === 'video-segment';
  }

  getTypeLabel(type) {
    if (type === 'audio-segment') return 'audio';
    if (type === 'video-segment') return 'video';
    return type.replace(/-/g, ' ');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
