const audio = document.getElementById("background-audio");
const volumeControl = document.getElementById("volume");
const currentTimeDisplay = document.getElementById("current-time");
const totalTimeDisplay = document.getElementById("total-time");
const playPauseButton = document.getElementById("play-pause-button");
const prevButton = document.getElementById("play-pause-button");
const nextButton = document.getElementById("play-pause-button");

const playlist = [
  "assets/audio/end-up-gone.mp3", // Track 1
  "assets/audio/magic-johnson.mp3", // Track 2
  "assets/audio/never-stop.mp3",
];

let currentTrackIndex = 0;

// Set initial volume based on slider value
audio.volume = volumeControl.value;

// Function to format time in minutes:seconds
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

// Function to play audio
function playAudio() {
  audio.play().catch((error) => {
    console.log("Playback prevented:", error);
  });
  updateTotalTime();
  startTimeUpdate(); // Start updating time display
  playPauseButton.src = "assets/images/playpause.png"; // Update button image to pause
}

function pauseAudio() {
  audio.pause();
  playPauseButton.src = "assets/images/playpause.png";
}

function handlePlayPause() {
  if (audio.paused) {
    playAudio();
  } else {
    pauseAudio();
  }
}

// Function to handle volume change
function handleVolumeChange(event) {
  audio.volume = event.target.value;
}

// Function to update the total time display
function updateTotalTime() {
  audio.addEventListener("loadedmetadata", () => {
    totalTimeDisplay.textContent = formatTime(audio.duration);
  });
}

// Function to start updating current time
function startTimeUpdate() {
  setInterval(() => {
    if (!audio.paused) {
      currentTimeDisplay.textContent = formatTime(audio.currentTime);
    }
  }, 1000); // Update every second
}

function loadTrack(index) {
  currentTrackIndex = index;
  audio.src = playlist[currentTrackIndex];
  audio.load();
  playAudio();
}

function playNext() {
  currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
  loadTrack(currentTrackIndex);
}

function playPrevious() {
  currentTrackIndex =
    (currentTrackIndex - 1 + playlist.length) % playlist.length;
  loadTrack(currentTrackIndex);
}

// Add event listener to the volume control
volumeControl.addEventListener("input", handleVolumeChange);

// Add event listeners to the play/pause, previous and next buttons
playPauseButton.addEventListener("click", handlePlayPause);
prevButton.addEventListener("click", playPrevious);
nextButton.addEventListener("click", playNext);

// Add event listener to the document to play audio on any click
document.addEventListener("click", playAudio);
