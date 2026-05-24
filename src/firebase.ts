import * as admin from "firebase-admin";
console.log(process.env.FIREBASE_PROJECT_ID);
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();

const dbRealTime = admin.database();

export { db, dbRealTime, admin };
