// Load existing transactions
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

// Save to localStorage
function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Add transaction
function addTransaction(merchant, category, amount) {
  const newTransaction = {
    merchant,
    category,
    date: new Date().toLocaleDateString(),
    amount: parseFloat(amount)
  };

  transactions.push(newTransaction);
  saveTransactions();
  renderTransactions();
}

// Render transactions
function renderTransactions() {
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";

  transactions.forEach(tx => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${tx.merchant}</td>
      <td>${tx.category}</td>
      <td>${tx.date}</td>
      <td class="${tx.amount < 0 ? "negative" : "positive"}">
        ${tx.amount < 0 ? "-" : "+"}$${Math.abs(tx.amount).toFixed(2)}
      </td>
    `;

    tbody.appendChild(row);
  });

  updateMetrics();
}

// Update dashboard numbers
function updateMetrics() {
  let income = 0;
  let expenses = 0;

  transactions.forEach(tx => {
    if (tx.amount > 0) income += tx.amount;
    else expenses += tx.amount;
  });

  const balance = income + expenses;

  document.querySelectorAll(".metric-card h3")[0].innerText =
    "$" + balance.toFixed(2);

  document.querySelectorAll(".metric-card h3")[1].innerText =
    "$" + income.toFixed(2);

  document.querySelectorAll(".metric-card h3")[2].innerText =
    "$" + Math.abs(expenses).toFixed(2);
}

// Button click
document.querySelector(".cta").addEventListener("click", () => {
  const merchant = prompt("Merchant name:");
  const category = prompt("Category:");
  const amount = prompt("Amount (use negative for expense):");

  if (merchant && category && amount) {
    addTransaction(merchant, category, amount);
  }
});

// Initial render
renderTransactions();
const modal = document.getElementById("transactionModal");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

document.querySelector(".cta").addEventListener("click", () => {
  modal.style.display = "flex";
});

cancelBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

saveBtn.addEventListener("click", () => {
  const merchant = document.getElementById("merchant").value;
  const category = document.getElementById("category").value;
  const amount = document.getElementById("amount").value;

  if (merchant && category && amount) {
    addTransaction(merchant, category, amount);
    modal.style.display = "none";

    document.getElementById("merchant").value = "";
    document.getElementById("category").value = "";
    document.getElementById("amount").value = "";
  }
});