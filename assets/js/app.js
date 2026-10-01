/**
 * PH MEDIA - Main Interactive Client Application
 */

import { 
  saveLead, 
  getServicesConfig, 
  getCalcOptions, 
  getPortfolioItems,
  getFaqs
} from "./firebase-config.js";

// Configurable Studio Phone & Data
const STUDIO_CONFIG = {
  whatsappNumber: "5542988640610", // Pedro Henrique - PH Media
  instagram: "https://www.instagram.com/phmedia.br?stkn=bnYxbzBpYTVlNGl6",
  location: "Ponta Grossa – PR"
};

document.addEventListener("DOMContentLoaded", async () => {
  await initServicesShowcase();
  await initCalculator();
  await initPortfolioShowcase();
  await initFaqShowcase();
  initLeadForm();
  initScrollAnimations();
  initDateYear();
});

/**
 * 1. Dynamic Services Showcase & Pill Navigation (Quadro 1)
 */
async function initServicesShowcase() {
  const navContainer = document.getElementById("servicesNav");
  const card = document.getElementById("serviceCard");
  const titleEl = document.getElementById("serviceTitle");
  const descEl = document.getElementById("serviceDescription");
  const iconBadgeEl = document.getElementById("serviceIconBadge");
  const featuresEl = document.getElementById("serviceFeatures");
  const priceTypeEl = document.getElementById("pricingType");
  const priceEl = document.getElementById("servicePrice");
  const subtextEl = document.getElementById("pricingSubtext");
  const waBtn = document.getElementById("serviceWhatsappBtn");

  const services = await getServicesConfig();
  if (!services || services.length === 0) return;

  // Render Pill Navigation dynamically
  if (navContainer) {
    navContainer.innerHTML = services.map((s, idx) => `
      <button class="service-pill-btn ${idx === 0 ? 'active' : ''}" role="tab" aria-selected="${idx === 0}" data-service="${s.id}" id="tab-${s.id}">
        <i class="fa-solid ${s.icon || 'fa-star'}"></i>
        <span>${s.title}</span>
      </button>
    `).join("");
  }

  function renderService(serviceKey) {
    const data = services.find(s => s.id === serviceKey) || services[0];
    if (!data) return;

    // Smooth card transition
    card.style.opacity = "0.4";
    card.style.transform = "translateY(8px)";

    setTimeout(() => {
      titleEl.textContent = data.title;
      descEl.textContent = data.description;
      iconBadgeEl.innerHTML = `<i class="fa-solid ${data.icon || 'fa-star'}"></i>`;
      priceTypeEl.textContent = data.pricingType || "Investimento";
      priceEl.textContent = data.price;
      subtextEl.textContent = data.subtext || "";

      featuresEl.innerHTML = (data.features || [])
        .map(feat => `<div class="feature-item"><i class="fa-solid fa-check"></i> ${feat}</div>`)
        .join("");

      const msg = data.whatsappText || `Olá Pedro! Tenho interesse no serviço de *${data.title}* (R$ ${data.price}). Podemos conversar?`;
      const waUrl = `https://wa.me/${STUDIO_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
      waBtn.href = waUrl;

      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 150);
  }

  const pills = navContainer.querySelectorAll(".service-pill-btn");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => {
        p.classList.remove("active");
        p.setAttribute("aria-selected", "false");
      });

      pill.classList.add("active");
      pill.setAttribute("aria-selected", "true");

      const serviceId = pill.getAttribute("data-service");
      renderService(serviceId);
    });
  });

  // Render first item
  renderService(services[0].id);
}

/**
 * 2. Interactive Budget Simulator (Quadro 2)
 */
async function initCalculator() {
  const optionsContainer = document.querySelector(".calc-options-group");
  const totalValueEl = document.getElementById("calcTotalValue");
  const applyBtn = document.getElementById("btnApplyCombo");

  const options = await getCalcOptions();
  if (optionsContainer && options && options.length > 0) {
    optionsContainer.innerHTML = options.map((opt, idx) => `
      <label class="calc-option">
        <input type="checkbox" name="calc-addon" value="${opt.price}" data-name="${opt.name}" ${idx === 0 || opt.checked ? 'checked' : ''}>
        <div class="calc-option-box">
          <div class="option-info">
            <span class="option-title">${opt.name}</span>
            <span class="option-desc">${opt.desc || ''}</span>
          </div>
          <span class="option-price">+ R$ ${opt.price}</span>
        </div>
      </label>
    `).join("");
  }

  const checkboxes = document.querySelectorAll('input[name="calc-addon"]');

  function calculateTotal() {
    let total = 0;
    const selectedItems = [];

    checkboxes.forEach(cb => {
      if (cb.checked) {
        total += parseFloat(cb.value);
        selectedItems.push(cb.getAttribute("data-name"));
      }
    });

    totalValueEl.textContent = total.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return { total, selectedItems };
  }

  checkboxes.forEach(cb => {
    cb.addEventListener("change", calculateTotal);
  });

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const { total, selectedItems } = calculateTotal();
      const itemsList = selectedItems.length > 0 ? selectedItems.join(", ") : "Serviços sob consulta";
      const text = `Olá Pedro! Montei uma simulação no site da PH Media com os seguintes serviços:\n- *Itens:* ${itemsList}\n- *Valor estimado:* R$ ${total.toFixed(2)}\n\nGostaria de confirmar a disponibilidade e fechar a proposta!`;
      const waUrl = `https://wa.me/${STUDIO_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, "_blank");
    });
  }

  calculateTotal();
}

