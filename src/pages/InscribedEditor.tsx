import React, { useState, useEffect, useCallback } from "react";
import { Toolbar } from "../components/Toolbar";
import { SlideList } from "../components/SlideList";
import { Canvas } from "../components/Canvas";
import {
  generateExportData,
  downloadInsFile,
  handleImport,
} from "../utils/export";
import { useDocumentStore } from "../store/document";

export const InscribedEditor: React.FC = () => {
  const { filename } = useDocumentStore();
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const [showAboutOverlay, setShowAboutOverlay] = useState(() => {
    // Check if user has visited before
    return localStorage.getItem("hasVisitedBefore") !== "true";
  });
  const [showDropOverlay, setShowDropOverlay] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);

  const save = async () => {
    const defaultFileName = filename || `inscribed-${Date.now()}.ins`;
    if ("showSaveFilePicker" in window) {
      try {
        const options: SaveFilePickerOptions = {
          suggestedName: defaultFileName,
          types: [
            {
              description: "Inscribed File",
              accept: { "text/plain": [".ins"] },
            },
          ],
        };

        const fileHandle = await window.showSaveFilePicker(options);
        const exportData = generateExportData(
          fileHandle.name.replace(".ins", "")
        );
        const blob = new Blob([JSON.stringify(exportData)], {
          type: "text/plain",
        });
        const writableStream = await fileHandle.createWritable();
        await writableStream.write(blob);
        await writableStream.close();
      } catch (err) {
        console.error("Save cancelled or error:", err);
      }
    } else {
      let fileName = window.prompt(
        "Enter file name (the default extension .ins will be appended if missing)",
        defaultFileName
      );

      if (!fileName) return;
      if (!fileName.toLowerCase().endsWith(".ins")) {
        fileName += ".ins";
      }
      const exportData = generateExportData(fileName);
      downloadInsFile(exportData, fileName);
    }
  };

  // Custom save shortcut: ctrl/cmd + s triggers the save function.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        event.stopPropagation();
        save();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [filename]);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    setShowMobileOverlay(isMobile);
  }, []);

  const handleCloseAbout = () => {
    setShowAboutOverlay(false);
    localStorage.setItem("hasVisitedBefore", "true");
  };

  // Handle file drop
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement> | DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Check if any of the dragged items is a .ins file
      if (e.dataTransfer?.items) {
        let hasInsFile = false;
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          const item = e.dataTransfer.items[i];
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file && file.name.toLowerCase().endsWith(".ins")) {
              hasInsFile = true;
              break;
            }
          }
        }
        setShowDropOverlay(hasInsFile);
      }
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement> | DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowDropOverlay(false);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement> | DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowDropOverlay(false);

      if (e.dataTransfer?.files) {
        // Find the first .ins file
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i];
          if (file.name.toLowerCase().endsWith(".ins")) {
            setFileToImport(file);
            setShowImportConfirm(true);
            break;
          }
        }
      }
    },
    []
  );

  // Set up global drag and drop handlers
  useEffect(() => {
    // Use the capture phase to intercept events before they reach the canvas
    window.addEventListener("dragover", handleDragOver, true);
    window.addEventListener("dragleave", handleDragLeave, true);
    window.addEventListener("drop", handleDrop, true);

    return () => {
      window.removeEventListener("dragover", handleDragOver, true);
      window.removeEventListener("dragleave", handleDragLeave, true);
      window.removeEventListener("drop", handleDrop, true);
    };
  }, [handleDragOver, handleDragLeave, handleDrop]);

  const confirmImport = async () => {
    if (fileToImport) {
      try {
        await handleImport(fileToImport);
        setShowImportConfirm(false);
        setFileToImport(null);
      } catch (error) {
        console.error("Import failed:", error);
        alert("Import failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      <Toolbar />
      <SlideList />
      <Canvas />

      <a
        href="https://github.com/chunrapeepat/inscribed/issues/new"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-[-40px] top-1/2 transform -translate-y-1/2 -rotate-90 bg-white shadow-md hover:shadow-lg rounded-lg px-4 py-2 hover:bg-gray-50 transition-all duration-200 border border-gray-200"
      >
        Feedback
      </a>

      {/* Mobile overlay */}
      {showMobileOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm text-center">
            <h2 className="text-xl font-semibold mb-4">
              Desktop Experience Recommended
            </h2>
            <p className="mb-6">
              This website is optimized for desktop viewing. For the best
              experience, please use a desktop or laptop computer.
            </p>
            <button
              onClick={() => setShowMobileOverlay(false)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              I understand
            </button>
          </div>
        </div>
      )}

      {/* About overlay */}
      {showAboutOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-xl text-center">
            <h2 className="text-xl font-semibold mb-4">About Inscribed</h2>
            <p className="mb-6">
              A slide-based tool for fast sketching and animating ideas.
            </p>
            <div className="mb-6">
              <iframe
                width="100%"
                height="300"
                src="https://www.youtube.com/embed/CLJvvGVErMY?si=aB4FI9V3ABQCcWtE"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="rounded-lg"
              ></iframe>
            </div>
            <div className="mb-6 flex items-center justify-center gap-4">
              <iframe
                src="https://ghbtns.com/github-btn.html?user=chunrapeepat&repo=inscribed&type=star&count=true&size=small"
                frameBorder="0"
                scrolling="0"
                width="150"
                height="20"
                title="GitHub"
              ></iframe>
              <a
                href="https://github.com/chunrapeepat/inscribed"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                See the project on GitHub
              </a>
            </div>
            <div className="mb-6 text-left">
              <p className="text-gray-700 text-sm">
                I've been writing tech content lately and needed a way to
                animate ideas for my blog. I'm a big fan of{" "}
                <a
                  href="https://excalidraw.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Excalidraw
                </a>{" "}
                and Keynote, so this is an attempt to combine their UX together
                for creating slides and stop motion animations. Export as GIF or
                iframe and embed anywhere you want. Enjoy!
              </p>
            </div>
            <button
              onClick={handleCloseAbout}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Drop overlay */}
      {showDropOverlay && (
        <div className="fixed inset-0 bg-blue-500 bg-opacity-30 z-[999999] flex items-center justify-center p-4 border-4 border-blue-500 border-dashed">
          <div className="bg-white rounded-lg p-8 max-w-md text-center shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Drop to Import</h2>
            <p className="text-gray-600">
              Drop your .ins file here to import it into Inscribed
            </p>
          </div>
        </div>
      )}

      {/* Import confirmation overlay */}
      {showImportConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md text-center">
            <h2 className="text-xl font-semibold mb-4">Confirm Import</h2>
            <p className="mb-6">
              Importing "{fileToImport?.name}" will replace your current data.
              Make sure you've backed up any important work.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowImportConfirm(false);
                  setFileToImport(null);
                }}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
