import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { api } from "../../convex/_generated/api";
import { BlockNoteEditor } from "@blocknote/core";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

interface CollaborativeEditorProps {
  documentId: string;
  placeholder?: string;
  editable?: boolean;
}

export function CollaborativeEditor({
  documentId,
  placeholder = "Start typing...",
  editable = true,
}: CollaborativeEditorProps) {
  const sync = useBlockNoteSync<BlockNoteEditor>(api.prosemirror, documentId, {
    editorOptions: {
      _tiptapOptions: {
        editable,
      },
    },
  });

  if (sync.isLoading) {
    return (
      <div className="p-8 space-y-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!sync.editor) {
    return (
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          No Content Yet
        </h3>
        <p className="text-slate-600 mb-4">
          Create the initial document to start collaborating
        </p>
        <Button onClick={() => sync.create({ type: "doc", content: [] })}>
          Create Document
        </Button>
      </div>
    );
  }

  return (
    <div className="collaborative-editor">
      <BlockNoteView editor={sync.editor} theme="light" />
    </div>
  );
}

export function CollaborativeEditorWrapper({
  documentId,
  ...props
}: CollaborativeEditorProps) {
  // Wrapper ensures editor re-renders when documentId changes
  return (
    <CollaborativeEditor key={documentId} documentId={documentId} {...props} />
  );
}
