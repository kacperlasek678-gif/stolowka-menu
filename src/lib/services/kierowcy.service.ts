import { adminDb } from "@/lib/firebase-admin";
import type { Kierowca } from "@/types/kierowca";

const collection = adminDb.collection("kierowcy");

/* =========================================================
   POBIERZ WSZYSTKICH KIEROWCÓW
========================================================= */
function mapDriver(
  doc: FirebaseFirestore.QueryDocumentSnapshot
): Kierowca {
  const data = doc.data();

  const {
    pin,
    pinHash,
    ...rest
  } = data;

  return {
    id: doc.id,
    ...rest,

    pinUstawiony: Boolean(
      data.pinUstawiony ||
      pinHash ||
      pin
    ),
  } as Kierowca;
}

export async function getAllDrivers(): Promise<Kierowca[]> {
  const snapshot = await collection.get();

 const kierowcy = snapshot.docs.map(mapDriver);

  kierowcy.sort((a, b) =>
    a.imie.localeCompare(
      b.imie,
      "pl"
    )
  );

  return kierowcy;
}

/* =========================================================
   POBIERZ JEDNEGO KIEROWCĘ
========================================================= */


/* =========================================================
   DODAJ KIEROWCĘ
========================================================= */

export async function createDriver(data: {
  imie: string;
  telefon?: string;
  aktywny: boolean;
}) {
  const ref =
    await collection.add({
      imie: data.imie,
      telefon: data.telefon ?? "",
      aktywny: data.aktywny,

      pinUstawiony: false,

      utworzono: new Date(),
    });

  return ref.id;
}

/* =========================================================
   EDYTUJ KIEROWCĘ
========================================================= */

export async function updateDriver(
  id: string,
  data: {
    imie: string;
    telefon?: string;
    aktywny: boolean;
  }
) {
  await collection.doc(id).update({
    imie: data.imie,
    telefon: data.telefon ?? "",
    aktywny: data.aktywny,
  });
}

/* =========================================================
   USUŃ KIEROWCĘ
========================================================= */

export async function deleteDriver(
  id: string
) {
  await collection.doc(id).delete();
}

/* =========================================================
   CZY ISTNIEJE
========================================================= */

export async function driverExists(
  id: string
) {
  const snapshot =
    await collection.doc(id).get();

  return snapshot.exists;
}

/* =========================================================
   AKTUALIZACJA STATUSU PIN
========================================================= */

export async function setDriverPinFlag(
  id: string,
  status: boolean
) {
  await collection.doc(id).update({
    pinUstawiony: status,
  });
}

export async function setDriverPinHash(
  id: string,
  pinHash: string
) {
  await collection.doc(id).update({
    pinHash,
    pinUstawiony: true,
    pinZmieniono: new Date(),
  });
}

export async function getDriverById(
  id: string
): Promise<Kierowca | null> {
  const doc = await collection.doc(id).get();

  if (!doc.exists) {
    return null;
  }

  return mapDriver(
    doc as FirebaseFirestore.QueryDocumentSnapshot
  );
}

export async function driverLoginExists(
  login: string,
  excludeId?: string
): Promise<boolean> {
  const snapshot = await collection
    .where("login", "==", login)
    .get();

  if (snapshot.empty) {
    return false;
  }

  if (!excludeId) {
    return true;
  }

  return snapshot.docs.some(
    (doc) => doc.id !== excludeId
  );
}
