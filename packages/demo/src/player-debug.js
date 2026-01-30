// Network state mapping
const networkStates = {
  0: 'NETWORK_EMPTY',
  1: 'NETWORK_IDLE',
  2: 'NETWORK_LOADING',
  3: 'NETWORK_NO_SOURCE',
};

// Ready state mapping
const readyStates = {
  0: 'HAVE_NOTHING',
  1: 'HAVE_METADATA',
  2: 'HAVE_CURRENT_DATA',
  3: 'HAVE_FUTURE_DATA',
  4: 'HAVE_ENOUGH_DATA',
};

export class PlayerDebug {
  constructor(video, playerDebugSection, player = null) {
    this.video = video;
    this.player = player;
    this.playerDebugSection = playerDebugSection;
    this.updateInterval = null;
    this.stallCount = 0;
    this.lastFrameCount = 0;
    this.lastFpsCheck = Date.now();

    // Track stalls
    this.video.addEventListener('stalled', () => {
      this.stallCount++;
    });
    this.video.addEventListener('waiting', () => {
      this.stallCount++;
    });
  }

  getBufferAhead() {
    const buffered = this.video.buffered;
    const currentTime = this.video.currentTime || 0;

    if (!buffered || buffered.length === 0) {
      return 0;
    }

    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && buffered.end(i) >= currentTime) {
        return buffered.end(i) - currentTime;
      }
    }
    return 0;
  }

  updateBufferVisualization() {
    const bufferBar = document.getElementById('bufferBar');
    if (!bufferBar) return;

    const duration = this.video.duration;
    const currentTime = this.video.currentTime || 0;

    if (!isFinite(duration) || duration === 0) {
      bufferBar.innerHTML = '';
      return;
    }

    bufferBar.innerHTML = '';

    // Draw buffered segments
    if (this.video.buffered && this.video.buffered.length > 0) {
      for (let i = 0; i < this.video.buffered.length; i++) {
        const start = this.video.buffered.start(i);
        const end = this.video.buffered.end(i);

        const segment = document.createElement('div');
        segment.className = 'buffer-segment';
        segment.style.left = (start / duration) * 100 + '%';
        segment.style.width = ((end - start) / duration) * 100 + '%';
        bufferBar.appendChild(segment);
      }
    }

    // Draw playhead
    const playhead = document.createElement('div');
    playhead.className = 'playhead';
    playhead.style.left = (currentTime / duration) * 100 + '%';
    bufferBar.appendChild(playhead);
  }

  updateStreamingInfo() {
    if (!this.playerDebugSection) {
      return;
    }

    // Playback state
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const pausedEl = document.getElementById('paused');
    const endedEl = document.getElementById('ended');
    const playbackRateEl = document.getElementById('playbackRate');
    const volumeEl = document.getElementById('volume');

    if (currentTimeEl)
      currentTimeEl.textContent = this.video.currentTime
        ? this.video.currentTime.toFixed(2) + 's'
        : '0.00s';
    if (durationEl)
      durationEl.textContent = isFinite(this.video.duration)
        ? this.video.duration.toFixed(2) + 's'
        : '-';
    if (pausedEl)
      pausedEl.textContent =
        this.video.paused !== undefined ? this.video.paused : 'true';
    if (endedEl)
      endedEl.textContent =
        this.video.ended !== undefined ? this.video.ended : 'false';
    if (playbackRateEl)
      playbackRateEl.textContent = this.video.playbackRate
        ? this.video.playbackRate.toFixed(2)
        : '1.0';
    if (volumeEl)
      volumeEl.textContent =
        this.video.volume !== undefined ? this.video.volume.toFixed(2) : '1.0';

    // Network state
    const networkStateEl = document.getElementById('networkState');
    const readyStateEl = document.getElementById('readyState');
    const seekingEl = document.getElementById('seeking');
    const errorEl = document.getElementById('error');

    if (networkStateEl)
      networkStateEl.textContent =
        this.video.networkState !== undefined
          ? networkStates[this.video.networkState] || '-'
          : '-';
    if (readyStateEl)
      readyStateEl.textContent =
        this.video.readyState !== undefined
          ? readyStates[this.video.readyState] || '-'
          : '-';
    if (seekingEl)
      seekingEl.textContent =
        this.video.seeking !== undefined ? this.video.seeking : 'false';
    if (errorEl)
      errorEl.textContent = this.video.error
        ? `${this.video.error.code}: ${this.video.error.message}`
        : 'none';

    // Video quality
    const resolutionEl = document.getElementById('resolution');
    if (resolutionEl) {
      resolutionEl.textContent =
        this.video.videoWidth && this.video.videoHeight
          ? `${this.video.videoWidth}x${this.video.videoHeight}`
          : '-';
    }

    // Get playback quality metrics
    if (this.video.getVideoPlaybackQuality) {
      const quality = this.video.getVideoPlaybackQuality();
      const totalFrames = quality.totalVideoFrames || 0;
      const droppedFrames = quality.droppedVideoFrames || 0;
      const corruptedFrames = quality.corruptedVideoFrames || 0;
      const dropRate =
        totalFrames > 0 ? (droppedFrames / totalFrames) * 100 : 0;

      const totalFramesEl = document.getElementById('totalFrames');
      const droppedFramesEl = document.getElementById('droppedFrames');
      const corruptedFramesEl = document.getElementById('corruptedFrames');
      const dropRateEl = document.getElementById('dropRate');
      const totalVideoFramesEl = document.getElementById('totalVideoFrames');
      const fpsEl = document.getElementById('fps');
      const creationTimeEl = document.getElementById('creationTime');

      if (totalFramesEl) totalFramesEl.textContent = totalFrames;
      if (droppedFramesEl) {
        droppedFramesEl.textContent = droppedFrames;
        droppedFramesEl.className =
          'metric-value ' + (droppedFrames > 0 ? 'warning' : 'good');
      }
      if (corruptedFramesEl) corruptedFramesEl.textContent = corruptedFrames;
      if (dropRateEl) {
        dropRateEl.textContent = dropRate.toFixed(2) + '%';
        dropRateEl.className =
          'metric-value ' + (dropRate > 1 ? 'warning' : 'good');
      }
      if (totalVideoFramesEl) totalVideoFramesEl.textContent = totalFrames;

      // Calculate FPS
      const now = Date.now();
      const timeDiff = (now - this.lastFpsCheck) / 1000;
      if (timeDiff >= 1 && fpsEl) {
        const frameDiff = totalFrames - this.lastFrameCount;
        const fps = Math.round(frameDiff / timeDiff);
        fpsEl.textContent = fps;
        this.lastFrameCount = totalFrames;
        this.lastFpsCheck = now;
      }

      // Creation time
      if (creationTimeEl && quality.creationTime) {
        creationTimeEl.textContent =
          (quality.creationTime / 1000).toFixed(2) + 's';
      }
    }

    // Buffer info
    const bufferRangesEl = document.getElementById('bufferRanges');
    const bufferAheadEl = document.getElementById('bufferAhead');
    const seekableRangesEl = document.getElementById('seekableRanges');
    const playedRangesEl = document.getElementById('playedRanges');

    if (bufferRangesEl)
      bufferRangesEl.textContent = this.video.buffered
        ? this.video.buffered.length
        : 0;
    const bufferAhead = this.getBufferAhead();
    if (bufferAheadEl) {
      bufferAheadEl.textContent = bufferAhead.toFixed(2) + 's';
      bufferAheadEl.className =
        'metric-value ' + (bufferAhead < 2 ? 'warning' : 'good');
    }
    if (seekableRangesEl)
      seekableRangesEl.textContent = this.video.seekable
        ? this.video.seekable.length
        : 0;
    if (playedRangesEl)
      playedRangesEl.textContent = this.video.played
        ? this.video.played.length
        : 0;

    // Update buffer visualization
    this.updateBufferVisualization();

    // Media info
    const sourceUrlEl = document.getElementById('sourceUrl');
    const canPlayTypeEl = document.getElementById('canPlayType');
    const videoTracksEl = document.getElementById('videoTracks');
    const audioTracksEl = document.getElementById('audioTracks');
    const subtitleTracksEl = document.getElementById('subtitleTracks');

    console.log('this.video', this.video);

    if (sourceUrlEl) {
      const manifestUrl =
        this.player && this.player.currentSrc
          ? this.player.currentSrc
          : this.video.currentSrc;
      sourceUrlEl.textContent = manifestUrl || '-';
    }
    if (canPlayTypeEl)
      canPlayTypeEl.textContent =
        this.video.canPlayType('application/vnd.apple.mpegurl') || 'unknown';
    if (videoTracksEl) {
      const videoTrackCount =
        this.player && typeof this.player.getVideoLevels === 'function'
          ? this.player.getVideoLevels().length
          : this.video.videoTracks
          ? this.video.videoTracks.length
          : 0;
      videoTracksEl.textContent = videoTrackCount;
    }
    if (audioTracksEl) {
      const audioTrackCount =
        this.player && this.player.tech && this.player.tech.audioTracks
          ? this.player.tech.audioTracks.length
          : this.video.audioTracks
          ? this.video.audioTracks.length
          : 0;
      audioTracksEl.textContent = audioTrackCount;
    }
    if (subtitleTracksEl) {
      const subtitleTrackCount =
        this.player && this.player.tech && this.player.tech.textTracks
          ? this.player.tech.textTracks.length
          : this.video.textTracks
            ? Array.from(this.video.textTracks).filter(
                (track) => track.kind !== 'metadata'
              ).length
            : 0;
      subtitleTracksEl.textContent = subtitleTrackCount;
    }

    // Performance
    const stallCountEl = document.getElementById('stallCount');
    if (stallCountEl) stallCountEl.textContent = this.stallCount;
  }

  start() {
    this.stop();
    this.stallCount = 0;
    this.lastFrameCount = 0;
    this.lastFpsCheck = Date.now();
    if (this.playerDebugSection) {
      this.playerDebugSection.style.display = 'block';
    }
    this.updateInterval = setInterval(() => this.updateStreamingInfo(), 100);
    this.updateStreamingInfo(); // Initial update
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  reset() {
    this.stallCount = 0;
    this.lastFrameCount = 0;
    this.lastFpsCheck = Date.now();
  }
}
