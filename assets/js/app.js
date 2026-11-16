/**
 * PH MEDIA - Main Interactive Client Application
 */

import { 
  saveLead, 
  getServicesConfig, 
  getCalcOptions, 
  getPortfolioItems,
  getFaqs,
  getFeedbacks
} from "./firebase-config.js";

// Configurable Studio Phone & Data
const STUDIO_CONFIG = {
  whatsappNumber: "5542988640610", // Pedro Henrique - PH Media
  instagram: "https://www.instagram.com/phmedia.br?stkn=bnYxbzBpYTVlNGl6",
  location: "Ponta Grossa – PR"
};

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Portfolio is top priority for visual rendering and lightbox click
  try {
    await initPortfolioShowcase();
  } catch (e) {
    console.error("Portfolio init error:", e);
  }

  // 2. Services Quadro 1
  try {
    await initServicesShowcase();
  } catch (e) {
    console.error("Services init error:", e);
  }

  // 3. Feedbacks
  try {
    await initFeedbacksShowcase();
  } catch (e) {
    console.error("Feedbacks init error:", e);
  }

  // 4. FAQ
  try {
    await initFaqShowcase();
  } catch (e) {
    console.error("FAQ init error:", e);
  }

  // 5. Forms, Scroll & Year
  try {
    initLeadForm();
    initScrollAnimations();
    initDateYear();
  } catch (e) {
    console.error("Core animations init error:", e);
  }
});

/**
 * 1. Dynamic Services Showcase (Editorial Cards -> Direct Redirect)
 */
async function initServicesShowcase() {
  const navContainer = document.getElementById("servicesNav");
  if (!navContainer) return;

  const services = await getServicesConfig();
  if (!services || services.length === 0) return;

  navContainer.innerHTML = services.map((s) => {
    const msg = s.whatsappText || `Olá Pedro! Tenho interesse no serviço de *${s.title}*. Podemos conversar?`;
    const url = s.redirectUrl || `https://wa.me/${STUDIO_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    return `
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="service-pill-btn" data-service="${s.id}" id="tab-${s.id}">
        <div class="service-btn-header">
          <span class="service-btn-title">${s.title}</span>
          <span class="service-btn-arrow" aria-hidden="true">↗</span>
        </div>
        <p class="service-btn-desc">${s.shortDesc || s.description || ''}</p>
      </a>
    `;
  }).join("");
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
let cachedPortfolioItems = [];

async function initPortfolioShowcase() {
  const portfolioGrid = document.querySelector(".portfolio-grid");
  const items = await getPortfolioItems();
  cachedPortfolioItems = items || [];
  window.loadedPortfolioItems = cachedPortfolioItems;

  if (portfolioGrid && items && items.length > 0) {
    portfolioGrid.innerHTML = items.map((p, index) => {
      return `
        <div class="portfolio-card portfolio-slide" data-index="${index}" role="button" tabindex="0" aria-label="Abrir galeria de ${escapeHtml(p.title)}">
          <div class="portfolio-img-wrap">
            <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy">
          </div>
        </div>
      `;
    }).join("");

    // Carousel Next Arrow Button
    const nextSlideBtn = document.getElementById("portfolioNextBtn");
    if (nextSlideBtn) {
      nextSlideBtn.onclick = (e) => {
        e.stopPropagation();
        const slideWidth = portfolioGrid.querySelector(".portfolio-slide")?.offsetWidth || 280;
        const maxScroll = portfolioGrid.scrollWidth - portfolioGrid.clientWidth;
        if (portfolioGrid.scrollLeft >= maxScroll - 20) {
          portfolioGrid.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          portfolioGrid.scrollBy({ left: slideWidth + 14, behavior: "smooth" });
        }
      };
    }

    // Delegated container click
    portfolioGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".portfolio-card");
      if (card) {
        const index = parseInt(card.getAttribute("data-index"), 10);
        if (cachedPortfolioItems[index]) {
          openPortfolioModal(cachedPortfolioItems[index]);
        }
      }
    });

    // Keyboard support (Enter / Space)
    portfolioGrid.querySelectorAll(".portfolio-card").forEach(card => {
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const index = parseInt(card.getAttribute("data-index"), 10);
          if (cachedPortfolioItems[index]) {
            openPortfolioModal(cachedPortfolioItems[index]);
          }
        }
      });
    });
  }

  initModalEvents();
}

// Global click fallback for any .portfolio-card anywhere on the page
document.addEventListener("click", (e) => {
  const card = e.target.closest(".portfolio-card");
  if (card) {
    const idxAttr = card.getAttribute("data-index");
    const index = idxAttr !== null ? parseInt(idxAttr, 10) : 0;
    if (cachedPortfolioItems && cachedPortfolioItems[index]) {
      openPortfolioModal(cachedPortfolioItems[index]);
    }
  }
});

// Real-time sync when saved from admin panel
window.addEventListener("phmedia_portfolio_updated", (e) => {
  if (e.detail && Array.isArray(e.detail)) {
    cachedPortfolioItems = e.detail;
    initPortfolioShowcase();
  }
});

window.addEventListener("storage", (e) => {
  if (e.key === "phmedia_portfolio" || e.key === "phmedia_portfolio_sync_time") {
    initPortfolioShowcase();
  }
});

// Expose globally so inline clicks or external scripts can open it anytime
window.openPortfolioModal = openPortfolioModal;
window.openPortfolioModalByIndex = function(index) {
  if (cachedPortfolioItems && cachedPortfolioItems[index]) {
    openPortfolioModal(cachedPortfolioItems[index]);
  }
};

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
 * 3.5. Feedbacks / Depoimentos Dinâmicos
 */
async function initFeedbacksShowcase() {
  const track = document.getElementById("feedbacksCarouselTrack");
  if (!track) return;

  const feedbacks = await getFeedbacks();
  if (!feedbacks || feedbacks.length === 0) return;

  track.innerHTML = feedbacks.map(f => {
    const starCount = Math.max(1, Math.min(5, parseInt(f.stars || 5, 10)));
    const starsHtml = Array.from({ length: starCount }).map(() => `<i class="fa-solid fa-star"></i>`).join("");
    return `
      <article class="feedback-card">
        <div class="feedback-card-top">
          <h3 class="feedback-title">${escapeHtml(f.title || "Excelente trabalho!")}</h3>
          <div class="feedback-stars" aria-label="${starCount} estrelas">
            ${starsHtml}
          </div>
        </div>
        <p class="feedback-text">${escapeHtml(f.text || "")}</p>
        <span class="feedback-author">${escapeHtml(f.author || "Cliente")}</span>
      </article>
    `;
  }).join("");
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
 * 5. Ultra-Lightweight 120fps Scroll Handler (Zero Layout Thrashing)
 */
function initScrollAnimations() {
  const header = document.getElementById("mainHeader");
  let isHeaderScrolled = false;
  let ticking = false;

  function onScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    const shouldBeScrolled = scrollY > 24;

    if (shouldBeScrolled !== isHeaderScrolled) {
      isHeaderScrolled = shouldBeScrolled;
      if (header) {
        header.classList.toggle("scrolled", isHeaderScrolled);
      }
    }
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  onScroll();
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
