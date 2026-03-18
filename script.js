const STORAGE_KEY = "peeduiteun_budget_v2";
const LAST_NOTIFY_KEY = "peeduiteun_budget_last_notify";

const CATEGORY_META = {
  "House Bills": { icon: "🏠", color: "#4b4ad7" },
  "Food & Drink": { icon: "🍽", color: "#68c6e8" },
  "Internet Bills": { icon: "🌐", color: "#ff7531" },
  "Transport": { icon: "🚗", color: "#5aaec5" },
  "Entertainment": { icon: "🎉", color: "#865df5" },
  "Shopping": { icon: "🛍", color: "#f29b38" },
  "Health": { icon: "💊", color: "#7bc89e" },
  "Savings": { icon: "💰", color: "#4a7df1" }
};

const DEFAULT_BUDGETS = {
  "House Bills": 1200,
  "Food & Drink": 650,
  "Internet Bills": 250,
  "Transport": 320,
  "Entertainment": 260,
  "Shopping": 420,
  "Health": 160,
  "Savings": 700
};

let deferredPrompt = null;
let state = loadState();

const els = {
  screens: [...document.querySelectorAll(".screen")],
  tabs: [...document.querySelectorAll(".tab")],
  monthLabel: document.getElementById("monthLabel"),
  totalSpentLabel: document.getElementById("totalSpentLabel"),
  spendRatioLabel: document.getElementById("spendRatioLabel"),
  netIncomeLabel: document.getElementById("netIncomeLabel"),
  expenseLabel: document.getElementById("expenseLabel"),
  recentExpenseList: document.getElementById("recentExpenseList"),
  budgetDonut: document.getElementById("budgetDonut"),
  budgetLegend: document.getElementById("budgetLegend"),
  budgetUsageLabel: document.getElementById("budgetUsageLabel"),
  advisorText: document.getElementById("advisorText"),
  categoryProgressList: document.getElementById("categoryProgressList"),
  selectedCategoryIcon: document.getElementById("selectedCategoryIcon"),
  selectedCategoryName: document.getElementById("selectedCategoryName"),
  budgetAmountInput: document.getElementById("budgetAmountInput"),
  categoryGrid: document.getElementById("categoryGrid"),
  incomeInput: document.getElementById("incomeInput"),
  installBtn: document.getElementById("installBtn"),
  transactionModal: document.getElementById("transactionModal"),
  modalTitle: document.getElementById("modalTitle"),
  transactionForm: document.getElementById("transactionForm"),
  transactionId: document.getElementById("transactionId"),
  transactionTitle: document.getElementById("transactionTitle"),
  transactionAmount: document.getElementById("transactionAmount"),
  transactionType: document.getElementById("transactionType"),
  transactionCategory: document.getElementById("transactionCategory"),
  transactionDate: document.getElementById("transactionDate"),
  transactionNote: document.getElementById("transactionNote"),
  deleteTransactionBtn: document.getElementById("deleteTransactionBtn"),
  trendChart: document.getElementById("trendChart"),
  chartStartLabel: document.getElementById("chartStartLabel"),
  chartMidLabel: document.getElementById("chartMidLabel"),
  chartEndLabel: document.getElementById("chartEndLabel"),
  toast: document.getElementById("toast"),
  importInput: document.getElementById("importInput"),
  notifyPermissionBtn: document.getElementById("notifyPermissionBtn")
};

bindEvents();
renderApp();
registerPWA();

