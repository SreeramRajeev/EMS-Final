/* ============================================================
   data.js — single source of truth for the whole demo.
   Data lives in localStorage so it survives page navigation
   and reloads during the presentation. Call EMS.resetDemo()
   from the console to restore the seed data at any time.
   ============================================================ */

const EMS = (() => {

  const STORE_KEY = "ems_data_v3";   // v3: added service connections (one customer -> many meters)

  /* ---------- Roles & positions ----------
     There are only two kinds of account: customers and employees.
     Every employee holds a POSITION, and the position decides what
     that person can see and do. Positions are tiered:

       Grid Manager (tier 3) — full control of the grid. Sets tariffs,
         generates bills, manages customers and staff, sees the whole
         complaint board, and routes complaints down to anyone below.
       Supervisor  (tier 2) — runs day-to-day operations: billing,
         customer accounts and the complaint board, and can assign
         complaints down to field agents.
       Field Agent (tier 1) — works the complaints assigned to them
         and looks up customer accounts in the field.

     A position grants a set of capability keys (see PERMS below). The
     nav, page guards and buttons all read from these keys, so power
     follows the position automatically.                              */
  const POSITIONS = {
    "Grid Manager": {
      tier: 3,
      // No personal "work" queue — a manager oversees and routes, they are
      // never assigned complaints themselves. They get every console screen.
      perms: ["overview", "complaints", "assign", "connections", "lookup",
              "billing", "customers", "policies", "employees"],
    },
    "Supervisor": {
      tier: 2,
      perms: ["work", "overview", "complaints", "assign", "connections",
              "lookup", "billing", "customers"],
    },
    "Field Agent": {
      tier: 1,
      perms: ["work", "lookup"],
    },
  };
  const DEFAULT_POSITION = "Field Agent";

  /* ---------- Seed data (used on first load / after reset) ---------- */
  function seedData() {
    return {
      customers: [
        { id: "C1001", name: "Anita Menon",  email: "anita@example.com",  phone: "9876543210",
          address: "12 Palm Grove, Kochi", pincode: "682001", password: "anita123" },
        { id: "C1002", name: "Ravi Kumar",   email: "ravi@example.com",   phone: "9812345678",
          address: "44 Lake View, Trivandrum", pincode: "695001", password: "ravi123" },
      ],

      /* Service connections. One customer can hold several. A connection
         only gets a consumer number + meter number once staff APPROVE it;
         a brand-new request stays "Pending" with both fields null.        */
      connections: [
        { id: "CX1", customerId: "C1001", consumerNo: "CNS100001", meterNo: "MTR-58291",
          category: "Domestic",   address: "12 Palm Grove, Kochi",      pincode: "682001",
          status: "Active",  requestedAt: "2026-01-10 09:00", decidedAt: "2026-01-12 11:30", decidedBy: "E501", reason: "" },
        { id: "CX2", customerId: "C1001", consumerNo: "CNS100002", meterNo: "MTR-58292",
          category: "Commercial", address: "5 Marine Drive, Kochi",     pincode: "682031",
          status: "Active",  requestedAt: "2026-02-02 14:20", decidedAt: "2026-02-05 10:05", decidedBy: "E501", reason: "" },
        { id: "CX3", customerId: "C1002", consumerNo: "CNS100003", meterNo: "MTR-77410",
          category: "Domestic",   address: "44 Lake View, Trivandrum",  pincode: "695001",
          status: "Active",  requestedAt: "2026-01-15 08:40", decidedAt: "2026-01-18 09:15", decidedBy: "E502", reason: "" },
        { id: "CX4", customerId: "C1002", consumerNo: null,        meterNo: null,
          category: "Commercial", address: "9 Market Road, Trivandrum", pincode: "695002",
          status: "Pending", requestedAt: "2026-06-30 16:10", decidedAt: null, decidedBy: null, reason: "" },
      ],

      employees: [
        { id: "E501", name: "Suresh Nair", email: "suresh@voltgrid.com", phone: "9900112233",
          dept: "Field Operations", position: "Grid Manager", password: "suresh123" },
        { id: "E502", name: "Priya Das",   email: "priya@voltgrid.com",  phone: "9900445566",
          dept: "Billing Support",  position: "Supervisor",   password: "priya123" },
        { id: "E503", name: "Arjun Rao",   email: "arjun@voltgrid.com",  phone: "9900778899",
          dept: "Line Maintenance", position: "Field Agent",  password: "arjun123" },
      ],

      policies: [
        { id: "P1", name: "Domestic — Slab A (0–200 units)", ratePerUnit: 4.5,
          description: "Standard household tariff for monthly usage up to 200 units." },
        { id: "P2", name: "Domestic — Slab B (201–500 units)", ratePerUnit: 6.25,
          description: "Household tariff for monthly usage between 201 and 500 units." },
        { id: "P3", name: "Green Rooftop Rebate", ratePerUnit: 3.75,
          description: "Discounted rate for homes with registered rooftop solar panels." },
      ],

      bills: [
        { id: "B9001", connectionId: "CX1", consumerNo: "CNS100001", customerId: "C1001",
          month: "May 2026",  units: 182, amount: 819.0,  dueDate: "2026-06-15", status: "Paid" },
        { id: "B9002", connectionId: "CX1", consumerNo: "CNS100001", customerId: "C1001",
          month: "June 2026", units: 214, amount: 1237.5, dueDate: "2026-07-15", status: "Unpaid" },
        { id: "B9003", connectionId: "CX3", consumerNo: "CNS100003", customerId: "C1002",
          month: "June 2026", units: 158, amount: 711.0,  dueDate: "2026-07-15", status: "Unpaid" },
      ],

      complaints: [
        { id: "K7001", customerId: "C1002", type: "Power outage",
          description: "Frequent power cuts in Lake View area every evening after 7 pm.",
          status: "Open", assignedTo: null, createdAt: "2026-06-28 10:14",
          updates: [ { at: "2026-06-28 10:14", what: "Complaint registered", note: "" } ] },
      ],

      payments: [
        { id: "T3001", billId: "B9001", customerId: "C1001", amount: 819.0,
          method: "Card", date: "2026-06-10 18:22" },
      ],

      nextIds: { customer: 1003, employee: 504, policy: 4, bill: 9004, complaint: 7002,
                 payment: 3002, connection: 5, consumer: 100004, meter: 60000 },
    };
  }

  /* ---------- Load / save ---------- */
  function load() {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
    const fresh = seedData();
    localStorage.setItem(STORE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  function save(data) {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  function resetDemo() {
    localStorage.removeItem(STORE_KEY);
    sessionStorage.clear();
    location.reload();
  }

  /* ---------- Small utilities ---------- */
  const now = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const money = (n) => "₹" + Number(n).toFixed(2);

  const nextId = (kind, prefix) => {
    const d = load();
    const id = prefix + d.nextIds[kind];
    d.nextIds[kind] += 1;
    save(d);
    return id;
  };

  /* ---------- Session (who is logged in) ---------- */
  function setSession(role, id, name) {
    sessionStorage.setItem("ems_session", JSON.stringify({ role, id, name }));
  }
  function getSession() {
    const raw = sessionStorage.getItem("ems_session");
    return raw ? JSON.parse(raw) : null;
  }
  function logout(toLogin) {
    sessionStorage.removeItem("ems_session");
    location.href = toLogin;
  }
  /* Redirect to login if the visitor is not signed in with the right role. */
  function requireRole(role, loginPage) {
    const s = getSession();
    if (!s || s.role !== role) { location.href = loginPage; return null; }
    return s;
  }

  /* Require a signed-in employee (any position). */
  function requireEmployee(loginPage) {
    return requireRole("employee", loginPage);
  }

  /* Require an employee who holds a specific capability. Not signed in
     → login page; signed in but lacking the capability → their own
     dashboard (so a field agent can't reach a manager-only screen).  */
  function requirePerm(perm, loginPage, dashPage) {
    const s = requireEmployee(loginPage);
    if (!s) return null;
    const emp = findEmployee(s.id);
    if (!emp || !can(emp, perm)) { location.href = dashPage; return null; }
    return s;
  }

  /* ---------- Auth ---------- */
  /* Customers may sign in with EITHER their email OR their Customer ID
     (e.g. "C1001"). Both are matched case-insensitively.               */
  function loginCustomer(idOrEmail, password) {
    const q = String(idOrEmail).trim().toLowerCase();
    return load().customers.find(c =>
      (c.email.toLowerCase() === q || c.id.toLowerCase() === q) && c.password === password) || null;
  }
  function loginEmployee(email, password) {
    return load().employees.find(e => e.email === email && e.password === password) || null;
  }

  /* ---------- Customers ---------- */
  const getCustomers   = () => load().customers;
  const findCustomer   = (id) => load().customers.find(c => c.id === id) || null;
  const customerByMail = (email) => load().customers.find(c => c.email === email) || null;

  function addCustomer(cust) {
    const d = load();
    cust.id = "C" + d.nextIds.customer;
    d.nextIds.customer += 1;
    d.customers.push(cust);
    save(d);
    return cust;
  }
  function removeCustomer(id) {
    const d = load();
    d.customers = d.customers.filter(c => c.id !== id);
    save(d);
  }

  /* ---------- Service connections ----------
     A customer requests a connection; it stays "Pending" until a staff
     member with the "connections" permission approves it, at which point
     a consumer number and meter number are issued and it becomes "Active"
     (or is "Rejected" with a reason). Bills attach to a connection.      */
  const getConnections            = () => load().connections;
  const findConnection            = (id)  => load().connections.find(x => x.id === id) || null;
  const connectionsForCustomer    = (cid) => load().connections.filter(x => x.customerId === cid);
  const activeConnectionsForCustomer = (cid) => connectionsForCustomer(cid).filter(x => x.status === "Active");
  const pendingConnections        = () => load().connections.filter(x => x.status === "Pending");
  const findConnectionByConsumer  = (no) => load().connections.find(x => x.consumerNo === no) || null;

  function requestConnection(customerId, info) {
    const d = load();
    const conn = {
      id: "CX" + d.nextIds.connection,
      customerId,
      consumerNo: null, meterNo: null,          // issued only on approval
      category: info.category || "Domestic",
      address: info.address, pincode: info.pincode,
      status: "Pending",
      requestedAt: now(), decidedAt: null, decidedBy: null, reason: "",
    };
    d.nextIds.connection += 1;
    d.connections.push(conn);
    save(d);
    return conn;
  }

  function approveConnection(connId, staffId) {
    const d = load();
    const conn = d.connections.find(x => x.id === connId);
    if (!conn || conn.status !== "Pending") return null;
    conn.status     = "Active";
    conn.consumerNo = "CNS" + d.nextIds.consumer;   // issue consumer number
    conn.meterNo    = "MTR-" + d.nextIds.meter;     // issue meter number
    conn.decidedAt  = now();
    conn.decidedBy  = staffId;
    d.nextIds.consumer += 1;
    d.nextIds.meter    += 1;
    save(d);
    return conn;
  }

  function rejectConnection(connId, staffId, reason) {
    const d = load();
    const conn = d.connections.find(x => x.id === connId);
    if (!conn || conn.status !== "Pending") return null;
    conn.status    = "Rejected";
    conn.decidedAt = now();
    conn.decidedBy = staffId;
    conn.reason    = reason || "";
    save(d);
    return conn;
  }

  /* ---------- Employees ---------- */
  const getEmployees = () => load().employees;
  const findEmployee = (id) => load().employees.find(e => e.id === id) || null;

  /* ----- Position & permissions ----- */
  const listPositions = () => Object.keys(POSITIONS);
  const positionLabel = (emp) => (emp && emp.position) ? emp.position : DEFAULT_POSITION;
  const positionOf    = (emp) => POSITIONS[positionLabel(emp)] || POSITIONS[DEFAULT_POSITION];
  const tierOf        = (emp) => positionOf(emp).tier;
  const permsOf       = (emp) => positionOf(emp).perms;
  const can           = (emp, perm) => permsOf(emp).includes(perm);

  /* Employees this person is allowed to route complaints to: anyone on
     a strictly lower tier. A Grid Manager reaches supervisors and field
     agents; a Supervisor reaches field agents; a Field Agent, no one.  */
  function assignableEmployees(emp) {
    if (!emp || !can(emp, "assign")) return [];
    const myTier = tierOf(emp);
    return load().employees.filter(e => e.id !== emp.id && tierOf(e) < myTier);
  }

  function addEmployee(emp) {
    const d = load();
    emp.id = "E" + d.nextIds.employee;
    emp.position = POSITIONS[emp.position] ? emp.position : DEFAULT_POSITION;
    d.nextIds.employee += 1;
    d.employees.push(emp);
    save(d);
    return emp;
  }
  function removeEmployee(id) {
    const d = load();
    d.employees = d.employees.filter(e => e.id !== id);
    /* unassign this employee from any open complaints */
    d.complaints.forEach(k => { if (k.assignedTo === id && k.status !== "Resolved") { k.assignedTo = null; k.status = "Open"; } });
    save(d);
  }

  /* ---------- Policies ---------- */
  const getPolicies = () => load().policies;

  function addPolicy(p) {
    const d = load();
    p.id = "P" + d.nextIds.policy;
    d.nextIds.policy += 1;
    d.policies.push(p);
    save(d);
  }
  function updatePolicy(id, fields) {
    const d = load();
    const p = d.policies.find(x => x.id === id);
    if (p) Object.assign(p, fields);
    save(d);
  }
  function removePolicy(id) {
    const d = load();
    d.policies = d.policies.filter(p => p.id !== id);
    save(d);
  }

  /* ---------- Bills & payments ---------- */
  const getBills = () => load().bills;
  const billsForCustomer = (customerId) => load().bills.filter(b => b.customerId === customerId);
  const billsForConnection = (connId) => load().bills.filter(b => b.connectionId === connId);
  const findBill = (id) => load().bills.find(b => b.id === id) || null;

  /* ---------- Billing engine ----------
     Bills are generated from metered consumption using tiered slab
     tariffs. The slab rates are read live from the policy table, so
     editing a policy in Policy Management changes what new bills cost.
     Two modes:
       "standard" — first 200 units at Slab A, the rest at Slab B.
       "green"    — flat Green Rooftop rate for solar homes.
     A fixed monthly service charge is added on top of energy usage.  */
  const SLAB_LIMIT     = 200;   // units before the higher slab kicks in
  const SERVICE_CHARGE = 50;    // fixed ₹/month connection charge

  /* Pull the three tariff rates from policies, matched by id first and
     then by keyword, with sensible fallbacks if a policy was removed. */
  function tariffRates() {
    const ps = load().policies;
    const byId = (id) => ps.find(p => p.id === id);
    const byWord = (w) => ps.find(p => p.name.toLowerCase().includes(w));
    const rate = (p, fb) => (p ? Number(p.ratePerUnit) : fb);
    return {
      slabA: rate(byId("P1") || byWord("slab a"), 4.5),
      slabB: rate(byId("P2") || byWord("slab b"), 6.25),
      green: rate(byId("P3") || byWord("green"),  3.75),
    };
  }

  /* Pure calculator: units + mode -> an itemised breakdown.
     Returns { units, mode, lines:[{label,amount}], energy,
               serviceCharge, total, rates }.                       */
  function computeBill(units, mode) {
    units = Math.max(0, Number(units) || 0);
    const r = tariffRates();
    const lines = [];
    let energy = 0;

    if (mode === "green") {
      energy = units * r.green;
      lines.push({ label: `${units} units × ₹${r.green.toFixed(2)} · Green rooftop`, amount: energy });
    } else {
      const t1 = Math.min(units, SLAB_LIMIT);
      const t2 = Math.max(0, units - SLAB_LIMIT);
      if (t1 > 0) {
        const amt = t1 * r.slabA;
        energy += amt;
        lines.push({ label: `${t1} units × ₹${r.slabA.toFixed(2)} · Slab A`, amount: amt });
      }
      if (t2 > 0) {
        const amt = t2 * r.slabB;
        energy += amt;
        lines.push({ label: `${t2} units × ₹${r.slabB.toFixed(2)} · Slab B`, amount: amt });
      }
      if (units === 0) lines.push({ label: "No consumption recorded", amount: 0 });
    }

    const total = energy + SERVICE_CHARGE;
    return { units, mode: mode || "standard", lines, energy,
             serviceCharge: SERVICE_CHARGE, total: Math.round(total * 100) / 100, rates: r };
  }

  /* Create a bill for a customer. Pass { customerId, month, units,
     amount, dueDate }; id and Unpaid status are filled in here.     */
  function addBill(bill) {
    const d = load();
    bill.id = "B" + d.nextIds.bill;
    bill.status = bill.status || "Unpaid";
    d.nextIds.bill += 1;
    d.bills.push(bill);
    save(d);
    return bill;
  }

  /* Marks a bill as paid and records the transaction. Returns the payment. */
  function payBill(billId, method) {
    const d = load();
    const bill = d.bills.find(b => b.id === billId);
    if (!bill || bill.status === "Paid") return null;
    bill.status = "Paid";
    const payment = {
      id: "T" + d.nextIds.payment,
      billId: bill.id,
      customerId: bill.customerId,
      amount: bill.amount,
      method,
      date: now(),
    };
    d.nextIds.payment += 1;
    d.payments.push(payment);
    save(d);
    return payment;
  }

  /* ---------- Complaints ---------- */
  const getComplaints = () => load().complaints;
  const findComplaint = (id) => load().complaints.find(k => k.id === id) || null;
  const complaintsForCustomer = (cid) => load().complaints.filter(k => k.customerId === cid);
  const complaintsForEmployee = (eid) => load().complaints.filter(k => k.assignedTo === eid);

  function addComplaint(customerId, type, description) {
    const d = load();
    const k = {
      id: "K" + d.nextIds.complaint,
      customerId, type, description,
      status: "Open", assignedTo: null, createdAt: now(),
      updates: [{ at: now(), what: "Complaint registered", note: "" }],
    };
    d.nextIds.complaint += 1;
    d.complaints.push(k);
    save(d);
    return k;
  }

  /* Admin action: hand a complaint to an employee. */
  function assignComplaint(complaintId, employeeId) {
    const d = load();
    const k = d.complaints.find(x => x.id === complaintId);
    const e = d.employees.find(x => x.id === employeeId);
    if (!k || !e) return;
    k.assignedTo = employeeId;
    k.status = "Assigned";
    k.updates.push({ at: now(), what: "Assigned to " + e.name, note: "" });
    save(d);
  }

  /* Employee action: move the complaint along its lifecycle. */
  function updateComplaintStatus(complaintId, status, note) {
    const d = load();
    const k = d.complaints.find(x => x.id === complaintId);
    if (!k) return;
    k.status = status;
    k.updates.push({ at: now(), what: "Status changed to " + status, note: note || "" });
    save(d);
  }

  /* Turn a status string into the matching badge CSS class. */
  const badgeClass = (status) => status.toLowerCase().replace(/\s+/g, "-");

  /* ---------- Public API ---------- */
  return {
    resetDemo, now, money, badgeClass,
    setSession, getSession, logout, requireRole, requireEmployee, requirePerm,
    loginCustomer, loginEmployee,
    getCustomers, findCustomer, customerByMail, addCustomer, removeCustomer,
    getConnections, findConnection, findConnectionByConsumer,
    connectionsForCustomer, activeConnectionsForCustomer, pendingConnections,
    requestConnection, approveConnection, rejectConnection,
    getEmployees, findEmployee, addEmployee, removeEmployee,
    listPositions, positionLabel, positionOf, tierOf, permsOf, can, assignableEmployees,
    getPolicies, addPolicy, updatePolicy, removePolicy,
    getBills, billsForCustomer, billsForConnection, findBill, payBill,
    tariffRates, computeBill, addBill,
    getComplaints, findComplaint, complaintsForCustomer, complaintsForEmployee,
    addComplaint, assignComplaint, updateComplaintStatus,
  };
})();
