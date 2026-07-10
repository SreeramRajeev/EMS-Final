/* employee/customerLookup.js — find a customer, see bills + complaints. */

const session = EMS.requireRole("employee", "login.html");
if (session) {

  // Top bar (name, nav, logout) is built once in js/chrome.js

  const search  = document.getElementById("search");
  const results = document.getElementById("results");

  function render() {
    const q = search.value.trim().toLowerCase();
    if (!q) {
      results.innerHTML = `<div class="glass center muted" style="padding:34px;">
        Start typing to search the customer directory.</div>`;
      return;
    }

    /* Match on name, email, id, phone, or any of the customer's
       consumer / meter numbers. */
    const matches = EMS.getCustomers().filter(c => {
      const conns = EMS.connectionsForCustomer(c.id);
      const hay = [c.name, c.email, c.id, c.phone,
        ...conns.map(cn => cn.consumerNo || ""),
        ...conns.map(cn => cn.meterNo || "")].join(" ").toLowerCase();
      return hay.includes(q);
    });

    if (!matches.length) {
      results.innerHTML = `<div class="glass center muted" style="padding:34px;">
        No customer matches “${search.value}”.</div>`;
      return;
    }

    results.innerHTML = matches.map(c => {
      const bills = EMS.billsForCustomer(c.id);
      let due = 0;                               // unpaid total for this customer
      for (const b of bills) if (b.status === "Unpaid") due += b.amount;
      const complaints = EMS.complaintsForCustomer(c.id);
      const conns = EMS.connectionsForCustomer(c.id);

      const connBadge = { Active: "paid", Pending: "in-progress", Rejected: "unpaid" };
      const connRows = conns.map(cn => `
        <tr>
          <td><strong>${cn.consumerNo || "—"}</strong></td>
          <td>${cn.category}</td>
          <td>${cn.meterNo || "—"}</td>
          <td><span class="badge ${connBadge[cn.status] || "assigned"}">${cn.status}</span></td>
        </tr>`).join("") ||
        `<tr class="empty"><td colspan="4">No connections.</td></tr>`;

      const billRows = bills.slice(-4).reverse().map(b => `
        <tr>
          <td>${b.consumerNo || "—"}</td><td>${b.month}</td>
          <td>${EMS.money(b.amount)}</td>
          <td><span class="badge ${EMS.badgeClass(b.status)}">${b.status}</span></td>
        </tr>`).join("") ||
        `<tr class="empty"><td colspan="4">No bills.</td></tr>`;

      const complaintRows = complaints.slice(-4).reverse().map(k => `
        <tr>
          <td><strong>${k.id}</strong></td><td>${k.type}</td>
          <td><span class="badge ${EMS.badgeClass(k.status)}">${k.status}</span></td>
        </tr>`).join("") ||
        `<tr class="empty"><td colspan="3">No complaints.</td></tr>`;

      return `
        <div class="glass">
          <div class="card-head">
            <div>
              <h2>${c.name} <span class="muted" style="font-size:0.8rem;">${c.id}</span></h2>
              <p class="muted">${c.email} · ${c.phone}</p>
              <p class="muted">${c.address} · ${c.pincode || ""}</p>
            </div>
            ${due ? `<span class="badge unpaid">${EMS.money(due)} due</span>`
                  : `<span class="badge paid">No dues</span>`}
          </div>

          <h3 class="mb-2 mt-2">Connections</h3>
          <table class="glass-table">
            <thead><tr><th>Consumer no.</th><th>Category</th><th>Meter</th><th>Status</th></tr></thead>
            <tbody>${connRows}</tbody>
          </table>

          <div class="grid cols-2 mt-2">
            <div>
              <h3 class="mb-2">Recent bills</h3>
              <table class="glass-table">
                <thead><tr><th>Consumer</th><th>Month</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>${billRows}</tbody>
              </table>
            </div>
            <div>
              <h3 class="mb-2">Complaints</h3>
              <table class="glass-table">
                <thead><tr><th>ID</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>${complaintRows}</tbody>
              </table>
            </div>
          </div>
        </div>`;
    }).join("");
  }

  search.addEventListener("input", render);
  render();
}