function createSeedState() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = (day) => new Date(year, month, day, 12).toISOString();

  return {
    monthlyIncome: 3200,
    budgets: { ...DEFAULT_BUDGETS },
    selectedCategory: "Internet Bills",
    transactions: [
      {
        id: crypto.randomUUID(),
        title: "Salary",
        type: "income",
        category: "Income",
        amount: 3200,
        date: date(1),
        note: "Base monthly income"
      },
      {
        id: crypto.randomUUID(),
        title: "Kost Ibu Nur",
        type: "expense",
        category: "House Bills",
        amount: 799,
        date: date(4),
        note: "Rent payment"
      },
      {
        id: crypto.randomUUID(),
        title: "Groceries",
        type: "expense",
        category: "Food & Drink",
        amount: 200,
        date: date(9),
        note: "Weekly food shop"
      },
      {
        id: crypto.randomUUID(),
        title: "Internet Plan",
        type: "expense",
        category: "Internet Bills",
        amount: 140,
        date: date(12),
        note: "Home internet"
      },
      {
        id: crypto.randomUUID(),
        title: "Car Maintenance",
        type: "expense",
        category: "Transport",
        amount: 270,
        date: date(17),
        note: "Oil and service"
      },
      {
        id: crypto.randomUUID(),
        title: "IndiMeme",
        type: "expense",
        category: "Shopping",
        amount: 430,
        date: date(22),
        note: "Online purchase"
      },
      {
        id: crypto.randomUUID(),
        title: "Dinner Out",
        type: "expense",
        category: "Food & Drink",
        amount: 72,
        date: date(25),
        note: "Weekend dinner"
      }
    ]
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (error) {
    console.error(error);
    return createSeedState();
  }
}

function normalizeState(data) {
  const fresh = createSeedState();
  const mergedBudgets = { ...DEFAULT_BUDGETS, ...(data?.budgets || {}) };
  const selectedCategory = mergedBudgets[data?.selectedCategory] !== undefined
    ? data.selectedCategory
    : "Internet Bills";
  return {
    monthlyIncome: Number(data?.monthlyIncome ?? fresh.monthlyIncome),
    budgets: mergedBudgets,
    selectedCategory,
    transactions: Array.isArray(data?.transactions) && data.transactions.length
      ? data.transactions.map((tx) => ({
          id: tx.id || crypto.randomUUID(),
          title: tx.title || "Untitled",
          type: tx.type === "income" ? "income" : "expense",
          category: tx.category || (tx.type === "income" ? "Income" : selectedCategory),
          amount: Number(tx.amount) || 0,
          date: tx.date || new Date().toISOString(),
          note: tx.note || ""
        }))
      : fresh.transactions
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchScreen(tab.dataset.target));
  });

  document.getElementById("openModalFromHome").addEventListener("click", () => openTransactionModal());
  document.getElementById("openModalFromBudget").addEventListener("click", () => openTransactionModal());
  document.getElementById("closeModalBtn").addEventListener("click", closeTransactionModal);
  document.querySelector("[data-close-modal='true']").addEventListener("click", closeTransactionModal);

  document.getElementById("backToBudgetBtn").addEventListener("click", () => switchScreen("budget"));
  document.getElementById("saveBudgetBtn").addEventListener("click", saveBudgetForSelectedCategory);
  document.getElementById("editBudgetNameBtn").addEventListener("click", () => els.budgetAmountInput.focus());
  document.getElementById("saveIncomeBtn").addEventListener("click", saveMonthlyIncome);
  document.getElementById("budgetResetBtn").addEventListener("click", resetDemoData);
  document.getElementById("menuBtn").addEventListener("click", () => toast("Navigation kept minimal for this app."));
  document.getElementById("moreBtn").addEventListener("click", () => switchScreen("settings"));
  document.getElementById("advisorAction").addEventListener("click", () => toast(buildAdvisorMessage()));
  document.getElementById("notifyBtn").addEventListener("click", () => {
    const summary = summarize();
    toast(`Spent ${formatCurrency(summary.expenses)} of ${formatCurrency(summary.netIncome)} this cycle.`);
  });

  els.transactionType.addEventListener("change", syncTransactionCategoryOptions);
  els.transactionForm.addEventListener("submit", handleTransactionSubmit);
  els.deleteTransactionBtn.addEventListener("click", deleteSelectedTransaction);
  els.installBtn.addEventListener("click", installApp);
  document.getElementById("exportBtn").addEventListener("click", exportData);
  els.importInput.addEventListener("change", importData);
  els.notifyPermissionBtn.addEventListener("click", requestNotificationPermission);

  els.recentExpenseList.addEventListener("click", handleRecentListClick);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    els.installBtn.disabled = false;
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) maybeNotifyOverspending();
  });
}

function switchScreen(target) {
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.target === target));
  els.screens.forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === target));
}

