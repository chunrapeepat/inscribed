import React, { useState, useEffect, useCallback } from "react";
import { useDocumentStore } from "../store/document";
import { exportToImageUrls } from "../utils/export";

interface PresentationModeProps {
  onClose: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  onClose,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideImages, setSlideImages] = useState<string[]>([]);
  const { slides, backgroundColor, documentSize, files } = useDocumentStore();

  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState(
    "Initializing presentation..."
  );
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // generate slide images
  useEffect(() => {
    setLoadingText("Generating presentation slides...");

    const generateSlideImages = async () => {
      const tempImages = await exportToImageUrls({
        slides,
        backgroundColor,
        documentSize,
        files,
      });

      setSlideImages(tempImages);
      setLoadingText("Presentation ready!");
      setLoading(false);
    };

    generateSlideImages();
  }, []);

  // handle keyboard navigation
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
  }, [handleNavigation]);

  // handle click/touch navigation
  const handleInteraction = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;

      const halfWidth = window.innerWidth / 2;
      handleNavigation(clientX < halfWidth ? "prev" : "next");
    },
    [handleNavigation]
  );

  // add touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      // minimum swipe distance
      handleNavigation(diff > 0 ? "next" : "prev");
    }
    setTouchStart(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white gap-4 z-[999999]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <div>{loadingText}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center cursor-none z-[999999]"
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
