import { create } from "zustand";

export type WorkflowState = "idle" | "recording" | "processing";

export type DiffChunk = {
  type: "equal" | "insert" | "delete";
  value: string;
};

type PendingEdit = {
  original: string;
  edited: string;
  diff: DiffChunk[];
};

type EditorStore = {
  workflow: WorkflowState;
  transcribedCommand: string;
  pendingEdit: PendingEdit | null;
  error: string | null;
  setWorkflow: (workflow: WorkflowState) => void;
  setTranscribedCommand: (command: string) => void;
  setPendingEdit: (pendingEdit: PendingEdit | null) => void;
  setError: (error: string | null) => void;
  clearPendingEdit: () => void;
};

export const useStore = create<EditorStore>((set) => ({
  workflow: "idle",
  transcribedCommand: "",
  pendingEdit: null,
  error: null,
  setWorkflow: (workflow) => set({ workflow }),
  setTranscribedCommand: (transcribedCommand) => set({ transcribedCommand }),
  setPendingEdit: (pendingEdit) => set({ pendingEdit }),
  setError: (error) => set({ error }),
  clearPendingEdit: () =>
    set({
      pendingEdit: null,
      transcribedCommand: "",
    }),
}));
