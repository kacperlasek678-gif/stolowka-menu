import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import type {
  App,
} from "firebase-admin/app";

import {
  getFirestore,
} from "firebase-admin/firestore";
import type {
  Firestore,
} from "firebase-admin/firestore";

let firebaseAdminApp: App | undefined;

function normalizujKluczPrywatny(
  value: string | undefined
) {
  if (!value) {
    return undefined;
  }

  return value
    .trim()
    // In .env.local quotation marks are valid syntax. In Vercel they can
    // accidentally become part of the stored value.
    .replace(/^["']/, "")
    .replace(/["']$/, "")
    .replace(/\\n/g, "\n");
}

export function getFirebaseAdminApp(): App {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID;

  const clientEmail =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  const privateKey = normalizujKluczPrywatny(
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );

  if (
    !projectId ||
    !clientEmail ||
    !privateKey
  ) {
    throw new Error(
      "Brakuje zmiennych srodowiskowych Firebase Admin."
    );
  }

  firebaseAdminApp =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });

  return firebaseAdminApp;
}

function getAdminDb(): Firestore {
  return getFirestore(
    getFirebaseAdminApp()
  );
}

// Keep existing imports stable while deferring Firebase initialization until
// a route actually needs it. Invalid Vercel credentials no longer break build.
export const adminDb = new Proxy(
  {} as Firestore,
  {
    get(_target, property, receiver) {
      const database = getAdminDb();
      const value = Reflect.get(
        database,
        property,
        receiver
      );

      return typeof value === "function"
        ? value.bind(database)
        : value;
    },
  }
);
