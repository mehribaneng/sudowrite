import { create } from "zustand";

import { SAMPLE_TEXT } from "@/constants/editor";

export type WorkflowState = "idle" | "recording" | "processing";

export type DiffChunk = {
  type: "equal" | "insert" | "delete";
  value: string;
};

type PendingEdit = {
  edited: string;
  diff: DiffChunk[];
};

type EditorStore = {
  content: string;
  workflow: WorkflowState;
  transcribedCommand: string;
  pendingEdit: PendingEdit | null;
  error: string | null;
  setContent: (content: string) => void;
  setWorkflow: (workflow: WorkflowState) => void;
  setTranscribedCommand: (command: string) => void;
  setPendingEdit: (pendingEdit: PendingEdit | null) => void;
  setError: (error: string | null) => void;
  applyPendingEdit: () => void;
  rejectPendingEdit: () => void;
};

export const useStore = create<EditorStore>((set) => ({
  content: SAMPLE_TEXT,
  workflow: "idle",
  transcribedCommand: "",
  pendingEdit: null,
  error: null,
  setContent: (content) => set({ content }),
  setWorkflow: (workflow) => set({ workflow }),
  setTranscribedCommand: (transcribedCommand) => set({ transcribedCommand }),
  setPendingEdit: (pendingEdit) => set({ pendingEdit }),
  setError: (error) => set({ error }),
  applyPendingEdit: () =>
    set((state) => ({
      content: state.pendingEdit?.edited ?? state.content,
      pendingEdit: null,
      transcribedCommand: "",
      error: null,
    })),
  rejectPendingEdit: () =>
    set({
      pendingEdit: null,
      transcribedCommand: "",
      error: null,
    }),
}));
