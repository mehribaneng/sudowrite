import { create, isAxiosError } from "axios";

import { getApiBaseUrl } from "@/constants/config";

type ApiErrorBody = {
  error?: {
    message?: string;
    statusCode?: number;
  };
};

type HealthResponse = {
  status: "ok";
};

type BootstrapResponse = {
  id: string;
  created: boolean;
};

type TranscriptionResponse = {
  text?: unknown;
};

type EditResponse = {
  edited?: unknown;
};

const backendClient = create({ timeout: 60_000 });

backendClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

export async function checkHealth() {
  const { data } = await backendClient.get<HealthResponse>("/health");
  if (data.status !== "ok") {
    throw new Error("The Scribe backend is unavailable.");
  }
}

export async function bootstrapDocument(documentId: string) {
  const { data } = await backendClient.put<BootstrapResponse>(
    `/documents/${encodeURIComponent(documentId)}`,
    {},
    { headers: { "Content-Type": "application/json" } },
  );

  return data;
}

function getAudioUpload(audioUri: string) {
  const extension = audioUri.split("?")[0].match(/\.([a-zA-Z0-9]+)$/)?.[1];
  const normalizedExtension = extension?.toLowerCase() ?? "m4a";
  const uploadTypes: Record<string, { extension: string; type: string }> = {
    // iOS may canonicalize audio/m4a to audio/x-m4a. M4A uses the MP4
    // container, so label it as audio/mp4 for the backend allowlist.
    m4a: { extension: "mp4", type: "audio/mp4" },
    mp4: { extension: "mp4", type: "audio/mp4" },
    mp3: { extension: "mp3", type: "audio/mpeg" },
    mpeg: { extension: "mpeg", type: "audio/mpeg" },
    wav: { extension: "wav", type: "audio/wav" },
    webm: { extension: "webm", type: "audio/webm" },
  };
  const upload = uploadTypes[normalizedExtension] ?? uploadTypes.m4a;

  return {
    uri: audioUri,
    name: `recording.${upload.extension}`,
    type: upload.type,
  };
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  const form = new FormData();
  form.append("audio", getAudioUpload(audioUri) as unknown as Blob);

  const { data } = await backendClient.post<TranscriptionResponse>(
    "/ai/transcribe",
    form,
  );

  if (typeof data.text !== "string" || !data.text.trim()) {
    throw new Error("The backend did not return a transcription.");
  }

  return data.text.trim();
}

export async function applyEditInstruction(
  documentId: string,
  content: string,
  instruction: string,
): Promise<string> {
  const { data } = await backendClient.post<EditResponse>(
    "/ai/edit",
    { documentId, content, instruction },
    { headers: { "Content-Type": "application/json" } },
  );

  if (typeof data.edited !== "string" || !data.edited.trim()) {
    throw new Error("The backend did not return an edited document.");
  }

  return data.edited;
}

export function getErrorMessage(error: unknown) {
  if (isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.error?.message;
    if (typeof message === "string") {
      return message;
    }

    if (error.code === "ECONNABORTED") {
      return "The backend took too long to respond. Please try again.";
    }

    return error.response
      ? `Backend request failed (${error.response.status}).`
      : "Could not reach the Scribe backend. Check its address and try again.";
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