function summarize() {
  const incomeTransactions = state.transactions.filter((tx) => tx.type === "income");
  const expenseTransactions = state.transactions.filter((tx) => tx.type === "expense");
  const incomeTotal = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const netIncome = incomeTransactions.length ? incomeTotal : state.monthlyIncome;
  const totalBudget = Object.values(state.budgets).reduce((sum, value) => sum + Number(value || 0), 0);
  const spendRatio = netIncome > 0 ? Math.round((expenses / netIncome) * 100) : 0;

  const perCategory = Object.keys(state.budgets).map((category) => {
    const spent = expenseTransactions
      .filter((tx) => tx.category === category)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const budget = Number(state.budgets[category] || 0);
    return {
      category,
      spent,
      budget,
      left: budget - spent
    };
  });

  return {
    netIncome,
    expenses,
    totalBudget,
    spendRatio,
    perCategory,
    expenseTransactions,
    incomeTransactions
  };
}

function renderApp() {
  const summary = summarize();
  const activeMonth = getActiveMonth();
  els.monthLabel.textContent = activeMonth.label;
  els.totalSpentLabel.textContent = formatCurrency(summary.expenses);
  els.spendRatioLabel.textContent = `You spent ${clamp(summary.spendRatio, 0, 999)}% income`;
  els.netIncomeLabel.textContent = formatCurrency(summary.netIncome);
  els.expenseLabel.textContent = formatCurrency(summary.expenses);
  els.incomeInput.value = String(roundMoney(state.monthlyIncome));

  renderRecentExpenses(summary.expenseTransactions);
  renderBudgetDonut(summary);
  renderCategoryProgress(summary.perCategory);
  renderBudgetPlanner();
  renderTrendChart(summary, activeMonth);
  updateNotificationButton();
  saveState();
  maybeNotifyOverspending();
}

function renderRecentExpenses(expenses) {
  const items = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  if (!items.length) {
    els.recentExpenseList.innerHTML = `<div class="empty-state">No expenses yet. Tap Add to create your first entry.</div>`;
    return;
  }

  els.recentExpenseList.innerHTML = items.map((tx) => {
    const meta = getCategoryMeta(tx.category);
    return `
      <article class="list-item">
        <div class="item-icon" style="background:${meta.color}">${meta.icon}</div>
        <div>
          <div class="item-title">${escapeHtml(tx.title)}</div>
          <div class="item-subtitle">${formatLongDate(tx.date)} · ${escapeHtml(tx.category)}</div>
          <div class="item-actions">
            <button class="small-btn" data-action="edit-tx" data-id="${tx.id}">Edit</button>
            <button class="small-btn" data-action="delete-tx" data-id="${tx.id}">Delete</button>
          </div>
        </div>
        <div class="item-amount">${formatCurrency(tx.amount)}</div>
      </article>
    `;
  }).join("");
}

function renderBudgetDonut(summary) {
  const ranked = [...summary.perCategory]
    .filter((item) => item.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3);

  const fallback = Object.keys(state.budgets).slice(0, 3).map((category) => ({
    category,
    spent: 1
  }));

  const source = ranked.length ? ranked : fallback;
  const total = source.reduce((sum, item) => sum + item.spent, 0);
  let start = 0;
  const gradientParts = source.map((item) => {
    const meta = getCategoryMeta(item.category);
    const size = Math.round((item.spent / total) * 360);
    const part = `${meta.color} ${start}deg ${start + size}deg`;
    start += size;
    return part;
  });

  if (start < 360) {
    gradientParts.push(`#edf1f7 ${start}deg 360deg`);
  }

  els.budgetDonut.style.background = `conic-gradient(${gradientParts.join(", ")})`;

  const usage = summary.totalBudget > 0 ? Math.round((summary.expenses / summary.totalBudget) * 100) : 0;
  els.budgetUsageLabel.textContent = `${clamp(usage, 0, 999)}%`;
  els.budgetLegend.innerHTML = source.map((item) => {
    const meta = getCategoryMeta(item.category);
    return `
      <div class="legend-item">
        <span class="legend-swatch" style="background:${meta.color}"></span>
        <span>${escapeHtml(item.category)}</span>
      </div>
    `;
  }).join("");

  els.advisorText.textContent = buildAdvisorMessage();
}

