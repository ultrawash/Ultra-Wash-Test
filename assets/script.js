/* ============================================================
   ULTRA WASH ADMIN SYSTEM — GLOBAL JAVASCRIPT
   Handles:
   - Dark mode
   - Sidebar state
   - Service selection
   - Form logic
   - Membership behavior
   - Pricing calculations
   - Business hour checks
   - Google Script fetch
   - Submission
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
   SERVICE CHECKBOX SELECTION
   (Behaves like radio buttons)
====================================================== */

function setupServiceCheckboxes() {
  const boxes = document.querySelectorAll('.service-checkbox');
  const hiddenInput = document.querySelector('#service');

  if (!boxes.length) return;

  boxes.forEach((box) => {
    box.addEventListener('change', () => {
      if (box.checked) {
        // Uncheck all other boxes
        boxes.forEach((other) => {
          if (other !== box) other.checked = false;
        });

        // Store value
        hiddenInput.value = box.value;

        // Trigger UI updates
        updateServiceUI(box.value);
      }
    });
  });
}

/* ======================================================
   SERVICE UI HANDLING
====================================================== */

function updateServiceUI(serviceType) {
  const single = document.querySelector("#singleAddressSection");
  const pickDel = document.querySelector("#pickUpDeliverySection");

  if (!single || !pickDel) return;

  switch (serviceType) {
    case "Self Drop-off & Pick Up":
      single.classList.add("hidden");
      pickDel.classList.add("hidden");
      break;

    case "Pick Up Only":
      single.classList.remove("hidden");
      pickDel.classList.add("hidden");
      break;

    case "Delivery Only":
      single.classList.remove("hidden");
      pickDel.classList.add("hidden");
      break;

    case "Pick Up & Delivery":
      single.classList.add("hidden");
      pickDel.classList.remove("hidden");
      break;
  }
}

/* ======================================================
   BUSINESS HOURS VALIDATION
====================================================== */

function isWithinBusinessHours(dateTimeStr, isPickup = true) {
  const dt = new Date(dateTimeStr);
  const day = dt.getDay();
  const hour = dt.getHours();
  const minute = dt.getMinutes();

  // Closed Sunday
  if (day === 0) return false;

  let start = { hour: 8, min: 30 };
  let endPickup = { hour: 16, min: 30 };
  let endSat = { hour: 11, min: 30 };

  let mins = hour * 60 + minute;

  if (day >= 1 && day <= 5) {
    // Mon–Fri
    return mins >= (start.hour * 60 + start.min)
      && mins <= (endPickup.hour * 60 + endPickup.min);
  }

  if (day === 6) {
    // Saturday
    return mins >= (start.hour * 60 + start.min)
      && mins <= (endSat.hour * 60 + endSat.min);
  }

  return false;
}

function validateBusinessHours() {
  const pickup = document.querySelector("#pickupDate");
  const drop = document.querySelector("#deliveryDate");
  const single = document.querySelector("#singleDateTime");

  if (pickup && pickup.value && !isWithinBusinessHours(pickup.value, true)) {
    alert("Pickup time is outside business hours.");
    return false;
  }
  if (drop && drop.value && !isWithinBusinessHours(drop.value, false)) {
    alert("Delivery time is outside business hours.");
    return false;
  }
  if (single && single.value && !isWithinBusinessHours(single.value)) {
    alert("Time is outside business hours.");
    return false;
  }
  return true;
}

/* ======================================================
   PRICE CALCULATIONS
====================================================== */

function calculatePrice(data) {
  let total = 0;
  let breakdown = "";

  // Membership (no price)
  if (data.package === "membership") {
    return { total: 0, breakdown: "Membership (0)" };
  }

  // Jimat
  if (data.package === "jimat") {
    const table = { "16": 16, "28": 28, "40": 40 };
    total = table[data.plan] || 0;
    breakdown = `$${total} (Jimat Box)`;
    return { total, breakdown };
  }

  // Wash, Dry & Fold
  if (data.package === "wash") {
    let kg = Number(data.kg);

    if (kg <= 5) {
      total = 10;
      breakdown = "$10 (5kg)";
    } else if (kg < 8) {
      let addon = (kg - 5) * 1.2;
      total = 10 + addon;
      breakdown = `$10 + $${addon.toFixed(2)} add-on`;
    } else if (kg === 8) {
      total = 12;
      breakdown = "$12 (8kg)";
    } else if (kg < 13) {
      let addon = (kg - 8) * 1.2;
      total = 12 + addon;
      breakdown = `$12 + $${addon.toFixed(2)} add-on`;
    } else if (kg === 13) {
      total = 16;
      breakdown = "$16 (13kg)";
    } else {
      let addon = (kg - 13) * 1.2;
      total = 16 + addon;
      breakdown = `$16 + $${addon.toFixed(2)} add-on`;
    }

    return { total, breakdown };
  }

  // Folding
  if (data.package === "folding") {
    let kg = Number(data.kg);

    if (kg <= 7) {
      total = 2;
      breakdown = "$2 (up to 7kg)";
    } else {
      const blocks = Math.floor((kg - 7) / 2);
      total = 2 + blocks * 1;
      breakdown = `$2 + $${blocks} add-on`;
    }
    return { total, breakdown };
  }

  // Ironing
  if (data.package === "ironing") {
    let pcs = Number(data.pcs);
    total = pcs * 1;
    breakdown = `$${total} (${pcs} pcs × $1)`;
    return { total, breakdown };
  }

  return { total: 0, breakdown: "" };
}

