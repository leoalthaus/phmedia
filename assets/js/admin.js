/**
 * PH MEDIA - Complete Admin Dashboard Controller
 * Manages: Services & Packages, Portfolio Folders & Photos, Feedbacks, FAQs, Client Accounts (Ensaios) & Admin PIN
 */

import {
  getServicesConfig,
  saveServicesConfig,
  getPortfolioItems,
  savePortfolioItems,
  getFeedbacks,
  saveFeedbacks,
  getFaqs,
  saveFaqs,
  getClientAccounts,
  saveClientAccounts
} from "./firebase-config.js";

const DEFAULT_PIN = "1234";
const DEFAULT_ADMIN_EMAILS = ["admin@phmedia.com", "admin", "pedro@phmedia.com", "phmedia"];

document.addEventListener("DOMContentLoaded", async () => {
  const loginView = document.getElementById("adminLoginView");
  const dashboardView = document.getElementById("adminDashboardView");
  const clientPortalView = document.getElementById("clientPortalDashboardView");
  const loginForm = document.getElementById("adminLoginForm");
  const accessInput = document.getElementById("loginAccessInput");
  const pinInput = document.getElementById("adminPin");
  const logoutBtn = document.getElementById("adminLogoutBtn");
  const clientLogoutBtn = document.getElementById("portalClientLogoutBtn");

  let currentServices = [];
  let currentPortfolio = [];
  let currentFeedbacks = [];
  let currentFaqs = [];
  let currentClientAccounts = [];

  // Preload client accounts for instant login check
  currentClientAccounts = await getClientAccounts();

  // Check active session (Admin or Client)
  if (sessionStorage.getItem("phmedia_admin_auth") === "true") {
    showDashboard();
  } else if (sessionStorage.getItem("phmedia_client_auth_id")) {
    const savedId = sessionStorage.getItem("phmedia_client_auth_id");
    const matchedClient = currentClientAccounts.find(c => c.id === savedId);
    if (matchedClient) {
      showClientPortal(matchedClient);
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const rawAccess = (accessInput?.value || "").trim();
      const accessLower = rawAccess.toLowerCase();
      const pin = (pinInput?.value || "").trim();

      const customAdminEmail = (localStorage.getItem("phmedia_custom_admin_email") || "").trim().toLowerCase();
      const customPin = localStorage.getItem("phmedia_custom_pin");

      const isAdminUser =
        DEFAULT_ADMIN_EMAILS.includes(accessLower) ||
        (customAdminEmail && accessLower === customAdminEmail);
      const isValidAdminPin = pin === DEFAULT_PIN || (customPin && pin === customPin);

      // 1. Check Admin Login
      if (isAdminUser && isValidAdminPin) {
        sessionStorage.removeItem("phmedia_client_auth_id");
        sessionStorage.setItem("phmedia_admin_auth", "true");
        showDashboard();
        return;
      }

      // 2. Check Client Account Login (by E-mail or Access Code)
      currentClientAccounts = await getClientAccounts();
      const matchedClient = currentClientAccounts.find(c => {
        const emailMatch = (c.clientEmail || "").trim().toLowerCase() === accessLower && accessLower.length > 0;
        const codeMatch = (c.accessCode || "").trim().toLowerCase() === accessLower && accessLower.length > 0;
        const passMatch = String(c.password || "").trim() === pin;
        return (emailMatch || codeMatch) && passMatch;
      });

      if (matchedClient) {
        sessionStorage.removeItem("phmedia_admin_auth");
        sessionStorage.setItem("phmedia_client_auth_id", matchedClient.id);
        showClientPortal(matchedClient);
        return;
      }

      alert("E-mail/Acesso ou senha incorretos! Verifique seus dados e tente novamente.");
      pinInput.value = "";
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("phmedia_admin_auth");
      dashboardView.classList.add("hidden");
      if (clientPortalView) clientPortalView.classList.add("hidden");
      loginView.classList.remove("hidden");
    });
  }

  if (clientLogoutBtn) {
    clientLogoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("phmedia_client_auth_id");
      if (clientPortalView) clientPortalView.classList.add("hidden");
      dashboardView.classList.add("hidden");
      loginView.classList.remove("hidden");
      if (accessInput) accessInput.value = "";
      if (pinInput) pinInput.value = "";
    });
  }

  function showClientPortal(account) {
    loginView.classList.add("hidden");
    dashboardView.classList.add("hidden");
    if (!clientPortalView) return;
    clientPortalView.classList.remove("hidden");

    document.getElementById("portalClientDate").textContent = account.eventDate || "ENSAIO EXCLUSIVO";
    document.getElementById("portalClientGalleryTitle").textContent = account.galleryTitle || "Seu Ensaio Fotográfico";
    document.getElementById("portalClientWelcome").textContent = `Olá, ${account.clientName}! Confira e baixe suas fotos em alta resolução abaixo.`;

    const dlAllBtn = document.getElementById("portalClientDownloadAllBtn");
    if (dlAllBtn) {
      if (account.downloadUrl && account.downloadUrl.trim().length > 0) {
        dlAllBtn.href = account.downloadUrl;
        dlAllBtn.classList.remove("hidden");
      } else {
        dlAllBtn.classList.add("hidden");
      }
    }

    const grid = document.getElementById("portalClientPhotosGrid");
    const photos = Array.isArray(account.photos) ? account.photos : [];
    if (grid) {
      grid.innerHTML = photos.map((src, idx) => `
        <div style="position: relative; border-radius: 14px; overflow: hidden; background: #18181b; aspect-ratio: 4/5; box-shadow: 0 8px 22px rgba(0,0,0,0.12);">
          <img src="${src}" alt="Foto ${idx + 1}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; display: block;">
          <div style="position: absolute; inset: auto 0 0 0; padding: 12px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); display: flex; justify-content: flex-end;">
            <a href="${src}" download="PHMedia-${(account.accessCode || 'Ensaio')}-${idx + 1}.jpg" style="padding: 7px 12px; border-radius: 8px; background: #ffffff; color: #000000; font-size: 12px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-download"></i>
              <span>Baixar Foto #${idx + 1}</span>
            </a>
          </div>
        </div>
      `).join("");
    }
  }

  // Tab switching
  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.add("hidden"));

      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      const target = document.getElementById(tabId);
      if (target) target.classList.remove("hidden");
    });
  });

  async function showDashboard() {
    loginView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    await Promise.all([
      loadServicesData(),
      loadPortfolioData(),
      loadFeedbacksData(),
      loadFaqsData(),
      loadClientsData()
    ]);
  }

  // Helper: Image reader & compressor for fast client-side uploads (Base64 JPEG)
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

  // =========================================================================
  // 1. SERVIÇOS & PACOTES (ADD / EDIT / DELETE)
  // =========================================================================
  async function loadServicesData() {
    currentServices = await getServicesConfig();
    renderServicesEditor();
  }

  function syncServicesInputsFromDOM() {
    const cards = document.querySelectorAll("#servicesEditGrid .admin-edit-card");
    if (cards.length === 0) return;
    const synced = [];
    cards.forEach((card, index) => {
      const original = currentServices[index] || { id: "svc_" + Date.now() + "_" + index };
      const title = card.querySelector(".svc-title")?.value.trim() || "Serviço";
      const shortDesc = card.querySelector(".svc-short-desc")?.value.trim() || "";
      const price = card.querySelector(".svc-price")?.value.trim() || "";
      const whatsappText = card.querySelector(".svc-wa-text")?.value.trim() || "";
      const redirectUrl = card.querySelector(".svc-redirect-url")?.value.trim() || "";

      synced.push({
        ...original,
        title,
        shortDesc,
        description: shortDesc || original.description || "",
        price,
        whatsappText: whatsappText || `Olá Pedro! Tenho interesse no serviço de *${title}*. Podemos conversar?`,
        redirectUrl
      });
    });
    currentServices = synced;
  }

  function renderServicesEditor() {
    const container = document.getElementById("servicesEditGrid");
    if (!container) return;

    container.innerHTML = currentServices.map((svc, index) => `
      <div class="admin-edit-card" data-index="${index}" style="background: #ffffff; border: 2px solid #e4e4e7; border-radius: 16px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f0f0f2;">
          <span style="font-weight: 800; font-size: 15px; color: #000;">Serviço #${index + 1}</span>
          <button type="button" class="btn-action btn-delete-service" data-index="${index}" style="color: #dc2626; border-color: #fecaca; background: #fef2f2;">
            <i class="fa-solid fa-trash"></i> <span>Apagar</span>
          </button>
        </div>

        <div class="admin-input-group">
          <label>Título do Serviço / Pacote</label>
          <input type="text" class="svc-title" value="${escapeHtml(svc.title)}" placeholder="Ex: Gestão de Instagram">
        </div>

        <div class="admin-input-group">
          <label>Subtítulo Curto (Exibido no Card da Página Inicial)</label>
          <textarea rows="2" class="svc-short-desc" placeholder="Ex: Planejamento, criação e gerenciamento de conteúdo.">${escapeHtml(svc.shortDesc || svc.description || "")}</textarea>
        </div>

        <div class="admin-input-group">
          <label>Valor de Referência (Opcional - Ex: 400,00)</label>
          <input type="text" class="svc-price" value="${escapeHtml(svc.price || "")}" placeholder="400,00">
        </div>

        <div class="admin-input-group">
          <label>Mensagem Automática do WhatsApp ao Clicar</label>
          <textarea rows="2" class="svc-wa-text" placeholder="Olá Pedro! Tenho interesse neste serviço...">${escapeHtml(svc.whatsappText || "")}</textarea>
        </div>

        <div class="admin-input-group">
          <label>Link Personalizado (Deixe vazio para usar o WhatsApp acima)</label>
          <input type="text" class="svc-redirect-url" value="${escapeHtml(svc.redirectUrl || "")}" placeholder="Opcional: https://...">
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".btn-delete-service").forEach(btn => {
      btn.addEventListener("click", () => {
        syncServicesInputsFromDOM();
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm(`Deseja apagar o serviço "${currentServices[idx]?.title}"?`)) {
          currentServices.splice(idx, 1);
          renderServicesEditor();
        }
      });
    });
  }

  const btnAddService = document.getElementById("btnAddService");
  if (btnAddService) {
    btnAddService.addEventListener("click", () => {
      syncServicesInputsFromDOM();
      currentServices.push({
        id: "svc_" + Date.now(),
        title: "Novo Serviço Audiovisual",
        shortDesc: "Descrição breve do serviço para exibir no card.",
        description: "Descrição breve do serviço para exibir no card.",
        price: "350,00",
        whatsappText: "Olá Pedro! Gostaria de solicitar um orçamento para *Novo Serviço Audiovisual*.",
        redirectUrl: ""
      });
      renderServicesEditor();
    });
  }

  const btnSaveServices = document.getElementById("btnSaveServices");
  if (btnSaveServices) {
    btnSaveServices.addEventListener("click", async () => {
      syncServicesInputsFromDOM();
      await saveServicesConfig(currentServices);
      alert("✅ Serviços & Pacotes salvos com sucesso! O site principal já foi atualizado.");
      await loadServicesData();
    });
  }

  // =========================================================================
  // 2. PORTFÓLIO: PASTAS & FOTOS ("UM POUCO DO MEU OLHAR")
  // =========================================================================
  async function loadPortfolioData() {
    currentPortfolio = await getPortfolioItems();
    renderPortfolioEditor();
  }

  function syncPortfolioInputsFromDOM() {
    const cards = document.querySelectorAll("#portfolioEditGrid .admin-edit-card");
    if (cards.length === 0) return;
    cards.forEach((card, index) => {
      if (!currentPortfolio[index]) return;
      currentPortfolio[index].title = card.querySelector(".port-title")?.value.trim() || "Pasta de Portfólio";
      currentPortfolio[index].category = (card.querySelector(".port-category")?.value.trim() || "AUDIOVISUAL").toUpperCase();
      currentPortfolio[index].image = card.querySelector(".port-image")?.value.trim() || currentPortfolio[index].image;
      currentPortfolio[index].desc = card.querySelector(".port-desc")?.value.trim() || "";
      const manualPhotos = card.querySelector(".port-photos")?.value.split("\n").map(p => p.trim()).filter(Boolean);
      if (manualPhotos && manualPhotos.length > 0) {
        currentPortfolio[index].photos = manualPhotos;
      }
    });
  }

  function renderPortfolioEditor() {
    const container = document.getElementById("portfolioEditGrid");
    if (!container) return;

    container.innerHTML = currentPortfolio.map((item, index) => {
      const photos = (item.photos && item.photos.length > 0) ? item.photos : (item.image ? [item.image] : []);
      const count = photos.length;

      const galleryThumbsHtml = photos.map((ph, pIdx) => `
        <div style="position: relative; width: 68px; height: 68px; border-radius: 8px; overflow: hidden; border: 2px solid #000; background: #000; flex-shrink: 0;">
          <img src="${ph}" alt="Foto ${pIdx + 1}" style="width: 100%; height: 100%; object-fit: cover;">
          <button type="button" class="btn-remove-gallery-photo" data-proj-index="${index}" data-photo-index="${pIdx}" title="Remover Foto" style="position: absolute; top: 2px; right: 2px; width: 22px; height: 22px; border-radius: 6px; background: rgba(220, 38, 38, 0.95); color: #fff; border: none; font-size: 11px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `).join("");

      return `
        <div class="admin-edit-card" data-index="${index}" style="background: #ffffff; border: 2px solid #e4e4e7; border-radius: 16px; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1.5px solid #f0f0f2;">
            <div>
              <span style="font-weight: 800; font-size: 16px; color: #000;">Pasta #${index + 1}</span>
              <span style="display: inline-block; margin-left: 8px; padding: 2px 8px; background: #dcfce7; color: #166534; border-radius: 6px; font-weight: 700; font-size: 12px;">${count} foto(s)</span>
            </div>
            <button type="button" class="btn-action btn-delete-portfolio" data-index="${index}" style="color: #dc2626; border-color: #fecaca; background: #fef2f2;">
              <i class="fa-solid fa-trash"></i> <span>Apagar Pasta</span>
            </button>
          </div>

          <div class="admin-input-group">
            <label>NOME DA PASTA / PROJETO</label>
            <input type="text" class="port-title" value="${escapeHtml(item.title)}" placeholder="Ex: Campanha Comercial & Fashion" style="font-weight: 600;">
          </div>

          <div class="admin-input-group">
            <label>ETIQUETA / CATEGORIA (EX: AUDIOVISUAL, ENSAIO, EVENTO)</label>
            <input type="text" class="port-category" value="${escapeHtml(item.category || 'AUDIOVISUAL')}" placeholder="AUDIOVISUAL" style="font-weight: 700; text-transform: uppercase;">
          </div>

          <!-- CAPA DA PASTA -->
          <div class="admin-input-group" style="background: #f8f9fa; border: 1.5px solid #e4e4e7; border-radius: 12px; padding: 14px;">
            <label style="font-weight: 800; font-size: 12px; color: #000;">
              <i class="fa-solid fa-image"></i> FOTO DE CAPA DA PASTA
            </label>
            <div style="display: flex; gap: 12px; align-items: center; margin-top: 8px;">
              <div style="width: 76px; height: 76px; border-radius: 8px; overflow: hidden; background: #000; border: 1.5px solid #000; flex-shrink: 0;">
                <img src="${item.image || 'assets/images/reel-1.jpg'}" alt="Capa" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
              <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                <input type="text" class="port-image" value="${escapeHtml(item.image)}" placeholder="Caminho ou link da capa">
                <button type="button" class="btn-primary btn-upload-cover-trigger" data-index="${index}" style="padding: 9px 12px; font-size: 12.5px;">
                  <i class="fa-solid fa-upload"></i>
                  <span>Enviar Foto de Capa</span>
                </button>
                <input type="file" accept="image/*" class="port-cover-file" data-index="${index}" style="display: none !important;">
              </div>
            </div>
          </div>

          <!-- FOTOS INTERNAS DA PASTA -->
          <div class="admin-input-group" style="background: #f8f9fa; border: 1.5px solid #e4e4e7; border-radius: 12px; padding: 14px;">
            <label style="font-weight: 800; font-size: 12px; color: #000;">
              <i class="fa-solid fa-images"></i> FOTOS DENTRO DESTA PASTA (${count} fotos)
            </label>
            <div style="display: flex; gap: 8px; overflow-x: auto; padding: 8px 2px; min-height: 75px; align-items: center;">
              ${galleryThumbsHtml.length > 0 ? galleryThumbsHtml : '<span style="font-size: 12px; color: var(--text-muted);">Nenhuma foto na pasta.</span>'}
            </div>
            <button type="button" class="btn-primary btn-upload-photos-trigger" data-index="${index}" style="margin-top: 6px; padding: 11px 14px; font-size: 13px; background: #25d366; border-color: #25d366;">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span>Adicionar Fotos na Pasta (Várias de uma vez)</span>
            </button>
            <input type="file" accept="image/*" multiple class="port-photos-file" data-index="${index}" style="display: none !important;">

            <label style="font-size: 11px; margin-top: 8px; color: #6b7280;">Links/Base64 das fotos (1 por linha):</label>
            <textarea rows="2" class="port-photos">${escapeHtml(photos.join("\n"))}</textarea>
          </div>

          <div class="admin-input-group">
            <label>DESCRIÇÃO DA PASTA / PROJETO</label>
            <input type="text" class="port-desc" value="${escapeHtml(item.desc || '')}" placeholder="Direção de cena, iluminação e captação">
          </div>
        </div>
      `;
    }).join("");

    container.querySelectorAll(".btn-delete-portfolio").forEach(btn => {
      btn.addEventListener("click", () => {
        syncPortfolioInputsFromDOM();
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm(`Deseja apagar a pasta "${currentPortfolio[idx]?.title}"?`)) {
          currentPortfolio.splice(idx, 1);
          renderPortfolioEditor();
        }
      });
    });

    container.querySelectorAll(".btn-remove-gallery-photo").forEach(btn => {
      btn.addEventListener("click", () => {
        syncPortfolioInputsFromDOM();
        const projIdx = parseInt(btn.getAttribute("data-proj-index"), 10);
        const photoIdx = parseInt(btn.getAttribute("data-photo-index"), 10);
        if (currentPortfolio[projIdx] && currentPortfolio[projIdx].photos) {
          currentPortfolio[projIdx].photos.splice(photoIdx, 1);
          renderPortfolioEditor();
        }
      });
    });

    container.querySelectorAll(".btn-upload-cover-trigger").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = btn.getAttribute("data-index");
        container.querySelector(`.port-cover-file[data-index="${idx}"]`)?.click();
      });
    });

    container.querySelectorAll(".btn-upload-photos-trigger").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = btn.getAttribute("data-index");
        container.querySelector(`.port-photos-file[data-index="${idx}"]`)?.click();
      });
    });

    container.querySelectorAll(".port-cover-file").forEach(input => {
      input.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        syncPortfolioInputsFromDOM();
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

    container.querySelectorAll(".port-photos-file").forEach(input => {
      input.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        syncPortfolioInputsFromDOM();
        const idx = parseInt(input.getAttribute("data-index"), 10);
        try {
          if (!currentPortfolio[idx].photos) currentPortfolio[idx].photos = [];
          for (const file of files) {
            const base64 = await readAndCompressImage(file, 1600, 0.82);
            currentPortfolio[idx].photos.push(base64);
          }
          if (!currentPortfolio[idx].image && currentPortfolio[idx].photos.length > 0) {
            currentPortfolio[idx].image = currentPortfolio[idx].photos[0];
          }
          renderPortfolioEditor();
        } catch (err) {
          alert("Erro ao processar fotos da pasta: " + err.message);
        }
      });
    });
  }

  const btnAddPortfolioItem = document.getElementById("btnAddPortfolioItem");
  if (btnAddPortfolioItem) {
    btnAddPortfolioItem.addEventListener("click", () => {
      syncPortfolioInputsFromDOM();
      currentPortfolio.push({
        id: "port_" + Date.now(),
        title: "Nova Pasta de Portfólio",
        category: "AUDIOVISUAL",
        desc: "Direção audiovisual e fotografia por PH Media",
        image: "assets/images/reel-1.jpg",
        photos: ["assets/images/reel-1.jpg"]
      });
      renderPortfolioEditor();
    });
  }

  const btnSavePortfolio = document.getElementById("btnSavePortfolio");
  if (btnSavePortfolio) {
    btnSavePortfolio.addEventListener("click", async () => {
      syncPortfolioInputsFromDOM();
      await savePortfolioItems(currentPortfolio);
      alert("✅ Portfólio & Pastas salvos com sucesso! O site principal foi atualizado.");
      await loadPortfolioData();
    });
  }

  // =========================================================================
  // 3. FEEDBACKS & DEPOIMENTOS (ADD / EDIT / DELETE)
  // =========================================================================
  async function loadFeedbacksData() {
    currentFeedbacks = await getFeedbacks();
    renderFeedbacksEditor();
  }

  function syncFeedbacksInputsFromDOM() {
    const cards = document.querySelectorAll("#feedbacksEditGrid .admin-edit-card");
    if (cards.length === 0) return;
    const synced = [];
    cards.forEach((card, index) => {
      const original = currentFeedbacks[index] || { id: "fb_" + Date.now() + "_" + index };
      const title = card.querySelector(".fb-title")?.value.trim() || "Excelente trabalho!";
      const author = card.querySelector(".fb-author")?.value.trim() || "Cliente";
      const stars = parseInt(card.querySelector(".fb-stars")?.value || "5", 10);
      const text = card.querySelector(".fb-text")?.value.trim() || "";
      synced.push({ ...original, title, author, stars, text });
    });
    currentFeedbacks = synced;
  }

  function renderFeedbacksEditor() {
    const container = document.getElementById("feedbacksEditGrid");
    if (!container) return;

    container.innerHTML = currentFeedbacks.map((fb, index) => `
      <div class="admin-edit-card" data-index="${index}" style="background: #ffffff; border: 2px solid #e4e4e7; border-radius: 16px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f0f0f2;">
          <span style="font-weight: 800; font-size: 15px; color: #000;">Feedback #${index + 1}</span>
          <button type="button" class="btn-action btn-delete-feedback" data-index="${index}" style="color: #dc2626; border-color: #fecaca; background: #fef2f2;">
            <i class="fa-solid fa-trash"></i> <span>Apagar</span>
          </button>
        </div>

        <div class="admin-input-group">
          <label>Título em Destaque (Ex: Um trabalho incrível!)</label>
          <input type="text" class="fb-title" value="${escapeHtml(fb.title)}" placeholder="Um trabalho incrível!">
        </div>

        <div class="admin-input-group">
          <label>Nome do Cliente / Autor(a)</label>
          <input type="text" class="fb-author" value="${escapeHtml(fb.author)}" placeholder="Ex: Maria Clara">
        </div>

        <div class="admin-input-group">
          <label>Avaliação (Estrelas)</label>
          <select class="fb-stars">
            <option value="5" ${(fb.stars || 5) == 5 ? "selected" : ""}>⭐⭐⭐⭐⭐ (5 Estrelas)</option>
            <option value="4" ${fb.stars == 4 ? "selected" : ""}>⭐⭐⭐⭐ (4 Estrelas)</option>
            <option value="3" ${fb.stars == 3 ? "selected" : ""}>⭐⭐⭐ (3 Estrelas)</option>
          </select>
        </div>

        <div class="admin-input-group">
          <label>Depoimento do Cliente</label>
          <textarea rows="4" class="fb-text" placeholder="Escreva o depoimento...">${escapeHtml(fb.text)}</textarea>
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".btn-delete-feedback").forEach(btn => {
      btn.addEventListener("click", () => {
        syncFeedbacksInputsFromDOM();
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm(`Apagar o feedback de "${currentFeedbacks[idx]?.author}"?`)) {
          currentFeedbacks.splice(idx, 1);
          renderFeedbacksEditor();
        }
      });
    });
  }

  const btnAddFeedback = document.getElementById("btnAddFeedback");
  if (btnAddFeedback) {
    btnAddFeedback.addEventListener("click", () => {
      syncFeedbacksInputsFromDOM();
      currentFeedbacks.push({
        id: "fb_" + Date.now(),
        title: "Um trabalho incrível!",
        author: "Novo Cliente",
        stars: 5,
        text: "Fiquei muito satisfeito com o resultado e profissionalismo da PH Media!"
      });
      renderFeedbacksEditor();
    });
  }

  const btnSaveFeedbacks = document.getElementById("btnSaveFeedbacks");
  if (btnSaveFeedbacks) {
    btnSaveFeedbacks.addEventListener("click", async () => {
      syncFeedbacksInputsFromDOM();
      await saveFeedbacks(currentFeedbacks);
      alert("✅ Feedbacks salvos com sucesso! O carrossel de depoimentos foi atualizado.");
      await loadFeedbacksData();
    });
  }

  // =========================================================================
  // 4. DÚVIDAS FREQUENTES - FAQ (ADD / EDIT / DELETE)
  // =========================================================================
  async function loadFaqsData() {
    currentFaqs = await getFaqs();
    renderFaqsEditor();
  }

  function syncFaqsInputsFromDOM() {
    const cards = document.querySelectorAll("#faqsEditGrid .admin-edit-card");
    if (cards.length === 0) return;
    const synced = [];
    cards.forEach((card, index) => {
      const original = currentFaqs[index] || { id: "faq_" + Date.now() + "_" + index };
      const question = card.querySelector(".faq-question")?.value.trim() || "";
      const answer = card.querySelector(".faq-answer")?.value.trim() || "";
      synced.push({ ...original, question, answer });
    });
    currentFaqs = synced;
  }

  function renderFaqsEditor() {
    const container = document.getElementById("faqsEditGrid");
    if (!container) return;

    container.innerHTML = currentFaqs.map((faq, index) => `
      <div class="admin-edit-card" data-index="${index}" style="background: #ffffff; border: 2px solid #e4e4e7; border-radius: 16px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f0f0f2;">
          <span style="font-weight: 800; font-size: 14px; color: #000;">Pergunta #${index + 1}</span>
          <button type="button" class="btn-action btn-delete-faq" data-index="${index}" style="color: #dc2626; border-color: #fecaca; background: #fef2f2;">
            <i class="fa-solid fa-trash"></i> <span>Apagar</span>
          </button>
        </div>
        <div class="admin-input-group">
          <label>Pergunta</label>
          <input type="text" class="faq-question" value="${escapeHtml(faq.question)}">
        </div>
        <div class="admin-input-group">
          <label>Resposta Detalhada</label>
          <textarea rows="3" class="faq-answer">${escapeHtml(faq.answer)}</textarea>
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".btn-delete-faq").forEach(btn => {
      btn.addEventListener("click", () => {
        syncFaqsInputsFromDOM();
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("Deseja apagar esta pergunta frequente?")) {
          currentFaqs.splice(idx, 1);
          renderFaqsEditor();
        }
      });
    });
  }

  const addFaqBtn = document.getElementById("btnAddFaq");
  if (addFaqBtn) {
    addFaqBtn.addEventListener("click", () => {
      syncFaqsInputsFromDOM();
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
      syncFaqsInputsFromDOM();
      await saveFaqs(currentFaqs);
      alert("✅ Dúvidas Frequentes (FAQ) salvas com sucesso!");
      await loadFaqsData();
    });
  }

  // =========================================================================
  // 5. CONTAS DE CLIENTES & ENSAIOS PRIVADOS (cliente.html)
  // =========================================================================
  async function loadClientsData() {
    currentClientAccounts = await getClientAccounts();
    renderClientsEditor();
  }

  function syncClientsInputsFromDOM() {
    const cards = document.querySelectorAll("#clientsEditGrid .admin-edit-card");
    if (cards.length === 0) return;
    cards.forEach((card, index) => {
      if (!currentClientAccounts[index]) return;
      currentClientAccounts[index].clientName = card.querySelector(".cli-name")?.value.trim() || "Cliente";
      currentClientAccounts[index].clientEmail = (card.querySelector(".cli-email")?.value.trim() || "").toLowerCase();
      currentClientAccounts[index].galleryTitle = card.querySelector(".cli-title")?.value.trim() || "Ensaio Fotográfico";
      currentClientAccounts[index].eventDate = card.querySelector(".cli-date")?.value.trim() || "";
      currentClientAccounts[index].accessCode = (card.querySelector(".cli-code")?.value.trim() || "").toUpperCase();
      currentClientAccounts[index].password = card.querySelector(".cli-pass")?.value.trim() || "";
      currentClientAccounts[index].downloadUrl = card.querySelector(".cli-download")?.value.trim() || "";
      const manualPhotos = card.querySelector(".cli-photos-text")?.value.split("\n").map(p => p.trim()).filter(Boolean);
      if (manualPhotos && manualPhotos.length > 0) {
        currentClientAccounts[index].photos = manualPhotos;
        currentClientAccounts[index].coverImage = manualPhotos[0];
      }
    });
  }

  function renderClientsEditor() {
    const container = document.getElementById("clientsEditGrid");
    if (!container) return;

    container.innerHTML = currentClientAccounts.map((cli, index) => {
      const photos = Array.isArray(cli.photos) ? cli.photos : [];
      const count = photos.length;

      const thumbsHtml = photos.map((ph, pIdx) => `
        <div style="position: relative; width: 64px; height: 64px; border-radius: 8px; overflow: hidden; border: 2px solid #000; background: #000; flex-shrink: 0;">
          <img src="${ph}" alt="Foto ${pIdx + 1}" style="width: 100%; height: 100%; object-fit: cover;">
          <button type="button" class="btn-remove-client-photo" data-cli-index="${index}" data-photo-index="${pIdx}" style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 5px; background: rgba(220,38,38,0.95); color: #fff; border: none; font-size: 10px; cursor: pointer;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `).join("");

      return `
        <div class="admin-edit-card" data-index="${index}" style="background: #ffffff; border: 2px solid #e4e4e7; border-radius: 16px; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1.5px solid #f0f0f2;">
            <div>
              <span style="font-weight: 800; font-size: 15px; color: #000;">Acesso Cliente #${index + 1}</span>
              <span style="display: inline-block; margin-left: 8px; padding: 2px 8px; background: #dbeafe; color: #1e40af; border-radius: 6px; font-weight: 700; font-size: 11.5px;">${count} foto(s) no ensaio</span>
            </div>
            <button type="button" class="btn-action btn-delete-client" data-index="${index}" style="color: #dc2626; border-color: #fecaca; background: #fef2f2;">
              <i class="fa-solid fa-trash"></i> <span>Excluir Acesso</span>
            </button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="admin-input-group">
              <label>Nome do Cliente</label>
              <input type="text" class="cli-name" value="${escapeHtml(cli.clientName)}" placeholder="Ex: Ana Beatriz">
            </div>
            <div class="admin-input-group">
              <label>Data do Ensaio / Evento</label>
              <input type="text" class="cli-date" value="${escapeHtml(cli.eventDate || '')}" placeholder="Ex: Novembro 2026">
            </div>
          </div>

          <div class="admin-input-group">
            <label>Título do Ensaio / Galeria</label>
            <input type="text" class="cli-title" value="${escapeHtml(cli.galleryTitle)}" placeholder="Ex: Ensaio Pessoal & Retratos">
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; background: #f8f9fa; padding: 12px; border-radius: 10px; border: 1px solid #e4e4e7;">
            <div class="admin-input-group">
              <label style="color: #000;"><i class="fa-solid fa-envelope"></i> E-mail de Login do Cliente</label>
              <input type="email" class="cli-email" value="${escapeHtml(cli.clientEmail || '')}" placeholder="Ex: cliente@email.com" style="font-weight: 700;">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="admin-input-group">
                <label style="color: #000;"><i class="fa-solid fa-user-tag"></i> Código Alternativo</label>
                <input type="text" class="cli-code" value="${escapeHtml(cli.accessCode)}" placeholder="Ex: ANA2026" style="font-weight: 800; text-transform: uppercase;">
              </div>
              <div class="admin-input-group">
                <label style="color: #000;"><i class="fa-solid fa-lock"></i> Senha do Cliente</label>
                <input type="text" class="cli-pass" value="${escapeHtml(cli.password)}" placeholder="Ex: 1234" style="font-weight: 700;">
              </div>
            </div>
          </div>

          <div class="admin-input-group">
            <label>Link Externo para Download Completo em Alta (Drive / Dropbox / iCloud - Opcional)</label>
            <input type="text" class="cli-download" value="${escapeHtml(cli.downloadUrl || '')}" placeholder="https://drive.google.com/...">
          </div>

          <div class="admin-input-group" style="background: #f8f9fa; border: 1.5px solid #e4e4e7; border-radius: 12px; padding: 14px;">
            <label style="font-weight: 800; font-size: 12px; color: #000;">
              <i class="fa-solid fa-camera"></i> FOTOS DO ENSAIO DISPONIBILIZADAS PARA O CLIENTE (${count})
            </label>
            <div style="display: flex; gap: 8px; overflow-x: auto; padding: 8px 2px; min-height: 70px; align-items: center;">
              ${thumbsHtml.length > 0 ? thumbsHtml : '<span style="font-size: 12px; color: var(--text-muted);">Nenhuma foto adicionada a este ensaio.</span>'}
            </div>
            <button type="button" class="btn-primary btn-upload-client-photos" data-index="${index}" style="margin-top: 6px; padding: 10px 14px; font-size: 12.5px; background: #25d366; border-color: #25d366;">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span>Fazer Upload das Fotos do Ensaio</span>
            </button>
            <input type="file" accept="image/*" multiple class="cli-photos-file" data-index="${index}" style="display: none !important;">
            <textarea rows="2" class="cli-photos-text" style="margin-top: 8px;" placeholder="Links das fotos (1 por linha)">${escapeHtml(photos.join("\n"))}</textarea>
          </div>
        </div>
      `;
    }).join("");

    container.querySelectorAll(".btn-delete-client").forEach(btn => {
      btn.addEventListener("click", () => {
        syncClientsInputsFromDOM();
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm(`Excluir a conta e o ensaio de "${currentClientAccounts[idx]?.clientName}"?`)) {
          currentClientAccounts.splice(idx, 1);
          renderClientsEditor();
        }
      });
    });

    container.querySelectorAll(".btn-remove-client-photo").forEach(btn => {
      btn.addEventListener("click", () => {
        syncClientsInputsFromDOM();
        const cliIdx = parseInt(btn.getAttribute("data-cli-index"), 10);
        const photoIdx = parseInt(btn.getAttribute("data-photo-index"), 10);
        if (currentClientAccounts[cliIdx]?.photos) {
          currentClientAccounts[cliIdx].photos.splice(photoIdx, 1);
          renderClientsEditor();
        }
      });
    });

    container.querySelectorAll(".btn-upload-client-photos").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = btn.getAttribute("data-index");
        container.querySelector(`.cli-photos-file[data-index="${idx}"]`)?.click();
      });
    });

    container.querySelectorAll(".cli-photos-file").forEach(input => {
      input.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        syncClientsInputsFromDOM();
        const idx = parseInt(input.getAttribute("data-index"), 10);
        try {
          if (!currentClientAccounts[idx].photos) currentClientAccounts[idx].photos = [];
          for (const file of files) {
            const base64 = await readAndCompressImage(file, 1600, 0.84);
            currentClientAccounts[idx].photos.push(base64);
          }
          currentClientAccounts[idx].coverImage = currentClientAccounts[idx].photos[0] || "";
          renderClientsEditor();
        } catch (err) {
          alert("Erro ao enviar fotos do cliente: " + err.message);
        }
      });
    });
  }

  const btnAddClientAccount = document.getElementById("btnAddClientAccount");
  if (btnAddClientAccount) {
    btnAddClientAccount.addEventListener("click", () => {
      syncClientsInputsFromDOM();
      const randomNum = Math.floor(100 + Math.random() * 900);
      currentClientAccounts.push({
        id: "cli_" + Date.now(),
        clientName: "Novo Cliente",
        clientEmail: `cliente${randomNum}@email.com`,
        accessCode: `ENSAIO${randomNum}`,
        password: "1234",
        galleryTitle: "Ensaio Fotográfico PH Media",
        eventDate: "2026",
        downloadUrl: "",
        coverImage: "assets/images/reel-1.jpg",
        photos: ["assets/images/reel-1.jpg"]
      });
      renderClientsEditor();
    });
  }

  const btnSaveClients = document.getElementById("btnSaveClients");
  if (btnSaveClients) {
    btnSaveClients.addEventListener("click", async () => {
      syncClientsInputsFromDOM();
      await saveClientAccounts(currentClientAccounts);
      alert("✅ Acessos de clientes e ensaios salvos com sucesso! O cliente já pode entrar pelo mesmo botão de login do site.");
      await loadClientsData();
    });
  }

  // =========================================================================
  // 6. ALTERAR CREDENCIAIS DO ADMINISTRADOR (E-MAIL + SENHA)
  // =========================================================================
  const newAdminEmailInput = document.getElementById("newAdminEmailInput");
  if (newAdminEmailInput) {
    newAdminEmailInput.value = localStorage.getItem("phmedia_custom_admin_email") || "admin@phmedia.com";
  }

  const btnSaveNewPin = document.getElementById("btnSaveNewPin");
  if (btnSaveNewPin) {
    btnSaveNewPin.addEventListener("click", () => {
      const emailVal = (document.getElementById("newAdminEmailInput")?.value || "").trim().toLowerCase();
      const newPinInput = document.getElementById("newAdminPinInput");
      const newPin = newPinInput?.value.trim() || "";

      if (emailVal) {
        localStorage.setItem("phmedia_custom_admin_email", emailVal);
      }
      if (newPin.length > 0) {
        if (newPin.length < 3) {
          alert("A nova senha deve ter pelo menos 3 caracteres.");
          return;
        }
        localStorage.setItem("phmedia_custom_pin", newPin);
        newPinInput.value = "";
      }
      alert("✅ Credenciais de Administrador atualizadas com sucesso!");
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }
});
