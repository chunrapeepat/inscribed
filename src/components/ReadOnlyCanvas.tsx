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

interface ReadOnlyCanvasProps {
  elements: ExcalidrawElement[];
  files: BinaryFiles;
  backgroundColor: string;
  documentSize: {
    width: number;
    height: number;
  };
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  currentSlide: number;
  totalSlides: number;
  onJumpToSlide?: (slide: number) => void;
}

export const ReadOnlyCanvas: React.FC<ReadOnlyCanvasProps> = ({
  elements,
  files,
  backgroundColor,
  documentSize,
  onNextSlide,
  onPrevSlide,
  currentSlide,
  totalSlides,
  onJumpToSlide,
}) => {
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [inputValue, setInputValue] = useState((currentSlide + 1).toString());

  // Function to center content
  const centerContent = useCallback(() => {
    if (!excalidrawAPIRef.current || elements.length === 0) return;

    const frame = elements.find((element) => element.id === "frame");
    if (frame) {
      excalidrawAPIRef.current?.scrollToContent(frame, {
        fitToViewport: true,
        viewportZoomFactor: 1,
      });
    }
  }, [elements]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      centerContent();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [elements, centerContent]);

  // Initial setup and elements change handler
  useEffect(() => {
    setTimeout(() => {
      if (!excalidrawAPIRef.current || elements.length === 0) return;

      // Find the frame element
      const frame = elements.find((element) => element.id === "frame");
      if (frame) {
        // Update frame stroke color through the API
        excalidrawAPIRef.current?.updateScene({
          elements: elements.map((el: ExcalidrawElement) =>
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

        centerContent();
      }
    }, 50);
  }, [elements]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        onNextSlide?.();
      } else if (e.key === "ArrowLeft") {
        onPrevSlide?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNextSlide, onPrevSlide]);

  // Update input value when currentSlide changes
  useEffect(() => {
    setInputValue((currentSlide + 1).toString());
  }, [currentSlide]);

  return (
    <div className="fixed inset-0 bg-white">
      {/* Hide zoom controls */}
      <style>
        {`
          .Stack.Stack_vertical.zoom-actions {
            display: none !important;
          }
        `}
      </style>

      {/* Interaction blocker overlay */}
      <div className="fixed inset-0 z-10" />

      <Excalidraw
        excalidrawAPI={(api) => {
          excalidrawAPIRef.current = api;
        }}
        initialData={{
          elements,
          files,
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

      {/* Navigation bar */}
      <div
        className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-4 
                      bg-gray-100 border border-gray-200 backdrop-blur z-20"
      >
        <button
          onClick={onPrevSlide}
          className="p-2 rounded-lg hover:bg-white/80 disabled:opacity-50 transition-colors"
          disabled={currentSlide === 0}
        >
          ←
        </button>

        <div className="flex items-center gap-2 px-2 border-l border-r border-gray-200">
          <input
            type="number"
            min={1}
            max={totalSlides}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const page = parseInt(inputValue) - 1;
                if (!isNaN(page) && page >= 0 && page < totalSlides) {
                  onJumpToSlide?.(page);
                } else {
                  // Reset to current slide if invalid
                  setInputValue((currentSlide + 1).toString());
                }
              }
            }}
            onBlur={() => {
              // Reset to current slide on blur
              setInputValue((currentSlide + 1).toString());
            }}
            className="w-16 px-2 py-1 text-center border rounded bg-white"
          />
          <span className="text-sm text-gray-600">/ {totalSlides}</span>
        </div>

        <button
          onClick={onNextSlide}
          className="p-2 rounded-lg hover:bg-white/80 disabled:opacity-50 transition-colors"
          disabled={currentSlide === totalSlides - 1}
        >
          →
        </button>

        <div className="absolute right-4">
          <a
            href="https://inscribed.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Made by inscribed.app
          </a>
        </div>
      </div>
    </div>
  );
};