function renderCategoryProgress(perCategory) {
  const ranked = [...perCategory].sort((a, b) => b.spent - a.spent);

  els.categoryProgressList.innerHTML = ranked.map((item) => {
    const meta = getCategoryMeta(item.category);
    const budget = item.budget || 1;
    const ratio = Math.min((item.spent / budget) * 100, 100);
    const safeLeft = item.left >= 0 ? `Left ${formatCurrency(item.left)}` : `Over ${formatCurrency(Math.abs(item.left))}`;
    return `
      <article class="progress-item">
        <div class="category-icon" style="background:${meta.color}">${meta.icon}</div>
        <div class="progress-main">
          <div class="progress-top">
            <div>
              <div class="progress-title">${escapeHtml(item.category)}</div>
              <div class="progress-subtitle">Budget ${formatCurrency(item.budget)}</div>
            </div>
            <div class="progress-amount">${formatCurrency(item.spent)}</div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${ratio}%;background:${meta.color}"></div>
          </div>
        </div>
        <div class="progress-right">
          <div class="progress-left">${safeLeft}</div>
        </div>
      </article>
    `;
  }).join("");
}

function renderBudgetPlanner() {
  const category = state.selectedCategory;
  const meta = getCategoryMeta(category);
  els.selectedCategoryIcon.textContent = meta.icon;
  els.selectedCategoryIcon.style.background = meta.color;
  els.selectedCategoryName.textContent = category;
  els.budgetAmountInput.value = String(roundMoney(state.budgets[category] || 0));

  els.categoryGrid.innerHTML = Object.keys(state.budgets).map((name) => {
    const itemMeta = getCategoryMeta(name);
    const active = name === category ? "active" : "";
    return `
      <button class="category-choice ${active}" data-action="select-category" data-category="${name}">
        <div class="category-icon" style="background:${itemMeta.color}">${itemMeta.icon}</div>
        <div class="category-name">${escapeHtml(name)}</div>
      </button>
    `;
  }).join("");

  els.categoryGrid.querySelectorAll("[data-action='select-category']").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCategory = button.dataset.category;
      renderBudgetPlanner();
      switchScreen("plan");
    });
  });
}

function renderTrendChart(summary, activeMonth) {
  const canvas = els.trendChart;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = { left: 16, right: 10, top: 8, bottom: 20 };
  ctx.clearRect(0, 0, width, height);

  const points = buildTrendSeries(summary, activeMonth);
  const maxValue = Math.max(
    ...points.map((point) => Math.max(point.incomeLeft, point.budgetLeft)),
    summary.netIncome,
    summary.totalBudget,
    1
  );

  ctx.strokeStyle = "#edf1f7";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i += 1) {
    const y = padding.top + ((height - padding.top - padding.bottom) / 3) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  drawSmoothArea(ctx, points.map((point) => point.incomeLeft), maxValue, {
    width,
    height,
    padding,
    stroke: "#4b4ad7",
    fill: "rgba(75, 74, 215, 0.35)"
  });

  drawSmoothArea(ctx, points.map((point) => point.budgetLeft), maxValue, {
    width,
    height,
    padding,
    stroke: "#68c6e8",
    fill: "rgba(104, 198, 232, 0.35)"
  });

  els.chartStartLabel.textContent = activeMonth.startLabel;
  els.chartMidLabel.textContent = activeMonth.midLabel;
  els.chartEndLabel.textContent = activeMonth.endLabel;
}

function buildTrendSeries(summary, activeMonth) {
  const dayCount = activeMonth.dayCount;
  const dailySpend = Array.from({ length: dayCount }, () => 0);
  const monthExpenses = summary.expenseTransactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === activeMonth.month && d.getFullYear() === activeMonth.year;
  });

  monthExpenses.forEach((tx) => {
    const d = new Date(tx.date);
    const index = d.getDate() - 1;
    if (dailySpend[index] !== undefined) dailySpend[index] += tx.amount;
  });

  const points = [];
  let running = 0;
  for (let day = 1; day <= dayCount; day += 1) {
    running += dailySpend[day - 1];
    points.push({
      day,
      incomeLeft: Math.max(summary.netIncome - running, 0),
      budgetLeft: Math.max(summary.totalBudget - running, 0)
    });
  }
  return points;
}

