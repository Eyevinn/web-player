export class SegmentTimeline {
  constructor(video, networkMonitor) {
    this.video = video;
    this.networkMonitor = networkMonitor;
    this.segments = [];
    this.updateInterval = null;
    this.slidingWindow = true;
    this.windowSize = 10; // seconds
    
    this.timelineEl = document.getElementById('segment-timeline');
    this.currentTimeEl = document.getElementById('segment-timeline-current-time');
    this.segmentCountEl = document.getElementById('segment-timeline-count');
    this.slidingWindowCheckbox = document.getElementById('segment-timeline-sliding-window');
    this.windowSizeSelect = document.getElementById('segment-timeline-window-size');
    
    // Segment info panel elements
    this.segmentInfoPanel = document.getElementById('segment-info-panel');
    this.segmentInfoIndex = document.getElementById('segment-info-index');
    this.segmentInfoStart = document.getElementById('segment-info-start');
    this.segmentInfoDuration = document.getElementById('segment-info-duration');
    this.segmentInfoBitrate = document.getElementById('segment-info-bitrate');
    this.segmentInfoSize = document.getElementById('segment-info-size');
    this.segmentInfoUrl = document.getElementById('segment-info-url');
    
    this.selectedSegment = null;
    
    this.initEventListeners();
  }

  initEventListeners() {
    if (this.slidingWindowCheckbox) {
      this.slidingWindowCheckbox.addEventListener('change', (e) => {
        this.slidingWindow = e.target.checked;
        this.update();
      });
    }

    if (this.windowSizeSelect) {
      this.windowSizeSelect.addEventListener('change', (e) => {
        this.windowSize = parseInt(e.target.value);
        this.update();
      });
    }
  }

  addSegment(url, startTime, duration, bitrate, size, index) {
    // Extract segment info from network requests
    const segment = {
      url,
      startTime,
      duration,
      endTime: startTime + duration,
      bitrate: bitrate || 0,
      size: size || 0,
      index: index !== undefined ? index : this.segments.length,
      timestamp: Date.now()
    };
    
    // Check if segment already exists
    const exists = this.segments.some(s => s.url === url);
    if (!exists) {
      this.segments.push(segment);
      // Sort by start time and reindex
      this.segments.sort((a, b) => a.startTime - b.startTime);
      this.segments.forEach((s, i) => {
        s.index = i;
      });
      this.update();
    }
  }

  update() {
    if (!this.timelineEl || !this.video) {
      return;
    }

    const currentTime = this.video.currentTime || 0;
    const duration = this.video.duration || 0;

    // Update current time display
    if (this.currentTimeEl) {
      this.currentTimeEl.textContent = currentTime.toFixed(2);
    }

    // Update segment count
    if (this.segmentCountEl) {
      this.segmentCountEl.textContent = this.segments.length;
    }

    // Clear timeline
    this.timelineEl.innerHTML = '';

    if (duration === 0 || isNaN(duration)) {
      return;
    }

    // Determine visible range
    let startTime = 0;
    let endTime = duration;
    let timelineStart = 0;
    let timelineEnd = duration;

    if (this.slidingWindow && this.windowSize > 0) {
      const windowStart = Math.max(0, currentTime - this.windowSize / 2);
      const windowEnd = Math.min(duration, currentTime + this.windowSize / 2);
      startTime = windowStart;
      endTime = windowEnd;
      timelineStart = windowStart;
      timelineEnd = windowEnd;
    } else if (this.slidingWindow && this.windowSize === -1) {
      // Show all
      startTime = 0;
      endTime = duration;
      timelineStart = 0;
      timelineEnd = duration;
    }

    const timeRange = timelineEnd - timelineStart;
    if (timeRange <= 0) return;

    // Draw time markers
    this.drawTimeMarkers(timelineStart, timelineEnd, timeRange);

    // Draw segments
    this.segments.forEach((segment) => {
      if (segment.endTime >= startTime && segment.startTime <= endTime) {
        this.drawSegment(segment, timelineStart, timelineEnd, timeRange, currentTime);
      }
    });

    // Draw buffered ranges
    this.drawBufferedRanges(timelineStart, timelineEnd, timeRange);

    // Draw playhead
    this.drawPlayhead(currentTime, timelineStart, timelineEnd, timeRange);
  }

  drawTimeMarkers(start, end, range) {
    const markerContainer = document.createElement('div');
    markerContainer.className = 'timeline-markers';
    
    const numMarkers = 10;
    for (let i = 0; i <= numMarkers; i++) {
      const time = start + (range * i / numMarkers);
      const marker = document.createElement('div');
      marker.className = 'timeline-marker';
      marker.style.left = (i / numMarkers * 100) + '%';
      marker.textContent = time.toFixed(1) + 's';
      markerContainer.appendChild(marker);
    }
    
    this.timelineEl.appendChild(markerContainer);
  }

  drawSegment(segment, start, end, range, currentTime) {
    const segmentEl = document.createElement('div');
    segmentEl.className = 'timeline-segment';
    
    const left = ((segment.startTime - start) / range) * 100;
    const width = ((segment.endTime - segment.startTime) / range) * 100;
    
    segmentEl.style.left = Math.max(0, left) + '%';
    segmentEl.style.width = Math.min(100 - left, width) + '%';
    
    // Color based on bitrate or position
    if (segment.startTime <= currentTime && segment.endTime >= currentTime) {
      segmentEl.classList.add('current-segment');
    }
    
    // Enhanced tooltip
    const bitrateText = segment.bitrate > 0 ? `, Bitrate: ${this.formatBitrate(segment.bitrate)}` : '';
    const sizeText = segment.size > 0 ? `, Size: ${this.formatSize(segment.size)}` : '';
    segmentEl.title = `Segment #${segment.index + 1}\nStart: ${segment.startTime.toFixed(2)}s\nDuration: ${segment.duration.toFixed(2)}s${bitrateText}${sizeText}`;
    
    // Add hover and click handlers
    segmentEl.addEventListener('mouseenter', () => {
      this.showSegmentInfo(segment);
      segmentEl.classList.add('hovered-segment');
    });
    
    segmentEl.addEventListener('mouseleave', () => {
      segmentEl.classList.remove('hovered-segment');
      if (this.selectedSegment !== segment) {
        this.hideSegmentInfo();
      }
    });
    
    segmentEl.addEventListener('click', () => {
      this.selectedSegment = segment;
      this.showSegmentInfo(segment);
      // Remove selected class from all segments
      this.timelineEl.querySelectorAll('.timeline-segment').forEach(el => {
        el.classList.remove('selected-segment');
      });
      segmentEl.classList.add('selected-segment');
    });
    
    this.timelineEl.appendChild(segmentEl);
  }
  
  showSegmentInfo(segment) {
    if (!this.segmentInfoPanel) return;
    
    if (this.segmentInfoIndex) {
      this.segmentInfoIndex.textContent = `#${segment.index + 1}`;
    }
    if (this.segmentInfoStart) {
      this.segmentInfoStart.textContent = `${segment.startTime.toFixed(2)}s`;
    }
    if (this.segmentInfoDuration) {
      this.segmentInfoDuration.textContent = `${segment.duration.toFixed(2)}s`;
    }
    if (this.segmentInfoBitrate) {
      this.segmentInfoBitrate.textContent = segment.bitrate > 0 
        ? this.formatBitrate(segment.bitrate) 
        : 'N/A';
    }
    if (this.segmentInfoSize) {
      this.segmentInfoSize.textContent = segment.size > 0 
        ? this.formatSize(segment.size) 
        : 'N/A';
    }
    if (this.segmentInfoUrl) {
      // Show shortened URL
      const url = segment.url || '-';
      const shortUrl = url.length > 60 ? url.substring(0, 60) + '...' : url;
      this.segmentInfoUrl.textContent = shortUrl;
      this.segmentInfoUrl.title = url; // Full URL in tooltip
    }
    
    this.segmentInfoPanel.style.display = 'block';
  }
  
  hideSegmentInfo() {
    if (this.segmentInfoPanel && !this.selectedSegment) {
      this.segmentInfoPanel.style.display = 'none';
    }
  }
  
  formatBitrate(bitrate) {
    if (bitrate >= 1000000) {
      return (bitrate / 1000000).toFixed(2) + ' Mbps';
    } else if (bitrate >= 1000) {
      return (bitrate / 1000).toFixed(2) + ' Kbps';
    }
    return bitrate + ' bps';
  }
  
  formatSize(size) {
    if (size >= 1048576) {
      return (size / 1048576).toFixed(2) + ' MB';
    } else if (size >= 1024) {
      return (size / 1024).toFixed(2) + ' KB';
    }
    return size + ' B';
  }

  drawBufferedRanges(start, end, range) {
    if (!this.video.buffered || this.video.buffered.length === 0) {
      return;
    }

    const bufferContainer = document.createElement('div');
    bufferContainer.className = 'timeline-buffer';

    for (let i = 0; i < this.video.buffered.length; i++) {
      const bufferStart = this.video.buffered.start(i);
      const bufferEnd = this.video.buffered.end(i);

      if (bufferEnd >= start && bufferStart <= end) {
        const bufferEl = document.createElement('div');
        bufferEl.className = 'timeline-buffer-range';
        
        const left = Math.max(0, ((bufferStart - start) / range) * 100);
        const right = Math.min(100, ((bufferEnd - start) / range) * 100);
        const width = right - left;
        
        bufferEl.style.left = left + '%';
        bufferEl.style.width = width + '%';
        
        bufferContainer.appendChild(bufferEl);
      }
    }

    this.timelineEl.appendChild(bufferContainer);
  }

  drawPlayhead(currentTime, start, end, range) {
    if (currentTime < start || currentTime > end) {
      return;
    }

    const playhead = document.createElement('div');
    playhead.className = 'timeline-playhead';
    const position = ((currentTime - start) / range) * 100;
    playhead.style.left = position + '%';
    this.timelineEl.appendChild(playhead);
  }

  start() {
    this.stop();
    this.updateInterval = setInterval(() => {
      this.extractSegmentsFromRequests();
      this.update();
    }, 100);
    this.update();
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Extract segment timing from network requests
  extractSegmentsFromRequests() {
    if (!this.networkMonitor || !this.networkMonitor.allRequests) {
      return;
    }

    const segmentRequests = this.networkMonitor.allRequests.filter(
      r => r.type === 'segment'
    );

    // Group segments by URL pattern and estimate timing
    const video = this.video;
    if (!video || !video.buffered || video.buffered.length === 0) {
      return;
    }

    // Use buffered ranges to estimate segment positions
    // This is a simplified approach - in a real implementation,
    // you'd parse the manifest to get exact segment timing
    segmentRequests.forEach((request, index) => {
      // Estimate segment position based on buffered ranges
      let estimatedStart = 0;
      if (video.buffered.length > 0) {
        // Distribute segments across buffered ranges
        const totalBuffered = Array.from({ length: video.buffered.length }, (_, i) => 
          video.buffered.end(i) - video.buffered.start(i)
        ).reduce((a, b) => a + b, 0);
        
        if (totalBuffered > 0) {
          const segmentRatio = index / Math.max(1, segmentRequests.length);
          estimatedStart = segmentRatio * totalBuffered;
        }
      }

      // Estimate duration (typical segment duration is 2-10 seconds)
      const estimatedDuration = 6; // Default 6 seconds

      // Check if segment already exists
      const exists = this.segments.some(s => s.url === request.url);
      if (!exists) {
        this.addSegment(
          request.url, 
          estimatedStart, 
          estimatedDuration, 
          request.bitrate,
          request.size,
          this.segments.length
        );
      }
    });
  }
  
  reset() {
    this.segments = [];
    this.selectedSegment = null;
    if (this.segmentInfoPanel) {
      this.segmentInfoPanel.style.display = 'none';
    }
    this.update();
  }
}
