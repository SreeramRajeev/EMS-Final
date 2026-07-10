/* admin/connectionManagement.js — approve or reject new connection requests. */

const session = EMS.requirePerm("connections", "../employee/login.html", "../employee/dashboard.html");
if (session) {

  // Top bar (name, nav, logout) is built once in js/chrome.js
  const me       = EMS.findEmployee(session.id);
  const pending  = document.getElementById("pendingRows");
  const all      = document.getElementById("allRows");
  const pendCount = document.getElementById("pendCount");

  const badge = { Active: "paid", Pending: "in-progress", Rejected: "unpaid" };

  function render() {
    /* --- Pending requests (with Approve / Reject) --- */
    const reqs = EMS.pendingConnections().slice().reverse();
    pendCount.textContent = reqs.length + " pending";
    pending.innerHTML = reqs.map(cn => {
      const c = EMS.findCustomer(cn.customerId);
      return `
        <tr>
          <td><strong>${cn.id}</strong></td>
          <td>${c ? c.name : cn.customerId}<br /><span class="muted" style="font-size:.76rem;">${cn.customerId}</span></td>
          <td>${cn.category}</td>
          <td style="max-width:240px;">${cn.address} · ${cn.pincode}</td>
          <td>${cn.requestedAt}</td>
          <td style="white-space:nowrap;">
            <button class="btn btn-primary btn-sm" data-approve="${cn.id}">Approve</button>
            <button class="btn btn-danger btn-sm"  data-reject="${cn.id}">Reject</button>
          </td>
        </tr>`;
    }).join("") ||
    `<tr class="empty"><td colspan="6">No pending requests — all caught up. 🎉</td></tr>`;

    /* --- Every connection in the system --- */
    const conns = EMS.getConnections().slice().reverse();
    all.innerHTML = conns.map(cn => {
      const c = EMS.findCustomer(cn.customerId);
      return `
        <tr>
          <td><strong>${cn.consumerNo || "—"}</strong></td>
          <td>${c ? c.name : cn.customerId}</td>
          <td>${cn.category}</td>
          <td>${cn.meterNo || "—"}</td>
          <td style="max-width:220px;">${cn.address} · ${cn.pincode}</td>
          <td><span class="badge ${badge[cn.status] || "assigned"}">${cn.status}</span></td>
        </tr>`;
    }).join("") ||
    `<tr class="empty"><td colspan="6">No connections yet.</td></tr>`;
  }

  /* Approve / reject via one listener on the pending table. */
  pending.addEventListener("click", (e) => {
    const approveBtn = e.target.closest("button[data-approve]");
    const rejectBtn  = e.target.closest("button[data-reject]");

    if (approveBtn) {
      const conn = EMS.approveConnection(approveBtn.dataset.approve, me.id);
      if (conn) alert(`Approved. Issued consumer no. ${conn.consumerNo} and meter ${conn.meterNo}.`);
      render();
    }

    if (rejectBtn) {
      const reason = prompt("Reason for rejecting this request (optional):", "");
      if (reason === null) return;               // cancelled
      EMS.rejectConnection(rejectBtn.dataset.reject, me.id, reason.trim());
      render();
    }
  });

  render();
}
