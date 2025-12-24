import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  getDoc,
  getDocs,
  where,
} from "firebase/firestore";

export interface CompetitorInput {
  name: string;
  website: string;
  status: "active" | "inactive";
}

export interface Competitor extends CompetitorInput {
  id: string;
  addedDate: Date;
  lastChecked?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CompetitorProductInput {
  competitorId: string;
  productName: string;
  category: string;
  currentPrice: number;
  url: string;
}

export interface CompetitorProduct extends CompetitorProductInput {
  id: string;
  previousPrice?: number;
  lastUpdated: Date;
  priceHistory: Array<{ date: Date; price: number }>;
}

const COMPETITORS_COL = "admin_competitors";
const PRICES_COL = "admin_competitor_prices";

export function subscribeCompetitors(cb: (competitors: Competitor[]) => void) {
  const q = query(
    collection(db, COMPETITORS_COL),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const list: Competitor[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name,
        website: data.website,
        status: data.status,
        addedDate:
          data.addedDate instanceof Timestamp
            ? data.addedDate.toDate()
            : new Date(data.addedDate),
        lastChecked: data.lastChecked
          ? data.lastChecked instanceof Timestamp
            ? data.lastChecked.toDate()
            : new Date(data.lastChecked)
          : undefined,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(data.createdAt),
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate()
            : data.updatedAt
            ? new Date(data.updatedAt)
            : undefined,
      };
    });
    cb(list);
  });
}

export function subscribeCompetitorProducts(
  competitorId: string,
  cb: (products: CompetitorProduct[]) => void
) {
  const q = query(
    collection(db, PRICES_COL),
    where("competitorId", "==", competitorId),
    orderBy("lastUpdated", "desc")
  );
  return onSnapshot(q, (snap) => {
    const list: CompetitorProduct[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        competitorId: data.competitorId,
        productName: data.productName,
        category: data.category,
        currentPrice: data.currentPrice,
        previousPrice: data.previousPrice,
        url: data.url,
        lastUpdated:
          data.lastUpdated instanceof Timestamp
            ? data.lastUpdated.toDate()
            : new Date(data.lastUpdated),
        priceHistory: (data.priceHistory || []).map(
          (p: { date: Timestamp | Date | string; price: number }) => ({
            date:
              p.date instanceof Timestamp
                ? p.date.toDate()
                : p.date instanceof Date
                ? p.date
                : new Date(p.date),
            price: p.price,
          })
        ),
      };
    });
    cb(list);
  });
}

export async function createCompetitor(input: CompetitorInput) {
  return addDoc(collection(db, COMPETITORS_COL), {
    ...input,
    addedDate: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCompetitor(
  id: string,
  patch: Partial<CompetitorInput & { lastChecked: Date }>
) {
  const ref = doc(db, COMPETITORS_COL, id);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteCompetitor(id: string) {
  const ref = doc(db, COMPETITORS_COL, id);
  await deleteDoc(ref);
  // Optionally cascade delete prices (manual cleanup)
  const priceSnap = await getDocs(
    query(collection(db, PRICES_COL), where("competitorId", "==", id))
  );
  await Promise.all(priceSnap.docs.map((d) => deleteDoc(d.ref)));
}

export async function addCompetitorProduct(input: CompetitorProductInput) {
  return addDoc(collection(db, PRICES_COL), {
    ...input,
    lastUpdated: serverTimestamp(),
    priceHistory: [{ date: serverTimestamp(), price: input.currentPrice }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCompetitorProduct(
  id: string,
  patch: Partial<CompetitorProductInput & { currentPrice: number }>
) {
  const ref = doc(db, PRICES_COL, id);
  const snap = await getDoc(ref);
  const data = snap.data();
  const prevPrice = data?.currentPrice;
  const history = (data?.priceHistory || []).slice();
  if (patch.currentPrice && patch.currentPrice !== prevPrice) {
    history.push({ date: new Date(), price: patch.currentPrice });
  }
  await updateDoc(ref, {
    ...patch,
    previousPrice: prevPrice,
    priceHistory: history.map((p: { date: Date; price: number }) => ({
      date: p.date,
      price: p.price,
    })),
    lastUpdated: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCompetitorProduct(id: string) {
  const ref = doc(db, PRICES_COL, id);
  await deleteDoc(ref);
}
