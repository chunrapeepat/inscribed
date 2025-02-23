import React, { useEffect } from "react";
import { useDocumentStore } from "../store/document";
import { SlidePreview } from "./SlidePreview";

export const SlideList: React.FC = () => {
  const {
    slides,
    currentSlideIndex,
    setCurrentSlide,
    reorderSlides,
    deleteSlide,
    updateSlide,
    addSlideAfterIndex,
  } = useDocumentStore();
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [showShortcuts, setShowShortcuts] = React.useState(false);

  // handle keyboard shortcuts for navigation when focused on the sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sidebarRef.current?.contains(document.activeElement)) {
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentSlide(Math.max(0, currentSlideIndex - 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setCurrentSlide(Math.min(slides.length - 1, currentSlideIndex + 1));
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (slides.length > 1) {
          deleteSlide(currentSlideIndex);
          setCurrentSlide(Math.min(currentSlideIndex, slides.length - 2));
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        const slideToStore = slides[currentSlideIndex];
        addSlideAfterIndex(currentSlideIndex);
        const insertIndex = currentSlideIndex + 1;
        updateSlide(insertIndex, slideToStore.elements);
        setCurrentSlide(insertIndex);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        const slideToStore = slides[currentSlideIndex];
        const slideData = {
          type: "PRESENTATION_SLIDE",
          data: slideToStore,
        };
        navigator.clipboard
          .writeText(JSON.stringify(slideData))
          .catch((error) =>
            console.error("Failed to copy to clipboard:", error)
          );
      } else if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        navigator.clipboard
          .readText()
          .then((clipboardText) => {
            try {
              const parsedData = JSON.parse(clipboardText);
              if (parsedData.type !== "PRESENTATION_SLIDE") {
                throw new Error("Invalid slide data format");
              }
              addSlideAfterIndex(currentSlideIndex);
              const insertIndex = currentSlideIndex + 1;
              updateSlide(insertIndex, parsedData.data.elements);
              setCurrentSlide(insertIndex);
            } catch (error) {
              console.error("Failed to paste slide:", error);
            }
          })
          .catch((error) =>
            console.error("Failed to read from clipboard:", error)
          );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlideIndex, slides]);

  // handle drag and drop for reordering slides
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.currentTarget.classList.add("opacity-50");
  };
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("opacity-50");
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-t-2", "border-blue-500");
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("border-t-2", "border-blue-500");
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-t-2", "border-blue-500");

    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (fromIndex !== toIndex) {
      reorderSlides(fromIndex, toIndex);
    }
  };

  return (
    <div className="fixed z-[9999] left-4 top-24 bottom-4 flex">
      <div
        ref={sidebarRef}
        className="w-60 bg-white rounded-lg shadow-lg focus:outline-none"
        tabIndex={0}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-gray-700 font-medium">Slides</div>
            <div className="relative">
              <button
                className="p-1 rounded-full hover:bg-gray-100"
                onMouseEnter={() => setShowShortcuts(true)}
                onMouseLeave={() => setShowShortcuts(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {showShortcuts && (
                <div className="absolute z-[9999] top-10 ml-2 w-64 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
                  <h3 className="text-sm font-medium mb-2">
                    Keyboard Shortcuts
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>↑ - Previous slide</li>
                    <li>↓ - Next slide</li>
                    <li>Delete/Backspace - Delete current slide</li>
                    <li>Ctrl/⌘ + C - Copy slide</li>
                    <li>Ctrl/⌘ + V - Paste slide</li>
                    <li>Ctrl/⌘ + D - Duplicate slide</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div
            className="space-y-4 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 160px)" }}
          >
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => setCurrentSlide(index)}
                className={`p-2 rounded-lg cursor-move transition-colors ${
                  currentSlideIndex === index
                    ? "bg-blue-100 border-2 border-blue-500"
                    : "hover:bg-gray-100 border-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-gray-500 text-xs font-medium">
                    Slide {index + 1}
                  </div>
                </div>
                <SlidePreview elements={slide.elements} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
