// Shared appointment data for every MedAppoint page.
// All pages use the same browser Local Storage key.
const storageKey = "medAppointAppointments";

function getAppointments() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch (error) {
    console.error("Could not read appointments:", error);
    return [];
  }
}

function saveAppointments(items) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

const doctorClinics = {
  "Dr. Priya Sharma": "CareBest Hospital, Lajpat Nagar, Jalandhar",
  "Dr. Rahul Mehta": "Dermagique Studio, Civil Lines, Jalandhar",
  "Dr. Ananya Gupta": "Ankur Kids Hospital, GTB Nagar, Jalandhar",
  "Dr. Arjun Kapoor": "Orthonova Hospital, Nakodar Road, Jalandhar",
  "Dr. Neha Verma": "Aarti Fertility & Gynae Centre, Mall Road, Jalandhar"
};

function formatDate(date) {
  if (!date) return "";
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function formatTime(time) {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const d = new Date();
  d.setHours(Number(hours), Number(minutes), 0, 0);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function appointmentDateTime(item) {
  return new Date(item.date + "T" + item.time);
}

function isPast(item) {
  return appointmentDateTime(item) < new Date();
}

function getStatusClass(status) {
  return (status || "Pending").toLowerCase();
}

// Set today's date on the dashboard.
const todayElement = document.getElementById("today");
if (todayElement) {
  todayElement.textContent = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
}

// Dashboard: show the exact same appointments that were booked on the form.
function renderDashboardAppointments() {
  const rows = document.getElementById("appointmentRows");
  if (!rows) return;

  const items = getAppointments();
  const now = new Date();
  const upcoming = items.filter(item =>
    appointmentDateTime(item) >= now && item.status !== "Cancelled"
  );

  document.getElementById("upcomingCount").textContent = upcoming.length;
  document.getElementById("confirmedCount").textContent =
    upcoming.filter(item => item.status === "Confirmed").length;
  document.getElementById("pendingCount").textContent =
    upcoming.filter(item => (item.status || "Pending") === "Pending").length;

  const search = (document.getElementById("search")?.value || "").toLowerCase();
  const filter = document.getElementById("statusFilter")?.value || "all";

  const filtered = items.filter(item => {
    const matchesSearch =
      (item.doctor || "").toLowerCase().includes(search) ||
      (item.clinic || "").toLowerCase().includes(search);
    const matchesStatus = filter === "all" || (item.status || "Pending") === filter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => appointmentDateTime(a) - appointmentDateTime(b));

  if (filtered.length === 0) {
    rows.innerHTML = '<tr><td colspan="5" class="empty">No appointments found. Book your first appointment to see it here.</td></tr>';
    return;
  }

  rows.innerHTML = filtered.map(item => `
    <tr>
      <td><div class="doctor">${escapeHTML(item.doctor)}</div><div class="muted">${escapeHTML(item.clinic)}</div></td>
      <td>${formatDate(item.date)}</td>
      <td>${formatTime(item.time)}</td>
      <td><span class="status ${getStatusClass(item.status)}">${escapeHTML(item.status || "Pending")}</span></td>
      <td>
        ${item.status === "Pending" ? `<button class="action" onclick="updateAppointmentStatus(${item.id}, 'Confirmed')">Confirm</button>` : ""}
        ${item.status !== "Cancelled" ? `<button class="cancel-btn" onclick="cancelAppointment(${item.id})">Cancel</button>` : ""}
      </td>
    </tr>
  `).join("");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function updateAppointmentStatus(id, status) {
  const items = getAppointments();
  const item = items.find(a => String(a.id) === String(id));
  if (!item) return;
  item.status = status;
  saveAppointments(items);
  renderDashboardAppointments();
  renderAppointmentPages();
}

function cancelAppointment(id) {
  if (!confirm("Are you sure you want to cancel this appointment?")) return;
  const items = getAppointments();
  const item = items.find(a => String(a.id) === String(id));
  if (!item) return;
  item.status = "Cancelled";
  item.cancellationNote = "Cancelled by patient";
  saveAppointments(items);
  renderDashboardAppointments();
  renderAppointmentPages();
}

// Booking form: doctor selected on the doctor page is pre-filled.
const bookingForm = document.getElementById("bookingForm");
if (bookingForm) {
  const doctorSelect = document.getElementById("doctor");
  const clinicInput = document.getElementById("clinic");
  const dateInput = document.getElementById("date");

  const now = new Date();
  dateInput.min = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  const params = new URLSearchParams(location.search);
  const selectedDoctor = params.get("doctor");
  if (selectedDoctor && doctorClinics[selectedDoctor]) {
    doctorSelect.value = selectedDoctor;
    clinicInput.value = doctorClinics[selectedDoctor];
  }

  doctorSelect.addEventListener("change", () => {
    clinicInput.value = doctorClinics[doctorSelect.value] || "";
  });

  bookingForm.addEventListener("submit", event => {
    event.preventDefault();

    const date = dateInput.value;
    const time = document.getElementById("time").value;
    if (new Date(date + "T" + time) <= new Date()) {
      alert("Please select a future appointment date and time.");
      return;
    }

    const appointment = {
      id: Date.now(),
      patient: document.getElementById("patient").value.trim(),
      age: document.getElementById("age").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      doctor: doctorSelect.value,
      clinic: clinicInput.value,
      date,
      time,
      reason: document.getElementById("reason").value.trim(),
      reminder: document.getElementById("reminder").value,
      recurring: document.getElementById("recurring").value,
      status: "Pending",
      cancellationNote: ""
    };

    const items = getAppointments();
    items.push(appointment);
    saveAppointments(items);

    alert("Appointment booked successfully!");
    window.location.href = "appointment.html";
  });
}

function createAppointmentCard(item, showCancel) {
  const card = document.createElement("article");
  card.className = "appointment-card";

  const details = [
    "Patient: " + (item.patient || "Not provided"),
    "Doctor: " + item.doctor,
    "Clinic: " + item.clinic,
    "Date: " + formatDate(item.date),
    "Time: " + formatTime(item.time),
    "Reason: " + (item.reason || "Not provided"),
    "Reminder: " + (item.reminder || "Not selected"),
    "Recurring: " + (item.recurring || "No")
  ];

  details.forEach(detail => {
    const p = document.createElement("p");
    p.textContent = detail;
    card.appendChild(p);
  });

  const status = document.createElement("span");
  status.className = "status " + getStatusClass(item.status);
  status.textContent = item.status || "Pending";
  card.appendChild(status);

  if (item.status === "Cancelled" && item.cancellationNote) {
    const note = document.createElement("p");
    note.textContent = "Cancellation note: " + item.cancellationNote;
    card.appendChild(note);
  }

  if (showCancel && item.status !== "Cancelled") {
    const button = document.createElement("button");
    button.className = "cancel-button";
    button.textContent = "Cancel Appointment";
    button.addEventListener("click", () => cancelAppointment(item.id));
    card.appendChild(button);
  }

  return card;
}

function renderAppointmentPages() {
  const currentList = document.getElementById("currentList");
  const historyList = document.getElementById("historyList");
  if (!currentList || !historyList) return;

  currentList.innerHTML = "";
  historyList.innerHTML = "";

  const items = getAppointments().sort((a, b) => appointmentDateTime(a) - appointmentDateTime(b));
  let currentCount = 0;
  let historyCount = 0;

  items.forEach(item => {
    if (item.status === "Cancelled" || isPast(item)) {
      historyList.appendChild(createAppointmentCard(item, false));
      historyCount++;
    } else {
      currentList.appendChild(createAppointmentCard(item, true));
      currentCount++;
    }
  });

  if (!currentCount) currentList.innerHTML = '<p class="empty">No current appointments found.</p>';
  if (!historyCount) historyList.innerHTML = '<p class="empty">No appointment history found.</p>';
}

function renderReminders() {
  const reminderList = document.getElementById("reminderList");
  if (!reminderList) return;

  reminderList.innerHTML = "";
  const items = getAppointments().filter(item =>
    !isPast(item) && item.status !== "Cancelled" && item.reminder !== "No reminder"
  ).sort((a, b) => appointmentDateTime(a) - appointmentDateTime(b));

  if (!items.length) {
    reminderList.innerHTML = '<p class="empty">No upcoming reminders found.</p>';
    return;
  }

  items.forEach(item => {
    const card = createAppointmentCard(item, false);
    card.className = "reminder-card";
    const reminderText = document.createElement("p");
    reminderText.textContent = "Reminder preference: " + item.reminder;
    card.appendChild(reminderText);
    reminderList.appendChild(card);
  });
}

renderDashboardAppointments();
renderAppointmentPages();
renderReminders();
