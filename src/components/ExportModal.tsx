import React, { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  exportToGif,
  fetchDataFromGist,
  downloadInsFile,
  generateEmbedCode,
  handleImport,
} from "../utils/export";
import { useDocumentStore } from "../store/document";
import { useFontsStore } from "../store/custom-fonts";
import { FileId } from "@excalidraw/excalidraw/types/element/types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const exportOptions = [
  {
    id: "import",
    title: "Import",
    description:
      "Import inscribed data (.ins file) This option will overwrite your data, backup your current data before importing",
  },
  {
    id: "export-data",
    title: "Export Data",
    description: "Export your current data for later editing",
  },
  {
    id: "gif",
    title: "Export as GIF",
    description: "Create an animated GIF. Good for sharing on social media.",
  },
  {
    id: "embed-presentation",
    title: "Embed Presentation",
    description:
      "Create an iframe embed of your slides. Good for embeding on website, documentation, Notion/Obsidian.",
  },
  {
    id: "embed-slider-template",
    title: "Embed with Slider Template",
    description:
      "Create an iframe embed with slider template. Good for visualizing a step by step process e.g. algorithm",
  },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const documentStore = useDocumentStore();
  const fontsStore = useFontsStore();
  const [selectedOption, setSelectedOption] = React.useState<string | null>(
    null
  );
  const [exportFileName, setExportFileName] = React.useState("");
  const [gistId, setGistId] = React.useState("");
  const [frameDelay, setFrameDelay] = React.useState("100");
  const [exportProgress, setExportProgress] = React.useState<number | null>(
    null
  );
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [embedCode, setEmbedCode] = useState("");

  // ESC shortcut
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    setShowEmbedCode(false);
    setEmbedCode("");
    setGistId("");
    setSelectedOption(null);
    onClose();
  };

  const generateExportData = (fileName: string) => {
    // prune unused files
    const usedFileIds = documentStore.slides
      .map((slide) => slide.elements)
      .flat()
      .filter((e) => e.type === "image")
      .map((e) => e.fileId);
    const unusedFileIds = Object.keys(documentStore.files).filter(
      (fileId) => !usedFileIds.includes(fileId as FileId)
    );
    const files = { ...documentStore.files };
    unusedFileIds.forEach((fileId) => {
      delete files[fileId as FileId];
    });

    return {
      name: fileName,
      document: {
        backgroundColor: documentStore.backgroundColor,
        slides: documentStore.slides,
        files,
        documentSize: documentStore.documentSize,
      },
      fonts: {
        customFonts: fontsStore.customFonts,
      },
    };
  };

  const handleExport = async () => {
    if (!selectedOption) return;
    if (
      (selectedOption === "export-data" || selectedOption === "gif") &&
      !exportFileName.trim()
    )
      return;
    if (
      (selectedOption === "embed-presentation" ||
        selectedOption === "slider") &&
      !gistId.trim()
    )
      return;
    if (selectedOption === "gif" && (!frameDelay || parseInt(frameDelay) < 1))
      return;

    try {
      if (selectedOption === "import") {
        const fileInput = document.getElementById(
          "fileUpload"
        ) as HTMLInputElement;
        if (!fileInput.files?.length) return;

        await handleImport(fileInput.files[0]);
        onClose();
      } else if (selectedOption === "export-data") {
        const exportData = generateExportData(exportFileName);
        downloadInsFile(exportData, exportFileName);
        setExportFileName("");
        setSelectedOption(null);
      } else if (selectedOption === "gif") {
        setExportProgress(0);
        await exportToGif({
          fileName: exportFileName,
          frameDelay: parseInt(frameDelay),
          onProgress: (progress) => setExportProgress(progress),
        });
        setExportProgress(null);
        setSelectedOption(null);
        setExportFileName("");
        setFrameDelay("100");
      } else if (
        selectedOption === "embed-presentation" ||
        selectedOption === "embed-slider-template"
      ) {
        await fetchDataFromGist(gistId);
        const embedType =
          selectedOption === "embed-presentation"
            ? "presentation"
            : "slider-template";
        const iframeCode = generateEmbedCode(embedType, gistId);
        setEmbedCode(iframeCode);
        setShowEmbedCode(true);
        return;
      }

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Export failed. Please try again."
      );
      setExportProgress(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExport();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Export Presentation</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="mb-2 text-sm text-gray-500">
            Need help?{" "}
            <a
              href="https://github.com/chunrapeepat/inscribed/blob/master/docs/export.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Learn how each option works
            </a>
          </p>
          {!showEmbedCode ? (
            <>
              {exportOptions.map((option) => (
                <div
                  key={option.id}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedOption === option.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-500"
                  }`}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <h3 className="font-medium">{option.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {option.description}
                  </p>
                </div>
              ))}

              {selectedOption === "import" && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label
                    htmlFor="fileUpload"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Select File
                  </label>
                  <input
                    type="file"
                    id="fileUpload"
                    accept=".ins"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      file:cursor-pointer cursor-pointer"
                    required
                  />
                </div>
              )}

              {selectedOption === "export-data" && (
                <form
                  onSubmit={handleSubmit}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <label
                    htmlFor="fileName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Export File Name
                  </label>
                  <input
                    type="text"
                    id="fileName"
                    value={exportFileName}
                    onChange={(e) => setExportFileName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter file name"
                    required
                  />
                </form>
              )}

              {selectedOption === "gif" && (
                <form
                  onSubmit={handleSubmit}
                  className="mt-4 pt-4 border-t border-gray-200 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="gifFileName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      GIF File Name
                    </label>
                    <input
                      type="text"
                      id="gifFileName"
                      value={exportFileName}
                      onChange={(e) => setExportFileName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter file name (.gif)"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="frameDelay"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Frame Delay (ms)
                    </label>
                    <input
                      type="number"
                      id="frameDelay"
                      value={frameDelay}
                      onChange={(e) => setFrameDelay(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter delay in milliseconds"
                      min="1"
                      required
                    />
                  </div>
                  {exportProgress !== null && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1 text-center">
                        Generating GIF: {Math.round(exportProgress)}%
                      </p>
                    </div>
                  )}
                </form>
              )}

              {(selectedOption === "embed-presentation" ||
                selectedOption === "embed-slider-template") && (
                <form
                  onSubmit={handleSubmit}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="gistId"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Gist URL
                    </label>
                    <div className="space-x-1 text-sm">
                      <button
                        onClick={() => {
                          const exportData =
                            generateExportData("embedding-data");
                          navigator.clipboard.writeText(
                            JSON.stringify(exportData)
                          );
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        (copy data)
                      </button>
                      <a
                        href="https://gist.github.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        (new gist →)
                      </a>
                    </div>
                  </div>
                  <input
                    type="text"
                    id="gistId"
                    value={gistId}
                    onChange={(e) => setGistId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter GitHub Gist URL"
                    required
                  />
                </form>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">
                {selectedOption === "embed-presentation"
                  ? "Embed Presentation"
                  : "Embed Slider Template"}
              </h3>
              <textarea
                value={embedCode}
                readOnly
                onClick={(e) => e.currentTarget.select()}
                className="w-full h-32 p-3 border rounded-md font-mono text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(embedCode);
                    alert("Copied to clipboard!");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy Code
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {!showEmbedCode && (
          <div className="p-4 border-t bg-gray-50 rounded-b-lg">
            <button
              onClick={handleExport}
              disabled={
                !selectedOption ||
                (selectedOption === "export-data" && !exportFileName.trim()) ||
                (selectedOption === "gif" &&
                  (!exportFileName.trim() ||
                    !frameDelay ||
                    parseInt(frameDelay) < 1)) ||
                ((selectedOption === "embed-presentation" ||
                  selectedOption === "embed-slider-template") &&
                  !gistId.trim())
              }
              className={`w-full py-2 px-4 rounded-lg transition-colors ${
                selectedOption &&
                !(selectedOption === "export-data" && !exportFileName.trim()) &&
                !(
                  selectedOption === "gif" &&
                  (!exportFileName.trim() ||
                    !frameDelay ||
                    parseInt(frameDelay) < 1)
                ) &&
                !(
                  (selectedOption === "embed-presentation" ||
                    selectedOption === "embed-slider-template") &&
                  !gistId.trim()
                )
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 cursor-not-allowed text-gray-500"
              }`}
            >
              {selectedOption === "import"
                ? "Upload File"
                : selectedOption
                ? "Export"
                : "Select an option"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
