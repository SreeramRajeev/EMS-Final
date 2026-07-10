/* customer/connections.js — view your connections and request new ones. */

const session = EMS.requireRole("customer", "login.html");
if (session) {

  const me = EMS.findCustomer(session.id);
  // Identity + log out are handled by js/chrome.js

  const list  = document.getElementById("connList");
  const alert = document.getElementById("alert");

  /* Status → badge colour (reusing existing badge styles). */
  const badge = { Active: "paid", Pending: "in-progress", Rejected: "unpaid" };

  function render() {
    const conns = EMS.connectionsForCustomer(me.id).slice().reverse();

    list.innerHTML = conns.map(cn => {
      let detail;
      if (cn.status === "Active") {
        detail = `<p class="conn-detail">Consumer no. <strong>${cn.consumerNo}</strong> · Meter ${cn.meterNo}</p>`;
      } else if (cn.status === "Rejected") {
        detail = `<p class="conn-detail">Not approved${cn.reason ? " — " + cn.reason : ""}.</p>`;
      } else {
        detail = `<p class="conn-detail">Awaiting staff approval — your consumer number and meter will appear here once approved.</p>`;
      }
      return `
        <div class="conn-item">
          <div class="card-head" style="margin-bottom:4px;">
            <div>
              <h3 style="margin:0;">${cn.category}</h3>
              <p class="muted" style="font-size:.8rem;">${cn.address} · ${cn.pincode}</p>
            </div>
            <span class="badge ${badge[cn.status] || "assigned"}">${cn.status}</span>
          </div>
          ${detail}
          <p class="muted" style="font-size:.72rem;">Requested ${cn.requestedAt}</p>
        </div>`;
    }).join("") ||
    `<p class="muted">No connections yet — request your first one on the left.</p>`;
  }

  document.getElementById("reqBtn").addEventListener("click", () => {
    const ok = V.validate([
      { id: "caddress", checks: [[V.required, "Service address is required"]] },
      { id: "cpincode", checks: [[V.required, "PIN code is required"], [V.pincode, "Enter a valid 6-digit PIN code"]] },
    ]);
    if (!ok) return;

    const conn = EMS.requestConnection(me.id, {
      address:  document.getElementById("caddress").value.trim(),
      pincode:  document.getElementById("cpincode").value.trim(),
      category: document.getElementById("ccategory").value,
    });

    alert.innerHTML = `Request submitted for <strong>${conn.category}</strong> connection at ${conn.address}. It's now pending staff approval.`;
    alert.classList.add("show");
    document.getElementById("caddress").value = "";
    document.getElementById("cpincode").value = "";
    render();
  });

  V.liveClear(["caddress", "cpincode"]);
  render();
}