function drawSmoothArea(ctx, values, maxValue, opts) {
  const { width, height, padding, stroke, fill } = opts;
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;

  const points = values.map((value, index) => {
    const x = padding.left + (index / Math.max(values.length - 1, 1)) * usableWidth;
    const y = padding.top + usableHeight - (value / maxValue) * usableHeight;
    return { x, y };
  });

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      const prev = points[index - 1];
      const cpX = (prev.x + point.x) / 2;
      ctx.bezierCurveTo(cpX, prev.y, cpX, point.y, point.x, point.y);
    }
  });

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = stroke;
  ctx.stroke();

  ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
  ctx.lineTo(points[0].x, height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function getActiveMonth() {
  const latest = [...state.transactions]
    .map((tx) => new Date(tx.date))
    .sort((a, b) => b - a)[0] || new Date();
  const year = latest.getFullYear();
  const month = latest.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const mid = Math.ceil(lastDay.getDate() / 2);
  return {
    year,
    month,
    dayCount: lastDay.getDate(),
    label: latest.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    startLabel: firstDay.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    midLabel: new Date(year, month, mid).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    endLabel: lastDay.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  };
}

function openTransactionModal(transaction = null) {
  els.transactionModal.classList.remove("hidden");
  els.transactionModal.setAttribute("aria-hidden", "false");
  syncTransactionCategoryOptions();

  if (transaction) {
    els.modalTitle.textContent = "Edit Transaction";
    els.transactionId.value = transaction.id;
    els.transactionTitle.value = transaction.title;
    els.transactionAmount.value = roundMoney(transaction.amount);
    els.transactionType.value = transaction.type;
    syncTransactionCategoryOptions();
    els.transactionCategory.value = transaction.category;
    els.transactionDate.value = toDateInputValue(transaction.date);
    els.transactionNote.value = transaction.note || "";
    els.deleteTransactionBtn.style.visibility = "visible";
  } else {
    els.modalTitle.textContent = "Add Transaction";
    els.transactionForm.reset();
    els.transactionId.value = "";
    els.transactionDate.value = toDateInputValue(new Date().toISOString());
    els.transactionType.value = "expense";
    syncTransactionCategoryOptions();
    els.transactionCategory.value = state.selectedCategory;
    els.deleteTransactionBtn.style.visibility = "hidden";
  }
}

function closeTransactionModal() {
  els.transactionModal.classList.add("hidden");
  els.transactionModal.setAttribute("aria-hidden", "true");
}

function syncTransactionCategoryOptions() {
  const isIncome = els.transactionType.value === "income";
  const options = isIncome ? ["Income"] : Object.keys(state.budgets);
  els.transactionCategory.innerHTML = options.map((name) => `<option value="${escapeAttr(name)}">${escapeHtml(name)}</option>`).join("");
}

function handleTransactionSubmit(event) {
  event.preventDefault();

  const tx = {
    id: els.transactionId.value || crypto.randomUUID(),
    title: els.transactionTitle.value.trim() || "Untitled",
    amount: roundMoney(Number(els.transactionAmount.value || 0)),
    type: els.transactionType.value === "income" ? "income" : "expense",
    category: els.transactionCategory.value,
    date: new Date(`${els.transactionDate.value}T12:00:00`).toISOString(),
    note: els.transactionNote.value.trim()
  };

  if (!tx.amount || Number.isNaN(tx.amount) || tx.amount < 0) {
    toast("Enter a valid amount.");
    return;
  }

  const exists = state.transactions.some((item) => item.id === tx.id);
  if (exists) {
    state.transactions = state.transactions.map((item) => item.id === tx.id ? tx : item);
    toast("Transaction updated.");
  } else {
    state.transactions.push(tx);
    toast("Transaction added.");
  }

  closeTransactionModal();
  renderApp();
}

function deleteSelectedTransaction() {
  const id = els.transactionId.value;
  if (!id) return;
  state.transactions = state.transactions.filter((tx) => tx.id !== id);
  closeTransactionModal();
  renderApp();
  toast("Transaction deleted.");
}

function handleRecentListClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const transaction = state.transactions.find((tx) => tx.id === id);
  if (!transaction) return;

  if (button.dataset.action === "edit-tx") {
    openTransactionModal(transaction);
  }

  if (button.dataset.action === "delete-tx") {
    state.transactions = state.transactions.filter((tx) => tx.id !== id);
    renderApp();
    toast("Transaction deleted.");
  }
}

