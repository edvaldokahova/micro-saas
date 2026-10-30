// Envio pela página do pedido: o link (token) autoriza.
import { uploadFiles as send, type UploadIssue, type UploadResult } from "@/lib/upload-client";
import { finishUpload, startUpload } from "./actions";

export type { UploadIssue, UploadResult };

export function uploadFiles(token: string, list: File[], itemId: string | null, onProgress?: (done: number, total: number) => void) {
  return send(list, { start: (f) => startUpload(token, f, itemId), finish: (d) => finishUpload(token, d, itemId) }, onProgress);
}
