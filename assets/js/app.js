/**
 * PH MEDIA - Main Interactive Client Application
 */

import { saveLead } from "./firebase-config.js";

// Configurable Studio Phone & Data
const STUDIO_CONFIG = {
  whatsappNumber: "5542988640610", // Pedro Henrique - PH Media
  instagram: "https://www.instagram.com/phmedia.br?stkn=bnYxbzBpYTVlNGl6",
  location: "Ponta Grossa – PR"
};

// Services Data Catalog
const SERVICES_CATALOG = {
  "social-media": {
    id: "social-media",
    title: "SOCIAL MEDIA",
    icon: "fa-hashtag",
    description: "Criação e gestão de conteúdo para redes sociais, do planejamento à produção, unindo estratégia, audiovisual e criatividade para transformar ideias em conteúdo que comunica.",
    features: [
      "Planejamento estratégico & calendário mensal",
      "Roteirização e captação de reels dinâmicos",
      "Edição profissional com legendas e sound design",
      "Análise de métricas, alcance e engajamento"
    ],
    pricingType: "Investimento mensal",
    price: "400,00",
    subtext: "ou pacote trimestral com condições especiais",
    whatsappText: "Olá Pedro! Tenho interesse no serviço de *Social Media Mensal* (R$ 400,00) para minha marca. Como podemos iniciar?"
  },
  "videomaker": {
    id: "videomaker",
    title: "VIDEOMAKER",
    icon: "fa-video",
    description: "Captação, direção e edição de vídeos cinematográficos em alta definição (4K), comerciais para marcas, cobertura de lançamentos e reels com alta retenção.",
    features: [
      "Captação 4K com estabilização gimbal profissional",
      "Iluminação de estúdio e captação de áudio sem fio",
      "Color grading cinematográfico & efeitos visuais",
      "Formatos otimizados para Reels, TikTok e YouTube"
    ],
    pricingType: "Investimento por projeto",
    price: "650,00",
    subtext: "diária de gravação inclusa",
    whatsappText: "Olá Pedro! Gostaria de um orçamento para produção de vídeo *Videomaker Cinematográfico 4K*. Podemos conversar?"
  },
  "storymaker": {
    id: "storymaker",
    title: "STORYMAKER",
    icon: "fa-bolt",
    description: "Cobertura em tempo real para eventos, inaugurações, bastidores e lançamentos de produtos com fotos e vídeos verticais dinâmicos e entrega imediata.",
    features: [
      "Cobertura ao vivo direto nos stories da sua marca",
      "Edição ágil no local para postagens imediatas",
      "Captação de momentos espontâneos e depoimentos",
      "Entrega de todo o material bruto organizado"
    ],
    pricingType: "Investimento por evento",
    price: "350,00",
    subtext: "pacote base de até 4 horas de evento",
    whatsappText: "Olá Pedro! Gostaria de contratar a cobertura *Storymaker em Tempo Real* para o meu evento. Está com a agenda aberta?"
  },
  "fotografia": {
    id: "fotografia",
    title: "FOTOGRAFIA & ENSAIOS",
    icon: "fa-camera",
    description: "Ensaios fotográficos conceituais para profissionais, marcas, produtos e eventos. Direção de poses e pós-produção refinada com identidade visual marcante.",
    features: [
      "Direção de poses e enquadramentos modernos",
      "Até 25 fotos selecionadas com tratamento premium",
      "Ensaio em estúdio ou locação externa",
      "Galeria digital privada para download em alta resolução"
    ],
    pricingType: "Investimento a partir de",
    price: "300,00",
    subtext: "com pós-produção inclusa",
    whatsappText: "Olá Pedro! Tenho interesse em agendar um *Ensaio Fotográfico / Fotos de Marca*. Quais são as próximas datas?"
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initServicesShowcase();
  initCalculator();
  initLeadForm();
  initScrollAnimations();
  initDateYear();
});

/**
 * 1. Dynamic Services Showcase & Pill Navigation
 */
