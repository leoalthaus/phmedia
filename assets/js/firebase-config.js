/**
 * PH MEDIA - Firebase Firestore Configuration & Data Layer
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
let isFirebaseReady = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseReady = true;
    console.log("🔥 Firebase Firestore connected successfully!");
  } else {
    console.warn("⚠️ Firebase keys not configured yet. Operating in LocalStorage fallback mode.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
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

  if (isFirebaseReady && db) {
    try {
      const docRef = await addDoc(collection(db, "leads"), {
        ...payload,
        serverTime: serverTimestamp()
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
  if (isFirebaseReady && db) {
    try {
      const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
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
  if (isFirebaseReady && db && !id.startsWith("lead_")) {
    try {
      const leadRef = doc(db, "leads", id);
      await updateDoc(leadRef, { status: newStatus });
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
  if (isFirebaseReady && db && !id.startsWith("lead_")) {
    try {
      await deleteDoc(doc(db, "leads", id));
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
  if (isFirebaseReady && db) {
    try {
      const snap = await getDocs(collection(db, "services"));
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
  if (isFirebaseReady && db) {
    try {
      for (const s of servicesArray) {
        await setDoc(doc(db, "services", s.id), s);
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
  if (isFirebaseReady && db) {
    try {
      const snap = await getDocs(collection(db, "calc_options"));
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
  if (isFirebaseReady && db) {
    try {
      for (const o of optionsArray) {
        await setDoc(doc(db, "calc_options", o.id), o);
      }
    } catch (e) {
      console.warn("Firestore calc save error:", e);
    }
  }
  localStorage.setItem("phmedia_calc_options", JSON.stringify(optionsArray));
  return true;
}

// ==========================================
// 4. PASTAS & ITENS DE PORTFÓLIO
// ==========================================

export const DEFAULT_PORTFOLIO = [
  {
    id: "port_1",
    title: "Campanha Comercial & Fashion",
    category: "AUDIOVISUAL",
    desc: "Direção de cena, iluminação e captação multi-câmera",
    image: "assets/images/reel-1.jpg"
  },
  {
    id: "port_2",
    title: "Comercial de Luxo & Produto",
    category: "CINEMATIC",
    desc: "Estabilização gimbal Ronin e pós-produção avançada",
    image: "assets/images/reel-2.jpg"
  }
];

export async function getPortfolioItems() {
  if (isFirebaseReady && db) {
    try {
      const snap = await getDocs(collection(db, "portfolio"));
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      if (items.length > 0) return items;
    } catch (e) {
      console.warn("Firestore portfolio fetch error:", e);
    }
  }

  const local = localStorage.getItem("phmedia_portfolio");
  return local ? JSON.parse(local) : DEFAULT_PORTFOLIO;
}

export async function savePortfolioItems(portfolioArray) {
  if (isFirebaseReady && db) {
    try {
      for (const p of portfolioArray) {
        await setDoc(doc(db, "portfolio", p.id), p);
      }
    } catch (e) {
      console.warn("Firestore portfolio save error:", e);
    }
  }
  localStorage.setItem("phmedia_portfolio", JSON.stringify(portfolioArray));
  return true;
}
