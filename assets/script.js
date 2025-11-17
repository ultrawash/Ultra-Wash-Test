/* ============================================================
   ULTRA WASH ADMIN SYSTEM — GLOBAL JAVASCRIPT (FULL VERSION)
   Updated with:
   - Dark mode
   - Sidebar logic
   - Service type checkbox cards
   - Package checkbox cards (premium)
   - All business logic
   - Worker autofill logic
   - Form submission
============================================================ */

/* ===========================
   DARK MODE TOGGLE
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".toggle-darkmode");
  if (toggle) {
    const saved = localStorage.getItem("uw-theme");
    if (saved === "dark") document.body.classList.add("dark");

    toggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem(
        "uw-theme",
        document.body.classList.contains("dark") ? "dark" : "light"
      );
    });
  }
});

/* ===========================
   SIDEBAR ACTIVE LINK
=========================== */
document.querySelectorAll(".sidebar nav a").forEach((link) => {
  if (window.location.pathname.includes(link.getAttribute("href"))) {
    link.classList.add("active");
  }
});

/* ======================================================
   SERVICE TYPE CHECKBOXES (Behave Like Radio Buttons)
====================================================== */

function setupServiceCheckboxes() {
  const boxes = document.querySelectorAll(".service-checkbox");
  const hiddenInput = document.querySelector("#service");

  if (!boxes.length) return;

  boxes.forEach((box) => {
    box.addEventListener("change", () => {
      if (box.checked) {
        // uncheck others
        boxes.forEach((other) => {
          if (other !== box) other.checked = false;
        });

        // save the selected service type
        hiddenInput.value = box.value;

        // update UI sections
        updateServiceUI(box.value);
      }
    });
  });
}

/* ======================================================
   SERVICE TYPE UI HANDLING
====================================================== */
function updateServiceUI(type) {
  const single = document.querySelector("#singleAddressSection");
  const pickDel = document.querySelector("#pickUpDeliverySection");

  if (!single || !pickDel) return;

  single.classList.add("hidden");
  pickDel.classList.add("hidden");

  if (type === "Pick Up Only" || type === "Delivery Only") {
    single.classList.remove("hidden");
  }

  if (type === "Pick Up & Delivery") {
    pickDel.classList.remove("hidden");
  }
}

/* ======================================================
   PACKAGE CHECKBOXES (Behave Like Radio Buttons)
====================================================== */

function setupPackageCheckboxes() {
  const boxes = document.querySelectorAll(".package-checkbox");
  const cards = document.querySelectorAll(".package-option");
  const hiddenInput = document.querySelector("#pricingService");

  if (!boxes.length) return;

  boxes.forEach((box) => {
    box.addEventListener("change", () => {
      if (box.checked) {
        boxes.forEach((other) => {
          if (other !== box) other.checked = false;
        });

        // clear all card highlights
        cards.forEach((c) => c.classList.remove("selected"));

        // highlight the selected one
        box.closest(".package-option").classList.add("selected");

        // save value
        hiddenInput.value = box.value;

        // UI handling
        updatePackageUI(box.value);
      }
    });
  });
}

/* ======================================================
   PACKAGE UI MANAGEMENT
====================================================== */

function updatePackageUI(type) {
  hide("#membershipFields");
  hide("#jimatFields");
  hide("#washFields");
  hide("#foldingFields");
  hide("#ironingFields");

  switch (type) {
    case "membership":
      show("#membershipFields");
      break;
    case "jimat":
      show("#jimatFields");
      break;
    case "wash":
      show("#washFields");
      break;
    case "folding":
      show("#foldingFields");
      break;
    case "ironing":
      show("#ironingFields");
      break;
  }
}

