const audio = document.getElementById("background-audio");
const volumeControl = document.getElementById("volume");
const currentTimeDisplay = document.getElementById("current-time");
const totalTimeDisplay = document.getElementById("total-time");

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
  if (audio.paused) {
    audio.play().catch((error) => {
      console.log("Playback prevented:", error);
    });
    updateTotalTime();
    startTimeUpdate(); // Start updating time display
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

// Add event listener to the volume control
volumeControl.addEventListener("input", handleVolumeChange);

// Add event listener to the document to play audio on any click
document.addEventListener("click", playAudio);
