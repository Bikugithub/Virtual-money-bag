// Get Today's Date in YYYY-MM-DD format
function getTodayString() {
    var d = new Date();
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

// Default Starter Wallet Data (Privacy protected - Generic names only)
var starterTransactions = [
    { id: 101, type: "inflow", pocket: "Bank", purpose: "business", category: "Business Sales", amount: 25000, date: getTodayString(), note: "Client Payment Received" },
    { id: 102, type: "inflow", pocket: "Cash", purpose: "personal", category: "Salary / Income", amount: 8000, date: getTodayString(), note: "Service Fee Collected" },
    { id: 103, type: "outflow", pocket: "Cash", purpose: "personal", category: "Food & Groceries", amount: 1200, date: getTodayString(), note: "General Supplies" },
    { id: 104, type: "outflow", pocket: "Bank", purpose: "business", category: "Stock / Inventory", amount: 6500, date: getTodayString(), note: "Inventory Restock" }
];

var walletData = [];
try {
    var saved = localStorage.getItem("billfoldWalletData");
    walletData = saved ? JSON.parse(saved) : starterTransactions;
    if (!Array.isArray(walletData)) walletData = starterTransactions;
} catch (err) {
    walletData = starterTransactions;
}

var currentMode = "all"; 
var ownerName = localStorage.getItem("billfoldOwner") || "PERSONAL & BUSINESS LEDGER";
var activeTheme = localStorage.getItem("billfoldTheme") || "theme-slate";

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
    if(dateInput) {
        dateInput.setAttribute("max", today);
        dateInput.value = today;
    }
}

function formatINR(num) {
    var n = Number(num) || 0;
    return "INR " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function saveWallet() {
    try { localStorage.setItem("billfoldWalletData", JSON.stringify(walletData)); } catch (e) {}
}

function renderWallet() {
    var modeList = walletData.filter(function(item) {
        if (currentMode === "all") return true;
        return item.purpose === currentMode;
    });

    var cashTotal = 0, bankTotal = 0, vaultTotal = 0;
    var sumInflow = 0, sumOutflow = 0;

    modeList.forEach(function(tx) {
        var amt = Number(tx.amount) || 0;
        var sign = tx.type === "inflow" ? 1 : -1;
        if (tx.type === "inflow") sumInflow += amt; else sumOutflow += amt;
        if (tx.pocket === "Cash") cashTotal += (amt * sign);
        else if (tx.pocket === "Bank") bankTotal += (amt * sign);
        else if (tx.pocket === "Vault") vaultTotal += (amt * sign);
    });

    var netBalance = sumInflow - sumOutflow;

    if(totalBalanceEl) totalBalanceEl.textContent = formatINR(netBalance);
    if(pocketCashEl) pocketCashEl.textContent = formatINR(cashTotal);
    if(pocketBankEl) pocketBankEl.textContent = formatINR(bankTotal);
    if(pocketVaultEl) pocketVaultEl.textContent = formatINR(vaultTotal);
    if(totalInflowEl) totalInflowEl.textContent = "+ " + formatINR(sumInflow);
    if(totalOutflowEl) totalOutflowEl.textContent = "- " + formatINR(sumOutflow);

    if (sumOutflow > sumInflow) {
        adviceEl.textContent = "ALERT: Outflow exceeds Inflow by " + formatINR(sumOutflow - sumInflow) + ".";
    } else if (sumInflow > 0) {
        var savedPct = Math.round(((sumInflow - sumOutflow) / sumInflow) * 100);
        adviceEl.textContent = "HEALTHY STATUS: Retaining " + savedPct + "% of total inflows.";
    } else {
        adviceEl.textContent = "No transactions recorded yet.";
    }

    renderHistoryList(modeList);
}

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

    if(historyCountEl) historyCountEl.textContent = filtered.length + " ENTRIES";
    if(!historyListEl) return;
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
                    '<div class="item-sub">' + tx.date + ' | POCKET: ' + tx.pocket.toUpperCase() + ' | ' + tx.purpose.toUpperCase() + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="item-right">' +
                '<strong class="' + (isIn ? 'inflow-text' : 'outflow-text') + '">' + (isIn ? '+' : '-') + ' ' + formatINR(tx.amount) + '</strong>' +
                '<button type="button" class="delete-btn" data-id="' + tx.id + '">DEL</button>' +
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
var form = document.getElementById("tx-form");
if(form) {
    form.addEventListener("submit", function(e) {
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
}

// Mode Switching
document.querySelectorAll(".mode-btn").forEach(function(btn) {
    btn.addEventListener("click", function(e) {
        document.querySelectorAll(".mode-btn").forEach(function(b) { b.classList.remove("active"); });
        e.target.classList.add("active");
        currentMode = e.target.getAttribute("data-mode");
        renderWallet();
    });
});

// Panels
var guidePanel = document.getElementById("panel-guide");
var themePanel = document.getElementById("panel-theme");

document.getElementById("btn-toggle-guide").addEventListener("click", function() {
    guidePanel.classList.toggle("hidden"); themePanel.classList.add("hidden");
});
document.getElementById("btn-close-guide").addEventListener("click", function() { guidePanel.classList.add("hidden"); });

document.getElementById("btn-toggle-theme").addEventListener("click", function() {
    themePanel.classList.toggle("hidden"); guidePanel.classList.add("hidden");
});
document.getElementById("btn-close-theme").addEventListener("click", function() { themePanel.classList.add("hidden"); });

document.getElementById("btn-save-name").addEventListener("click", function() {
    var val = document.getElementById("input-owner-name").value.trim();
    ownerName = val ? val.toUpperCase() + " // WALLET LEDGER" : "PERSONAL & BUSINESS LEDGER";
    ownerText.textContent = ownerName;
    try { localStorage.setItem("billfoldOwner", ownerName); } catch (e) {}
    themePanel.classList.add("hidden");
});

document.querySelectorAll(".theme-btn").forEach(function(btn) {
    btn.addEventListener("click", function(e) {
        activeTheme = e.target.getAttribute("data-theme");
        document.body.className = activeTheme;
        try { localStorage.setItem("billfoldTheme", activeTheme); } catch (err) {}
    });
});

// Filters
document.getElementById("search-box").addEventListener("input", renderWallet);
document.getElementById("filter-flow").addEventListener("change", renderWallet);
document.getElementById("filter-pocket").addEventListener("change", renderWallet);
document.getElementById("filter-sort").addEventListener("change", renderWallet);

// Init
document.body.className = activeTheme;
ownerText.textContent = ownerName;
lockFutureDates();
renderWallet();

// --- PWA INSTALL HANDLER ---
var deferredPrompt;
var installBtn = document.getElementById("btn-install-app");

window.addEventListener("beforeinstallprompt", function(e) {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", function() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function() {
        deferredPrompt = null;
        installBtn.classList.add("hidden");
    });
});

window.addEventListener("appinstalled", function() {
    installBtn.classList.add("hidden");
});
