import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Presentation as Present,
  Share2,
  Maximize2,
} from "lucide-react";
import { useStore } from "../store/document";
import { ExportModal } from "./ExportModal";
import { DocumentSizeModal } from "./DocumentSizeModal";
import { FontsManagerModal } from "./FontsManagerModal";

export const Toolbar: React.FC = () => {
  const { addSlide, deleteSlide, currentSlideIndex } = useStore();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDocumentSizeModalOpen, setIsDocumentSizeModalOpen] = useState(false);
  const [isFontsManagerModalOpen, setIsFontsManagerModalOpen] = useState(false);

  return (
    <>
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2 flex gap-4">
        <button
          onClick={addSlide}
          className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100"
        >
          <Plus size={20} />
          <span>New Slide</span>
        </button>
        <button
          onClick={() => deleteSlide(currentSlideIndex)}
          className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100 text-red-600"
        >
          <Trash2 size={20} />
          <span>Delete Slide</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100 text-green-600">
          <Present size={20} />
          <span>Present</span>
        </button>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100 text-blue-600"
        >
          <Share2 size={20} />
          <span>Share / Export</span>
        </button>
        <button
          onClick={() => setIsDocumentSizeModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100"
        >
          <Maximize2 size={20} />
          <span>Document Size</span>
        </button>
        <button
          onClick={() => setIsFontsManagerModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100"
        >
          <span>Fonts</span>
        </button>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      <DocumentSizeModal
        isOpen={isDocumentSizeModalOpen}
        onClose={() => setIsDocumentSizeModalOpen(false)}
      />
      <FontsManagerModal
        isOpen={isFontsManagerModalOpen}
        onClose={() => setIsFontsManagerModalOpen(false)}
      />
    </>
  );
};
