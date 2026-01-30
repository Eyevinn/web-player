export class NetworkAnalysis {
  constructor(player = null) {
    this.player = player;

    // Element references for variant info (pills)
    this.bandwidthsContainer = document.getElementById('na-bandwidths');
    this.resolutionsContainer = document.getElementById('na-resolutions');
    this.codecsContainer = document.getElementById('na-codecs');
    this.audioCodecsContainer = document.getElementById('na-audiocodecs');
    this.qualityLevelsContainer = document.getElementById('na-quality-levels');
    this.audioTracksContainer = document.getElementById('na-audiotracks');
    this.subtitlesContainer = document.getElementById('na-subtitles');
  }

  updateVariantInfo(video, player) {
    if (!video) return;

    const playerInstance = player || this.player;

    if (!playerInstance) return;

    try {
      // Only render Quality Levels (codecSet per level) under Tracks
      if (
        playerInstance.tech &&
        playerInstance.tech.hls &&
        playerInstance.tech.hls.levels
      ) {
        const levelsAll = playerInstance.tech.hls.levels || [];
        if (this.qualityLevelsContainer) {
          this.qualityLevelsContainer.innerHTML = '';
          levelsAll.forEach((lvl, idx) => {
            const heightPart = lvl && lvl.height ? `${lvl.height}p` : '';
            const kbPart =
              lvl && lvl.bitrate ? `${Math.round(lvl.bitrate / 1000)}kb` : '';
            const codecSetStr =
              lvl && lvl.codecs
                ? lvl.codecs
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .join(',')
                : '';
            const partsLabel = [heightPart, kbPart, codecSetStr]
              .filter(Boolean)
              .join(' / ');
            const label = partsLabel || `level ${idx}`;
            const isActive =
              playerInstance.currentLevel &&
              playerInstance.currentLevel.id === idx;
            const el = document.createElement('span');
            el.className = 'na-pill' + (isActive ? ' active' : '');
            el.textContent = label;
            this.qualityLevelsContainer.appendChild(el);
          });
        }
        // Render available audio tracks (from HLS) and mark selected
        try {
          const hls = playerInstance.tech.hls;
          if (
            this.audioTracksContainer &&
            hls &&
            Array.isArray(hls.audioTracks)
          ) {
            this.audioTracksContainer.innerHTML = '';
            const currentAudio =
              hls.audioTrack !== undefined && hls.audioTrack !== null
                ? String(hls.audioTrack)
                : null;
            hls.audioTracks.forEach((at) => {
              const id = String(at.id);
              const lang = at.lang ? String(at.lang).trim() : '';
              const name = at.name ? String(at.name).trim() : '';
              let label = '';
              if (lang && name) label = `${lang} / ${name}`;
              else if (name) label = name;
              else if (lang) label = lang;
              else label = `Track ${id}`;
              const isActive = currentAudio === id;
              const pill = document.createElement('span');
              pill.className = 'na-pill' + (isActive ? ' active' : '');
              pill.textContent = label;
              this.audioTracksContainer.appendChild(pill);
            });
          }
        } catch (e) {
          // ignore
        }
        // Subtitle tracks - prefer HLS subtitleTracks, fallback to video.textTracks
        try {
          const hls = playerInstance.tech.hls;
          let subtitles = null;
          let currentSubtitle = null;
          if (hls && Array.isArray(hls.subtitleTracks)) {
            subtitles = hls.subtitleTracks;
            currentSubtitle =
              hls.subtitleTrack !== undefined
                ? String(hls.subtitleTrack)
                : null;
          } else if (video && video.textTracks) {
            subtitles = Array.from(video.textTracks);
            // find first showing track
            const showing = subtitles.findIndex((t) => t.mode === 'showing');
            currentSubtitle = showing >= 0 ? String(showing) : null;
          }
          if (this.subtitlesContainer && Array.isArray(subtitles)) {
            this.subtitlesContainer.innerHTML = '';
            subtitles.forEach((st, index) => {
              // HLS subtitle track objects may have id/name/lang similar to audioTracks
              const id = st.id !== undefined ? String(st.id) : String(index);
              const lang = st.lang ? String(st.lang).trim() : '';
              const name = st.name ? String(st.name).trim() : '';
              let label = '';
              if (lang && name) label = `${lang} / ${name}`;
              else if (name) label = name;
              else if (lang) label = lang;
              else label = `Sub ${id}`;
              const isActive =
                currentSubtitle === id || currentSubtitle === String(index);
              const pill = document.createElement('span');
              pill.className = 'na-pill' + (isActive ? ' active' : '');
              pill.textContent = label;
              this.subtitlesContainer.appendChild(pill);
            });
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // Silently fail
    }
  }

  reset() {
    // Reset variant info
    if (this.bandwidthsContainer) this.bandwidthsContainer.innerHTML = '';
    if (this.resolutionsContainer) this.resolutionsContainer.innerHTML = '';
    if (this.codecsContainer) this.codecsContainer.innerHTML = '';
    if (this.audioCodecsContainer) this.audioCodecsContainer.innerHTML = '';
    if (this.qualityLevelsContainer) this.qualityLevelsContainer.innerHTML = '';
    if (this.audioTracksContainer) this.audioTracksContainer.innerHTML = '';
    if (this.subtitlesContainer) this.subtitlesContainer.innerHTML = '';
  }
}