/* ======================================================
   CUSTOMER FETCH (Google Apps Script)
====================================================== */

async function loadCustomers() {
  const dropdown = document.querySelector("#customerSearchList");
  if (!dropdown) return;

  try {
    const res = await fetch("https://script.google.com/macros/s/AKfycbwRk-T3xGVFx0PzQSXqJ9piRLk8tXUWzcyDDHOfCxDuhLJ1V2PAPt87LETLZ1ZkbpnZmA/exec");
    const customers = await res.json();

    dropdown.innerHTML = "";
    customers.forEach((c) => {
      const opt = document.createElement("div");
      opt.classList.add("dropdown-item");
      opt.textContent = `${c["Name"]} (${c["Customer ID"]})`;
      opt.dataset.phone = c["Phone"];
      opt.dataset.address = c["Location Address"];
      opt.dataset.map = c["Map Link / Coordinates"];
      opt.dataset.service = c["Service Type"];
      opt.dataset.package = c["Service Package"];
      opt.dataset.plan = c["Plan Details"];
      opt.dataset.quantity = c["Quantity"];
      dropdown.appendChild(opt);
    });

    setupCustomerSelection();
  } catch (err) {
    console.error("Error loading customers:", err);
  }
}

/* ======================================================
   CUSTOMER SELECTION HANDLING
====================================================== */

function setupCustomerSelection() {
  const searchBox = document.querySelector("#customerRefSearch");
  const dropdown = document.querySelector("#customerSearchList");
  const hidden = document.querySelector("#customerRef");

  if (!searchBox || !dropdown) return;

  searchBox.addEventListener("input", () => {
    const term = searchBox.value.toLowerCase();
    dropdown.querySelectorAll(".dropdown-item").forEach((item) => {
      item.style.display = item.textContent.toLowerCase().includes(term)
        ? "block"
        : "none";
    });
  });

  dropdown.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", () => {
      hidden.value = item.dataset.phone;
      searchBox.value = item.textContent;

      fillWorkerForm(item.dataset);

      dropdown.classList.remove("open");
    });
  });
}

/* ======================================================
   FILL WORKER UPDATE FORM
====================================================== */

function fillWorkerForm(data) {
  setValue("#mapLinkWorker", data.map);
  setValue("#customerPhoneWorker", data.phone);
  setValue("#backendAddress", data.address);
  setValue("#serviceWorker", data.service);

  // Set package
  setValue("#pricingServiceUpdate", data.package);
  setValue("#pricingServiceUpdateDisplay", data.package);

  // Set plan or quantity
  switch (data.package) {
    case "membership":
      show("#membershipFieldsUpdate");
      setValue("#membershipPlanUpdate", data.plan);
      break;

    case "jimat":
      show("#jimatFieldsUpdate");
      setValue("#jimatPlanUpdate", data.plan);
      break;

    case "wash":
      show("#washFieldsUpdate");
      setValue("#washKgUpdate", data.quantity);
      break;

    case "folding":
      show("#foldingFieldsUpdate");
      setValue("#foldKgUpdate", data.quantity);
      break;

    case "ironing":
      show("#ironingFieldsUpdate");
      setValue("#ironPcsUpdate", data.quantity);
      break;
  }
}

/* ======================================================
   HELPER FUNCTIONS
====================================================== */

function setValue(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.value = value || "";
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
   SUBMIT HANDLING
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
        alert("Submission failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    }
  });
});

/* ======================================================
   AUTO-INIT FUNCTIONS
====================================================== */

setupServiceCheckboxes();
loadCustomers();
