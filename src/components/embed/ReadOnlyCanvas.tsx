import React, { useEffect, useRef, useCallback, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import {
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types/types";
import {
  AppState,
  NormalizedZoomValue,
} from "@excalidraw/excalidraw/types/types";
import { DefaultNavigation } from "./DefaultNavigation";
import { SliderNavigation } from "./SliderNavigation";

type ExportData = {
  name: string;
  document: {
    backgroundColor: string;
    slides: {
      id: string;
      elements: ExcalidrawElement[];
    }[];
    files: BinaryFiles;
    documentSize: { width: number; height: number };
  };
  fonts: {
    customFonts: {
      [fontFamily: string]: {
        subset: string;
        fontFamily: string;
        fontStyle: string;
        fontWeight: number;
        fontDisplay: string;
        src: string;
        unicodeRange: string;
      }[];
    };
  };
};

interface ReadOnlyCanvasProps {
  initialData: ExportData;
  navigationType?: "default" | "slider";
}
export const ReadOnlyCanvas: React.FC<ReadOnlyCanvasProps> = ({
  initialData,
  navigationType = "default",
}) => {
  const {
    document: { slides, files, backgroundColor, documentSize },
  } = initialData;
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const totalSlides = slides.length;

  // Function to center content
  const centerContent = useCallback(() => {
    if (!excalidrawAPIRef.current || slides.length === 0) return;

    const frame = slides[currentSlideIndex].elements.find(
      (element) => element.id === "frame"
    );
    if (frame) {
      excalidrawAPIRef.current?.scrollToContent(frame, {
        fitToViewport: true,
        viewportZoomFactor: 1,
      });
    }
  }, [slides, currentSlideIndex]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      centerContent();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [slides, currentSlideIndex]);

  useEffect(() => {
    // wait for the canvas to load; refactor this later
    setTimeout(
      () => {
        if (!excalidrawAPIRef.current || slides.length === 0) return;
        const frame = slides[currentSlideIndex].elements.find(
          (element) => element.id === "frame"
        );
        if (frame) {
          excalidrawAPIRef.current?.updateScene({
            elements: slides[currentSlideIndex].elements.map(
              (el: ExcalidrawElement) =>
                el.id === "frame"
                  ? {
                      ...el,
                      strokeStyle: "solid",
                      strokeWidth: 1,
                      strokeColor: "transparent",
                    }
                  : el
            ),
          });

          setIsLoaded(true);
          centerContent();
        }
      },
      isLoaded ? 0 : 300
    );
  }, [slides, currentSlideIndex, isLoaded]);

  // handle keyboard events
  useEffect(() => {
    let isKeyPressed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isKeyPressed) return; // Prevent multiple triggers while key is held
      isKeyPressed = true;

      if (e.key === "ArrowRight") {
        setCurrentSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
      }
    };
    const handleKeyUp = () => {
      isKeyPressed = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      <style>
        {`
          .Stack.Stack_vertical.zoom-actions {
            display: none !important;
          }
          .App-bottom-bar {
            display: none !important;
          }
        `}
      </style>
      {/* Credit link in top right */}
      <div className="absolute top-2 right-2 z-20">
        <a
          href="https://inscribed.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Made with inscribed.app
        </a>
      </div>
      {/* Main content wrapper with padding-bottom for nav bar */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 z-10" />
        <Excalidraw
          excalidrawAPI={(api) => {
            excalidrawAPIRef.current = api;
          }}
          initialData={{
            files,
            elements: slides[currentSlideIndex].elements.map(
              (el: ExcalidrawElement) => ({
                ...el,
                strokeStyle: "solid",
                strokeWidth: 1,
                strokeColor: "transparent",
              })
            ),
            appState: {
              viewBackgroundColor: backgroundColor,
              width: documentSize.width,
              height: documentSize.height,
              isLoading: false,
              errorMessage: null,
              viewModeEnabled: true,
              zenModeEnabled: true,
              gridSize: null,
              showHelpDialog: false,
              disableScrollForElements: true,
              scrollX: 0,
              scrollY: 0,
              zoom: { value: 1 as NormalizedZoomValue },
            } as Partial<AppState>,
          }}
          viewModeEnabled
          zenModeEnabled
          gridModeEnabled={false}
          UIOptions={{
            canvasActions: {
              toggleTheme: false,
              export: false,
              saveAsImage: false,
              saveToActiveFile: false,
              loadScene: false,
              clearCanvas: false,
              changeViewBackgroundColor: false,
            },
          }}
        />
      </div>

      {/* Navigation */}
      {navigationType === "default" ? (
        <DefaultNavigation
          currentSlide={currentSlideIndex}
          totalSlides={totalSlides}
          onNextSlide={() =>
            setCurrentSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1))
          }
          onPrevSlide={() =>
            setCurrentSlideIndex((prev) => Math.max(prev - 1, 0))
          }
          onJumpToSlide={(value) => setCurrentSlideIndex(value)}
        />
      ) : (
        <SliderNavigation
          currentSlide={currentSlideIndex}
          totalSlides={totalSlides}
          onSlideChange={(value) => setCurrentSlideIndex(value)}
        />
      )}
    </div>
  );
};
