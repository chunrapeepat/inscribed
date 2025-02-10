import React, { useEffect, useRef, useCallback } from "react";
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
}

export const ReadOnlyCanvas: React.FC<ReadOnlyCanvasProps> = ({
  elements,
  files,
  backgroundColor,
  documentSize,
  onNextSlide,
  onPrevSlide,
}) => {
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);

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
      <div className="fixed inset-0 z-50" />

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
    </div>
  );
};
