import { adminDb } from "@/lib/firebase-admin";

const collection = adminDb.collection("menu");

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
};

export type MenuItemInput = Omit<MenuItem, "id">;

function mapMenuItem(
  doc: FirebaseFirestore.QueryDocumentSnapshot
): MenuItem {
  const data = doc.data();

  return {
    id: doc.id,
    name: typeof data.name === "string" ? data.name : "",
    price: typeof data.price === "number" ? data.price : 0,
    category: typeof data.category === "string" ? data.category : "",
    available: data.available !== false,
  };
}

export async function getAllMenuItems(): Promise<MenuItem[]> {
  const snapshot = await collection.get();

  return snapshot.docs
    .map(mapMenuItem)
    .sort((a, b) => a.category.localeCompare(b.category, "pl") || a.name.localeCompare(b.name, "pl"));
}

export async function createMenuItem(input: MenuItemInput) {
  const doc = await collection.add(input);
  return { id: doc.id, ...input };
}

export async function updateMenuItem(id: string, input: MenuItemInput) {
  await collection.doc(id).update(input);
  return { id, ...input };
}

export async function deleteMenuItem(id: string) {
  await collection.doc(id).delete();
}

export async function menuItemExists(id: string) {
  return (await collection.doc(id).get()).exists;
}
