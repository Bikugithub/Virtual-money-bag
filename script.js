// Get Today's Date in YYYY-MM-DD format
function getTodayString() {
    var d = new Date();
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

// Default Starter Wallet Data
var starterTransactions = [
    { id: 101, type: "inflow", pocket: "Bank", purpose: "business", category: "Business Sales", amount: 25000, date: getTodayString(), note: "Client Order Payment" },
    { id: 102, type: "inflow", pocket: "Cash", purpose: "personal", category: "Salary / Income", amount: 8000, date: getTodayString(), note: "Monthly Teaching Fees" },
    { id: 103, type: "outflow", pocket: "Cash", purpose: "personal", category: "Food & Groceries", amount: 1200, date: getTodayString(), note: "Market Supplies" },
    { id: 104, type: "outflow", pocket: "Bank", purpose: "business", category: "Stock / Inventory", amount: 6500, date: getTodayString(), note: "Shop Stock Refill" }
];

// Load saved data safely
var walletData = [];
try {
    var saved = localStorage.getItem("billfoldWalletData");
    walletData = saved ? JSON.parse(saved) : starterTransactions;
    if (!Array.isArray(walletData)) walletData = starterTransactions;
} catch (err) {
    walletData = starterTransactions;
}

var currentMode = "all"; // 'all', 'personal', 'business'
var ownerName = localStorage.getItem("billfoldOwner") || "PERSONAL & BUSINESS LEDGER";
var activeTheme = localStorage.getItem("billfoldTheme") || "theme-slate";

// DOM Elements
var ownerText = document.getElementById("wallet-owner");
var dateInput = document.getElementById("tx-date");
var totalBalanceEl = document.getElementById("total-balance");
var pocketCashEl = document.getElementById("pocket-cash");
var pocketBankEl = document.getElementById("pocket-bank");
var pocketVaultEl = document.getElementById("pocket-vault");
var totalInflowEl = document.getElementById("total-inflow");
var totalOutflowEl = document.getElementById("total-outflow");
var adviceEl = document.getElementById("wallet-advice");
var historyListEl = document.getElementById("history-list");
var historyCountEl = document.getElementById("history-count");

// Lock Future Dates on Calendar
function lockFutureDates() {
    var today = getTodayString();
    dateInput.setAttribute("max", today);
    dateInput.value = today;
}

// Format Currency
function formatINR(num) {
    var n = Number(num) || 0;
    return "INR " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Save to LocalStorage
function saveWallet() {
    try {
        localStorage.setItem("billfoldWalletData", JSON.stringify(walletData));
    } catch (e) {}
}

// Main Render Function
function renderWallet() {
    // 1. Filter by Mode (All, Personal, Business)
    var modeList = walletData.filter(function(item) {
        if (currentMode === "all") return true;
        return item.purpose === currentMode;
    });

    var cashTotal = 0, bankTotal = 0, vaultTotal = 0;
    var sumInflow = 0, sumOutflow = 0;

    modeList.forEach(function(tx) {
        var amt = Number(tx.amount) || 0;
        var sign = tx.type === "inflow" ? 1 : -1;

        if (tx.type === "inflow") sumInflow += amt;
        else sumOutflow += amt;

        if (tx.pocket === "Cash") cashTotal += (amt * sign);
        else if (tx.pocket === "Bank") bankTotal += (amt * sign);
        else if (tx.pocket === "Vault") vaultTotal += (amt * sign);
    });

    var netBalance = sumInflow - sumOutflow;

    totalBalanceEl.textContent = formatINR(netBalance);
    pocketCashEl.textContent = formatINR(cashTotal);
    pocketBankEl.textContent = formatINR(bankTotal);
    pocketVaultEl.textContent = formatINR(vaultTotal);
    totalInflowEl.textContent = "+ " + formatINR(sumInflow);
    totalOutflowEl.textContent = "- " + formatINR(sumOutflow);

    // Update Advice Strip
    if (sumOutflow > sumInflow) {
        adviceEl.textContent = "ALERT: Outflow exceeds Inflow by " + formatINR(sumOutflow - sumInflow) + ". Control non-essential spending.";
    } else if (sumInflow > 0) {
        var savedPct = Math.round(((sumInflow - sumOutflow) / sumInflow) * 100);
        adviceEl.textContent = "HEALTHY STATUS: You are retaining " + savedPct + "% of your total inflows in this view.";
    } else {
        adviceEl.textContent = "No transactions recorded in this view yet.";
    }

    renderHistoryList(modeList);
}

// Render Filtered Transaction History
function renderHistoryList(modeList) {
    var searchVal = document.getElementById("search-box").value.trim().toLowerCase();
    var flowFilter = document.getElementById("filter-flow").value;
    var pocketFilter = document.getElementById("filter-pocket").value;
    var sortVal = document.getElementById("filter-sort").value;

    var filtered = modeList.filter(function(tx) {
        var matchSearch = tx.note.toLowerCase().includes(searchVal) || tx.category.toLowerCase().includes(searchVal);
        var matchFlow = (flowFilter === "all") || (tx.type === flowFilter);
        var matchPocket = (pocketFilter === "all") || (tx.pocket === pocketFilter);
        return matchSearch && matchFlow && matchPocket;
    });

    filtered.sort(function(a, b) {
        if (sortVal === "newest") return b.date.localeCompare(a.date);
        if (sortVal === "highest") return Number(b.amount) - Number(a.amount);
        if (sortVal === "lowest") return Number(a.amount) - Number(b.amount);
        return 0;
    });

    historyCountEl.textContent = filtered.length + " ENTRIES";
    historyListEl.innerHTML = "";

    if (filtered.length === 0) {
        historyListEl.innerHTML = '<div class="empty-msg">No matching wallet transactions found.</div>';
        return;
    }

    filtered.forEach(function(tx) {
        var row = document.createElement("div");
        row.className = "history-item";
        var isIn = tx.type === "inflow";

        row.innerHTML =
            '<div class="item-left">' +
                '<span class="type-tag ' + (isIn ? 'tag-in' : 'tag-out') + '">' + (isIn ? 'IN' : 'OUT') + '</span>' +
                '<div>' +
                    '<div class="item-note">' + tx.note + '</div>' +
                    '<div class="item-sub">' + tx.date + ' | POCKET: ' + tx.pocket.toUpperCase() + ' | ' + tx.purpose.toUpperCase() + ' | ' + tx.category + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="item-right">' +
                '<strong class="' + (isIn ? 'inflow-text' : 'outflow-text') + '">' + (isIn ? '+' : '-') + ' ' + formatINR(tx.amount) + '</strong>' +
                '<button type="button" class="delete-btn" data-id="' + tx.id + '">DELETE</button>' +
            '</div>';

        row.querySelector(".delete-btn").addEventListener("click", function() {
            walletData = walletData.filter(function(item) { return item.id !== tx.id; });
            saveWallet();
            renderWallet();
        });

        historyListEl.appendChild(row);
    });
}

// Add New Transaction
document.getElementById("tx-form").addEventListener("submit", function(e) {
    e.preventDefault();
    var chosenDate = dateInput.value;
    if (chosenDate > getTodayString()) {
        alert("Future dates are disabled.");
        return;
    }

    var newEntry = {
        id: Date.now(),
        type: document.getElementById("tx-type").value,
        pocket: document.getElementById("tx-pocket").value,
        purpose: document.getElementById("tx-purpose").value,
        category: document.getElementById("tx-category").value,
        amount: parseFloat(document.getElementById("tx-amount").value),
        date: chosenDate,
        note: document.getElementById("tx-note").value.trim()
    };

    walletData.unshift(newEntry);
    saveWallet();
    renderWallet();

    document.getElementById("tx-amount").value = "";
    document.getElementById("tx-note").value = "";
    lockFutureDates();
});

// Mode Switching (All / Personal / Business)
document.querySelectorAll(".mode-btn").forEach(function(btn) {
    btn.addEventListener("click", function(e) {
        document.querySelectorAll(".mode-btn").forEach(function(b) { b.classList.remove("active"); });
        e.target.classList.add("active");
        currentMode = e.target.getAttribute("data-mode");
        renderWallet();
    });
});

// Guide & Theme Panels
var guidePanel = document.getElementById("panel-guide");
var themePanel = document.getElementById("panel-theme");

document.getElementById("btn-toggle-guide").addEventListener("click", function() {
    guidePanel.classList.toggle("hidden");
    themePanel.classList.add("hidden");
});
document.getElementById("btn-close-guide").addEventListener("click", function() {
    guidePanel.classList.add("hidden");
});

document.getElementById("btn-toggle-theme").addEventListener("click", function() {
    themePanel.classList.toggle("hidden");
    guidePanel.classList.add("hidden");
});
document.getElementById("btn-close-theme").addEventListener("click", function() {
    themePanel.classList.add("hidden");
});

// Save Owner Name
document.getElementById("btn-save-name").addEventListener("click", function() {
    var val = document.getElementById("input-owner-name").value.trim();
    ownerName = val ? val.toUpperCase() + " // WALLET LEDGER" : "PERSONAL & BUSINESS LEDGER";
    ownerText.textContent = ownerName;
    try { localStorage.setItem("billfoldOwner", ownerName); } catch (e) {}
    themePanel.classList.add("hidden");
});

// Switch Themes
document.querySelectorAll(".theme-btn").forEach(function(btn) {
    btn.addEventListener("click", function(e) {
        activeTheme = e.target.getAttribute("data-theme");
        document.body.className = activeTheme;
        try { localStorage.setItem("billfoldTheme", activeTheme); } catch (err) {}
    });
});

// Filter Listeners
document.getElementById("search-box").addEventListener("input", renderWallet);
document.getElementById("filter-flow").addEventListener("change", renderWallet);
document.getElementById("filter-pocket").addEventListener("change", renderWallet);
document.getElementById("filter-sort").addEventListener("change", renderWallet);

// Download High-Quality PNG Statement
document.getElementById("btn-download-report").addEventListener("click", function() {
    var canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1200;
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 1000, 1200);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText("BILLFOLD WALLET STATEMENT", 50, 70);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(ownerName + " | DATE: " + getTodayString(), 50, 110);

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(50, 140, 900, 180);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText("TOTAL BALANCE: " + totalBalanceEl.textContent, 80, 205);

    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = "#22c55e";
    ctx.fillText("INFLOW: " + totalInflowEl.textContent, 80, 260);
    ctx.fillStyle = "#f43f5e";
    ctx.fillText("OUTFLOW: " + totalOutflowEl.textContent, 500, 260);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("CASH: " + pocketCashEl.textContent + "  |  BANK: " + pocketBankEl.textContent + "  |  VAULT: " + pocketVaultEl.textContent, 80, 300);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("RECENT TRANSACTIONS", 50, 370);

    var y = 400;
    walletData.slice(0, 12).forEach(function(tx) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(50, y, 900, 52);

        ctx.fillStyle = tx.type === "inflow" ? "#22c55e" : "#f43f5e";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText(tx.type === "inflow" ? "[IN]" : "[OUT]", 70, y + 33);

        ctx.fillStyle = "#f8fafc";
        ctx.fillText(tx.note.slice(0, 30), 150, y + 33);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "18px sans-serif";
        ctx.fillText(tx.date + " | " + tx.pocket, 540, y + 33);

        ctx.fillStyle = tx.type === "inflow" ? "#22c55e" : "#f43f5e";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText((tx.type === "inflow" ? "+" : "-") + formatINR(tx.amount), 740, y + 33);

        y += 62;
    });

    var link = document.createElement("a");
    link.download = "Wallet-Statement-" + getTodayString() + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});

// Backup JSON
document.getElementById("btn-backup").addEventListener("click", function() {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(walletData, null, 2));
    var a = document.createElement("a");
    a.href = dataStr;
    a.download = "wallet_backup_" + getTodayString() + ".json";
    a.click();
});

// Restore JSON
document.getElementById("file-restore").addEventListener("change", function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(evt) {
        try {
            var parsed = JSON.parse(evt.target.result);
            if (Array.isArray(parsed)) {
                walletData = parsed;
                saveWallet();
                renderWallet();
                alert("Wallet data restored.");
            }
        } catch (err) {
            alert("Invalid backup file.");
        }
    };
    reader.readAsText(file);
});

// Initialize App Immediately
document.body.className = activeTheme;
ownerText.textContent = ownerName;
lockFutureDates();
renderWallet();
                             
