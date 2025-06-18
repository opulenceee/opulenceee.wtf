// LSRP Calculator JavaScript

// Pricing data
const PRICING_DATA = {
  guns: {
    Deagle: { price: 19000, unit: "gun" },
    Colt: { price: 16000, unit: "gun" },
    Shotgun: { price: 20000, unit: "gun" },
    Sdpistol: { price: 21000, unit: "gun" },
    Mac10: { price: 25000, unit: "gun" },
    Tec9: { price: 24000, unit: "gun" },
    Rifle: { price: 26000, unit: "gun" },
    MP5: { price: 30000, unit: "gun" },
    M4: { price: 43000, unit: "gun" },
    AK47: { price: 40000, unit: "gun" },
  },
  drugs: {
    "Marijuana (0.1g)": { price: 10, prisonPrice: 40, unit: "0.1g" },
    "Marijuana (1.0g)": { price: 100, prisonPrice: 400, unit: "1.0g" },
    "Cocaine (0.1g)": { price: 35, prisonPrice: 140, unit: "0.1g" },
    "Cocaine (1.0g)": { price: 350, prisonPrice: 1400, unit: "1.0g" },
    "Crack Cocaine (0.1g)": { price: 25, prisonPrice: 140, unit: "0.1g" },
    "Crack Cocaine (1.0g)": { price: 250, prisonPrice: 1400, unit: "1.0g" },
    "Codeine (1 Line)": { price: 150, prisonPrice: 600, unit: "line" },
    "Codeine (16 Lines)": { price: 2400, prisonPrice: 9600, unit: "bottle" },
    Xanax: { price: 150, prisonPrice: 600, unit: "pill" },
    MDMA: { price: 200, prisonPrice: 800, unit: "pill" },
    Oxycodone: { price: 250, prisonPrice: 1000, unit: "pill" },
    Percocet: { price: 100, prisonPrice: 400, unit: "pill" },
    "Heroin (0.1g)": { price: 20, prisonPrice: 80, unit: "0.1g" },
    "Heroin (1.0g)": { price: 200, prisonPrice: 800, unit: "1.0g" },
    "Ketamine (0.1g)": { price: 15, prisonPrice: 60, unit: "0.1g" },
    "Ketamine (1.0g)": { price: 150, prisonPrice: 600, unit: "1.0g" },
    "PCP (0.1g)": { price: 15, prisonPrice: 60, unit: "0.1g" },
    "PCP (1.0g)": { price: 150, prisonPrice: 600, unit: "1.0g" },
    Fentanyl: { price: 175, prisonPrice: 700, unit: "pill" },
    "Methamphetamine (0.1g)": { price: 15, prisonPrice: 60, unit: "0.1g" },
    "Methamphetamine (1.0g)": { price: 150, prisonPrice: 600, unit: "1.0g" },
    Steroids: { price: 250, prisonPrice: 1000, unit: "pill" },
    Adderall: { price: 50, prisonPrice: 200, unit: "pill" },
  },
};

// Cart to store items
let cart = [];
let cartCounter = 1;

// DOM elements
const categorySelect = document.getElementById("category");
const itemTypeSelect = document.getElementById("itemType");
const quantityInput = document.getElementById("quantity");
const prisonCheckbox = document.getElementById("prisonPrice");
const addItemBtn = document.getElementById("addItem");
const clearAllBtn = document.getElementById("clearAll");
const unitDisplay = document.getElementById("unit-display");
const cartTableBody = document.querySelector("#cartTable tbody");
const grandTotalElement = document.getElementById("grandTotal");

// Modal elements
const confirmModal = document.getElementById("confirmModal");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");

// Notification elements
const notification = document.getElementById("notification");
const notificationMessage = document.getElementById("notificationMessage");

// Discount elements
const discountPercentageInput = document.getElementById("discountPercentage");
const applyDiscountBtn = document.getElementById("applyDiscount");
const subtotalElement = document.getElementById("subtotal");
const discountRow = document.getElementById("discountRow");
const discountPercentElement = document.getElementById("discountPercent");
const discountAmountElement = document.getElementById("discountAmount");

// Discount state
let currentDiscount = 0;

// Initialize the calculator
function initCalculator() {
  populateItemDropdown();
  setupEventListeners();
  updateCartDisplay();
}

