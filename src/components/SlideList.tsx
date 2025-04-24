import React, { useEffect } from "react";
import { useDocumentStore } from "../store/document";
import { SlidePreview } from "./SlidePreview";

export const SlideList: React.FC = () => {
  const {
    slides,
    currentSlideIndex,
    setCurrentSlide,
    reorderSlides,
    reorderConsecutiveSlides,
    deleteSlide,
    updateSlide,
    addSlideAfterIndex,
    getSidebarCollapsed,
    setIsSlideListFocused,
  } = useDocumentStore();
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  const [isSidebarFocused, setIsSidebarFocused] = React.useState(false);

  // Multi-select state
  const [selectionStart, setSelectionStart] = React.useState<number | null>(
    null
  );
  const [selectionEnd, setSelectionEnd] = React.useState<number | null>(null);

  const isSidebarCollapsed = getSidebarCollapsed();

  // Function to determine if there's an active multi-selection
  const hasSelection = () => selectionStart !== null && selectionEnd !== null;

  // Function to clear the current selection
  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  // Get the selected slides indices in a range (inclusive)
  const getSelectedIndices = () => {
    if (selectionStart === null || selectionEnd === null) {
      return [currentSlideIndex];
    }

    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // handle keyboard shortcuts for navigation when focused on the sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sidebarRef.current?.contains(document.activeElement)) {
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();

        if (e.shiftKey) {
          // Start selection if none exists yet
          if (selectionStart === null) {
            setSelectionStart(currentSlideIndex);
            setSelectionEnd((end) => {
              return Math.max(0, (end !== null ? end : currentSlideIndex) - 1);
            });
          } else {
            // Update the end of selection
            setSelectionEnd((end) => {
              return Math.max(0, (end !== null ? end : currentSlideIndex) - 1);
            });
          }
        } else {
          // Clear any existing selection on normal navigation
          clearSelection();
          setCurrentSlide(Math.max(0, currentSlideIndex - 1));
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();

        if (e.shiftKey) {
          // Start selection if none exists yet
          if (selectionStart === null) {
            setSelectionStart(currentSlideIndex);
            setSelectionEnd((end) =>
              Math.min(
                slides.length - 1,
                (end !== null ? end : currentSlideIndex) + 1
              )
            );
          } else {
            // Update the end of selection
            setSelectionEnd((end) =>
              Math.min(
                slides.length - 1,
                (end !== null ? end : currentSlideIndex) + 1
              )
            );
          }
        } else {
          // Clear any existing selection on normal navigation
          clearSelection();
          setCurrentSlide(Math.min(slides.length - 1, currentSlideIndex + 1));
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (slides.length > 1) {
          // Don't support multi-select delete for now since it's complex
          // We would need to handle the case where all selected slides are deleted
          deleteSlide(currentSlideIndex);
          setCurrentSlide(Math.min(currentSlideIndex, slides.length - 2));
          clearSelection();
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

  // Handle click with selection
  const handleSlideClick = (index: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      // If holding shift, create or extend selection
      if (selectionStart === null) {
        setSelectionStart(currentSlideIndex);
        setSelectionEnd(index);
      } else {
        setSelectionEnd(index);
      }
      // We still want to update the current slide
      setCurrentSlide(index);
    } else {
      // Normal click, just set current and clear selection
      setCurrentSlide(index);
      clearSelection();
    }
  };

  // handle drag and drop for reordering slides
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    // If we have a selection and the dragged item is within the selection,
    // we'll drag the entire selection
    if (hasSelection() && getSelectedIndices().includes(index)) {
      // Store the selection range to use in drop handler
      const selectedIndices = getSelectedIndices();
      const startIdx = Math.min(...selectedIndices);
      const endIdx = Math.max(...selectedIndices);

      // Store both the main index and the selection range
      e.dataTransfer.setData("text/plain", index.toString());
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({
          selectionStart: startIdx,
          selectionEnd: endIdx,
        })
      );

      // Add opacity to all selected items
      document.querySelectorAll(".selected-slide").forEach((el) => {
        el.classList.add("opacity-50");
      });
    } else {
      // Single item drag
      e.dataTransfer.setData("text/plain", index.toString());
      e.currentTarget.classList.add("opacity-50");

      // Clear selection when dragging a non-selected item
      clearSelection();
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Remove opacity from all potentially dragged items
    e.currentTarget.classList.remove("opacity-50");
    document.querySelectorAll(".selected-slide").forEach((el) => {
      el.classList.remove("opacity-50");
    });
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

    // Check if this is a multi-selection drag
    try {
      const selectionData = e.dataTransfer.getData("application/json");
      if (selectionData) {
        const { selectionStart, selectionEnd } = JSON.parse(selectionData);
        reorderConsecutiveSlides(selectionStart, selectionEnd, toIndex);
        clearSelection();
        return;
      }
    } catch (error) {
      console.error("Error parsing selection data:", error);
    }

    // Fall back to single-item reordering
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (fromIndex !== toIndex) {
      reorderSlides(fromIndex, toIndex);
    }

    // Clear any selection after drop
    clearSelection();
  };

  return (
    <div className="relative">
      <div className="">
        {showShortcuts && (
          <div
            style={{ transform: "translateX(calc(100% - 3rem))" }}
            className="absolute z-[99999] top-40 ml-2 w-64 p-4 bg-white rounded-lg shadow-lg border border-gray-200"
          >
            <h3 className="text-sm font-medium mb-2">Keyboard Shortcuts</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>↑ - Previous slide</li>
              <li>↓ - Next slide</li>
              <li>Shift + ↑/↓ - Select multiple slides</li>
              <li>Shift + Click - Select range of slides</li>
              <li>Delete/Backspace - Delete current slide</li>
              <li>Ctrl/⌘ + C - Copy slide</li>
              <li>Ctrl/⌘ + V - Paste slide</li>
              <li>Ctrl/⌘ + D - Duplicate slide</li>
              <li>Ctrl/⌘ + S - Save/Export Data (filename.ins)</li>
            </ul>
          </div>
        )}
      </div>

      <div
        className={`fixed z-[9999] left-4 top-24 bottom-4 flex overflow-hidden transition-all duration-300 ${
          isSidebarCollapsed ? "translate-x-[-280px]" : ""
        }`}
      >
        <div
          ref={sidebarRef}
          className="w-60 bg-white rounded-lg shadow-lg focus:outline-none"
          tabIndex={0}
          onFocus={() => {
            setIsSidebarFocused(true);
            setIsSlideListFocused(true);
          }}
          onBlur={() => {
            setIsSidebarFocused(false);
            setIsSlideListFocused(false);
          }}
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
                  onClick={(e) => handleSlideClick(index, e)}
                  className={`p-2 rounded-lg cursor-move transition-colors ${
                    hasSelection() && getSelectedIndices().includes(index)
                      ? "selected-slide bg-blue-50 border-2 border-blue-300"
                      : currentSlideIndex === index
                      ? isSidebarFocused
                        ? "bg-blue-100 border-2 border-blue-500"
                        : "bg-gray-100 border-2 border-gray-300"
                      : "hover:bg-gray-100 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-gray-500 text-xs font-medium">
                      Slide {index + 1}
                    </div>
                  </div>
                  <div className="relative">
                    <SlidePreview elements={slide.elements} />
                    <div
                      className="absolute inset-0 z-10 cursor-pointer"
                      aria-label="Slide overlay"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
