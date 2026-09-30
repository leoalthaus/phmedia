/**
 * PH MEDIA - Firebase Firestore Configuration & Data Layer
 * 
 * Instructions:
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 2. Add a Web App and replace the firebaseConfig object below with your credentials.
 * 3. In Firebase Console, enable Cloud Firestore database (in test mode or production rules).
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your web app's Firebase configuration (Replace with your actual keys)
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
  // Only initialize if non-placeholder keys are present
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

/**
 * Save a new Lead / Quote request
 */
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

  // Fallback to LocalStorage
  const localLeads = JSON.parse(localStorage.getItem("phmedia_leads") || "[]");
  const localLead = { ...payload, id: "lead_" + Date.now() };
  localLeads.unshift(localLead);
  localStorage.setItem("phmedia_leads", JSON.stringify(localLeads));
  return { success: true, id: localLead.id, source: "local" };
}

/**
 * Retrieve all Leads
 */
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

/**
 * Update a Lead status
 */
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

/**
 * Delete a Lead
 */
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
