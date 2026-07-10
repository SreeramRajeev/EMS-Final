/* customer/login.js — sign a customer in and route to the dashboard. */

document.getElementById("loginBtn").addEventListener("click", () => {
  const ok = V.validate([
    { id: "email",    checks: [[V.required, "Email or Customer ID is required"], [V.emailOrId, "Enter a valid email or Customer ID (e.g. C1001)"]] },
    { id: "password", checks: [[V.required, "Password is required"]] },
  ]);
  if (!ok) return;

  const idOrEmail = document.getElementById("email").value.trim();
  const password  = document.getElementById("password").value;

  const customer = EMS.loginCustomer(idOrEmail, password);
  if (!customer) {
    const alert = document.getElementById("alert");
    alert.textContent = "No account matches those details.";
    alert.classList.add("show");
    return;
  }

  EMS.setSession("customer", customer.id, customer.name);
  sessionStorage.setItem("ems_welcome", customer.name);   // shows a welcome toast on the dashboard
  location.href = "dashboard.html";
});

V.liveClear(["email", "password"]);
