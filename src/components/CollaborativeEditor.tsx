import { useBlockNoteSync } from '@convex-dev/prosemirror-sync/blocknote';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { api } from '../../convex/_generated/api';
import { BlockNoteEditor, PartialBlock } from '@blocknote/core';

interface CollaborativeEditorProps {
  documentId: string;
  placeholder?: string;
  editable?: boolean;
}

export function CollaborativeEditor({ documentId, placeholder = "Start typing...", editable = true }: CollaborativeEditorProps) {
  const sync = useBlockNoteSync<BlockNoteEditor>(api.prosemirror, documentId, {
    editorOptions: {
      _tiptapOptions: {
        editable,
      },
    },
  });

  if (sync.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600">Loading collaborative editor...</span>
      </div>
    );
  }

  if (!sync.editor) {
    return (
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No Content Yet</h3>
        <p className="text-slate-600 mb-4">Create the initial document to start collaborating</p>
        <button
          onClick={() => sync.create({ type: 'doc', content: [] })}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
        >
          Create Document
        </button>
      </div>
    );
  }

  return (
    <div className="collaborative-editor">
      <BlockNoteView 
        editor={sync.editor} 
        theme="light"
      />
    </div>
  );
}

export function CollaborativeEditorWrapper({ documentId, ...props }: CollaborativeEditorProps) {
  // Wrapper ensures editor re-renders when documentId changes
  return <CollaborativeEditor key={documentId} documentId={documentId} {...props} />;
}