// Populate item dropdown based on selected category
function populateItemDropdown() {
  const category = categorySelect.value;
  const items = PRICING_DATA[category];

  itemTypeSelect.innerHTML = "";

  Object.keys(items).forEach((itemName) => {
    const option = document.createElement("option");
    option.value = itemName;
    option.textContent = itemName;
    itemTypeSelect.appendChild(option);
  });

  updateUnitDisplay();
}

// Update unit display based on selected item
function updateUnitDisplay() {
  const category = categorySelect.value;
  const itemName = itemTypeSelect.value;

  if (itemName && PRICING_DATA[category][itemName]) {
    const unit = PRICING_DATA[category][itemName].unit;
    unitDisplay.textContent = unit + (category === "guns" ? "(s)" : "(s)");
  }
}

// Setup event listeners
function setupEventListeners() {
  categorySelect.addEventListener("change", () => {
    populateItemDropdown();
    updatePrisonCheckboxVisibility();
  });

  itemTypeSelect.addEventListener("change", updateUnitDisplay);

  addItemBtn.addEventListener("click", addItemToCart);
  clearAllBtn.addEventListener("click", showClearConfirmation);

  // Modal event listeners
  confirmBtn.addEventListener("click", confirmClearCart);
  cancelBtn.addEventListener("click", closeClearConfirmation);

  // Close modal when clicking outside of it
  confirmModal.addEventListener("click", (e) => {
    if (e.target === confirmModal) {
      closeClearConfirmation();
    }
  });

  // Allow adding items with Enter key
  quantityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addItemToCart();
    }
  });

  // Discount event listeners
  applyDiscountBtn.addEventListener("click", applyDiscount);

  // Allow applying discount with Enter key
  discountPercentageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      applyDiscount();
    }
  });

  // Numeric input validation
  setupNumericInputValidation();

  updatePrisonCheckboxVisibility();
}

// Show/hide prison checkbox based on category
function updatePrisonCheckboxVisibility() {
  const category = categorySelect.value;
  const prisonToggle = document.querySelector(".prison-toggle");

  if (category === "drugs") {
    prisonToggle.style.display = "flex";
  } else {
    prisonToggle.style.display = "none";
    prisonCheckbox.checked = false;
  }
}

// Add item to cart
function addItemToCart() {
  const category = categorySelect.value;
  const itemName = itemTypeSelect.value;
  const quantity = parseFloat(quantityInput.value);
  const isPrison = prisonCheckbox.checked;

  if (!itemName || quantity <= 0) {
    showNotification(
      "Please select an item and enter a valid quantity.",
      "error"
    );
    return;
  }

  const itemData = PRICING_DATA[category][itemName];
  const basePrice = itemData.price;
  const unitPrice =
    isPrison && itemData.prisonPrice ? itemData.prisonPrice : basePrice;
  const totalPrice = unitPrice * quantity;

  const cartItem = {
    id: cartCounter++,
    category: category.charAt(0).toUpperCase() + category.slice(1),
    name: itemName,
    quantity: quantity,
    unit: itemData.unit,
    unitPrice: unitPrice,
    totalPrice: totalPrice,
    isPrison: isPrison,
  };

  cart.push(cartItem);
  updateCartDisplay();

  // Reset quantity to 1
  quantityInput.value = 1;
}

// Remove item from cart
function removeFromCart(itemId) {
  cart = cart.filter((item) => item.id !== itemId);
  updateCartDisplay();
}

// Show clear confirmation modal
function showClearConfirmation() {
  if (cart.length === 0) return;

  confirmModal.style.display = "block";
  confirmModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden"; // Prevent background scrolling
}

// Close clear confirmation modal
function closeClearConfirmation() {
  confirmModal.style.display = "none";
  confirmModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "auto"; // Restore scrolling
}

// Confirm and clear entire cart
function confirmClearCart() {
  cart = [];
  updateCartDisplay();
  closeClearConfirmation();
  showNotification("Cart cleared successfully!", "success");
}

// Apply discount
function applyDiscount() {
  const discountPercent = parseFloat(discountPercentageInput.value) || 0;

  if (discountPercent < 0 || discountPercent > 100) {
    showNotification("Discount must be between 0% and 100%", "error");
    return;
  }

  currentDiscount = discountPercent;

  // Get current subtotal
  const subtotalText = subtotalElement.textContent.replace(/[$,]/g, "");
  const subtotal = parseFloat(subtotalText) || 0;

  calculateFinalTotal(subtotal);

  if (discountPercent > 0) {
    showNotification(`${discountPercent}% discount applied!`, "success");
  }
}

