import React, { useState, useEffect } from "react";
import { Toolbar } from "../components/Toolbar";
import { SlideList } from "../components/SlideList";
import { Canvas } from "../components/Canvas";
import { generateExportData, downloadInsFile } from "../utils/export";

export const InscribedEditor: React.FC = () => {
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const [showAboutOverlay, setShowAboutOverlay] = useState(() => {
    // Check if user has visited before
    return localStorage.getItem("hasVisitedBefore") !== "true";
  });

  const save = async () => {
    const defaultFileName = `inscribed-${Date.now()}.ins`;
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
        const exportData = generateExportData(fileHandle.name);
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
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    setShowMobileOverlay(isMobile);
  }, []);

  const handleCloseAbout = () => {
    setShowAboutOverlay(false);
    localStorage.setItem("hasVisitedBefore", "true");
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
    </div>
  );
};
