import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTask,
} from "firebase/storage";
import { storage, app } from "../config/firebase";
import { logger } from "./logger";

export interface TicketAttachmentMeta {
  name: string;
  url: string;
  size?: number;
  type?: string;
  path: string;
  scanStatus?: "pending" | "clean" | "infected" | "error";
}

export interface EmailAssetMeta {
  name: string;
  url: string;
  size?: number;
  type?: string;
  path: string;
}

/**
 * Upload a file to Firebase Storage under support_tickets/{ticketId}/
 * Returns basic attachment metadata for saving on the message.
 */
export const uploadTicketAttachment = async (
  ticketId: string,
  file: File,
  onProgress?: (progress: number, task: UploadTask) => void
): Promise<TicketAttachmentMeta> => {
  if (
    !storage ||
    !(app as unknown as { options?: { storageBucket?: string } }).options
      ?.storageBucket
  ) {
    throw new Error(
      "File storage is not configured (missing storage bucket). Set VITE_FIREBASE_STORAGE_BUCKET to enable uploads."
    );
  }

  const safeName = file.name.replace(/[^\w.-]+/g, "-");
  const path = `support_tickets/${ticketId}/${Date.now()}-${safeName}`;
  const fileRef = ref(storage, path);

  try {
    const task = uploadBytesResumable(fileRef, file, {
      contentType: file.type || "application/octet-stream",
    });
    await new Promise<void>((resolve, reject) => {
      task.on(
        "state_changed",
        (snap) => {
          if (onProgress) {
            const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
            onProgress(pct, task);
          }
        },
        (err) => reject(err),
        () => resolve()
      );
    });
    const url = await getDownloadURL(task.snapshot.ref);
    return {
      name: file.name,
      url,
      size: file.size,
      type: file.type,
      path,
      scanStatus: "pending",
    };
  } catch (err) {
    logger.error("Attachment upload failed", err);
    throw new Error(
      err instanceof Error ? err.message : "Failed to upload attachment"
    );
  }
};

/**
 * Upload a file for use in bulk/admin emails. Stored under email_assets/.
 * Returns public metadata suitable for embedding via <img src="..." /> in emails.
 */
export const uploadEmailAsset = async (
  file: File,
  onProgress?: (progress: number, task: UploadTask) => void
): Promise<EmailAssetMeta> => {
  if (
    !storage ||
    !(app as unknown as { options?: { storageBucket?: string } }).options
      ?.storageBucket
  ) {
    throw new Error(
      "File storage is not configured (missing storage bucket). Set VITE_FIREBASE_STORAGE_BUCKET to enable uploads."
    );
  }
  const safeName = file.name.replace(/[^\w.-]+/g, "-");
  const path = `email_assets/${Date.now()}-${safeName}`;
  const fileRef = ref(storage, path);
  try {
    const task = uploadBytesResumable(fileRef, file, {
      contentType: file.type || "application/octet-stream",
    });
    await new Promise<void>((resolve, reject) => {
      task.on(
        "state_changed",
        (snap) => {
          if (onProgress) {
            const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
            onProgress(pct, task);
          }
        },
        (err) => reject(err),
        () => resolve()
      );
    });
    const url = await getDownloadURL(task.snapshot.ref);
    return {
      name: file.name,
      url,
      size: file.size,
      type: file.type,
      path,
    };
  } catch (err) {
    logger.error("Email asset upload failed", err);
    throw new Error(
      err instanceof Error ? err.message : "Failed to upload email asset"
    );
  }
};
