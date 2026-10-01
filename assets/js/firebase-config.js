/**
 * PH MEDIA - Firebase Firestore Configuration & High-Speed Data Layer
 * Uses zero-blocking lazy loading for instant mobile performance
 */

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "phmedia-studio.firebaseapp.com",
  projectId: "phmedia-studio",
  storageBucket: "phmedia-studio.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

let db = null;
let fbModule = null;
let isFirebaseReady = false;

// Dynamic on-demand Firebase loader (Zero initial blocking payload on mobile)
async function getFirestoreDB() {
  if (isFirebaseReady && db) return { db, fb: fbModule };
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
    return null;
  }
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const fb = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const app = initializeApp(firebaseConfig);
    db = fb.getFirestore(app);
    fbModule = fb;
    isFirebaseReady = true;
    console.log("🔥 Firebase Firestore connected successfully!");
    return { db, fb: fbModule };
  } catch (err) {
    console.warn("Firebase lazy load error:", err);
    return null;
  }
}

// ==========================================
// 1. LEADS / ORÇAMENTOS
// ==========================================

export async function saveLead(leadData) {
  const payload = {
    ...leadData,
    status: "Novo",
    createdAt: new Date().toISOString()
  };

  const fbConn = await getFirestoreDB();
  if (fbConn) {
    try {
      const { db, fb } = fbConn;
      const docRef = await fb.addDoc(fb.collection(db, "leads"), {
        ...payload,
        serverTime: fb.serverTimestamp()
      });
      return { success: true, id: docRef.id, source: "firestore" };
    } catch (e) {
      console.warn("Firestore write error, saving locally:", e);
    }
  }

  const localLeads = JSON.parse(localStorage.getItem("phmedia_leads") || "[]");
  const localLead = { ...payload, id: "lead_" + Date.now() };
  localLeads.unshift(localLead);
  localStorage.setItem("phmedia_leads", JSON.stringify(localLeads));
  return { success: true, id: localLead.id, source: "local" };
}