/* ======================================================
   BUSINESS HOUR VALIDATION
====================================================== */
function isWithinBusinessHours(dateTimeStr) {
  const dt = new Date(dateTimeStr);
  const day = dt.getDay();
  const hour = dt.getHours();
  const min = dt.getMinutes();

  // Sunday closed
  if (day === 0) return false;

  const minutes = hour * 60 + min;

  // Monday–Friday: 8:30–16:30
  if (day >= 1 && day <= 5) {
    return minutes >= 510 && minutes <= 990;
  }

  // Saturday: 8:30–11:30
  if (day === 6) {
    return minutes >= 510 && minutes <= 690;
  }

  return false;
}

function validateBusinessHours() {
  const single = document.querySelector("#singleDateTime");
  const pickup = document.querySelector("#pickupDate");
  const delivery = document.querySelector("#deliveryDate");

  if (single && single.value && !isWithinBusinessHours(single.value)) {
    alert("Selected time is outside business hours.");
    return false;
  }
  if (pickup && pickup.value && !isWithinBusinessHours(pickup.value)) {
    alert("Pickup time is outside business hours.");
    return false;
  }
  if (delivery && delivery.value && !isWithinBusinessHours(delivery.value)) {
    alert("Delivery time is outside business hours.");
    return false;
  }

  return true;
}

/* ======================================================
   PRICE CALCULATION ENGINE
====================================================== */

function calculatePrice(data) {
  let total = 0;
  let breakdown = "";

  /* ========== MEMBERSHIP ========== */
  if (data.package === "membership") {
    return { total: 0, breakdown: "Membership (0)" };
  }

  /* ========== JIMAT ========== */
  if (data.package === "jimat") {
    const table = { "16": 16, "28": 28, "40": 40 };
    total = table[data.plan] || 0;
    breakdown = `$${total} (Jimat Box)`;
    return { total, breakdown };
  }

  /* ========== WASH, DRY & FOLD ========== */
  if (data.package === "wash") {
    const kg = Number(data.kg);

    if (kg <= 5) {
      total = 10;
      breakdown = "$10 (5kg)";
    } else if (kg < 8) {
      const addon = (kg - 5) * 1.2;
      total = 10 + addon;
      breakdown = `$10 + $${addon.toFixed(2)} add-on`;
    } else if (kg === 8) {
      total = 12;
      breakdown = "$12 (8kg)";
    } else if (kg < 13) {
      const addon = (kg - 8) * 1.2;
      total = 12 + addon;
      breakdown = `$12 + $${addon.toFixed(2)} add-on`;
    } else if (kg === 13) {
      total = 16;
      breakdown = "$16 (13kg)";
    } else {
      const addon = (kg - 13) * 1.2;
      total = 16 + addon;
      breakdown = `$16 + $${addon.toFixed(2)} add-on`;
    }

    return { total, breakdown };
  }

  /* ========== FOLDING ========== */
  if (data.package === "folding") {
    const kg = Number(data.kg);

    if (kg <= 7) {
      total = 2;
      breakdown = "$2 (up to 7kg)";
    } else {
      const blocks = Math.floor((kg - 7) / 2);
      total = 2 + blocks;
      breakdown = `$2 + $${blocks} add-on`;
    }
    return { total, breakdown };
  }

  /* ========== IRONING ========== */
  if (data.package === "ironing") {
    const pcs = Number(data.pcs);
    total = pcs * 1;
    breakdown = `$${total} (${pcs} pcs × $1)`;
    return { total, breakdown };
  }

  return { total: 0, breakdown: "" };
}

