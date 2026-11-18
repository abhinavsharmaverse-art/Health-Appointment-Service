function renderHistoryPage() {
  const body=document.getElementById("historyBody");
  if(!body) return;
  const search=document.getElementById("search").value.toLowerCase().trim();
  const selected=document.getElementById("statusFilter").value;
  const all=getAppointments();
  const history=all.filter(item=>item.status==="Cancelled" || isPast(item) || item.status==="Completed");
  const completed=history.filter(item=>item.status!=="Cancelled").length;
  const cancelled=history.filter(item=>item.status==="Cancelled").length;
  document.getElementById("totalCount").textContent=history.length;
  document.getElementById("completedCount").textContent=completed;
  document.getElementById("cancelledCount").textContent=cancelled;
  const filtered=history.filter(item=>{
    const matchesText=(item.doctor||"").toLowerCase().includes(search)||(item.clinic||"").toLowerCase().includes(search);
    const status=item.status==="Cancelled"?"Cancelled":"Completed";
    return matchesText && (selected==="all" || selected===status);
  }).sort((a,b)=>appointmentDateTime(b)-appointmentDateTime(a));
  body.replaceChildren();
  filtered.forEach(item=>{
    const row=document.createElement("tr");
    [item.doctor||"",item.clinic||"",formatDate(item.date),formatTime(item.time)].forEach(value=>{
      const cell=document.createElement("td");cell.textContent=value;row.appendChild(cell);
    });
    const cell=document.createElement("td");
    const badge=document.createElement("span");
    badge.className="status "+(item.status==="Cancelled"?"cancelled":"completed");
    badge.textContent=item.status==="Cancelled"?"Cancelled":(item.status||"Completed");
    cell.appendChild(badge);row.appendChild(cell);body.appendChild(row);
  });
  document.getElementById("emptyMessage").style.display=filtered.length?"none":"block";
}
document.getElementById("search").addEventListener("input",renderHistoryPage);
document.getElementById("statusFilter").addEventListener("change",renderHistoryPage);
renderHistoryPage();
