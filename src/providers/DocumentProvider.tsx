import { HocuspocusProvider } from "@hocuspocus/provider";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as Y from "yjs";

import { getCollaborationUrl, getDocumentId } from "@/constants/config";
import { bootstrapDocument, checkHealth, getErrorMessage } from "@/lib/api";
import { applyApprovedEdit, applyLocalTextChange } from "@/lib/yjs-text";
import { useStore } from "@/store/useStore";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

type DocumentContextValue = {
  content: string;
  connectionStatus: ConnectionStatus;
  isReady: boolean;
  documentId: string | null;
  updateText: (nextText: string) => void;
  getCurrentText: () => string;
  applyEditIfCurrent: (original: string, edited: string) => boolean;
};

const DocumentContext = createContext<DocumentContextValue | null>(null);

export function DocumentProvider({ children }: PropsWithChildren) {
  const [content, setContent] = useState("");
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [isReady, setIsReady] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const setError = useStore((state) => state.setError);

  useEffect(() => {
    let cancelled = false;
    let ydoc: Y.Doc | null = null;
    let ytext: Y.Text | null = null;
    let provider: HocuspocusProvider | null = null;
    let observer: (() => void) | null = null;
    let hasSynced = false;

    const connect = async () => {
      try {
        const nextDocumentId = getDocumentId();
        const collaborationUrl = getCollaborationUrl();

        await checkHealth();
        await bootstrapDocument(nextDocumentId);
        if (cancelled) {
          return;
        }

        ydoc = new Y.Doc();
        ytext = ydoc.getText("content");
        ydocRef.current = ydoc;
        ytextRef.current = ytext;
        setDocumentId(nextDocumentId);

        observer = () => setContent(ytext?.toString() ?? "");
        ytext.observe(observer);

        provider = new HocuspocusProvider({
          url: collaborationUrl,
          name: nextDocumentId,
          document: ydoc,
          onStatus: ({ status }) => {
            if (!cancelled) {
              setConnectionStatus(status);
            }
          },
          onSynced: ({ state }) => {
            if (!cancelled && state) {
              hasSynced = true;
              setContent(ytext?.toString() ?? "");
              setIsReady(true);
            }
          },
          onClose: () => {
            if (!cancelled && !hasSynced) {
              setConnectionStatus("disconnected");
              setError(
                `Could not sync with ${collaborationUrl}. Check the WebSocket listener and device address.`,
              );
            }
          },
          onAuthenticationFailed: ({ reason }) => {
            if (!cancelled) {
              setError(reason || "Could not connect to the document.");
            }
          },
        });
      } catch (error) {
        if (!cancelled) {
          setConnectionStatus("disconnected");
          setError(getErrorMessage(error));
        }
      }
    };

    void connect();

    return () => {
      cancelled = true;
      if (ytext && observer) {
        ytext.unobserve(observer);
      }
      provider?.destroy();
      ydoc?.destroy();
      ydocRef.current = null;
      ytextRef.current = null;
    };
  }, [setError]);

  const updateText = useCallback((nextText: string) => {
    const ydoc = ydocRef.current;
    const ytext = ytextRef.current;
    if (ydoc && ytext) {
      applyLocalTextChange(ydoc, ytext, nextText);
    }
  }, []);

  const getCurrentText = useCallback(() => {
    return ytextRef.current?.toString() ?? "";
  }, []);

  const applyEditIfCurrent = useCallback(
    (original: string, edited: string) => {
      const ydoc = ydocRef.current;
      const ytext = ytextRef.current;
      return ydoc && ytext
        ? applyApprovedEdit(ydoc, ytext, original, edited)
        : false;
    },
    [],
  );

  const value = useMemo(
    () => ({
      content,
      connectionStatus,
      isReady,
      documentId,
      updateText,
      getCurrentText,
      applyEditIfCurrent,
    }),
    [
      applyEditIfCurrent,
      connectionStatus,
      content,
      documentId,
      getCurrentText,
      isReady,
      updateText,
    ],
  );

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocument must be used within DocumentProvider.");
  }

  return context;
}
