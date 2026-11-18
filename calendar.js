const calendarToday = new Date();
let calendarMonth = calendarToday.getMonth();
let calendarYear = calendarToday.getFullYear();
let selectedCalendarDate = null;

function calendarDateKey(date) {
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-");
}
function renderCalendar() {
  const heading = document.getElementById("monthYear");
  const daysBox = document.getElementById("calendarDays");
  if (!heading || !daysBox) return;
  heading.textContent = new Date(calendarYear, calendarMonth, 1).toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  daysBox.replaceChildren();
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const totalDays = new Date(calendarYear, calendarMonth+1, 0).getDate();
  const appointmentsByDate = {};
  getAppointments().forEach(item => {
    if (!appointmentsByDate[item.date]) appointmentsByDate[item.date] = [];
    appointmentsByDate[item.date].push(item);
  });
  for (let i=0;i<firstDay;i++) {
    const blank=document.createElement("div");
    blank.style.visibility="hidden";
    blank.setAttribute("aria-hidden","true");
    daysBox.appendChild(blank);
  }
  for (let day=1;day<=totalDays;day++) {
    const dateKey = calendarDateKey(new Date(calendarYear,calendarMonth,day));
    const cell=document.createElement("div");
    cell.textContent=day;
    cell.tabIndex=0;
    cell.setAttribute("role","button");
    cell.setAttribute("aria-label", dateKey + (appointmentsByDate[dateKey] ? ", appointment scheduled" : ""));
    if (day===calendarToday.getDate() && calendarMonth===calendarToday.getMonth() && calendarYear===calendarToday.getFullYear()) cell.classList.add("today");
    if (appointmentsByDate[dateKey]) cell.classList.add("has-appointment");
    if (selectedCalendarDate===dateKey) cell.classList.add("selected");
    const selectDate=()=>{selectedCalendarDate=dateKey;showCalendarDetails(dateKey,appointmentsByDate[dateKey]||[]);renderCalendar();};
    cell.addEventListener("click",selectDate);
    cell.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectDate();}});
    daysBox.appendChild(cell);
  }
}
function showCalendarDetails(dateKey, records) {
  const details=document.getElementById("details");
  details.replaceChildren();
  const heading=document.createElement("strong");
  heading.textContent="Selected date: "+dateKey;
  details.appendChild(heading);
  if (!records.length) {
    const p=document.createElement("p");p.textContent="No appointments scheduled for this date.";details.appendChild(p);return;
  }
  records.forEach(item=>{
    const p=document.createElement("p");
    p.textContent=(item.time||"Time not set")+" — "+(item.doctor||"Doctor not set")+" ("+(item.clinic||"Clinic not set")+") · "+(item.status||"Pending");
    details.appendChild(p);
  });
}
function changeMonth(step) {
  calendarMonth+=step;
  if(calendarMonth<0){calendarMonth=11;calendarYear--;}
  if(calendarMonth>11){calendarMonth=0;calendarYear++;}
  selectedCalendarDate=null;
  document.getElementById("details").textContent="Select a date to view appointment details.";
  renderCalendar();
}
renderCalendar();
