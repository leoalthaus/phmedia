/**
 * PH MEDIA - Admin Dashboard Controller
 */

import { getLeads, updateLeadStatus, deleteLead } from "./firebase-config.js";

const DEFAULT_PIN = "1234";

document.addEventListener("DOMContentLoaded", () => {
  const loginView = document.getElementById("adminLoginView");
  const dashboardView = document.getElementById("adminDashboardView");
  const loginForm = document.getElementById("adminLoginForm");
  const pinInput = document.getElementById("adminPin");
  const logoutBtn = document.getElementById("adminLogoutBtn");
  const refreshBtn = document.getElementById("btnRefreshLeads");
  const exportBtn = document.getElementById("btnExportCsv");

  let allLeads = [];
  let currentFilter = "all";

  // Check login session
  if (sessionStorage.getItem("phmedia_admin_auth") === "true") {
    showDashboard();
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const pin = pinInput.value.trim();
    if (pin === DEFAULT_PIN || pin === localStorage.getItem("phmedia_custom_pin")) {
      sessionStorage.setItem("phmedia_admin_auth", "true");
      showDashboard();
    } else {
      alert("Senha incorreta! A senha padrão é 1234");
      pinInput.value = "";
    }
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("phmedia_admin_auth");
    loginView.classList.remove("hidden");
    dashboardView.classList.add("hidden");
  });

  refreshBtn.addEventListener("click", loadLeadsData);

  exportBtn.addEventListener("click", () => {
    if (allLeads.length === 0) {
      alert("Nenhum lead para exportar.");
      return;
    }
    const headers = ["Data", "Nome", "WhatsApp", "Servico", "Status", "Mensagem"];
    const rows = allLeads.map(l => [
      l.createdAt ? new Date(l.createdAt).toLocaleDateString("pt-BR") : "-",
      `"${(l.name || "").replace(/"/g, '""')}"`,
      `"${l.phone || ""}"`,
      `"${(l.service || "").replace(/"/g, '""')}"`,
      `"${l.status || "Novo"}"`,
      `"${(l.message || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_phmedia_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Filters
  document.getElementById("btnFilterAll").addEventListener("click", () => { currentFilter = "all"; renderTable(); });
  document.getElementById("btnFilterNovos").addEventListener("click", () => { currentFilter = "Novo"; renderTable(); });
  document.getElementById("btnFilterFechados").addEventListener("click", () => { currentFilter = "Fechado"; renderTable(); });

  function showDashboard() {
    loginView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    loadLeadsData();
  }

  async function loadLeadsData() {
    const tableBody = document.getElementById("leadsTableBody");
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">Carregando registros...</td></tr>`;

    allLeads = await getLeads();
    updateMetrics();
    renderTable();
  }

  function updateMetrics() {
    document.getElementById("metricTotal").textContent = allLeads.length;
    document.getElementById("metricNovos").textContent = allLeads.filter(l => (l.status || "Novo") === "Novo").length;
    document.getElementById("metricFechados").textContent = allLeads.filter(l => l.status === "Fechado").length;
  }

  function renderTable() {
    const tableBody = document.getElementById("leadsTableBody");
    let filtered = allLeads;

    if (currentFilter !== "all") {
      filtered = allLeads.filter(l => (l.status || "Novo") === currentFilter);
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Nenhum lead encontrado neste filtro.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map(lead => {
      const dateStr = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";
      const cleanPhone = (lead.phone || "").replace(/\D/g, "");
      const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(`Olá ${lead.name}! Sou o Pedro da PH Media. Recebi sua mensagem sobre o serviço ${lead.service}.`)}` : "#";
      const statusClass = lead.status === "Fechado" ? "badge-fechado" : lead.status === "Em Contato" ? "badge-contato" : "badge-novo";

      return `
        <tr>
          <td>${dateStr}</td>
          <td><strong>${escapeHtml(lead.name || "Sem nome")}</strong></td>
          <td>${escapeHtml(lead.phone || "-")}</td>
          <td>${escapeHtml(lead.service || "-")}</td>
          <td><span class="badge-status ${statusClass}">${lead.status || "Novo"}</span></td>
          <td>
            <div class="lead-actions">
              ${cleanPhone ? `<a href="${waLink}" target="_blank" class="btn-action wa" title="Abrir WhatsApp"><i class="fa-brands fa-whatsapp"></i> Conversar</a>` : ""}
              <button class="btn-action btn-toggle-status" data-id="${lead.id}" data-current="${lead.status || 'Novo'}">Alterar Status</button>
              <button class="btn-action btn-delete-lead" data-id="${lead.id}" style="color: #f87171;"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Bind action events
    tableBody.querySelectorAll(".btn-toggle-status").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const current = btn.getAttribute("data-current");
        const nextStatus = current === "Novo" ? "Em Contato" : current === "Em Contato" ? "Fechado" : "Novo";
        await updateLeadStatus(id, nextStatus);
        await loadLeadsData();
      });
    });

    tableBody.querySelectorAll(".btn-delete-lead").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (confirm("Tem certeza que deseja remover este registro?")) {
          const id = btn.getAttribute("data-id");
          await deleteLead(id);
          await loadLeadsData();
        }
      });
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
});
