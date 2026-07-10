/* admin/customerManagement.js — searchable customer directory. */

const session = EMS.requirePerm("customers", "../employee/login.html", "../employee/dashboard.html");
if (session) {

  // Top bar (name, nav, logout) is built once in js/chrome.js

  const rows   = document.getElementById("customerRows");
  const search = document.getElementById("search");

  function render() {
    const q = search.value.trim().toLowerCase();
    const list = EMS.getCustomers().filter(c => {
      if (!q) return true;
      const conns = EMS.connectionsForCustomer(c.id);
      const hay = [c.name, c.email, c.id, c.phone,
        ...conns.map(cn => cn.consumerNo || "")].join(" ").toLowerCase();
      return hay.includes(q);
    });

    rows.innerHTML = list.map(c => {
      const conns  = EMS.connectionsForCustomer(c.id);
      const active = conns.filter(x => x.status === "Active");
      const pend   = conns.filter(x => x.status === "Pending").length;
      const connCell = (active.map(x => x.consumerNo).join("<br />") || "—") +
        (pend ? `<br /><span class="muted" style="font-size:.72rem;">${pend} pending</span>` : "");
      return `
      <tr>
        <td><strong>${c.id}</strong></td>
        <td>${c.name}</td>
        <td>${c.email}</td>
        <td>${c.phone}</td>
        <td>${connCell}</td>
        <td>${c.address}${c.pincode ? " · " + c.pincode : ""}</td>
        <td><button class="btn btn-danger btn-sm" data-del="${c.id}">Remove</button></td>
      </tr>`;
    }).join("") ||
      `<tr class="empty"><td colspan="7">No customers match “${search.value}”.</td></tr>`;
  }

  search.addEventListener("input", render);

  rows.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-del]");
    if (btn && confirm("Remove this customer account?")) {
      EMS.removeCustomer(btn.dataset.del);
      render();
    }
  });

  render();
}