// Calculate final total with discount
function calculateFinalTotal(subtotal) {
  if (currentDiscount > 0) {
    const discountAmount = subtotal * (currentDiscount / 100);
    const finalTotal = subtotal - discountAmount;

    // Show discount row
    discountRow.style.display = "flex";
    discountPercentElement.textContent = currentDiscount;
    discountAmountElement.textContent = "-$" + formatNumber(discountAmount);

    // Update final total
    grandTotalElement.textContent = "$" + formatNumber(finalTotal);
  } else {
    // Hide discount row
    discountRow.style.display = "none";

    // Final total equals subtotal
    grandTotalElement.textContent = "$" + formatNumber(subtotal);
  }
}

// Setup numeric input validation
function setupNumericInputValidation() {
  // Quantity input validation - decimals based on category
  quantityInput.addEventListener("input", (e) => {
    const category = categorySelect.value;
    const allowDecimals = category === "drugs"; // Only drugs allow decimals
    validateNumericInput(e.target, allowDecimals);
  });

  quantityInput.addEventListener("keypress", (e) => {
    const category = categorySelect.value;
    const allowDecimals = category === "drugs"; // Only drugs allow decimals
    if (!isValidNumericKey(e, allowDecimals)) {
      e.preventDefault();
    }
  });

  // Update validation when category changes
  categorySelect.addEventListener("change", () => {
    // Clear quantity when switching categories to avoid confusion
    quantityInput.value = "1";
  });

  // Discount input validation - allow decimals for precise percentages
  discountPercentageInput.addEventListener("input", (e) => {
    validateNumericInput(e.target, true); // Allow decimals for percentage
  });

  discountPercentageInput.addEventListener("keypress", (e) => {
    if (!isValidNumericKey(e, true)) {
      e.preventDefault();
    }
  });
}

// Validate numeric input
function validateNumericInput(input, allowDecimals = true) {
  let value = input.value;

  if (allowDecimals) {
    // Allow numbers with decimals (quantity)
    value = value.replace(/[^0-9.]/g, "");
    // Ensure only one decimal point
    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }
  } else {
    // Only allow whole numbers (discount percentage)
    value = value.replace(/[^0-9]/g, "");
  }

  input.value = value;
}

// Check if keypress is valid for numeric input
function isValidNumericKey(event, allowDecimals = true) {
  const key = event.key;

  // Always allow control keys
  if (
    [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
    ].includes(key)
  ) {
    return true;
  }

  // Allow numbers
  if (/^[0-9]$/.test(key)) {
    return true;
  }

  // Allow decimal point if enabled and not already present
  if (allowDecimals && key === "." && !event.target.value.includes(".")) {
    return true;
  }

  // Prevent all other keys
  return false;
}

// Show notification toast
function showNotification(message, type = "error") {
  notificationMessage.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.add("show");

  // Auto-hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

// Update cart display
function updateCartDisplay() {
  if (cart.length === 0) {
    cartTableBody.innerHTML =
      '<tr><td colspan="8" class="empty-cart">Your cart is empty</td></tr>';
    subtotalElement.textContent = "$0.00";
    grandTotalElement.textContent = "$0.00";
    discountRow.style.display = "none";
    currentDiscount = 0;
    discountPercentageInput.value = 0;
    return;
  }

  cartTableBody.innerHTML = "";
  let subtotal = 0;

  cart.forEach((item, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.category}</td>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>$${formatNumber(item.unitPrice)}</td>
      <td>$${formatNumber(item.totalPrice)}</td>
      <td>${
        item.isPrison ? '<span class="prison-indicator">YES</span>' : "NO"
      }</td>
      <td><button class="remove-btn" onclick="removeFromCart(${
        item.id
      })">Remove</button></td>
    `;

    cartTableBody.appendChild(row);
    subtotal += item.totalPrice;
  });

  // Update subtotal
  subtotalElement.textContent = "$" + formatNumber(subtotal);

  // Calculate final total with discount
  calculateFinalTotal(subtotal);
}

// Format number with commas
function formatNumber(num) {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Export functions to global scope for HTML onclick handlers
window.removeFromCart = removeFromCart;

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initCalculator);
