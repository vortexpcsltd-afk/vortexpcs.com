import { logger } from "./logger";
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
} from "firebase/firestore";

export interface BannerInput {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "promo";
  color?: string;
  position: "top" | "bottom";
  link?: string;
  linkText?: string;
  startDate: Date;
  endDate?: Date;
  targeting: "all" | "new" | "returning" | "geographic";
  targetCountries?: string[];
  active: boolean;
}

export interface Banner extends BannerInput {
  id: string;
  views: number;
  clicks: number;
  createdAt: Date;
  updatedAt?: Date;
}

const BANNERS_COL = "admin_banners";

export function subscribeBanners(cb: (banners: Banner[]) => void) {
  const q = query(collection(db, BANNERS_COL), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const list: Banner[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          message: data.message,
          type: data.type,
          color: data.color,
          position: data.position,
          link: data.link,
          linkText: data.linkText,
          startDate:
            data.startDate instanceof Timestamp
              ? data.startDate.toDate()
              : new Date(data.startDate),
          endDate: data.endDate
            ? data.endDate instanceof Timestamp
              ? data.endDate.toDate()
              : new Date(data.endDate)
            : undefined,
          targeting: data.targeting,
          targetCountries: data.targetCountries || [],
          active: !!data.active,
          views: data.views || 0,
          clicks: data.clicks || 0,
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
    },
    (error) => {
      logger.error("Banner subscription error:", error);
      // Call callback with empty array on permission error
      // This prevents the app from breaking if user isn't admin
      cb([]);
    }
  );
}

export async function createBanner(input: BannerInput) {
  return addDoc(collection(db, BANNERS_COL), {
    ...input,
    views: 0,
    clicks: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    startDate: input.startDate,
    endDate: input.endDate || null,
  });
}

export async function updateBanner(
  id: string,
  patch: Partial<
    BannerInput & { views: number; clicks: number; active: boolean }
  >
) {
  const ref = doc(db, BANNERS_COL, id);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteBanner(id: string) {
  const ref = doc(db, BANNERS_COL, id);
  await deleteDoc(ref);
}

export async function incrementBannerMetric(
  id: string,
  field: "views" | "clicks"
) {
  // Naive increment using transaction-like read-modify-write; for high contention replace with a Cloud Function.
  const ref = doc(db, BANNERS_COL, id);
  // Fetch current value
  const { getDoc } = await import("firebase/firestore");
  const currentSnap = await getDoc(ref);
  const currentVal = (currentSnap.data()?.[field] as number | undefined) || 0;
  await updateDoc(ref, {
    [field]: currentVal + 1,
    updatedAt: serverTimestamp(),
  });
}
