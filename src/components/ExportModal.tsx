import React, { FormEvent, useEffect, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import {
  exportToGif,
  fetchDataFromGist,
  downloadInsFile,
  generateEmbedCode,
  handleImport,
  GistFileData,
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
  {
    id: "get-shareable-link",
    title: "Get Shareable Link",
    description:
      "Generate a direct shareable link from your Gist URL for easy sharing",
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
  const [gistFiles, setGistFiles] = useState<GistFileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isLoadingGist, setIsLoadingGist] = useState(false);

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
    setGistFiles([]);
    setSelectedFile(null);
    setIsLoadingGist(false);
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
        selectedOption === "embed-slider-template" ||
        selectedOption === "get-shareable-link") &&
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
        selectedOption === "embed-slider-template" ||
        selectedOption === "get-shareable-link"
      ) {
        // If we already have gist files and a selected file, proceed with that
        if (gistFiles.length > 0 && selectedFile) {
          // Use a query parameter for filename instead of fragment identifier
          const fileParam = `&filename=${encodeURIComponent(selectedFile)}`;

          if (selectedOption === "get-shareable-link") {
            // Generate shareable link instead of iframe code
            const embedType = "presentation"; // Default to presentation view
            const shareableLink = `${window.location.origin}/share?type=${embedType}&gist_url=${gistId}${fileParam}`;
            setEmbedCode(shareableLink);
            setShowEmbedCode(true);
          } else {
            // Generate iframe code for other embed options
            const embedType =
              selectedOption === "embed-presentation"
                ? "presentation"
                : "slider-template";
            const iframeCode = generateEmbedCode(
              embedType,
              `${gistId}${fileParam}`
            );
            setEmbedCode(iframeCode);
            setShowEmbedCode(true);
          }
          return;
        }

        // Otherwise fetch from the gist
        setIsLoadingGist(true);
        try {
          const result = await fetchDataFromGist(gistId);

          // If result is an array, we have multiple files to choose from
          if (Array.isArray(result)) {
            setGistFiles(result);
            setSelectedFile(result[0].filename); // Select first file by default
            setIsLoadingGist(false);
            return; // Wait for user to select a file
          }

          // Single file result, proceed with generating link/embed
          if (selectedOption === "get-shareable-link") {
            // Generate shareable link instead of iframe code
            const embedType = "presentation"; // Default to presentation view
            const shareableLink = `${window.location.origin}/share?type=${embedType}&gist_url=${gistId}`;
            setEmbedCode(shareableLink);
            setShowEmbedCode(true);
          } else {
            // Generate iframe code for other embed options
            const embedType =
              selectedOption === "embed-presentation"
                ? "presentation"
                : "slider-template";
            const iframeCode = generateEmbedCode(embedType, gistId);
            setEmbedCode(iframeCode);
            setShowEmbedCode(true);
          }
        } finally {
          setIsLoadingGist(false);
        }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
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
              href="https://github.com/chunrapeepat/inscribed/blob/master/docs/export-options.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Learn how each option works
            </a>
          </p>
          {!showEmbedCode ? (
            <>
              <div className="mb-4">
                <label
                  htmlFor="export-option"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Export Option
                </label>
                <select
                  id="export-option"
                  value={selectedOption || ""}
                  onChange={(e) => setSelectedOption(e.target.value || null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select an option</option>
                  {exportOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
                {selectedOption && (
                  <p className="text-gray-600 text-sm mt-2">
                    {
                      exportOptions.find(
                        (option) => option.id === selectedOption
                      )?.description
                    }
                  </p>
                )}
              </div>

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
                selectedOption === "embed-slider-template" ||
                selectedOption === "get-shareable-link") && (
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
                    onChange={(e) => {
                      setGistId(e.target.value);
                      // Clear gist files when URL changes
                      if (gistFiles.length > 0) {
                        setGistFiles([]);
                        setSelectedFile(null);
                      }
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter GitHub Gist URL"
                    required
                  />

                  {isLoadingGist && (
                    <div className="mt-2 text-sm text-gray-600 flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                      Loading Gist files...
                    </div>
                  )}

                  {gistFiles.length > 0 && (
                    <div className="mt-3">
                      <label
                        htmlFor="gistFile"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Select File
                      </label>
                      <select
                        id="gistFile"
                        value={selectedFile || ""}
                        onChange={(e) => setSelectedFile(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {gistFiles.map((file) => (
                          <option key={file.filename} value={file.filename}>
                            {file.filename}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Found {gistFiles.length} valid Inscribed data files in
                        this Gist
                      </p>
                    </div>
                  )}
                </form>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">
                {selectedOption === "embed-presentation"
                  ? "Embed Presentation"
                  : selectedOption === "embed-slider-template"
                  ? "Embed Slider Template"
                  : "Shareable Link"}
              </h3>
              <textarea
                value={embedCode}
                readOnly
                onClick={(e) => e.currentTarget.select()}
                className={`w-full p-3 border rounded-md font-mono text-sm ${
                  selectedOption === "get-shareable-link" ? "h-12" : "h-32"
                }`}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(embedCode);
                    alert("Copied to clipboard!");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {selectedOption === "get-shareable-link"
                    ? "Copy Link"
                    : "Copy Code"}
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
                  selectedOption === "embed-slider-template" ||
                  selectedOption === "get-shareable-link") &&
                  (!gistId.trim() || (gistFiles.length > 0 && !selectedFile)))
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
                    selectedOption === "embed-slider-template" ||
                    selectedOption === "get-shareable-link") &&
                  (!gistId.trim() || (gistFiles.length > 0 && !selectedFile))
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
