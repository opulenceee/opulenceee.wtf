// Focus trap functionality
const focusableElements =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
let lastFocusedElement = null;

function trapFocus(element) {
  const focusableContent = element.querySelectorAll(focusableElements);
  const firstFocusableElement = focusableContent[0];
  const lastFocusableElement = focusableContent[focusableContent.length - 1];

  element.addEventListener("keydown", function (e) {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    }
  });
}

// Modal Functions
function showPrivateModal(botName) {
  const modal = document.getElementById("privateModal");
  const content = document.getElementById("modalDescription");

  // Store the currently focused element
  lastFocusedElement = document.activeElement;

  // Update modal content
  content.innerHTML = `${botName} is currently private and only available for authorized users.<br><br>If you're interested in learning more or gaining access, please contact me through Discord.`;

  // Show modal
  modal.style.display = "block";
  modal.setAttribute("aria-hidden", "false");

  // Enable focus trap
  trapFocus(modal);

  // Focus the first focusable element
  const firstFocusable = modal.querySelector(focusableElements);
  if (firstFocusable) {
    firstFocusable.focus();
  }

  // Prevent background scrolling
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("privateModal");

  // Hide modal
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");

  // Restore background scrolling
  document.body.style.overflow = "";

  // Return focus to the last focused element
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  // Close modal when clicking outside
  window.addEventListener("click", function (event) {
    const modal = document.getElementById("privateModal");
    if (event.target === modal) {
      closeModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Escape" &&
      document.getElementById("privateModal").style.display === "block"
    ) {
      closeModal();
    }
  });

  // Handle touch events for mobile devices
  let touchStartY = 0;
  const modal = document.getElementById("privateModal");

  modal.addEventListener(
    "touchstart",
    function (e) {
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  modal.addEventListener(
    "touchmove",
    function (e) {
      const touchEndY = e.touches[0].clientY;
      const modalContent = modal.querySelector(".modal-content");

      // Only prevent default if we're not scrolling content
      if (!modalContent.contains(e.target)) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
});

// Utility function to handle errors gracefully
function handleError(error) {
  console.error("An error occurred:", error);
  // You could implement a user-friendly error message system here
}

// Add error boundary
window.addEventListener("error", function (e) {
  handleError(e.error);
});

// Add support for screen reader announcements
function announce(message, priority = "polite") {
  let announcer = document.getElementById("announcer");

  if (!announcer) {
    announcer = document.createElement("div");
    announcer.id = "announcer";
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    document.body.appendChild(announcer);
  }

  announcer.textContent = message;
}