/* ======================================================
   GOOGLE SCRIPT — LOAD CUSTOMER LIST
====================================================== */
async function loadCustomers() {
  const container = document.querySelector("#customerSearchList");
  if (!container) return;

  try {
    const res = await fetch(
      "https://script.google.com/macros/s/AKfycbwRk-T3xGVFx0PzQSXqJ9piRLk8tXUWzcyDDHOfCxDuhLJ1V2PAPt87LETLZ1ZkbpnZmA/exec"
    );
    const data = await res.json();

    container.innerHTML = "";

    data.forEach((cust) => {
      const item = document.createElement("div");
      item.classList.add("dropdown-item");
      item.textContent = `${cust["Name"]} (${cust["Customer ID"]})`;
      item.dataset.name = cust["Name"];
      item.dataset.phone = cust["Phone"];
      item.dataset.address = cust["Location Address"];
      item.dataset.map = cust["Map Link / Coordinates"];
      item.dataset.service = cust["Service Type"];
      item.dataset.package = cust["Service Package"];
      item.dataset.plan = cust["Plan Details"];
      item.dataset.quantity = cust["Quantity"];

      container.appendChild(item);
    });

    setupCustomerSelection();
  } catch (err) {
    console.error(err);
  }
}

/* ======================================================
   CUSTOMER DROPDOWN — Worker Form
====================================================== */

function setupCustomerSelection() {
  const search = document.querySelector("#customerRefSearch");
  const list = document.querySelector("#customerSearchList");
  const hidden = document.querySelector("#customerRef");

  if (!search || !list) return;

  // live search
  search.addEventListener("input", () => {
    const term = search.value.toLowerCase();

    list.style.display = "block";

    list.querySelectorAll(".dropdown-item").forEach((item) => {
      item.style.display = item.textContent.toLowerCase().includes(term)
        ? "block"
        : "none";
    });
  });

  // item click
  list.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", () => {
      hidden.value = item.dataset.phone;
      search.value = item.textContent;
      list.style.display = "none";

      fillWorkerForm(item.dataset);
    });
  });
}

/* ======================================================
   FILL WORKER FORM (Auto-Fill All Customer Data)
====================================================== */

function fillWorkerForm(data) {
  setVal("#customerNameWorker", data.name);
  setVal("#customerPhoneWorker", data.phone);
  setVal("#mapLinkWorker", data.map);
  setVal("#backendAddress", data.address);
  setVal("#serviceWorker", data.service);

  // Package Type
  setVal("#pricingServiceUpdate", data.package);
  setVal("#pricingServiceUpdateDisplay", data.package);

  hide("#membershipFieldsUpdate");
  hide("#jimatFieldsUpdate");
  hide("#washFieldsUpdate");
  hide("#foldingFieldsUpdate");
  hide("#ironingFieldsUpdate");

  switch (data.package) {
    case "membership":
      show("#membershipFieldsUpdate");
      setVal("#membershipPlanUpdate", data.plan);
      break;

    case "jimat":
      show("#jimatFieldsUpdate");
      setVal("#jimatPlanUpdate", data.plan);
      break;

    case "wash":
      show("#washFieldsUpdate");
      setVal("#washKgUpdate", data.quantity);
      break;

    case "folding":
      show("#foldingFieldsUpdate");
      setVal("#foldKgUpdate", data.quantity);
      break;

    case "ironing":
      show("#ironingFieldsUpdate");
      setVal("#ironPcsUpdate", data.quantity);
      break;
  }
}

/* ======================================================
   HELPERS
====================================================== */

function setVal(selector, val) {
  const el = document.querySelector(selector);
  if (el) el.value = val || "";
}

function show(selector) {
  const el = document.querySelector(selector);
  if (el) el.classList.remove("hidden");
}

function hide(selector) {
  const el = document.querySelector(selector);
  if (el) el.classList.add("hidden");
}

/* ======================================================
   FORM SUBMISSION
====================================================== */
document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateBusinessHours()) return;

    const fd = new FormData(form);

    try {
      const res = await fetch(
        "https://risetotop.app.n8n.cloud/webhook/uw-admin",
        { method: "POST", body: fd }
      );

      if (res.ok) {
        window.location.href = "success.html";
      } else {
        alert("Submission error");
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    }
  });
});

/* ======================================================
   AUTO-INITIALIZE
====================================================== */

setupServiceCheckboxes();
setupPackageCheckboxes();
loadCustomers();