function initServicesShowcase() {
  const pills = document.querySelectorAll(".service-pill-btn");
  const card = document.getElementById("serviceCard");
  const titleEl = document.getElementById("serviceTitle");
  const descEl = document.getElementById("serviceDescription");
  const iconBadgeEl = document.getElementById("serviceIconBadge");
  const featuresEl = document.getElementById("serviceFeatures");
  const priceTypeEl = document.getElementById("pricingType");
  const priceEl = document.getElementById("servicePrice");
  const subtextEl = document.getElementById("pricingSubtext");
  const waBtn = document.getElementById("serviceWhatsappBtn");

  function renderService(serviceKey) {
    const data = SERVICES_CATALOG[serviceKey];
    if (!data) return;

    // Smooth card transition
    card.style.opacity = "0.4";
    card.style.transform = "translateY(8px)";

    setTimeout(() => {
      titleEl.textContent = data.title;
      descEl.textContent = data.description;
      iconBadgeEl.innerHTML = `<i class="fa-solid ${data.icon}"></i>`;
      priceTypeEl.textContent = data.pricingType;
      priceEl.textContent = data.price;
      subtextEl.textContent = data.subtext;

      featuresEl.innerHTML = data.features
        .map(feat => `<div class="feature-item"><i class="fa-solid fa-check"></i> ${feat}</div>`)
        .join("");

      const waUrl = `https://wa.me/${STUDIO_CONFIG.whatsappNumber}?text=${encodeURIComponent(data.whatsappText)}`;
      waBtn.href = waUrl;

      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 150);
  }

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

  // Initialize with first service
  renderService("social-media");
}

/**
 * 2. Interactive Budget Simulator
 */
function initCalculator() {
  const checkboxes = document.querySelectorAll('input[name="calc-addon"]');
  const totalValueEl = document.getElementById("calcTotalValue");
  const applyBtn = document.getElementById("btnApplyCombo");

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

  applyBtn.addEventListener("click", () => {
    const { total, selectedItems } = calculateTotal();
    const itemsList = selectedItems.length > 0 ? selectedItems.join(", ") : "Serviços sob consulta";
    const text = `Olá Pedro! Montei uma simulação no site da PH Media com os seguintes serviços:\n- *Itens:* ${itemsList}\n- *Valor estimado:* R$ ${total.toFixed(2)}\n\nGostaria de confirmar a disponibilidade e fechar a proposta!`;
    const waUrl = `https://wa.me/${STUDIO_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  });
}

/**
 * 3. Lead Capture Form with Firebase & Direct Toast Feedback
 */
function initLeadForm() {
  const form = document.getElementById("leadForm");
  const submitBtn = document.getElementById("submitLeadBtn");
  const feedbackEl = document.getElementById("formFeedback");

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
      const result = await saveLead(leadData);
      showToast("✨ Solicitação enviada com sucesso! Falaremos com você em breve.", "success");

      form.reset();
      feedbackEl.className = "form-feedback success";
      feedbackEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Proposta recebida! Você também pode nos chamar diretamente no WhatsApp para agilizar o atendimento.`;
      feedbackEl.classList.remove("hidden");

      // Auto-prompt WhatsApp fast-track
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
 * 4. Toast Notifications
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
 * 5. Dynamic High-Impact Scroll Physics Engine
 */
function initScrollAnimations() {
  const heroPortrait = document.getElementById("heroPortrait");
  const serviceCard = document.getElementById("serviceCard");
  const calcCard = document.getElementById("orcamento");
  const servicePrice = document.getElementById("servicePrice");
  const serviceBadge = document.getElementById("serviceIconBadge");
  const portfolioImgs = document.querySelectorAll(".portfolio-card img");
  const animatedElements = document.querySelectorAll(".hero-content, .portfolio-card, .contact-section, .faq-section");

  // Entrance reveal observer for other sections
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  animatedElements.forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(24px)";
    el.style.transition = "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
    observer.observe(el);
  });

  // Continuous High-Impact Scroll Physics with requestAnimationFrame
  let ticking = false;

  function onScrollPhysics() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;

    // 1. HERO PORTRAIT: Pronounced Dynamic Cinematic Zoom (from 1.0x up to 1.52x)
    if (heroPortrait) {
      const progress = Math.min(Math.max(scrollY / 420, 0), 1);
      const scale = 1 + Math.pow(progress, 0.8) * 0.52;
      const translateY = progress * 28;
      heroPortrait.style.transform = `scale(${scale.toFixed(4)}) translateY(${translateY.toFixed(1)}px)`;
    }

    // High-Impact 3D Card Physics Function
    function applyHighImpactPhysics(cardElement, isServiceShowcase = false) {
      if (!cardElement) return;
      const rect = cardElement.getBoundingClientRect();
      
      if (rect.bottom >= -80 && rect.top <= windowHeight + 80) {
        const cardCenter = rect.top + rect.height / 2;
        const screenCenter = windowHeight / 2;
        // Normalized offset from center: -1.0 (above center) to +1.0 (below center)
        const offset = (cardCenter - screenCenter) / (windowHeight / 2);
        const clampedOffset = Math.min(Math.max(offset, -1.2), 1.2);
        const absOffset = Math.abs(clampedOffset);

        // High-impact 3D tilt: up to 8.5 degrees
        const rotateX = clampedOffset * -8.5;
        // Dynamic scale: 1.065 at the center, 0.94 when entering/leaving
        const scale = 1.065 - absOffset * 0.085;
        // Depth translation
        const translateZ = (1 - absOffset) * 20;

        // Dynamic shadow elevation
        const shadowBlur = Math.max(50 - absOffset * 30, 10);
        const shadowY = Math.max(25 - absOffset * 15, 6);
        const shadowOpacity = Math.max(0.18 - absOffset * 0.12, 0.03);
        const borderColor = `rgba(0, 0, 0, ${Math.max(0.35 - absOffset * 0.25, 0.08).toFixed(2)})`;

        // Specular light sweep position (moves dynamically across the surface)
        const sheenX = ((1 - clampedOffset) * 50 + 25).toFixed(1) + "%";
        const sheenY = ((clampedOffset + 1) * 40 + 10).toFixed(1) + "%";
        const sheenOpacity = Math.max(0.65 - absOffset * 0.45, 0.1).toFixed(2);

        cardElement.style.setProperty("--mouse-x", sheenX);
        cardElement.style.setProperty("--mouse-y", sheenY);
        cardElement.style.setProperty("--sheen-opacity", sheenOpacity);

        cardElement.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) translateZ(${translateZ.toFixed(1)}px) scale(${scale.toFixed(4)})`;
        cardElement.style.boxShadow = `0 ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity.toFixed(3)})`;
        cardElement.style.borderColor = borderColor;

        // Internal Element Parallax Pop for Service Showcase
        if (isServiceShowcase) {
          if (servicePrice) {
            const pricePop = 1 + (1 - absOffset) * 0.08;
            servicePrice.style.transform = `scale(${Math.max(pricePop, 1).toFixed(3)})`;
          }
          if (serviceBadge) {
            const badgeRotate = clampedOffset * -15;
            const badgePop = 35 + (1 - absOffset) * 15;
            serviceBadge.style.transform = `translateZ(${badgePop}px) rotate(${badgeRotate.toFixed(1)}deg)`;
          }
        }
      }
    }

    // Apply High-Impact physics to Card 1 and Card 2
    applyHighImpactPhysics(serviceCard, true);
    applyHighImpactPhysics(calcCard, false);

    // 4. PORTFOLIO CARDS: Continuous Zoom as you scroll
    portfolioImgs.forEach((img) => {
      const rect = img.getBoundingClientRect();
      if (rect.bottom >= 0 && rect.top <= windowHeight) {
        const centerOffset = (rect.top + rect.height / 2) - (windowHeight / 2);
        const normDistance = Math.abs(centerOffset) / (windowHeight / 2);
        const clampedDist = Math.min(Math.max(normDistance, 0), 1);
        const cardZoom = 1.18 - clampedDist * 0.14;
        img.style.transform = `scale(${cardZoom.toFixed(4)})`;
      }
    });

    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(onScrollPhysics);
      ticking = true;
    }
  }, { passive: true });

  // Initial trigger
  onScrollPhysics();
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
