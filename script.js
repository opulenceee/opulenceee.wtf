class AudioPlayer {
  constructor(config) {
    this.audio = document.getElementById("background-audio");
    this.currentTimeDisplay = document.getElementById("current-time");
    this.totalTimeDisplay = document.getElementById("total-time");
    this.playPauseButton = document.getElementById("play-pause-button");
    this.prevButton = document.getElementById("prev-button");
    this.nextButton = document.getElementById("next-button");
    this.progressBar = document.getElementById("progress-bar");
    this.volumeSlider = document.getElementById("volume-slider");

    this.playlist = config.playlist;
    this.currentTrackIndex = 0;

    this.initializePlayer();
    this.setupEventListeners();
  }

  initializePlayer() {
    // Set initial volume
    this.audio.volume = CONFIG.defaultVolume;
    this.volumeSlider.value = CONFIG.defaultVolume * 100;

    // Set initial button state
    this.updatePlayPauseButton();

    // Load first track
    this.loadTrack(this.currentTrackIndex);
  }

  setupEventListeners() {
    // Playback controls
    this.playPauseButton.addEventListener("click", () =>
      this.handlePlayPause()
    );
    this.prevButton.addEventListener("click", () => this.playPrevious());
    this.nextButton.addEventListener("click", () => this.playNext());

    // Progress bar
    this.progressBar.addEventListener("click", (e) => this.seekAudio(e));
    this.audio.addEventListener("timeupdate", () => this.updateProgressBar());

    // Volume control
    this.volumeSlider.addEventListener("input", (e) => {
      this.audio.volume = e.target.value / 100;
    });

    // Keyboard controls
    document.addEventListener("keydown", (e) => this.handleKeyboard(e));

    // Track ended
    this.audio.addEventListener("ended", () => this.playNext());

    // Error handling
    this.audio.addEventListener("error", (e) => this.handleError(e));

    // Metadata loaded
    this.audio.addEventListener("loadedmetadata", () => {
      this.updateTotalTime();
    });
  }

  handleKeyboard(event) {
    switch (event.code) {
      case "Space":
        event.preventDefault();
        this.handlePlayPause();
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.playPrevious();
        break;
      case "ArrowRight":
        event.preventDefault();
        this.playNext();
        break;
      case "ArrowUp":
        event.preventDefault();
        this.adjustVolume(0.1);
        break;
      case "ArrowDown":
        event.preventDefault();
        this.adjustVolume(-0.1);
        break;
    }
  }

  adjustVolume(delta) {
    const newVolume = Math.max(0, Math.min(1, this.audio.volume + delta));
    this.audio.volume = newVolume;
    this.volumeSlider.value = newVolume * 100;
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  updatePlayPauseButton() {
    const img = this.playPauseButton.querySelector("img");
    img.src = this.audio.paused
      ? "assets/images/play.png"
      : "assets/images/pause.png";
  }

  handlePlayPause() {
    if (this.audio.paused) {
      this.audio.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    } else {
      this.audio.pause();
    }
    this.updatePlayPauseButton();
  }

  loadTrack(index) {
    this.currentTrackIndex = index;
    this.audio.src = this.playlist[index].url;
    this.audio.load();

    // Reset displays
    this.currentTimeDisplay.textContent = "0:00";
    this.progressBar.value = 0;

    // Update button state
    this.updatePlayPauseButton();
  }

  playNext() {
    this.currentTrackIndex =
      (this.currentTrackIndex + 1) % this.playlist.length;
    this.loadTrack(this.currentTrackIndex);
    this.audio.play().catch((error) => {
      console.error("Error playing next track:", error);
    });
  }

  playPrevious() {
    this.currentTrackIndex =
      (this.currentTrackIndex - 1 + this.playlist.length) %
      this.playlist.length;
    this.loadTrack(this.currentTrackIndex);
    this.audio.play().catch((error) => {
      console.error("Error playing previous track:", error);
    });
  }

  seekAudio(event) {
    const clickPosition = event.offsetX / this.progressBar.offsetWidth;
    const newTime = clickPosition * this.audio.duration;
    if (!isNaN(newTime)) {
      this.audio.currentTime = newTime;
      this.updateProgressBar();
    }
  }

  updateProgressBar() {
    if (!isNaN(this.audio.duration)) {
      const progress = (this.audio.currentTime / this.audio.duration) * 100;
      this.progressBar.value = progress;
      this.currentTimeDisplay.textContent = this.formatTime(
        this.audio.currentTime
      );
    }
  }

  updateTotalTime() {
    if (!isNaN(this.audio.duration)) {
      this.totalTimeDisplay.textContent = this.formatTime(this.audio.duration);
    }
  }

  handleError(error) {
    console.error("Audio error:", error);
    // Optionally add user-facing error handling here
  }
}

// Initialize the audio player when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const player = new AudioPlayer(CONFIG);
});
