const audio = document.getElementById("background-audio");
const currentTimeDisplay = document.getElementById("current-time");
const totalTimeDisplay = document.getElementById("total-time");
const playPauseButton = document.getElementById("play-pause-button");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const progressBar = document.getElementById("progress-bar");

const playlist = [
  "assets/audio/end-up-gone.mp3",
  "assets/audio/magic-johnson.mp3",
  "assets/audio/never-stop.mp3",
];

let currentTrackIndex = 0;

// Set initial volume to a specific value (e.g., 0.5)
audio.volume = 0.5;

// Display play button on startup
playPauseButton.src = "assets/images/play.png";

// Function to format time in minutes:seconds
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

// Function to play audio
function playAudio() {
  audio
    .play()
    .then(() => {
      console.log("Audio is playing");
    })
    .catch((error) => {
      console.log("Playback prevented:", error);
    });
  playPauseButton.src = "assets/images/pause.png"; // Update button image to pause
}

// Function to pause audio
function pauseAudio() {
  audio.pause();
  playPauseButton.src = "assets/images/play.png"; // Update button image to play
}

// Function to handle play/pause
function handlePlayPause() {
  if (audio.paused) {
    playAudio();
  } else {
    pauseAudio();
  }
}

// Function to update the total time display
function updateTotalTime() {
  totalTimeDisplay.textContent = formatTime(audio.duration);
}

// Function to update the progress bar as the audio plays
function updateProgressBar() {
  const progress = (audio.currentTime / audio.duration) * 100;
  progressBar.value = progress || 0; // Set to 0 if NaN (e.g., before metadata loads)
  currentTimeDisplay.textContent = formatTime(audio.currentTime);

  // Check if the current time is equal to the total duration
  if (audio.currentTime >= audio.duration) {
    playNext(); // Play the next track if the current track ends
  }
}

// Function to seek within the audio when clicking on the progress bar
function seekAudio(event) {
  const clickPosition = event.offsetX / progressBar.offsetWidth;
  audio.currentTime = clickPosition * audio.duration;
}

// Function to load a specific track
function loadTrack(index) {
  currentTrackIndex = index;
  audio.src = playlist[currentTrackIndex];
  audio.load();

  // Reset current time display and total time display
  audio.addEventListener("loadedmetadata", () => {
    updateTotalTime();
    currentTimeDisplay.textContent = "0:00"; // Reset current time display
  });
}

// Function to play the next track
function playNext() {
  console.log("Playing next track...");
  currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
  loadTrack(currentTrackIndex);
  playAudio();
}

// Function to play the previous track
function playPrevious() {
  currentTrackIndex =
    (currentTrackIndex - 1 + playlist.length) % playlist.length;
  loadTrack(currentTrackIndex);
  playAudio();
}

// Event listeners for play/pause, previous, and next buttons
playPauseButton.addEventListener("click", handlePlayPause);
prevButton.addEventListener("click", playPrevious);
nextButton.addEventListener("click", playNext);

// Event listener to update progress bar as the audio plays
audio.addEventListener("timeupdate", updateProgressBar);

// Event listener to seek audio when clicking on the progress bar
progressBar.addEventListener("click", seekAudio);

// Start the first track when the page loads
loadTrack(currentTrackIndex);
