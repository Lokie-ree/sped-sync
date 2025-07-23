import { CollaborativeEditorWrapper } from "./CollaborativeEditor";
import { CollaborationIndicator } from "./CollaborationIndicator";

interface CollaborateTabProps {
  iepId: string;
}

export function CollaborateTab({ iepId }: CollaborateTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Collaborative Editing</h3>
        <p className="text-slate-600 mb-4">
          Work together with your IEP team in real-time. Changes are automatically saved and synced across all team members.
        </p>
      </div>

      <CollaborationIndicator iepId={iepId} />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900">Collaborative Document</h4>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Auto-saving</span>
            </div>
          </div>
        </div>
        <div className="min-h-[400px]">
          <CollaborativeEditorWrapper 
            documentId={iepId}
            placeholder="Start collaborating on this IEP document..."
          />
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Collaboration Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Changes are saved automatically as you type</li>
          <li>• You can see who else is editing in real-time</li>
          <li>• Use comments and suggestions to communicate with your team</li>
          <li>• All edits are tracked and can be reviewed later</li>
        </ul>
      </div>
    </div>
  );
}
