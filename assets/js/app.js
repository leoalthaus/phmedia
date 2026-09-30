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
 * 3. Portfolio Showcase (Pastas & Projetos)
 */
async function initPortfolioShowcase() {
  const portfolioGrid = document.querySelector(".portfolio-grid");
  const items = await getPortfolioItems();

  if (portfolioGrid && items && items.length > 0) {
    portfolioGrid.innerHTML = items.map(p => `
      <div class="portfolio-card">
        <div class="portfolio-img-wrap">
          <img src="${p.image}" alt="${p.title}" loading="lazy">
          <div class="portfolio-badge">${p.category || 'AUDIOVISUAL'}</div>
          <div class="play-overlay">
            <i class="fa-solid fa-play"></i>
          </div>
        </div>
        <div class="portfolio-info">
          <h4>${p.title}</h4>
          <p>${p.desc || ''}</p>
        </div>
      </div>
    `).join("");
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

    // 4. SERVICE PILL BUTTONS (Quadro 1 Nav): Dynamic Kinetic Stagger Wave
    servicePills.forEach((pill, idx) => {
      const rect = pill.getBoundingClientRect();
      if (rect.bottom >= 0 && rect.top <= windowHeight) {
        const centerOffset = (rect.top + rect.height / 2) - (windowHeight / 2);
        const normDist = Math.abs(centerOffset) / (windowHeight / 2);
        const clampedDist = Math.min(Math.max(normDist, 0), 1);
        
        const waveScale = 1.04 - clampedDist * 0.06;
        const waveX = (1 - clampedDist) * (idx % 2 === 0 ? 3 : -3);
        
        if (!pill.classList.contains("active")) {
          pill.style.transform = `translateX(${waveX.toFixed(1)}px) scale(${waveScale.toFixed(3)})`;
        }
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

    // 6. CALCULATOR OPTIONS: Interactive Micro-Tilt on Scroll
    calcOptions.forEach((optBox) => {
      const rect = optBox.getBoundingClientRect();
      if (rect.bottom >= 0 && rect.top <= windowHeight) {
        const centerOffset = (rect.top + rect.height / 2) - (windowHeight / 2);
        const normDist = Math.abs(centerOffset) / (windowHeight / 2);
        const clampedDist = Math.min(Math.max(normDist, 0), 1);
        const optScale = 1.02 - clampedDist * 0.03;
        optBox.style.transform = `scale(${optScale.toFixed(3)})`;
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

    // 8. PORTFOLIO CARDS & IMAGES: Continuous Zoom & Parallax Lift
    portfolioCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.bottom >= 0 && rect.top <= windowHeight) {
        const centerOffset = (rect.top + rect.height / 2) - (windowHeight / 2);
        const normDist = Math.abs(centerOffset) / (windowHeight / 2);
        const clampedDist = Math.min(Math.max(normDist, 0), 1);

        const img = card.querySelector("img");
        if (img) {
          const cardZoom = 1.20 - clampedDist * 0.16;
          img.style.transform = `scale(${cardZoom.toFixed(4)})`;
        }

        const cardTilt = (centerOffset / (windowHeight / 2)) * -4;
        card.style.transform = `perspective(800px) rotateX(${cardTilt.toFixed(1)}deg) translateY(${(-clampedDist * 4).toFixed(1)}px)`;
      }
    });

    // 9. FLOATING WHATSAPP BUTTON: Reactive Velocity Pulse
    if (floatingWa) {
      const waPulse = 1 + Math.min(scrollSpeed * 0.005, 0.18);
      const waRotate = scrollDir * Math.min(scrollSpeed * 0.35, 15);
      floatingWa.style.transform = `scale(${waPulse.toFixed(3)}) rotate(${waRotate.toFixed(1)}deg)`;
    }

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
