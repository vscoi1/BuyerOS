import { z } from "zod";
import { documentSignedUrlInput, documentUploadInitiateInput } from "@/server/validators";

export function initiateDocumentUpload(input: z.infer<typeof documentUploadInitiateInput>) {
  const payload = documentUploadInitiateInput.parse(input);
  const storageKey = `documents/${crypto.randomUUID()}-${payload.fileName}`;

  return {
    storageKey,
    uploadUrl: `https://object-store.example.com/upload/${encodeURIComponent(storageKey)}`,
    expiresInSeconds: 900,
  };
}

export function getSignedReadUrl(input: z.infer<typeof documentSignedUrlInput>) {
  const payload = documentSignedUrlInput.parse(input);
  return {
    storageKey: payload.storageKey,
    signedUrl: `https://object-store.example.com/read/${encodeURIComponent(payload.storageKey)}?exp=900`,
    expiresInSeconds: 900,
  };
}