function saveBudgetForSelectedCategory() {
  const value = roundMoney(Number(els.budgetAmountInput.value || 0));
  if (Number.isNaN(value) || value < 0) {
    toast("Enter a valid budget amount.");
    return;
  }

  state.budgets[state.selectedCategory] = value;
  renderApp();
  toast(`${state.selectedCategory} budget saved.`);
}

function saveMonthlyIncome() {
  const value = roundMoney(Number(els.incomeInput.value || 0));
  if (Number.isNaN(value) || value <= 0) {
    toast("Enter a valid monthly income.");
    return;
  }

  state.monthlyIncome = value;

  const salary = state.transactions.find((tx) => tx.type === "income" && tx.title === "Salary");
  if (salary) {
    salary.amount = value;
  } else {
    state.transactions.unshift({
      id: crypto.randomUUID(),
      title: "Salary",
      type: "income",
      category: "Income",
      amount: value,
      date: new Date().toISOString(),
      note: "Base monthly income"
    });
  }

  renderApp();
  toast("Monthly income saved.");
}

function resetDemoData() {
  state = createSeedState();
  renderApp();
  toast("Demo data restored.");
}

async function installApp() {
  if (!deferredPrompt) {
    toast("Install is not available in this browser yet.");
    return;
  }

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  els.installBtn.disabled = true;
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "budget-data.json";
  link.click();
  URL.revokeObjectURL(url);
  toast("Data exported.");
}

function importData(event) {
  const [file] = event.target.files || [];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state = normalizeState(parsed);
      renderApp();
      toast("Data imported.");
    } catch (error) {
      console.error(error);
      toast("Import failed. Use a valid JSON export.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    toast("Notifications are not supported here.");
    return;
  }

  const result = await Notification.requestPermission();
  updateNotificationButton();
  if (result === "granted") {
    toast("Notifications enabled.");
    maybeNotifyOverspending(true);
  } else {
    toast("Notifications not enabled.");
  }
}

function updateNotificationButton() {
  if (!("Notification" in window)) {
    els.notifyPermissionBtn.textContent = "Unavailable";
    els.notifyPermissionBtn.disabled = true;
    return;
  }

  const status = Notification.permission;
  els.notifyPermissionBtn.textContent =
    status === "granted" ? "Enabled" : status === "denied" ? "Blocked" : "Enable";
}

function maybeNotifyOverspending(force = false) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const summary = summarize();
  const overspent = summary.perCategory.filter((item) => item.left < 0);
  if (!overspent.length) return;

  const todayKey = new Date().toDateString();
  const last = localStorage.getItem(LAST_NOTIFY_KEY);
  if (!force && last === todayKey) return;

  localStorage.setItem(LAST_NOTIFY_KEY, todayKey);
  const names = overspent.map((item) => item.category).slice(0, 2).join(", ");
  new Notification("Budget alert", {
    body: `You are over budget in ${names}. Open the app to review your spending.`
  });
}

function buildAdvisorMessage() {
  const summary = summarize();
  const overspent = summary.perCategory.filter((item) => item.left < 0).length;
  const spendRatio = summary.netIncome > 0 ? summary.expenses / summary.netIncome : 0;

  if (overspent > 0) {
    return `${overspent} category ${overspent > 1 ? "budgets are" : "budget is"} over the limit. Shift spending or raise the budget cap.`;
  }
  if (spendRatio > 0.8) {
    return "High burn rate. Limit new discretionary spending until your next income date.";
  }
  if (spendRatio > 0.5) {
    return "You're in a balanced range. Stay under the top two category limits to finish strong.";
  }
  return "Good control this month. You still have room to invest or move money into savings.";
}

async function registerPWA() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("sw.js");
    } catch (error) {
      console.error("Service worker registration failed", error);
    }
  }
}

function getCategoryMeta(category) {
  return CATEGORY_META[category] || { icon: "•", color: "#9ca3af" };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value || 0);
}

function formatLongDate(value) {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function toDateInputValue(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

let toastTimer = null;
function toast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2400);
}
