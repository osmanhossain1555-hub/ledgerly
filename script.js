let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

const modal = document.getElementById("transactionModal");
const merchantEl = document.getElementById("merchant");
const categoryEl = document.getElementById("category");
const amountEl = document.getElementById("amount");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const closeBtn = document.getElementById("closeBtn");
const addBtn = document.querySelector(".cta");
const metricH3s = document.querySelectorAll(".metric-card h3");
const metricNotes = document.querySelectorAll(".metric-card span");
const tbody = document.querySelector(".transactions-panel tbody");

function openModal() {
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setTimeout(() => merchantEl.focus(), 0);
}
function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

addBtn.addEventListener("click", openModal);
cancelBtn.addEventListener("click", closeModal);
closeBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("show")) closeModal(); });

function addTransaction(merchant, category, amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num === 0) return;

  transactions.unshift({
    id: Date.now().toString(),
    merchant: merchant.trim(),
    category: category.trim(),
    date: new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" }),
    amount: num
  });

  if (transactions.length > 5000) transactions = transactions.slice(0, 5000);
  saveTransactions();
  renderTransactions();
}

function renderTransactions() {
  tbody.innerHTML = "";
  const recent = transactions.slice(0, 20);

  if (!recent.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" style="color:#6f7688;padding:18px 8px;">No transactions yet. Tap <strong>+ Add transaction</strong> to start.</td>`;
    tbody.appendChild(tr);
  }

  for (const tx of recent) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(tx.merchant)}</td>
      <td>${escapeHtml(tx.category)}</td>
      <td>${escapeHtml(tx.date)}</td>
      <td class="${tx.amount < 0 ? "negative" : "positive"}">
        ${tx.amount < 0 ? "-" : "+"}$${Math.abs(tx.amount).toFixed(2)}
      </td>
    `;
    tbody.appendChild(tr);
  }

  updateMetrics();
}

function updateMetrics() {
  let income = 0;
  let expenses = 0;

  for (const tx of transactions) {
    if (tx.amount > 0) income += tx.amount;
    else expenses += tx.amount;
  }

  const balance = income + expenses;
  const savingsRate = income > 0 ? Math.max(0, ((balance / income) * 100)) : 0;

  if (metricH3s[0]) metricH3s[0].textContent = "$" + balance.toFixed(2);
  if (metricH3s[1]) metricH3s[1].textContent = "$" + income.toFixed(2);
  if (metricH3s[2]) metricH3s[2].textContent = "$" + Math.abs(expenses).toFixed(2);
  if (metricH3s[3]) metricH3s[3].textContent = Math.round(savingsRate) + "%";

  if (metricNotes[0]) metricNotes[0].textContent = balance >= 0 ? "Looking healthy" : "Needs attention";
  if (metricNotes[1]) metricNotes[1].textContent = income > 0 ? "Income recorded" : "No income yet";
  if (metricNotes[2]) metricNotes[2].textContent = expenses < 0 ? "Spending tracked" : "No expenses yet";
  if (metricNotes[3]) metricNotes[3].textContent = income > 0 ? "Auto-calculated" : "Add income first";
}

saveBtn.addEventListener("click", () => {
  const merchant = merchantEl.value;
  const category = categoryEl.value;
  const amount = amountEl.value;
  if (!merchant || !category || !amount) return;
  addTransaction(merchant, category, amount);
  merchantEl.value = "";
  categoryEl.value = "";
  amountEl.value = "";
  closeModal();
});

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderTransactions();
