import {
  Receipt,
  FileText,
  Landmark,
  Folder,
  ChevronRight,
} from "lucide-react";
import type { DocumentCategory } from "@receipt-app/shared";

interface Folder {
  id: DocumentCategory | "all";
  label: string;
  icon: React.ElementType;
  count: number;
}

interface Props {
  folders: Folder[];
  onSelectFolder: (folderId: DocumentCategory | "all") => void;
}

export function FolderGrid({ folders, onSelectFolder }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {folders.map((folder) => {
        const Icon = folder.icon;
        return (
          <button
            key={folder.id}
            onClick={() => onSelectFolder(folder.id)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 text-left w-full active:bg-gray-50 transition-colors"
          >
            {/* Icon Box */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gray-100 text-gray-500">
              <Icon size={24} />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 text-lg">
                {folder.label}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {folder.count} documents
              </p>
            </div>

            {/* Action */}
            <div className="text-gray-400">
              <ChevronRight size={20} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
