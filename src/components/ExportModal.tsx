import React from "react";
import { X } from "lucide-react";
import { exportToGif } from "../utils/export-gif";
import { useStore } from "../store/document";
import { useFontsStore } from "../store/custom-fonts";
import { FileId } from "@excalidraw/excalidraw/types/element/types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const documentStore = useStore();
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

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!selectedOption) return;
    if (
      (selectedOption === "export-data" || selectedOption === "gif") &&
      !exportFileName.trim()
    )
      return;
    if (
      (selectedOption === "template" || selectedOption === "slider") &&
      !gistId.trim()
    )
      return;
    if (selectedOption === "gif" && (!frameDelay || parseInt(frameDelay) < 1))
      return;

    try {
      if (selectedOption === "import") {
        // Handle file upload logic here
        console.log("Uploading file");
      } else if (selectedOption === "export-data") {
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

        // Get data from both stores
        const documentData = {
          backgroundColor: documentStore.backgroundColor,
          slides: documentStore.slides,
          files,
          documentSize: documentStore.documentSize,
        };
        const fontsData = {
          customFonts: fontsStore.customFonts,
        };

        // Combine the data
        const exportData = {
          name: exportFileName,
          document: documentData,
          fonts: fontsData,
        };

        const jsonData = JSON.stringify(exportData, null, 2);

        // Create blob and download link
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        // Ensure filename has .ins extension
        const filename = exportFileName.endsWith(".ins")
          ? exportFileName
          : `${exportFileName}.ins`;

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
      } else if (selectedOption === "template" || selectedOption === "slider") {
        // Handle template/slider export with gistId
        console.log("Exporting with Gist ID:", gistId);
      }

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
      setExportProgress(null);
    }
  };

  const exportOptions = [
    {
      id: "import",
      title: "Import",
      description: "Import slides from external sources",
    },
    {
      id: "export-data",
      title: "Export Data",
      description: "Export your data for later editing",
    },
    {
      id: "gif",
      title: "Export as GIF",
      description: "Create an animated GIF of your slides",
    },
    {
      id: "template",
      title: "Export as Template",
      description: "Save your slides as a reusable template",
    },
    {
      id: "slider",
      title: "Export as Slider",
      description: "Create a standalone presentation viewer",
    },
  ];

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
        <div className="p-4 space-y-4">
          {exportOptions.map((option) => (
            <div
              key={option.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedOption === option.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-500"
              }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <h3 className="font-medium text-lg">{option.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{option.description}</p>
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
            <div className="mt-4 pt-4 border-t border-gray-200">
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
            </div>
          )}

          {selectedOption === "gif" && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
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
            </div>
          )}

          {(selectedOption === "template" || selectedOption === "slider") && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label
                htmlFor="gistId"
                className="block text-sm font-medium text-gray-700"
              >
                Gist ID
              </label>
              <input
                type="text"
                id="gistId"
                value={gistId}
                onChange={(e) => setGistId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter Gist ID"
                required
              />
            </div>
          )}
        </div>
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
              ((selectedOption === "template" || selectedOption === "slider") &&
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
                (selectedOption === "template" ||
                  selectedOption === "slider") &&
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
      </div>
    </div>
  );
};
