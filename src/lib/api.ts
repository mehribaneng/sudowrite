import { isAxiosError } from "axios";
import { File } from "expo-file-system";

import { openRouterClient } from "@/lib/openrouter";

const WHISPER_MODEL = "openai/whisper-large-v3";
const EDIT_MODEL = "anthropic/claude-sonnet-4.6";

const EDITOR_PROMPT = `You are a prose editor. The user will give you a document and an editing instruction.
Return ONLY the full edited document with the instruction applied. No commentary, no explanation, no markdown formatting. Just the edited text.`;

type TranscriptionResponse = {
  text?: unknown;
  error?: { message?: unknown };
};

type ChatResponse = {
  choices?: {
    message?: {
      content?: unknown;
    };
  }[];
  error?: { message?: unknown };
};

function getAudioFormat(uri: string) {
  const match = uri.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? "m4a";
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  const audio = new File(audioUri);
  const data = await audio.base64();
  const { data: result } = await openRouterClient.post<TranscriptionResponse>(
    "/audio/transcriptions",
    {
      model: WHISPER_MODEL,
      input_audio: {
        data,
        format: getAudioFormat(audioUri),
      },
    },
  );

  if (typeof result.text !== "string" || !result.text.trim()) {
    throw new Error("OpenRouter did not return a transcription.");
  }

  return result.text.trim();
}

export async function applyEditInstruction(
  content: string,
  instruction: string,
): Promise<string> {
  const { data: result } = await openRouterClient.post<ChatResponse>(
    "/chat/completions",
    {
      model: EDIT_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: EDITOR_PROMPT,
        },
        {
          role: "user",
          content: `Document:\n${content}\n\nInstruction: ${instruction}`,
        },
      ],
    },
  );
  const edited = result.choices?.[0]?.message?.content;

  if (typeof edited !== "string" || !edited.trim()) {
    throw new Error("OpenRouter did not return an edited document.");
  }

  return edited;
}

export function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.error?.message;
    if (typeof message === "string") {
      return message;
    }

    if (error.code === "ECONNABORTED") {
      return "OpenRouter took too long to respond. Please try again.";
    }

    return error.response
      ? `OpenRouter request failed (${error.response.status}).`
      : "Could not reach OpenRouter. Check your connection and try again.";
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
