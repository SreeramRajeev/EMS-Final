/* ============================================================
   chrome.js — shared page furniture for every VoltGrid page.

   Jobs:
   1. Staff navigation — the top-bar menu is built from the signed-in
      employee's POSITION, so each person only sees links they may use.
      Staff pages opt in with: <nav id="vg-nav" data-active="billing"></nav>
   2. Identity — fills the name/role badge for whoever is logged in, and
      shows a small pop-up card (name, role, connections, log out) when
      the badge is clicked.
   3. Welcome toast — a brief "Welcome, <name>" note right after login.
   4. Footer — added to every page.
   ============================================================ */
(function () {

  /* ---- Staff menu: every link and the permission it needs ---- */
  const NAV_ITEMS = [
    { key: "work",        perm: "work",        label: "My work",         href: "../employee/dashboard.html" },
    { key: "overview",    perm: "overview",    label: "Overview",        href: "../admin/dashboard.html" },
    { key: "complaints",  perm: "complaints",  label: "Complaints",      href: "../admin/complaintManagement.html" },
    { key: "connections", perm: "connections", label: "Connections",     href: "../admin/connectionManagement.html" },
    { key: "lookup",      perm: "lookup",      label: "Customer lookup", href: "../employee/customerLookup.html" },
    { key: "billing",     perm: "billing",     label: "Billing",         href: "../admin/billing.html" },
    { key: "customers",   perm: "customers",   label: "Customers",       href: "../admin/customerManagement.html" },
    { key: "policies",    perm: "policies",    label: "Policies",        href: "../admin/policyManagement.html" },
    { key: "employees",   perm: "employees",   label: "Team",            href: "../admin/employeeManagement.html" },
  ];

  const inCustomer = () => location.pathname.includes("/customer/");
  const inAdmin    = () => location.pathname.includes("/admin/");
  function loginPath() { return inAdmin() ? "../employee/login.html" : "login.html"; }

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---- Staff top-bar menu ---- */
  function renderStaffNav(me) {
    const nav = document.getElementById("vg-nav");
    if (!nav) return;
    const active = nav.getAttribute("data-active") || "";
    nav.innerHTML = NAV_ITEMS
      .filter(item => EMS.can(me, item.perm))
      .map(item => `<a href="${item.href}"${item.key === active ? ' class="active"' : ""}>${item.label}</a>`)
      .join("");
  }

  /* ---- Identity badge + pop-up, for customers AND staff ---- */
  function renderIdentity() {
    if (typeof EMS === "undefined") return;
    const session = EMS.getSession();
    if (!session) return;

    let name = session.name, roleLine = "", email = "", connsHTML = "";

    if (session.role === "employee") {
      const me = EMS.findEmployee(session.id);
      if (!me) return;
      name = me.name;
      roleLine = EMS.positionLabel(me) + (me.dept ? " · " + me.dept : "");
      email = me.email;
      renderStaffNav(me);
    } else if (session.role === "customer") {
      const me = EMS.findCustomer(session.id);
      if (!me) return;
      name = me.name;
      roleLine = "Customer · " + me.id;
      email = me.email;
      const active = EMS.activeConnectionsForCustomer(me.id);
      const lines = active.length
        ? active.map(c => `<div class="id-conn"><strong>${esc(c.consumerNo)}</strong>
             <span>${esc(c.category)} · Meter ${esc(c.meterNo)}</span></div>`).join("")
        : `<div class="id-conn muted">No active connections yet</div>`;
      connsHTML = `<div class="id-conns"><div class="id-conns-h">Your connections</div>
          ${lines}<a class="id-conns-link" href="connections.html">Manage connections →</a></div>`;
    }

    /* Fill the header badge */
    const nameEl = document.getElementById("whoName");
    const metaEl = document.getElementById("whoMeta");
    if (nameEl) nameEl.textContent = name;
    if (metaEl) metaEl.textContent = roleLine;

    /* Header "Log out" button */
    const out = document.getElementById("logoutBtn");
    if (out) out.addEventListener("click", () => EMS.logout(loginPath()));

    /* Build the click-to-open pop-up */
    const who = document.querySelector(".topbar .who");
    if (!who) return;
    who.classList.add("who-btn");
    who.setAttribute("title", "Account");

    const pop = document.createElement("div");
    pop.className = "id-popup";
    pop.hidden = true;
    pop.innerHTML = `
      <div class="id-popup-name">${esc(name)}</div>
      <div class="id-popup-role">${esc(roleLine)}</div>
      ${email ? `<div class="id-popup-sub">${esc(email)}</div>` : ""}
      ${connsHTML}
      <button class="btn btn-ghost btn-sm id-popup-out">Log out</button>`;
    document.body.appendChild(pop);

    function place() {
      const r = who.getBoundingClientRect();
      pop.style.top = (r.bottom + 10) + "px";
      pop.style.right = Math.max(12, window.innerWidth - r.right) + "px";
    }
    who.addEventListener("click", (e) => {
      e.stopPropagation();
      if (pop.hidden) { place(); pop.hidden = false; }
      else pop.hidden = true;
    });
    document.addEventListener("click", (e) => {
      if (!pop.hidden && !pop.contains(e.target)) pop.hidden = true;
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") pop.hidden = true; });
    pop.querySelector(".id-popup-out").addEventListener("click", () => EMS.logout(loginPath()));
  }

  /* ---- Welcome toast (set by the login pages) ---- */
  function welcomeToast() {
    let name;
    try { name = sessionStorage.getItem("ems_welcome"); } catch (e) { return; }
    if (!name) return;
    sessionStorage.removeItem("ems_welcome");

    const t = document.createElement("div");
    t.className = "vg-toast";
    t.innerHTML = `<span class="vg-toast-bolt">⚡</span> Welcome, ${esc(name)}!`;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, 3200);
  }

  /* ---- Footer ---- */
  function footerHTML() {
    const year = new Date().getFullYear();
    return `
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div class="sf-brand">
          <div class="brand"><span class="bolt">⚡</span><span>VoltGrid<small>Electricity Management</small></span></div>
          <p>Metering, billing, payments and complaints for the whole grid — one connected system for customers and staff.</p>
          <p class="sf-status"><span class="dot"></span> Grid online · all services operational</p>
        </div>
        <div class="sf-cols">
          <div class="sf-col">
            <h4>Services</h4>
            <a href="#">View &amp; pay bills</a>
            <a href="#">New connection</a>
            <a href="#">Tariffs &amp; policies</a>
            <a href="#">Rooftop solar</a>
          </div>
          <div class="sf-col">
            <h4>Support</h4>
            <a href="#">Help center</a>
            <a href="#">Report an outage</a>
            <a href="#">Raise a complaint</a>
            <a href="#">Contact us</a>
          </div>
          <div class="sf-col">
            <h4>Company</h4>
            <a href="#">About VoltGrid</a>
            <a href="#">Careers</a>
            <a href="#">Newsroom</a>
            <a href="#">Sustainability</a>
          </div>
          <div class="sf-col sf-contact">
            <h4>Get in touch</h4>
            <a href="tel:1800111222">📞 1800-111-222 (24×7)</a>
            <a href="mailto:care@voltgrid.com">✉️ care@voltgrid.com</a>
            <span>Grid House, MG Road, Kochi 682001</span>
          </div>
        </div>
      </div>
      <div class="site-footer-bar">
        <span>© ${year} VoltGrid Energy. All rights reserved.</span>
        <nav class="sf-legal">
          <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Cookies</a><a href="#">Accessibility</a>
        </nav>
      </div>
    </footer>`;
  }
  function renderFooter() {
    if (document.querySelector(".site-footer")) return;
    document.body.insertAdjacentHTML("beforeend", footerHTML());
  }

  /* ---- Boot ---- */
  document.addEventListener("DOMContentLoaded", () => {
    renderIdentity();
    welcomeToast();
    renderFooter();
  });

})();
