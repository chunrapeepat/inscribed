import React, { useState, useEffect, useCallback } from "react";
import { useDocumentStore } from "../store/document";
import { exportToBlob } from "@excalidraw/excalidraw";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

interface PresentationModeProps {
  onClose: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  onClose,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideImages, setSlideImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(
    "Initializing presentation..."
  );
  const { slides, backgroundColor, documentSize, files } = useDocumentStore();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // generate slide images
  useEffect(() => {
    const urls: string[] = [];
    let mounted = true;

    const generateSlideImages = async () => {
      setLoadingText("Generating presentation slides...");
      const tempImages: string[] = new Array(slides.length).fill("");

      for (let i = 0; i < slides.length; i++) {
        if (!mounted) return;

        const slide = slides[i];
        const elements = slide.elements.filter(
          (el: ExcalidrawElement) => el.id !== "frame"
        );

        try {
          setLoadingText(`Generating slide ${i + 1} of ${slides.length}...`);
          const blob = await exportToBlob({
            elements,
            appState: {
              exportWithDarkMode: false,
              exportBackground: true,
              viewBackgroundColor: backgroundColor,
              width: documentSize.width,
              height: documentSize.height,
            },
            files,
            getDimensions: () => ({
              width: documentSize.width,
              height: documentSize.height,
            }),
          });

          const url = URL.createObjectURL(blob);
          urls.push(url);
          tempImages[i] = url;

          if (mounted) {
            setProgress(((i + 1) / slides.length) * 100);
            setSlideImages([...tempImages]);
          }
        } catch (error) {
          console.error(`Error generating slide ${i + 1}:`, error);
          setError(`Error generating slide ${i + 1}. Please try again.`);
          if (mounted) {
            setLoadingText(
              `Error generating slide ${i + 1}. Please try again.`
            );
          }
        }
      }

      if (mounted) {
        setLoadingText("Presentation ready!");
        setLoading(false);
      }
    };

    generateSlideImages();

    return () => {
      mounted = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleNavigation = useCallback(
    (direction: "prev" | "next") => {
      setCurrentSlideIndex((prev) => {
        if (direction === "prev") {
          return Math.max(prev - 1, 0);
        }
        return Math.min(prev + 1, slides.length - 1);
      });
    },
    [slides.length]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        handleNavigation("next");
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        handleNavigation("prev");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleNavigation]);

  // Handle click/touch navigation
  const handleInteraction = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;

      const halfWidth = window.innerWidth / 2;
      handleNavigation(clientX < halfWidth ? "prev" : "next");
    },
    [handleNavigation]
  );

  // Add touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      // Minimum swipe distance
      handleNavigation(diff > 0 ? "next" : "prev");
    }
    setTouchStart(null);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white gap-4 z-[9999]">
        <div className="text-red-500">{error}</div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200"
        >
          Exit Presentation
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white gap-4 z-[9999]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <div>{loadingText}</div>
        </div>
        <div className="w-48 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center cursor-none z-[9999]"
      onClick={handleInteraction}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slideImages[currentSlideIndex] && (
        <img
          src={slideImages[currentSlideIndex]}
          alt={`Slide ${currentSlideIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />
      )}
      <div className="fixed bottom-4 right-4 text-white text-sm opacity-50">
        {currentSlideIndex + 1} / {slides.length}
      </div>
      <div className="fixed bottom-4 left-4 text-white text-sm opacity-50">
        Press ← → to navigate • ESC to exit
      </div>
    </div>
  );
};
