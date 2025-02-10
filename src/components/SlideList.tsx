import React from "react";
import { useStore } from "../store/document";
import { SlidePreview } from "./SlidePreview";

export const SlideList: React.FC = () => {
  const {
    slides,
    currentSlideIndex,
    setCurrentSlide,
    reorderSlides,
    deleteSlide,
    updateSlide,
    addSlide,
  } = useStore();

  const sidebarRef = React.useRef<HTMLDivElement>(null);

  // Add keyboard navigation handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the sidebar contains the focused element
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
          // Prevent deleting the last slide
          deleteSlide(currentSlideIndex);
          // Move to previous slide if available, otherwise stay at current index
          setCurrentSlide(Math.min(currentSlideIndex, slides.length - 2));
        }
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
              // Add new slide and move it to the correct position
              addSlide();
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
  }, [
    currentSlideIndex,
    slides.length,
    setCurrentSlide,
    deleteSlide,
    slides,
    reorderSlides,
    addSlide,
    updateSlide,
  ]);

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
    <div
      ref={sidebarRef}
      className="fixed left-4 top-24 bottom-4 w-60 bg-white rounded-lg shadow-lg overflow-y-auto focus:outline-none"
      tabIndex={0}
    >
      <div className="p-4">
        <div className="space-y-4">
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
  );
};
