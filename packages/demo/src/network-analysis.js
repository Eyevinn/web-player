export class NetworkAnalysis {
  constructor() {
    this.networkRequests = [];
    this.manifestData = null;
    this.lastVariantUrl = null;
    this.bitrateSwitch = 0;
    this.startTime = Date.now();
    
    // Element references
    this.totalRequestsEl = document.getElementById('na-totalRequests');
    this.manifestRequestsEl = document.getElementById('na-manifestRequests');
    this.segmentRequestsEl = document.getElementById('na-segmentRequests');
    this.failedRequestsEl = document.getElementById('na-failedRequests');
    this.avgSegmentTimeEl = document.getElementById('na-avgSegmentTime');
    this.totalDataEl = document.getElementById('na-totalData');
    this.activeBandwidthEl = document.getElementById('na-activeBandwidth');
    this.activeResolutionEl = document.getElementById('na-activeResolution');
    this.activeCodecEl = document.getElementById('na-activeCodec');
    this.bitrateSwitchEl = document.getElementById('na-bitrateSwitch');
    this.lastSegmentEl = document.getElementById('na-lastSegment');
  }

  addRequest(request) {
    this.networkRequests.push(request);
    
    // Determine request type
    let requestType = 'other';
    if (request.url.includes('.m3u8')) {
      requestType = 'manifest';
      
      // Parse manifest if we got the response
      if (request.responseText) {
        this.parseManifest(request.url, request.responseText);
      }
    } else if (request.url.includes('.ts') || request.url.includes('.m4s') || 
               request.url.includes('.mp4') || request.url.match(/\/[0-9]+\.m4[sv]$/)) {
      requestType = 'segment';
      
      // Track variant changes
      const variantUrl = this.extractVariantFromSegmentUrl(request.url);
      if (variantUrl && variantUrl !== this.lastVariantUrl) {
        this.lastVariantUrl = variantUrl;
        this.bitrateSwitch++;
      }
    }
    
    request.type = requestType;
    this.updateStatistics();
  }

  extractVariantFromSegmentUrl(url) {
    // Try to extract the variant path (everything before the segment name)
    const match = url.match(/(.+)\/[^\/]+\.(ts|m4s)$/);
    return match ? match[1] : null;
  }

  parseManifest(url, content) {
    const lines = content.split('\n');
    const variants = [];
    let currentVariant = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        // Parse variant info
        currentVariant = { url: url };

        const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
        if (bandwidthMatch) currentVariant.bandwidth = parseInt(bandwidthMatch[1]);

        const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/);
        if (resolutionMatch) currentVariant.resolution = resolutionMatch[1];

        const codecsMatch = line.match(/CODECS="([^"]+)"/);
        if (codecsMatch) currentVariant.codecs = codecsMatch[1];

        const frameRateMatch = line.match(/FRAME-RATE=([\d.]+)/);
        if (frameRateMatch) currentVariant.frameRate = parseFloat(frameRateMatch[1]);

        // Next line should be the variant URL
        if (i + 1 < lines.length && !lines[i + 1].startsWith('#')) {
          currentVariant.playlistUrl = lines[i + 1].trim();
          variants.push(currentVariant);
        }
      }
    }

    if (variants.length > 0) {
      this.manifestData = {
        url: url,
        variants: variants,
        parsed: new Date().toISOString()
      };

      // Update current variant info (assume highest bitrate initially)
      const topVariant = variants.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))[0];
      if (topVariant) {
        if (this.activeBandwidthEl) {
          this.activeBandwidthEl.textContent = 
            topVariant.bandwidth ? (topVariant.bandwidth / 1000).toFixed(0) + ' kbps' : '-';
        }
        if (this.activeResolutionEl) {
          this.activeResolutionEl.textContent = topVariant.resolution || '-';
        }
        if (this.activeCodecEl) {
          this.activeCodecEl.textContent = topVariant.codecs || '-';
        }
      }
    }
  }

  updateStatistics() {
    const total = this.networkRequests.length;
    const manifests = this.networkRequests.filter(r => r.type === 'manifest').length;
    const segments = this.networkRequests.filter(r => r.type === 'segment').length;
    const failed = this.networkRequests.filter(r => r.status >= 400 || r.status === 0).length;

    const segmentRequests = this.networkRequests.filter(r => r.type === 'segment');
    const avgTime = segmentRequests.length > 0
      ? segmentRequests.reduce((sum, r) => sum + (r.duration || 0), 0) / segmentRequests.length
      : 0;

    const totalBytes = this.networkRequests.reduce((sum, r) => sum + (r.size || 0), 0);

    if (this.totalRequestsEl) this.totalRequestsEl.textContent = total;
    if (this.manifestRequestsEl) this.manifestRequestsEl.textContent = manifests;
    if (this.segmentRequestsEl) this.segmentRequestsEl.textContent = segments;
    
    if (this.failedRequestsEl) {
      this.failedRequestsEl.textContent = failed;
      this.failedRequestsEl.className = 'metric-value ' + (failed > 0 ? 'error' : 'good');
    }
    
    if (this.avgSegmentTimeEl) {
      this.avgSegmentTimeEl.textContent = Math.round(avgTime) + 'ms';
    }
    if (this.totalDataEl) {
      this.totalDataEl.textContent = this.formatBytes(totalBytes);
    }
    if (this.bitrateSwitchEl) {
      this.bitrateSwitchEl.textContent = this.bitrateSwitch;
    }

    if (segmentRequests.length > 0) {
      const lastSeg = segmentRequests[segmentRequests.length - 1];
      const shortUrl = lastSeg.url.split('/').pop();
      if (this.lastSegmentEl) {
        this.lastSegmentEl.textContent = shortUrl;
      }
    }
  }

  reset() {
    this.networkRequests = [];
    this.manifestData = null;
    this.lastVariantUrl = null;
    this.bitrateSwitch = 0;
    this.startTime = Date.now();
    this.updateStatistics();
    
    // Reset variant info
    if (this.activeBandwidthEl) this.activeBandwidthEl.textContent = '-';
    if (this.activeResolutionEl) this.activeResolutionEl.textContent = '-';
    if (this.activeCodecEl) this.activeCodecEl.textContent = '-';
    if (this.lastSegmentEl) this.lastSegmentEl.textContent = '-';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
