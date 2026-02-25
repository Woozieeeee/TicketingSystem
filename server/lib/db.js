const admin = require("firebase-admin");

let useFirestore = false;
let firestore = null;

function init() {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
      firestore = admin.firestore();
      useFirestore = true;
    } catch (e) {
      useFirestore = false;
    }
  }
}

init();

const memory = { tickets: [] };

async function createTicket(data) {
  if (useFirestore) {
    const now = new Date().toISOString();
    const docRef = await firestore.collection("tickets").add({
      title: data.title || "",
      description: data.description || "",
      status: data.status || "open",
      priority: data.priority || "normal",
      createdAt: now,
      updatedAt: now,
      requesterId: data.requesterId || null,
      assigneeId: data.assigneeId || null,
    });
    const doc = await docRef.get();
    return { id: docRef.id, ...doc.data() };
  } else {
    const id = String(memory.tickets.length + 1);
    const now = new Date().toISOString();
    const ticket = {
      id,
      title: data.title || "",
      description: data.description || "",
      status: data.status || "open",
      priority: data.priority || "normal",
      createdAt: now,
      updatedAt: now,
      requesterId: data.requesterId || null,
      assigneeId: data.assigneeId || null,
    };
    memory.tickets.push(ticket);
    return ticket;
  }
}

async function listTickets() {
  if (useFirestore) {
    const snap = await firestore
      .collection("tickets")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } else {
    return [...memory.tickets].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  }
}

module.exports = { createTicket, listTickets };