/**
 * 3. Portfolio Showcase (Pastas, Projetos & Fullscreen Lightbox Modal)
 */
let currentModalProject = null;
let currentModalPhotoIndex = 0;

async function initPortfolioShowcase() {
  const portfolioGrid = document.querySelector(".portfolio-grid");
  const items = await getPortfolioItems();

  if (portfolioGrid && items && items.length > 0) {
    portfolioGrid.innerHTML = items.map((p, index) => {
      const photosCount = (p.photos && p.photos.length) || 1;
      return `
        <div class="portfolio-card" data-index="${index}" role="button" tabindex="0" aria-label="Abrir galeria de ${escapeHtml(p.title)}" style="cursor: pointer;">
          <div class="portfolio-img-wrap">
            <img src="${p.image}" alt="${p.title}" loading="lazy">
            <div class="portfolio-badge">${p.category || 'AUDIOVISUAL'}</div>
            <div class="play-overlay">
              <i class="fa-solid fa-images"></i>
            </div>
          </div>
          <div class="portfolio-info">
            <h4>${p.title}</h4>
            <p>${p.desc || ''}</p>
            <span style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 4px; margin-top: 6px;">
              <i class="fa-solid fa-expand"></i> Ver fotos do projeto (${photosCount})
            </span>
          </div>
        </div>
      `;
    }).join("");

    // Use delegated container click + direct listeners for 100% reliable trigger
    portfolioGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".portfolio-card");
      if (card) {
        const index = parseInt(card.getAttribute("data-index"), 10);
        if (items[index]) {
          openPortfolioModal(items[index]);
        }
      }
    });

    portfolioGrid.querySelectorAll(".portfolio-card").forEach(card => {
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const index = parseInt(card.getAttribute("data-index"), 10);
          if (items[index]) {
            openPortfolioModal(items[index]);
          }
        }
      });
    });
  }

  initModalEvents();
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function openPortfolioModal(project) {
  if (!project) return;
  currentModalProject = project;
  currentModalPhotoIndex = 0;

  const modal = document.getElementById("portfolioModal");
  const badgeEl = document.getElementById("modalCategoryBadge");
  const titleEl = document.getElementById("modalProjectTitle");
  const descEl = document.getElementById("modalProjectDesc");
  const waBtn = document.getElementById("modalWhatsAppBtn");
  const thumbsContainer = document.getElementById("modalThumbnailsStrip");

  if (!modal) {
    console.error("Portfolio modal element not found in DOM");
    return;
  }

  const photos = (project.photos && project.photos.length > 0) ? project.photos : [project.image];

  if (badgeEl) badgeEl.textContent = project.category || "AUDIOVISUAL";
  if (titleEl) titleEl.textContent = project.title || "Projeto";
  if (descEl) descEl.textContent = project.desc || "Produção audiovisual e direção fotográfica por PH Media.";

  if (waBtn) {
    const waText = `Olá Pedro! Vi as fotos do projeto *${project.title}* no site da PH Media e gostaria de solicitar um orçamento similar para minha marca.`;
    waBtn.href = `https://wa.me/${STUDIO_CONFIG.whatsappNumber}?text=${encodeURIComponent(waText)}`;
  }

  // Render Thumbnails
  if (thumbsContainer) {
    if (photos.length > 1) {
      thumbsContainer.style.display = "flex";
      thumbsContainer.innerHTML = photos.map((src, idx) => `
        <div class="modal-thumb ${idx === 0 ? 'active' : ''}" data-thumb-idx="${idx}">
          <img src="${src}" alt="Foto ${idx + 1}" loading="lazy">
        </div>
      `).join("");

      thumbsContainer.querySelectorAll(".modal-thumb").forEach(th => {
        th.addEventListener("click", () => {
          const idx = parseInt(th.getAttribute("data-thumb-idx"), 10);
          showModalPhoto(idx);
        });
      });
    } else {
      thumbsContainer.style.display = "none";
      thumbsContainer.innerHTML = "";
    }
  }

  // Open modal explicitly
  modal.style.display = "flex";
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  showModalPhoto(0);
}

