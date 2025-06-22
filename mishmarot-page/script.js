document.addEventListener("DOMContentLoaded", function () {
  const uploadForm = document.getElementById("upload-form");
  const fileInput = document.getElementById("file");
  const fileUploadText = document.querySelector(".file-upload-text");
  const loadingDiv = document.getElementById("loading");
  const resultsDiv = document.getElementById("results");
  const errorDiv = document.getElementById("error");
  const errorMessage = document.getElementById("error-message");
  const shiftsListDiv = document.getElementById("shifts-list");
  const downloadBtn = document.getElementById("download-btn");

  let currentIcsContent = "";
  let currentFilename = "";

  // Update file upload text when file is selected
  fileInput.addEventListener("change", function () {
    if (this.files && this.files.length > 0) {
      fileUploadText.textContent = this.files[0].name;
      fileUploadText.style.color = "rgb(255, 128, 128)";
    } else {
      fileUploadText.textContent = "Choose file...";
      fileUploadText.style.color = "rgba(255, 255, 255, 0.7)";
    }
  });

  // Handle form submission
  uploadForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Hide previous results/errors
    hideAllMessages();

    // Show loading
    loadingDiv.classList.remove("hidden");

    // Prepare form data
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("name", document.getElementById("name").value);
    formData.append("month", document.getElementById("month").value);
    formData.append("year", document.getElementById("year").value);

    try {
      const response = await fetch("/convert", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Success - show results
        displayResults(data);
      } else {
        // Error from server
        showError(
          data.error || "An error occurred while processing your file."
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showError("Network error. Please check your connection and try again.");
    } finally {
      loadingDiv.classList.add("hidden");
    }
  });

  // Handle download button click
  downloadBtn.addEventListener("click", async function () {
    if (!currentIcsContent) {
      showError("No calendar data available to download.");
      return;
    }

    try {
      const response = await fetch("/download_ics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ics_content: currentIcsContent,
          filename: currentFilename,
        }),
      });

      if (response.ok) {
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = currentFilename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        showError(errorData.error || "Error downloading file.");
      }
    } catch (error) {
      console.error("Download error:", error);
      showError("Network error while downloading. Please try again.");
    }
  });

  function displayResults(data) {
    hideAllMessages();

    // Store data for download
    currentIcsContent = data.ics_content;
    currentFilename = data.filename;

    // Clear previous results
    shiftsListDiv.innerHTML = "";

    // Display shift count instead of individual shifts
    const countElement = document.createElement("div");
    countElement.className = "shift-count";
    countElement.innerHTML = `
      <div style="text-align: center; font-size: 1.2rem; color: rgb(255, 128, 128); margin-bottom: 1rem;">
        Found ${data.shifts.length} shift${
      data.shifts.length !== 1 ? "s" : ""
    } for conversion
      </div>
    `;
    shiftsListDiv.appendChild(countElement);

    resultsDiv.classList.remove("hidden");
  }

  function showError(message) {
    hideAllMessages();
    errorMessage.textContent = message;
    errorDiv.classList.remove("hidden");
  }

  function hideAllMessages() {
    resultsDiv.classList.add("hidden");
    errorDiv.classList.add("hidden");
    loadingDiv.classList.add("hidden");
  }

  function formatTime(timeString) {
    // Convert "2024-01-15 07:00:00" to "07:00"
    const time = timeString.split(" ")[1];
    return time.substring(0, 5);
  }

  // Add drag and drop functionality
  const fileUploadWrapper = document.querySelector(".file-upload-wrapper");

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    fileUploadWrapper.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    fileUploadWrapper.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    fileUploadWrapper.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    fileUploadWrapper.classList.add("highlight");
    fileUploadText.style.borderColor = "rgb(255, 128, 128)";
    fileUploadText.style.backgroundColor = "rgba(255, 128, 128, 0.1)";
    fileUploadText.style.color = "rgb(255, 128, 128)";
  }

  function unhighlight() {
    fileUploadWrapper.classList.remove("highlight");
    if (!fileInput.files || fileInput.files.length === 0) {
      fileUploadText.style.borderColor = "rgba(255, 255, 255, 0.3)";
      fileUploadText.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
      fileUploadText.style.color = "rgba(255, 255, 255, 0.7)";
    }
  }

  fileUploadWrapper.addEventListener("drop", handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      fileInput.files = files;
      fileUploadText.textContent = files[0].name;
      fileUploadText.style.color = "rgb(255, 128, 128)";
    }
  }
});
