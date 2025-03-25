import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  exportToGif,
  fetchDataFromGist,
  downloadInsFile,
  generateEmbedCode,
  handleImport,
  GistFileData,
  generateExportData,
} from "../utils/export";
import { useDocumentStore } from "../store/document";
import { useFontsStore } from "../store/custom-fonts";

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
    id: "import-gist",
    title: "Import from Gist",
    description:
      "Import inscribed data from a GitHub Gist URL. This option will overwrite your data.",
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
  const [importedGistUrl, setImportedGistUrl] = useState<string | null>(null);

  // GIF preview states
  const [previewGifUrl, setPreviewGifUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState<number | null>(null);

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

  // Reset importedGistUrl on first modal load or when refreshing the page
  useEffect(() => {
    // This effect will run on component mount
    // We reset the importedGistUrl to ensure it starts fresh on page load
    if (!isOpen) {
      setImportedGistUrl(null);
    }
  }, []); // Empty dependency array means this runs once on mount

  if (!isOpen) return null;

  const handleClose = () => {
    setShowEmbedCode(false);
    setEmbedCode("");
    setGistId("");
    setSelectedOption(null);
    setGistFiles([]);
    setSelectedFile(null);
    setIsLoadingGist(false);

    // Clean up any GIF preview
    if (previewGifUrl) {
      URL.revokeObjectURL(previewGifUrl);
      setPreviewGifUrl(null);
    }
    setPreviewProgress(null);
    setIsGeneratingPreview(false);

    // Don't reset importedGistUrl here, as we want to persist it between modal openings

    onClose();
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
        selectedOption === "get-shareable-link" ||
        selectedOption === "import-gist") &&
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

        // Reset imported Gist URL when importing a file
        setImportedGistUrl(null);

        await handleImport(fileInput.files[0]);
        onClose();
      } else if (selectedOption === "import-gist") {
        // If we already have gist files and a selected file, proceed with import
        if (gistFiles.length > 0 && selectedFile) {
          // Find the selected file in gistFiles
          const selectedGistFile = gistFiles.find(
            (file) => file.filename === selectedFile
          );
          if (selectedGistFile) {
            // Import the data directly from the selected file
            const documentStore = useDocumentStore.getState();
            const fontsStore = useFontsStore.getState();

            // Reset the store with import data
            documentStore.resetStore(selectedGistFile.content.document);

            // Add fonts if not already present
            if (selectedGistFile.content.fonts?.customFonts) {
              Object.keys(selectedGistFile.content.fonts.customFonts).forEach(
                (fontFamily) => {
                  if (!fontsStore.customFonts[fontFamily]) {
                    fontsStore.addFonts(
                      selectedGistFile.content.fonts.customFonts[fontFamily]
                    );
                  }
                }
              );
            }

            // Save the imported Gist URL
            setImportedGistUrl(gistId);

            onClose();
            return;
          }
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

          // Single file result, import directly
          const documentStore = useDocumentStore.getState();
          const fontsStore = useFontsStore.getState();

          // Reset the store with import data
          documentStore.resetStore(result.document);

          // Add fonts if not already present
          if (result.fonts?.customFonts) {
            Object.keys(result.fonts.customFonts).forEach((fontFamily) => {
              if (!fontsStore.customFonts[fontFamily]) {
                fontsStore.addFonts(result.fonts.customFonts[fontFamily]);
              }
            });
          }

          // Save the imported Gist URL
          setImportedGistUrl(gistId);

          onClose();
        } finally {
          setIsLoadingGist(false);
        }
        return;
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

            // Extract username/gistId from the full Gist URL
            const gistMatch = gistId.match(/gist\.github\.com\/([^/]+\/[^/]+)/);
            const gistShortId = gistMatch ? gistMatch[1] : gistId;

            // Use new shorter URL format for shareable links
            const shareableLink = `${window.location.origin}/share?gist=${gistShortId}${fileParam}`;

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

            // Extract username/gistId from the full Gist URL
            const gistMatch = gistId.match(/gist\.github\.com\/([^/]+\/[^/]+)/);
            const gistShortId = gistMatch ? gistMatch[1] : gistId;

            // Use new shorter URL format for shareable links
            const shareableLink = `${window.location.origin}/share?gist=${gistShortId}`;

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

  // Function to generate a preview GIF
  const handlePreviewGif = async () => {
    // Clear any existing preview
    if (previewGifUrl) {
      URL.revokeObjectURL(previewGifUrl);
      setPreviewGifUrl(null);
    }

    setIsGeneratingPreview(true);
    setPreviewProgress(0);

    try {
      // Use the existing exportToGif function with 'preview' as the filename
      // to indicate we want to get the URL rather than download
      const url = (await exportToGif({
        fileName: "preview",
        frameDelay: parseInt(frameDelay) || 100,
        onProgress: (progress) => setPreviewProgress(progress),
      })) as string;

      setPreviewGifUrl(url);
    } catch (error) {
      console.error("Error generating preview GIF:", error);
    } finally {
      setIsGeneratingPreview(false);
      setPreviewProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Export Presentation</h2>
          <button
            type="button"
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

              {selectedOption === "import-gist" && (
                <form
                  onSubmit={handleSubmit}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <label
                    htmlFor="importGistUrl"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Gist URL
                  </label>
                  <input
                    type="text"
                    id="importGistUrl"
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
                        htmlFor="importGistFile"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Select File
                      </label>
                      <select
                        id="importGistFile"
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
                  <p className="text-xs text-gray-500 mt-2">
                    <b>Pro tip:</b> use <b>cmd/ctrl + s</b> shortcut to export
                    file
                  </p>
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
                    <div className="flex justify-between items-center">
                      <label
                        htmlFor="frameDelay"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Frame Delay (ms)
                      </label>
                      <button
                        type="button"
                        onClick={handlePreviewGif}
                        disabled={isGeneratingPreview}
                        className="text-blue-600 hover:text-blue-800 space-x-1 text-sm"
                      >
                        <span>(preview GIF)</span>
                      </button>
                    </div>
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

                  {/* Preview GIF Progress */}
                  {isGeneratingPreview && previewProgress !== null && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${previewProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1 text-center">
                        Generating preview: {Math.round(previewProgress)}%
                      </p>
                    </div>
                  )}

                  {/* Preview GIF Display */}
                  {previewGifUrl && (
                    <div className="mt-2 border rounded-lg p-2">
                      <p className="text-xs text-gray-500 mb-1">Preview:</p>
                      <div className="flex justify-center">
                        <img
                          src={previewGifUrl}
                          alt="GIF Preview"
                          className="max-h-64 max-w-full object-contain rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* Export Progress */}
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
                        type="button"
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
                      {importedGistUrl && (
                        <a
                          href={importedGistUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          (existing gist →)
                        </a>
                      )}
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
                  type="button"
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
                  type="button"
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
              type="submit"
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
                  selectedOption === "get-shareable-link" ||
                  selectedOption === "import-gist") &&
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
                    selectedOption === "get-shareable-link" ||
                    selectedOption === "import-gist") &&
                  (!gistId.trim() || (gistFiles.length > 0 && !selectedFile))
                )
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 cursor-not-allowed text-gray-500"
              }`}
            >
              {selectedOption === "import"
                ? "Upload File"
                : selectedOption === "import-gist"
                ? "Import"
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
