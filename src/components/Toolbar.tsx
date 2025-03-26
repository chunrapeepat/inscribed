import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Presentation as Present,
  Cloudy,
  FileCog,
  Copy,
  PanelLeftClose,
} from "lucide-react";
import { useDocumentStore } from "../store/document";
import { ExportModal } from "./ExportModal";
import { DocumentSettingModal } from "./DocumentSettingModal";
import { CustomFontsModal } from "./CustomFontsModal";
import { useModalStore } from "../store/modal";
import { PresentationMode } from "./PresentationMode";

export const Toolbar: React.FC = () => {
  const {
    addSlide,
    addSlideAfterIndex,
    deleteSlide,
    currentSlideIndex,
    slides,
    updateSlide,
    getSidebarCollapsed,
    toggleSidebar,
  } = useDocumentStore();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDocumentSizeModalOpen, setIsDocumentSizeModalOpen] = useState(false);
  const { openCustomFontsModal, closeModal } = useModalStore();
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  const isSidebarCollapsed = getSidebarCollapsed();

  const handleDuplicateSlide = () => {
    const slideToStore = slides[currentSlideIndex];
    addSlideAfterIndex(currentSlideIndex);
    const insertIndex = currentSlideIndex + 1;
    updateSlide(insertIndex, slideToStore.elements);
  };

  return (
    <>
      <div className="fixed top-4 left-0 right-0 mx-4 bg-white rounded-lg shadow-lg px-2 py-2">
        <div className="relative flex justify-between">
          <div className="flex gap-2">
            <button
              onClick={toggleSidebar}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100"
              title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
            >
              <PanelLeftClose
                size={16}
                className={`transform transition-transform ${
                  isSidebarCollapsed ? "rotate-180" : ""
                }`}
              />
              <span className="text-xs">
                {isSidebarCollapsed ? "Show Slides" : "Hide Slides"}
              </span>
            </button>
            <button
              onClick={addSlide}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100"
            >
              <Plus size={16} />
              <span className="text-xs">New Slide</span>
            </button>
            <button
              onClick={handleDuplicateSlide}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100"
            >
              <Copy size={16} />
              <span className="text-xs">Duplicate</span>
            </button>
            <button
              onClick={() => deleteSlide(currentSlideIndex)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100 text-red-600"
            >
              <Trash2 size={16} />
              <span className="text-xs">Delete Slide</span>
            </button>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <img src="/logo.png" alt="Logo" className="h-8" />
            <a
              href="https://github.com/chunrapeepat/inscribed?tab=readme-ov-file#changelog"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-xs text-gray-500"
            >
              v{APP_VERSION}
            </a>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsPresentationMode(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100 text-green-600"
            >
              <Present size={16} />
              <span className="text-xs">Present</span>
            </button>
            <button
              onClick={() => setIsDocumentSizeModalOpen(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100"
            >
              <FileCog size={16} />
              <span className="text-xs">Document Setting</span>
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100 text-blue-600"
            >
              <Cloudy size={16} />
              <span className="text-xs">Import/Export</span>
            </button>
          </div>
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      <DocumentSettingModal
        isOpen={isDocumentSizeModalOpen}
        onClose={() => setIsDocumentSizeModalOpen(false)}
      />
      <CustomFontsModal
        isOpen={openCustomFontsModal}
        onClose={() => closeModal("custom-fonts-modal")}
      />
      {isPresentationMode && (
        <PresentationMode onClose={() => setIsPresentationMode(false)} />
      )}
    </>
  );
};