function closePortfolioModal() {
  const modal = document.getElementById("portfolioModal");
  if (!modal) return;

  modal.classList.add("hidden");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  currentModalProject = null;
}

function showModalPhoto(index) {
  if (!currentModalProject) return;

  const photos = (currentModalProject.photos && currentModalProject.photos.length > 0)
    ? currentModalProject.photos
    : [currentModalProject.image];

  const total = photos.length;
  if (total === 0) return;

  currentModalPhotoIndex = (index + total) % total;

  const mainImg = document.getElementById("modalMainImg");
  const counterEl = document.getElementById("modalCounterBadge");
  const prevBtn = document.getElementById("modalBtnPrev");
  const nextBtn = document.getElementById("modalBtnNext");
  const thumbs = document.querySelectorAll(".modal-thumb");

  if (counterEl) {
    counterEl.textContent = `${currentModalPhotoIndex + 1} / ${total}`;
  }

  if (prevBtn && nextBtn) {
    if (total <= 1) {
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
    } else {
      prevBtn.style.display = "flex";
      nextBtn.style.display = "flex";
    }
  }

  if (mainImg) {
    const nextSrc = photos[currentModalPhotoIndex];
    mainImg.src = nextSrc;
    mainImg.style.opacity = "1";
    mainImg.style.transform = "scale(1)";
  }

  // Update active thumbnail
  thumbs.forEach((th, idx) => {
    if (idx === currentModalPhotoIndex) {
      th.classList.add("active");
      th.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    } else {
      th.classList.remove("active");
    }
  });
}

  // Update active thumbnail
  thumbs.forEach((th, idx) => {
    if (idx === currentModalPhotoIndex) {
      th.classList.add("active");
      th.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    } else {
      th.classList.remove("active");
    }
  });
}

function initModalEvents() {
  const closeBtn = document.getElementById("btnClosePortfolioModal");
  const backdrop = document.getElementById("modalBackdrop");
  const prevBtn = document.getElementById("modalBtnPrev");
  const nextBtn = document.getElementById("modalBtnNext");
  const mainImg = document.getElementById("modalMainImg");

  if (closeBtn) closeBtn.addEventListener("click", closePortfolioModal);
  if (backdrop) backdrop.addEventListener("click", closePortfolioModal);

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showModalPhoto(currentModalPhotoIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showModalPhoto(currentModalPhotoIndex + 1);
    });
  }

  // Keyboard navigation
  window.addEventListener("keydown", (e) => {
    const modal = document.getElementById("portfolioModal");
    if (!modal || modal.classList.contains("hidden")) return;

    if (e.key === "Escape") {
      closePortfolioModal();
    } else if (e.key === "ArrowLeft") {
      showModalPhoto(currentModalPhotoIndex - 1);
    } else if (e.key === "ArrowRight") {
      showModalPhoto(currentModalPhotoIndex + 1);
    }
  });

  // Mobile Touch Swipe support
  if (mainImg) {
    let touchStartX = 0;
    let touchEndX = 0;

    mainImg.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    mainImg.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const swipeDistance = touchEndX - touchStartX;
      if (Math.abs(swipeDistance) > 40) {
        if (swipeDistance > 0) {
          // Swiped Right -> Previous Photo
          showModalPhoto(currentModalPhotoIndex - 1);
        } else {
          // Swiped Left -> Next Photo
          showModalPhoto(currentModalPhotoIndex + 1);
        }
      }
    }, { passive: true });
  }
}