export async function getLeads() {
  const fbConn = await getFirestoreDB();
  if (fbConn) {
    try {
      const { db, fb } = fbConn;
      const q = fb.query(fb.collection(db, "leads"), fb.orderBy("createdAt", "desc"));
      const snapshot = await fb.getDocs(q);
      const leads = [];
      snapshot.forEach(docSnap => {
        leads.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (leads.length > 0) return leads;
    } catch (e) {
      console.warn("Could not fetch from Firestore, checking local storage:", e);
    }
  }

  return JSON.parse(localStorage.getItem("phmedia_leads") || "[]");
}

export async function updateLeadStatus(id, newStatus) {
  const fbConn = await getFirestoreDB();
  if (fbConn && !id.startsWith("lead_")) {
    try {
      const { db, fb } = fbConn;
      const leadRef = fb.doc(db, "leads", id);
      await fb.updateDoc(leadRef, { status: newStatus });
      return true;
    } catch (e) {
      console.error("Error updating lead in Firestore:", e);
    }
  }

  const localLeads = JSON.parse(localStorage.getItem("phmedia_leads") || "[]");
  const index = localLeads.findIndex(l => l.id === id);
  if (index !== -1) {
    localLeads[index].status = newStatus;
    localStorage.setItem("phmedia_leads", JSON.stringify(localLeads));
    return true;
  }
  return false;
}

export async function deleteLead(id) {
  const fbConn = await getFirestoreDB();
  if (fbConn && !id.startsWith("lead_")) {
    try {
      const { db, fb } = fbConn;
      await fb.deleteDoc(fb.doc(db, "leads", id));
      return true;
    } catch (e) {
      console.error("Error deleting from Firestore:", e);
    }
  }

  const localLeads = JSON.parse(localStorage.getItem("phmedia_leads") || "[]");
  const filtered = localLeads.filter(l => l.id !== id);
  localStorage.setItem("phmedia_leads", JSON.stringify(filtered));
  return true;
}

// ==========================================
// 2. SERVIÇOS & PACOTES (QUADRO 1)
// ==========================================

export const DEFAULT_SERVICES = [
  {
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
  {
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
  {
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
  {
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
];

export async function getServicesConfig() {
  const fbConn = await getFirestoreDB();
  if (fbConn) {
    try {
      const { db, fb } = fbConn;
      const snap = await fb.getDocs(fb.collection(db, "services"));
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      if (items.length > 0) return items;
    } catch (e) {
      console.warn("Firestore services fetch error:", e);
    }
  }

  const local = localStorage.getItem("phmedia_services");
  return local ? JSON.parse(local) : DEFAULT_SERVICES;
}

export async function saveServicesConfig(servicesArray) {
  const fbConn = await getFirestoreDB();
  if (fbConn) {
    try {
      const { db, fb } = fbConn;
      for (const s of servicesArray) {
        await fb.setDoc(fb.doc(db, "services", s.id), s);
      }
    } catch (e) {
      console.warn("Firestore services save error:", e);
    }
  }
  localStorage.setItem("phmedia_services", JSON.stringify(servicesArray));
  return true;
}

// ==========================================
// 3. CALCULADORA DE ORÇAMENTO (QUADRO 2)
// ==========================================

export const DEFAULT_CALC_OPTIONS = [
  { id: "calc_1", name: "Social Media Mensal", desc: "Gestão, roteiro, postagens & reels semanais", price: 400, checked: true },
  { id: "calc_2", name: "Cobertura Storymaker (Evento)", desc: "Cobertura em tempo real com entrega imediata", price: 350, checked: false },
  { id: "calc_3", name: "Reel / Comercial Cinematográfico 4K", desc: "Captação com gimbal, iluminação de estúdio & drone", price: 300, checked: false },
  { id: "calc_4", name: "Ensaio Fotográfico de Marca/Perfil", desc: "20 fotos tratadas em alta resolução", price: 250, checked: false }
];

export async function getCalcOptions() {
  const fbConn = await getFirestoreDB();
  if (fbConn) {
    try {
      const { db, fb } = fbConn;
      const snap = await fb.getDocs(fb.collection(db, "calc_options"));
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      if (items.length > 0) return items;
    } catch (e) {
      console.warn("Firestore calc options error:", e);
    }
  }

  const local = localStorage.getItem("phmedia_calc_options");
  return local ? JSON.parse(local) : DEFAULT_CALC_OPTIONS;
}

export async function saveCalcOptions(optionsArray) {
  const fbConn = await getFirestoreDB();
  if (fbConn) {
    try {
      const { db, fb } = fbConn;
      for (const o of optionsArray) {
        await fb.setDoc(fb.doc(db, "calc_options", o.id), o);
      }
    } catch (e) {
      console.warn("Firestore calc save error:", e);
    }
  }
  localStorage.setItem("phmedia_calc_options", JSON.stringify(optionsArray));
  return true;
}

// ==========================================
// 4. PASTAS & ITENS DE PORTFÓLIO (IndexedDB + LocalStorage + Firestore Sync)
// ==========================================

const IDB_NAME = "phmedia_db";
const IDB_VERSION = 1;
const IDB_STORE = "portfolio_store";

function openIDB() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) return resolve(null);
    try {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (err) {
      resolve(null);
    }
  });
}

async function idbGet(key) {
  try {
    const db = await openIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.val : null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function idbSet(key, val) {
  try {
    const db = await openIDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.put({ key, val });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

export const DEFAULT_PORTFOLIO = [
  {
    id: "port_1",
    title: "Campanha Comercial & Fashion",
    category: "AUDIOVISUAL",
    desc: "Direção de cena, iluminação e captação multi-câmera para marcas de destaque.",
    image: "assets/images/reel-1.jpg",
    photos: [
      "assets/images/reel-1.jpg",
      "assets/images/reel-2.jpg",
      "assets/images/pedro.jpg"
    ]
  },
  {
    id: "port_2",
    title: "Comercial de Luxo & Produto",
    category: "CINEMATIC",
    desc: "Estabilização gimbal Ronin, captação 4K em 60fps e pós-produção avançada.",
    image: "assets/images/reel-2.jpg",
    photos: [
      "assets/images/reel-2.jpg",
      "assets/images/reel-1.jpg",
      "assets/images/pedro.jpg"
    ]
  },
  {
    id: "port_3",
    title: "Cobertura de Eventos & Storymaker",
    category: "REELS & SOCIAL",
    desc: "Captação dinâmica em tempo real para eventos corporativos, lançamentos e marcas.",
    image: "assets/images/pedro.jpg",
    photos: [
      "assets/images/pedro.jpg",
      "assets/images/reel-1.jpg",
      "assets/images/reel-2.jpg"
    ]
  }
];

export async function getPortfolioItems() {
  let items = null;

  // 1. Try IndexedDB first (holds full-resolution images without size limits)
  try {
    const idbData = await idbGet("portfolio");
    if (Array.isArray(idbData) && idbData.length > 0) {
      items = idbData;
    }
  } catch (e) {
    console.warn("IndexedDB read error:", e);
  }

  // 2. Try Firestore if configured
  if (!items || items.length === 0) {
    const fbConn = await getFirestoreDB();
    if (fbConn) {
      try {
        const { db, fb } = fbConn;
        const snap = await fb.getDocs(fb.collection(db, "portfolio"));
        const firestoreItems = [];
        snap.forEach(d => firestoreItems.push({ id: d.id, ...d.data() }));
        if (firestoreItems.length > 0) items = firestoreItems;
      } catch (e) {
        console.warn("Firestore portfolio fetch error:", e);
      }
    }
  }

  // 3. Try LocalStorage fallback
  if (!items || items.length === 0) {
    try {
      const local = localStorage.getItem("phmedia_portfolio");
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          items = parsed;
        }
      }
    } catch (e) {
      console.warn("LocalStorage read error:", e);
    }
  }

  // 4. Default 3 items fallback
  if (!items || items.length === 0) {
    items = DEFAULT_PORTFOLIO;
  }

  // Ensure every item has a valid photos array
  return items.map(p => {
    let photos = p.photos;
    if (!Array.isArray(photos) || photos.length === 0) {
      photos = p.image ? [p.image] : ["assets/images/reel-1.jpg"];
    }
    return { ...p, photos };
  });
}

export async function savePortfolioItems(portfolioArray) {
  // 1. Save to high-capacity IndexedDB
  try {
    await idbSet("portfolio", portfolioArray);
  } catch (e) {
    console.warn("IndexedDB save error:", e);
  }

  // 2. Save to Firestore if connected
  const fbConn = await getFirestoreDB();
  if (fbConn) {
    try {
      const { db, fb } = fbConn;
      for (const p of portfolioArray) {
        await fb.setDoc(fb.doc(db, "portfolio", p.id), p);
      }
    } catch (e) {
      console.warn("Firestore portfolio save error:", e);
    }
  }

  // 3. Save to LocalStorage (with quota safety)
  try {
    localStorage.setItem("phmedia_portfolio", JSON.stringify(portfolioArray));
  } catch (err) {
    console.warn("LocalStorage quota reached, saved to IndexedDB successfully.");
  }

  // 4. Notify open tabs / main page
  try {
    localStorage.setItem("phmedia_portfolio_sync_time", Date.now().toString());
    window.dispatchEvent(new CustomEvent("phmedia_portfolio_updated", { detail: portfolioArray }));
  } catch (e) {}

  return true;
}

// ==========================================
// 5. DÚVIDAS FREQUENTES (FAQ)
// ==========================================

export const DEFAULT_FAQS = [
  {
    id: "faq_1",
    question: "Como é feito o planejamento de conteúdo?",
    answer: "Realizamos um briefing completo para entender seu público e objetivos. Em seguida, definimos o calendário editorial, datas de gravação e alinhamos as referências visuais antes de produzir."
  },
  {
    id: "faq_2",
    question: "Qual é o prazo de entrega dos vídeos e fotos?",
    answer: "Para coberturas Storymaker em eventos, o envio ocorre em tempo real ou em até 24h. Para vídeos comerciais e ensaios fotográficos com pós-produção detalhada, o prazo médio é de 3 a 5 dias úteis."
  },
  {
    id: "faq_3",
    question: "Atende fora de Ponta Grossa?",
    answer: "Sim! Atendemos em toda a região dos Campos Gerais e Paraná mediante cálculo prévio de deslocamento e diária técnica."
  }
];

export async function getFaqs() {
  const fbConn = await getFirestoreDB();
  if (fbConn) {
    try {
      const { db, fb } = fbConn;
      const snap = await fb.getDocs(fb.collection(db, "faqs"));
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      if (items.length > 0) return items;
    } catch (e) {
      console.warn("Firestore FAQ fetch error:", e);
    }
  }

  const local = localStorage.getItem("phmedia_faqs");
  return local ? JSON.parse(local) : DEFAULT_FAQS;
}

export async function saveFaqs(faqsArray) {
  const fbConn = await getFirestoreDB();
  if (fbConn) {
    try {
      const { db, fb } = fbConn;
      for (const f of faqsArray) {
        await fb.setDoc(fb.doc(db, "faqs", f.id), f);
      }
    } catch (e) {
      console.warn("Firestore faqs save error:", e);
    }
  }
  localStorage.setItem("phmedia_faqs", JSON.stringify(faqsArray));
  return true;
}
