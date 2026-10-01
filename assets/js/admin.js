/**
 * PH MEDIA - Complete Admin Dashboard Controller
 */

import { 
  getLeads, 
  updateLeadStatus, 
  deleteLead,
  getServicesConfig,
  saveServicesConfig,
  getCalcOptions,
  saveCalcOptions,
  getPortfolioItems,
  savePortfolioItems
} from "./firebase-config.js";

const DEFAULT_PIN = "1234";

document.addEventListener("DOMContentLoaded", () => {
  const loginView = document.getElementById("adminLoginView");
  const dashboardView = document.getElementById("adminDashboardView");
  const loginForm = document.getElementById("adminLoginForm");
  const pinInput = document.getElementById("adminPin");
  const logoutBtn = document.getElementById("adminLogoutBtn");

  let allLeads = [];
  let currentFilter = "all";
  let currentServices = [];
  let currentCalcOptions = [];
  let currentPortfolio = [];

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

  // Tab switching
  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.add("hidden"));

      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      document.getElementById(tabId).classList.remove("hidden");
    });
  });

  function showDashboard() {
    loginView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    loadLeadsData();
    loadServicesData();
    loadCalcData();
    loadPortfolioData();
  }

  // =========================================================================
  // 1. LEADS
  // =========================================================================
  document.getElementById("btnRefreshLeads").addEventListener("click", loadLeadsData);
  document.getElementById("btnFilterAll").addEventListener("click", () => { currentFilter = "all"; renderLeadsTable(); });
  document.getElementById("btnFilterNovos").addEventListener("click", () => { currentFilter = "Novo"; renderLeadsTable(); });
  document.getElementById("btnFilterFechados").addEventListener("click", () => { currentFilter = "Fechado"; renderLeadsTable(); });

  document.getElementById("btnExportCsv").addEventListener("click", () => {
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
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `leads_phmedia_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  async function loadLeadsData() {
    allLeads = await getLeads();
    updateLeadMetrics();
    renderLeadsTable();
  }

  function updateLeadMetrics() {
    document.getElementById("metricTotal").textContent = allLeads.length;
    document.getElementById("metricNovos").textContent = allLeads.filter(l => (l.status || "Novo") === "Novo").length;
    document.getElementById("metricFechados").textContent = allLeads.filter(l => l.status === "Fechado").length;
  }

  function renderLeadsTable() {
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
      const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(`Olá ${lead.name}! Sou o Pedro da PH Media. Recebi sua solicitação para ${lead.service}.`)}` : "#";
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
              <button class="btn-action btn-delete-lead" data-id="${lead.id}" style="color: #b91c1c;"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    tableBody.querySelectorAll(".btn-toggle-status").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const current = btn.getAttribute("data-current");
        const next = current === "Novo" ? "Em Contato" : current === "Em Contato" ? "Fechado" : "Novo";
        await updateLeadStatus(id, next);
        await loadLeadsData();
      });
    });

    tableBody.querySelectorAll(".btn-delete-lead").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (confirm("Remover este lead?")) {
          await deleteLead(btn.getAttribute("data-id"));
          await loadLeadsData();
        }
      });
    });
  }

  // =========================================================================
  // 2. SERVIÇOS (QUADRO 1)
  // =========================================================================
  async function loadServicesData() {
    currentServices = await getServicesConfig();
    renderServicesEditor();
  }

  function renderServicesEditor() {
    const container = document.getElementById("servicesEditGrid");
    container.innerHTML = currentServices.map((svc, index) => {
      const featuresText = (svc.features || []).join("\n");
      return `
        <div class="admin-edit-card" data-index="${index}">
          <div class="admin-input-group">
            <label>Título do Botão / Serviço</label>
            <input type="text" class="svc-title" value="${escapeHtml(svc.title)}">
          </div>
          <div class="admin-input-group">
            <label>Tipo de Cobrança (Ex: Investimento mensal)</label>
            <input type="text" class="svc-pricing-type" value="${escapeHtml(svc.pricingType || 'Investimento mensal')}">
          </div>
          <div class="admin-input-group">
            <label>Valor (Ex: 400,00 ou 650,00)</label>
            <input type="text" class="svc-price" value="${escapeHtml(svc.price)}">
          </div>
          <div class="admin-input-group">
            <label>Subtexto do Preço</label>
            <input type="text" class="svc-subtext" value="${escapeHtml(svc.subtext || '')}">
          </div>
          <div class="admin-input-group">
            <label>Descrição do Serviço</label>
            <textarea rows="3" class="svc-desc">${escapeHtml(svc.description)}</textarea>
          </div>
          <div class="admin-input-group">
            <label>Itens Inclusos (1 por linha)</label>
            <textarea rows="4" class="svc-features">${escapeHtml(featuresText)}</textarea>
          </div>
        </div>
      `;
    }).join("");
  }

  document.getElementById("btnSaveServices").addEventListener("click", async () => {
    const cards = document.querySelectorAll("#servicesEditGrid .admin-edit-card");
    const updated = [];

    cards.forEach((card, index) => {
      const original = currentServices[index];
      const title = card.querySelector(".svc-title").value.trim();
      const pricingType = card.querySelector(".svc-pricing-type").value.trim();
      const price = card.querySelector(".svc-price").value.trim();
      const subtext = card.querySelector(".svc-subtext").value.trim();
      const description = card.querySelector(".svc-desc").value.trim();
      const features = card.querySelector(".svc-features").value.split("\n").map(f => f.trim()).filter(f => f.length > 0);

      updated.push({
        ...original,
        title,
        pricingType,
        price,
        subtext,
        description,
        features,
        whatsappText: `Olá Pedro! Tenho interesse no serviço de *${title}* (R$ ${price}). Podemos conversar?`
      });
    });

    await saveServicesConfig(updated);
    alert("✅ Serviços e preços salvos com sucesso! O site principal foi atualizado.");
    await loadServicesData();
  });

  // =========================================================================
  // 3. CALCULADORA (QUADRO 2)
  // =========================================================================
  async function loadCalcData() {
    currentCalcOptions = await getCalcOptions();
    renderCalcEditor();
  }

  function renderCalcEditor() {
    const container = document.getElementById("calcEditGrid");
    container.innerHTML = currentCalcOptions.map((opt, index) => {
      return `
        <div class="admin-edit-card" data-index="${index}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; font-size: 13px;">Opção #${index + 1}</span>
            <button type="button" class="btn-action btn-delete-calc" data-index="${index}" style="color: #b91c1c;">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
          <div class="admin-input-group">
            <label>Nome da Opção</label>
            <input type="text" class="calc-name" value="${escapeHtml(opt.name)}">
          </div>
          <div class="admin-input-group">
            <label>Descrição do Adicional</label>
            <input type="text" class="calc-desc" value="${escapeHtml(opt.desc || '')}">
          </div>
          <div class="admin-input-group">
            <label>Valor Adicionado (R$ número)</label>
            <input type="number" class="calc-price" value="${opt.price}">
          </div>
        </div>
      `;
    }).join("");

    container.querySelectorAll(".btn-delete-calc").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"));
        currentCalcOptions.splice(idx, 1);
        renderCalcEditor();
      });
    });
  }

  document.getElementById("btnAddCalcOption").addEventListener("click", () => {
    currentCalcOptions.push({
      id: "calc_" + Date.now(),
      name: "Novo Adicional",
      desc: "Descrição do serviço",
      price: 150,
      checked: false
    });
    renderCalcEditor();
  });

  document.getElementById("btnSaveCalc").addEventListener("click", async () => {
    const cards = document.querySelectorAll("#calcEditGrid .admin-edit-card");
    const updated = [];

    cards.forEach((card, index) => {
      const original = currentCalcOptions[index] || { id: "calc_" + Date.now() };
      const name = card.querySelector(".calc-name").value.trim();
      const desc = card.querySelector(".calc-desc").value.trim();
      const price = parseFloat(card.querySelector(".calc-price").value) || 0;

      updated.push({
        ...original,
        name,
        desc,
        price
      });
    });

    await saveCalcOptions(updated);
    alert("✅ Calculadora de combos salva com sucesso!");
    await loadCalcData();
  });

  // =========================================================================
  // 4. PORTFÓLIO & PASTAS DE VÍDEOS/FOTOS COM UPLOAD DE IMAGENS
  // =========================================================================
  async function loadPortfolioData() {
    currentPortfolio = await getPortfolioItems();
    renderPortfolioEditor();
  }

  // Image reader & compressor for fast client-side uploads (Base64 JPEG)
  function readAndCompressImage(file, maxDimension = 1400, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        return reject(new Error("Arquivo não é uma imagem válida"));
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function renderPortfolioEditor() {
    const container = document.getElementById("portfolioEditGrid");
    if (!container) return;

    container.innerHTML = currentPortfolio.map((item, index) => {
      const photos = (item.photos && item.photos.length > 0) ? item.photos : (item.image ? [item.image] : []);
      const count = photos.length;

      const galleryThumbsHtml = photos.map((ph, pIdx) => `
        <div style="position: relative; width: 68px; height: 68px; border-radius: 8px; overflow: hidden; border: 2px solid #000; background: #000; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <img src="${ph}" alt="Foto ${pIdx + 1}" style="width: 100%; height: 100%; object-fit: cover;">
          <button type="button" class="btn-remove-gallery-photo" data-proj-index="${index}" data-photo-index="${pIdx}" title="Remover Foto" style="position: absolute; top: 2px; right: 2px; width: 22px; height: 22px; border-radius: 6px; background: rgba(220, 38, 38, 0.95); color: #fff; border: none; font-size: 11px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `).join("");

      return `
        <div class="admin-edit-card" data-index="${index}" style="background: #ffffff; border: 2px solid #e4e4e7; border-radius: 16px; padding: 20px; box-shadow: 0 4px 14px rgba(0,0,0,0.04);">
          
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1.5px solid #f0f0f2;">
            <div>
              <span style="font-weight: 800; font-size: 16px; color: #000;">Projeto #${index + 1}</span>
              <span style="display: inline-block; margin-left: 8px; padding: 2px 8px; background: #dcfce7; color: #166534; border-radius: 6px; font-weight: 700; font-size: 12px;">${count} foto(s) na galeria</span>
            </div>
            <button type="button" class="btn-action btn-delete-portfolio" data-index="${index}" style="color: #dc2626; border-color: #fecaca; background: #fef2f2;">
              <i class="fa-solid fa-trash"></i> <span>Excluir</span>
            </button>
          </div>

          <!-- Título -->
          <div class="admin-input-group">
            <label style="font-weight: 700; font-size: 12px; color: #374151;">TÍTULO DO PROJETO / CAMPANHA</label>
            <input type="text" class="port-title" value="${escapeHtml(item.title)}" placeholder="Ex: Campanha Comercial & Fashion" style="font-weight: 600;">
          </div>

          <!-- Categoria -->
          <div class="admin-input-group">
            <label style="font-weight: 700; font-size: 12px; color: #374151;">ETIQUETA / CATEGORIA (EX: AUDIOVISUAL, REELS, EVENTO)</label>
            <input type="text" class="port-category" value="${escapeHtml(item.category || 'AUDIOVISUAL')}" placeholder="AUDIOVISUAL" style="font-weight: 700; text-transform: uppercase;">
          </div>

          <!-- 1. IMAGEM DA CAPA + BOTÃO DE UPLOAD -->
          <div class="admin-input-group" style="background: #f8f9fa; border: 1.5px solid #e4e4e7; border-radius: 12px; padding: 14px;">
            <label style="font-weight: 800; font-size: 12px; color: #000; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-image"></i> IMAGEM DA CAPA DO CARD
            </label>
            
            <div style="display: flex; gap: 12px; align-items: center; margin-top: 8px;">
              <div style="width: 80px; height: 60px; border-radius: 8px; overflow: hidden; background: #000; border: 1.5px solid #000; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                <img src="${item.image || 'assets/images/reel-1.jpg'}" alt="Capa" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
              <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                <input type="text" class="port-image" value="${escapeHtml(item.image)}" placeholder="Caminho ou link da capa">
                
                <!-- BOTÃO DE UPLOAD DA CAPA -->
                <button type="button" class="btn-primary btn-upload-cover-trigger" data-index="${index}" style="padding: 10px 14px; font-size: 13px; font-weight: 700; justify-content: center; background: #000000; color: #ffffff; border-radius: 10px; cursor: pointer;">
                  <i class="fa-solid fa-upload"></i>
                  <span>Clique para Fazer Upload da Imagem de Capa</span>
                </button>
                <input type="file" accept="image/*" class="port-cover-file" data-index="${index}" style="display: none !important;">
              </div>
            </div>
          </div>

          <!-- 2. FOTOS DA GALERIA (POPUP) + BOTÃO DE UPLOAD MÚLTIPLO -->
          <div class="admin-input-group" style="background: #f8f9fa; border: 1.5px solid #e4e4e7; border-radius: 12px; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="font-weight: 800; font-size: 12px; color: #000; display: flex; align-items: center; gap: 6px; margin: 0;">
                <i class="fa-solid fa-images"></i> FOTOS DA GALERIA / POPUP (${count} fotos)
              </label>
            </div>

            <!-- Miniaturas atuais com botão excluir -->
            <div style="display: flex; gap: 8px; overflow-x: auto; padding: 8px 2px; min-height: 75px; align-items: center;">
              ${galleryThumbsHtml.length > 0 ? galleryThumbsHtml : '<span style="font-size: 12.5px; color: var(--text-muted);">Nenhuma foto no álbum. Clique no botão verde abaixo para carregar fotos!</span>'}
            </div>

            <!-- BOTÃO DE UPLOAD MÚLTIPLAS FOTOS -->
            <button type="button" class="btn-primary btn-upload-photos-trigger" data-index="${index}" style="margin-top: 8px; padding: 12px 16px; font-size: 13.5px; font-weight: 700; justify-content: center; background: #25d366; border-color: #25d366; color: #ffffff; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.3);">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span>Clique para Fazer Upload das Fotos da Galeria (Múltiplas)</span>
            </button>
            <input type="file" accept="image/*" multiple class="port-photos-file" data-index="${index}" style="display: none !important;">

            <label style="font-size: 11px; margin-top: 10px; color: #6b7280;">Links manuais das fotos (1 por linha):</label>
            <textarea rows="3" class="port-photos" placeholder="assets/images/reel-1.jpg&#10;assets/images/reel-2.jpg">${escapeHtml(photos.join("\n"))}</textarea>
          </div>

          <!-- Descrição -->
          <div class="admin-input-group">
            <label style="font-weight: 700; font-size: 12px; color: #374151;">DESCRIÇÃO DO PROJETO</label>
            <input type="text" class="port-desc" value="${escapeHtml(item.desc || '')}" placeholder="Direção de cena, iluminação e captação">
          </div>

        </div>
      `;
    }).join("");

    // Hook up Delete Album buttons
    container.querySelectorAll(".btn-delete-portfolio").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm(`Remover o projeto "${currentPortfolio[idx].title}"?`)) {
          currentPortfolio.splice(idx, 1);
          renderPortfolioEditor();
        }
      });
    });

    // Hook up individual photo delete buttons
    container.querySelectorAll(".btn-remove-gallery-photo").forEach(btn => {
      btn.addEventListener("click", () => {
        const projIdx = parseInt(btn.getAttribute("data-proj-index"), 10);
        const photoIdx = parseInt(btn.getAttribute("data-photo-index"), 10);
        if (currentPortfolio[projIdx] && currentPortfolio[projIdx].photos) {
          currentPortfolio[projIdx].photos.splice(photoIdx, 1);
          renderPortfolioEditor();
        }
      });
    });

    // Hook up Cover Upload Triggers
    container.querySelectorAll(".btn-upload-cover-trigger").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = btn.getAttribute("data-index");
        const fileInput = container.querySelector(`.port-cover-file[data-index="${idx}"]`);
        if (fileInput) fileInput.click();
      });
    });

    // Hook up Gallery Photos Upload Triggers
    container.querySelectorAll(".btn-upload-photos-trigger").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = btn.getAttribute("data-index");
        const fileInput = container.querySelector(`.port-photos-file[data-index="${idx}"]`);
        if (fileInput) fileInput.click();
      });
    });

    // Cover File Input Change Handler
    container.querySelectorAll(".port-cover-file").forEach(input => {
      input.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const idx = parseInt(input.getAttribute("data-index"), 10);
        try {
          const base64 = await readAndCompressImage(file, 1400, 0.85);
          currentPortfolio[idx].image = base64;
          if (!currentPortfolio[idx].photos || currentPortfolio[idx].photos.length === 0) {
            currentPortfolio[idx].photos = [base64];
          }
          renderPortfolioEditor();
        } catch (err) {
          alert("Erro ao processar imagem da capa: " + err.message);
        }
      });
    });

    // Gallery Photos Multi-File Input Change Handler
    container.querySelectorAll(".port-photos-file").forEach(input => {
      input.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const idx = parseInt(input.getAttribute("data-index"), 10);
        
        try {
          if (!currentPortfolio[idx].photos) {
            currentPortfolio[idx].photos = [];
          }
          for (const file of files) {
            const base64 = await readAndCompressImage(file, 1600, 0.82);
            currentPortfolio[idx].photos.push(base64);
          }
          if (!currentPortfolio[idx].image && currentPortfolio[idx].photos.length > 0) {
            currentPortfolio[idx].image = currentPortfolio[idx].photos[0];
          }
          renderPortfolioEditor();
        } catch (err) {
          alert("Erro ao processar fotos da galeria: " + err.message);
        }
      });
    });
  }

  document.getElementById("btnAddPortfolioItem").addEventListener("click", () => {
    currentPortfolio.push({
      id: "port_" + Date.now(),
      title: "Novo Álbum de Portfólio",
      category: "AUDIOVISUAL",
      desc: "Direção audiovisual e cobertura cinematográfica por PH Media",
      image: "assets/images/reel-1.jpg",
      photos: [
        "assets/images/reel-1.jpg",
        "assets/images/reel-2.jpg",
        "assets/images/pedro.jpg"
      ]
    });
    renderPortfolioEditor();
  });

  document.getElementById("btnSavePortfolio").addEventListener("click", async () => {
    const cards = document.querySelectorAll("#portfolioEditGrid .admin-edit-card");
    const updated = [];

    cards.forEach((card, index) => {
      const original = currentPortfolio[index] || { id: "port_" + Date.now() };
      const title = card.querySelector(".port-title").value.trim();
      const category = card.querySelector(".port-category").value.trim().toUpperCase();
      const image = card.querySelector(".port-image").value.trim();
      const desc = card.querySelector(".port-desc").value.trim();
      
      const photosRaw = card.querySelector(".port-photos").value.split("\n").map(p => p.trim()).filter(p => p.length > 0);
      const photos = photosRaw.length > 0 ? photosRaw : (image ? [image] : ["assets/images/reel-1.jpg"]);

      updated.push({
        ...original,
        title,
        category,
        image,
        photos,
        desc
      });
    });

    await savePortfolioItems(updated);
    alert("✅ Galeria de portfólio e fotos salvas com sucesso! O site principal foi atualizado.");
    await loadPortfolioData();
  });

  // =========================================================================
  // 5. DÚVIDAS FREQUENTES (FAQ)
  // =========================================================================
  let currentFaqs = [];

  async function loadFaqsData() {
    currentFaqs = await getFaqs();
    renderFaqsEditor();
  }

  function renderFaqsEditor() {
    const container = document.getElementById("faqsEditGrid");
    if (!container) return;
    container.innerHTML = currentFaqs.map((faq, index) => {
      return `
        <div class="admin-edit-card" data-index="${index}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; font-size: 13px;">Pergunta #${index + 1}</span>
            <button type="button" class="btn-action btn-delete-faq" data-index="${index}" style="color: #b91c1c;">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
          <div class="admin-input-group">
            <label>Pergunta / Título</label>
            <input type="text" class="faq-question" value="${escapeHtml(faq.question)}">
          </div>
          <div class="admin-input-group">
            <label>Resposta Detalhada</label>
            <textarea rows="3" class="faq-answer">${escapeHtml(faq.answer)}</textarea>
          </div>
        </div>
      `;
    }).join("");

    container.querySelectorAll(".btn-delete-faq").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"));
        currentFaqs.splice(idx, 1);
        renderFaqsEditor();
      });
    });
  }

  const addFaqBtn = document.getElementById("btnAddFaq");
  if (addFaqBtn) {
    addFaqBtn.addEventListener("click", () => {
      currentFaqs.push({
        id: "faq_" + Date.now(),
        question: "Nova Pergunta Frequente",
        answer: "Digite a resposta detalhada aqui para orientar o cliente."
      });
      renderFaqsEditor();
    });
  }

  const saveFaqsBtn = document.getElementById("btnSaveFaqs");
  if (saveFaqsBtn) {
    saveFaqsBtn.addEventListener("click", async () => {
      const cards = document.querySelectorAll("#faqsEditGrid .admin-edit-card");
      const updated = [];

      cards.forEach((card, index) => {
        const original = currentFaqs[index] || { id: "faq_" + Date.now() };
        const question = card.querySelector(".faq-question").value.trim();
        const answer = card.querySelector(".faq-answer").value.trim();

        updated.push({
          ...original,
          question,
          answer
        });
      });

      await saveFaqs(updated);
      alert("✅ Perguntas Frequentes (FAQ) salvas com sucesso! O site foi atualizado.");
      await loadFaqsData();
    });
  }

  // Load FAQ on dashboard init
  const origShowDash = showDashboard;
  showDashboard = function() {
    origShowDash();
    loadFaqsData();
  };

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }
});