/**
 * 4. FAQ / Dúvidas Frequentes Dinâmicas
 */
async function initFaqShowcase() {
  const accordionList = document.querySelector(".accordion-list");
  const faqs = await getFaqs();

  if (accordionList && faqs && faqs.length > 0) {
    accordionList.innerHTML = faqs.map(f => `
      <details class="accordion-item glass-card">
        <summary class="accordion-summary">
          <span>${f.question}</span>
          <i class="fa-solid fa-chevron-down"></i>
        </summary>
        <div class="accordion-content">
          <p>${f.answer}</p>
        </div>
      </details>
    `).join("");
  }
}

/**
 * 5. Lead Capture Form with Firebase & Direct Toast Feedback
 */
function initLeadForm() {
  const form = document.getElementById("leadForm");
  const submitBtn = document.getElementById("submitLeadBtn");
  const feedbackEl = document.getElementById("formFeedback");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const leadData = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      service: formData.get("service"),
      message: formData.get("message") || ""
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Enviando...</span>`;
    feedbackEl.classList.add("hidden");

    try {
      await saveLead(leadData);
      showToast("✨ Solicitação enviada com sucesso! Falaremos com você em breve.", "success");

      form.reset();
      feedbackEl.className = "form-feedback success";
      feedbackEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Proposta recebida! Você também pode nos chamar diretamente no WhatsApp para agilizar o atendimento.`;
      feedbackEl.classList.remove("hidden");

      setTimeout(() => {
        const quickPrompt = confirm("Deseja abrir o WhatsApp agora mesmo para falar diretamente com o Pedro?");
        if (quickPrompt) {
          const msg = `Olá Pedro! Acabei de enviar uma proposta pelo site para o serviço: *${leadData.service}*. Meu nome é ${leadData.name}.`;
          window.open(`https://wa.me/${STUDIO_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
        }
      }, 700);

    } catch (err) {
      console.error(err);
      feedbackEl.className = "form-feedback error";
      feedbackEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Ocorreu um erro ao enviar. Por favor, envie diretamente pelo WhatsApp.`;
      feedbackEl.classList.remove("hidden");
      showToast("Erro ao processar. Tente via WhatsApp.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>Enviar Solicitação</span>`;
    }
  });
}

/**
 * Toast Notifications
 */
export function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * 5. Full-Site Dynamic Scroll Kinetic & Physics Engine
 */
function initScrollAnimations() {
  const header = document.getElementById("mainHeader");
  const logoImg = document.querySelector(".logo-img");
  const heroPortrait = document.getElementById("heroPortrait");
  const heroContent = document.querySelector(".hero-content");
  const heroName = document.querySelector(".hero-name");
  const heroCtaBtn = document.querySelector(".hero-cta-btn");
  const locationBadge = document.querySelector(".location-badge");
  const servicePills = document.querySelectorAll(".service-pill-btn");
  const serviceCard = document.getElementById("serviceCard");
  const calcCard = document.getElementById("orcamento");
  const servicePrice = document.getElementById("servicePrice");
  const serviceBadge = document.getElementById("serviceIconBadge");
  const sectionHeaders = document.querySelectorAll(".section-header");
  const calcOptions = document.querySelectorAll(".calc-option-box");
  const floatingWa = document.getElementById("floatingWhatsapp");
  const portfolioCards = document.querySelectorAll(".portfolio-card");

  let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
  let ticking = false;

  function onFullSiteScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const scrollDelta = scrollY - lastScrollY;
    const scrollSpeed = Math.min(Math.abs(scrollDelta), 50);
    const scrollDir = scrollDelta >= 0 ? 1 : -1; // 1 = down, -1 = up

    // 1. TOP HEADER & LOGO REACTIVITY
    if (header) {
      if (scrollY > 30) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    }
    if (logoImg) {
      const logoScale = 1 + Math.min(scrollSpeed * 0.002, 0.08);
      logoImg.style.transform = `scale(${logoScale.toFixed(3)})`;
    }

    // 2. HERO PORTRAIT: Pronounced Dynamic Cinematic Zoom (from 1.0x up to 1.55x)
    if (heroPortrait) {
      const progress = Math.min(Math.max(scrollY / 420, 0), 1);
      const scale = 1 + Math.pow(progress, 0.8) * 0.55;
      const translateY = progress * 30;
      heroPortrait.style.transform = `scale(${scale.toFixed(4)}) translateY(${translateY.toFixed(1)}px)`;
    }

    // 3. HERO TEXTS & MAIN BUTTON: Kinetic Parallax & Float
    if (heroContent) {
      const heroOffset = Math.min(scrollY * 0.18, 90);
      const heroOpacity = Math.max(1 - scrollY / 650, 0);
      heroContent.style.transform = `translateY(${heroOffset.toFixed(1)}px)`;
      heroContent.style.opacity = heroOpacity.toFixed(3);

      if (heroName) {
        const letterSpacing = -0.5 + Math.min(scrollY * 0.004, 3);
        heroName.style.letterSpacing = `${letterSpacing.toFixed(2)}px`;
      }
      if (heroCtaBtn) {
        const btnScale = 1 + Math.min(scrollY * 0.0003, 0.05);
        heroCtaBtn.style.transform = `scale(${btnScale.toFixed(3)})`;
      }
      if (locationBadge) {
        const pinRotate = scrollDir * Math.min(scrollSpeed * 0.4, 12);
        locationBadge.style.transform = `rotate(${pinRotate.toFixed(1)}deg)`;
      }
    }

    // 4. SIMULTANEOUS OPPOSING LATERAL SURGE FOR BUTTONS & CONTROLS
    // (Even items surge from Left-to-Right, Odd items surge from Right-to-Left simultaneously as you scroll)
    const currentServicePills = document.querySelectorAll(".service-pill-btn");
    currentServicePills.forEach((pill, idx) => {
      const rect = pill.getBoundingClientRect();
      if (rect.bottom >= -60 && rect.top <= windowHeight + 60) {
        const centerOffset = (rect.top + rect.height / 2) - (windowHeight / 2);
        const normDist = centerOffset / (windowHeight / 2);
        const clampedNorm = Math.min(Math.max(normDist, -1.2), 1.2);
        const absDist = Math.abs(clampedNorm);

        // Direction: Even (0, 2) comes from Left (-), Odd (1, 3) comes from Right (+)
        const direction = (idx % 2 === 0) ? -1 : 1;
        const maxShift = 46;
        const translateX = direction * clampedNorm * maxShift;
        const scale = pill.classList.contains("active") ? 1.02 : (1.03 - absDist * 0.05);

        pill.style.transform = `translateX(${translateX.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      }
    });

    // 5. HIGH-IMPACT 3D CARD PHYSICS (Quadro 1 & Quadro 2)
    function applyHighImpactPhysics(cardElement, isServiceShowcase = false) {
      if (!cardElement) return;
      const rect = cardElement.getBoundingClientRect();
      
      if (rect.bottom >= -80 && rect.top <= windowHeight + 80) {
        const cardCenter = rect.top + rect.height / 2;
        const screenCenter = windowHeight / 2;
        const offset = (cardCenter - screenCenter) / (windowHeight / 2);
        const clampedOffset = Math.min(Math.max(offset, -1.2), 1.2);
        const absOffset = Math.abs(clampedOffset);

        const inertiaTilt = scrollDir * Math.min(scrollSpeed * 0.15, 3);
        const rotateX = (clampedOffset * -8.5) + inertiaTilt;
        const scale = 1.065 - absOffset * 0.085;
        const translateZ = (1 - absOffset) * 22;

        const shadowBlur = Math.max(50 - absOffset * 30, 10);
        const shadowY = Math.max(25 - absOffset * 15, 6);
        const shadowOpacity = Math.max(0.18 - absOffset * 0.12, 0.03);
        const borderColor = `rgba(0, 0, 0, ${Math.max(0.35 - absOffset * 0.25, 0.08).toFixed(2)})`;

        const sheenX = ((1 - clampedOffset) * 50 + 25).toFixed(1) + "%";
        const sheenY = ((clampedOffset + 1) * 40 + 10).toFixed(1) + "%";
        const sheenOpacity = Math.max(0.65 - absOffset * 0.45, 0.1).toFixed(2);

        cardElement.style.setProperty("--mouse-x", sheenX);
        cardElement.style.setProperty("--mouse-y", sheenY);
        cardElement.style.setProperty("--sheen-opacity", sheenOpacity);

        cardElement.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) translateZ(${translateZ.toFixed(1)}px) scale(${scale.toFixed(4)})`;
        cardElement.style.boxShadow = `0 ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity.toFixed(3)})`;
        cardElement.style.borderColor = borderColor;

        if (isServiceShowcase) {
          if (servicePrice) {
            const pricePop = 1 + (1 - absOffset) * 0.10;
            servicePrice.style.transform = `scale(${Math.max(pricePop, 1).toFixed(3)})`;
          }
          if (serviceBadge) {
            const badgeRotate = clampedOffset * -18;
            const badgePop = 35 + (1 - absOffset) * 18;
            serviceBadge.style.transform = `translateZ(${badgePop}px) rotate(${badgeRotate.toFixed(1)}deg)`;
          }
        }
      }
    }

    applyHighImpactPhysics(serviceCard, true);
    applyHighImpactPhysics(calcCard, false);

    // 6. CALCULATOR OPTIONS: 3D Depth Wave & Kinetic Elevation Pop (No lateral translation)
    const currentCalcOptions = document.querySelectorAll(".calc-option-box");
    currentCalcOptions.forEach((optBox, idx) => {
      const rect = optBox.getBoundingClientRect();
      if (rect.bottom >= -60 && rect.top <= windowHeight + 60) {
        const centerOffset = (rect.top + rect.height / 2) - (windowHeight / 2);
        const normDist = centerOffset / (windowHeight / 2);
        const clampedNorm = Math.min(Math.max(normDist, -1.2), 1.2);
        const absDist = Math.abs(clampedNorm);

        // 3D Perspective Tilt and Smooth Elevation Pop (Kept centered without lateral shift)
        const tiltX = clampedNorm * -4.0;
        const elevationZ = (1 - absDist) * 14;
        const optScale = 1.03 - absDist * 0.035;
        const shadowY = Math.max(8 - absDist * 5, 2);
        const shadowBlur = Math.max(20 - absDist * 12, 4);
        const shadowOpacity = Math.max(0.12 - absDist * 0.08, 0.02);

        optBox.style.transform = `perspective(600px) rotateX(${tiltX.toFixed(2)}deg) translateZ(${elevationZ.toFixed(1)}px) scale(${optScale.toFixed(3)})`;
        optBox.style.boxShadow = `0 ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity.toFixed(3)})`;
      }
    });

    // 7. SECTION HEADERS & TITLES: Dynamic Tracking Expansion
    sectionHeaders.forEach((sh) => {
      const rect = sh.getBoundingClientRect();
      if (rect.bottom >= 0 && rect.top <= windowHeight) {
        const centerOffset = (rect.top + rect.height / 2) - (windowHeight / 2);
        const normDist = Math.abs(centerOffset) / (windowHeight / 2);
        const clampedDist = Math.min(Math.max(normDist, 0), 1);
        
        const titleTag = sh.querySelector(".section-tag");
        const titleH2 = sh.querySelector(".section-title");
        
        if (titleTag) {
          const letterSpacing = 2.5 + (1 - clampedDist) * 1.5;
          titleTag.style.letterSpacing = `${letterSpacing.toFixed(1)}px`;
        }
        if (titleH2) {
          const titleScale = 1.03 - clampedDist * 0.04;
          titleH2.style.transform = `scale(${titleScale.toFixed(3)})`;
        }
      }
    });

    // 8. PORTFOLIO CARDS & IMAGE BUTTONS / BADGES: Simultaneous Lateral Surge & Zoom
    const currentPortfolioCards = document.querySelectorAll(".portfolio-card");
    currentPortfolioCards.forEach((card, idx) => {
      const rect = card.getBoundingClientRect();
      if (rect.bottom >= -80 && rect.top <= windowHeight + 80) {
        const centerOffset = (rect.top + rect.height / 2) - (windowHeight / 2);
        const normDist = centerOffset / (windowHeight / 2);
        const clampedNorm = Math.min(Math.max(normDist, -1.2), 1.2);
        const absDist = Math.abs(clampedNorm);

        const direction = (idx % 2 === 0) ? -1 : 1;
        const cardShift = direction * clampedNorm * 18;
        const badge = card.querySelector(".portfolio-badge");
        const playBtn = card.querySelector(".play-overlay");
        const img = card.querySelector("img");

        if (img) {
          const cardZoom = 1.20 - absDist * 0.16;
          img.style.transform = `scale(${cardZoom.toFixed(4)})`;
        }

        const cardTilt = clampedNorm * -4;
        card.style.transform = `perspective(800px) rotateX(${cardTilt.toFixed(1)}deg) translateX(${cardShift.toFixed(1)}px)`;

        // Image badge & play button surge simultaneously from opposite sides
        if (badge) {
          const badgeX = direction * clampedNorm * 42;
          badge.style.transform = `translateX(${badgeX.toFixed(1)}px)`;
        }
        if (playBtn) {
          const playX = (-direction) * clampedNorm * 38;
          playBtn.style.transform = `translate(-50%, -50%) translateX(${playX.toFixed(1)}px) scale(${Math.max(1 - absDist * 0.3, 0.75).toFixed(2)})`;
        }
      }
    });

    // 8.1. KEEP THE TWO PRICING PACKAGE BUTTONS FIXED / CENTERED (No lateral shift)
    const serviceWaBtn = document.getElementById("serviceWhatsappBtn");
    if (serviceWaBtn) {
      serviceWaBtn.style.transform = "";
    }

    const applyComboBtn = document.getElementById("btnApplyCombo");
    if (applyComboBtn) {
      applyComboBtn.style.transform = "";
    }

    // 9. FLOATING WHATSAPP BUTTON: Reactive Velocity Pulse
    if (floatingWa) {
      const waPulse = 1 + Math.min(scrollSpeed * 0.005, 0.18);
      const waRotate = scrollDir * Math.min(scrollSpeed * 0.35, 15);
      floatingWa.style.transform = `scale(${waPulse.toFixed(3)}) rotate(${waRotate.toFixed(1)}deg)`;
    }

    // 10. VERTICAL CAROUSEL CENTER-STAGE SPOTLIGHT (Wider focus, subtle edge transition)
    const mainSections = document.querySelectorAll(".main-content > section, .main-footer");
    mainSections.forEach((sec) => {
      const rect = sec.getBoundingClientRect();
      if (rect.bottom >= -100 && rect.top <= windowHeight + 100) {
        // Keep hero crystal-clear when user is at the top
        if (sec.id === "hero" && scrollY < 120) {
          sec.style.opacity = "1";
          sec.style.transform = "scale(1)";
          sec.style.filter = "none";
          return;
        }

        const secCenter = rect.top + rect.height / 2;
        const screenCenter = windowHeight / 2;
        const distNorm = Math.abs(secCenter - screenCenter) / (windowHeight / 2);

        // Core spotlight focus: wide center zone (up to 0.55), only smooth softening near borders (min 0.55)
        let focusOpacity = 1;
        if (distNorm > 0.55) {
          focusOpacity = Math.max(1 - (distNorm - 0.55) * 1.0, 0.55);
        }

        // Subtly scale down towards top & bottom borders (1.0 -> 0.97)
        const stageScale = Math.max(1 - Math.min(distNorm * 0.03, 0.03), 0.97);

        sec.style.opacity = focusOpacity.toFixed(3);
        sec.style.transform = `scale(${stageScale.toFixed(3)})`;
        sec.style.filter = "none";
      }
    });

    lastScrollY = scrollY;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(onFullSiteScroll);
      ticking = true;
    }
  }, { passive: true });

  onFullSiteScroll();
}

/**
 * 6. Dynamic Year in Footer
 */
function initDateYear() {
  const yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}
