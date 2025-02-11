import React, { useEffect, useRef } from "react";
import { exportToSvg } from "@excalidraw/excalidraw";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { useDocumentStore } from "../store/document";

interface SlidePreviewProps {
  elements: ExcalidrawElement[];
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({ elements }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { backgroundColor, files } = useDocumentStore();

  useEffect(() => {
    const generatePreview = async () => {
      if (!previewRef.current) return;

      // disable frame from preview
      const _elements = JSON.parse(JSON.stringify(elements));
      const frameElements = _elements.find(
        (element: ExcalidrawElement) => element.id === "frame"
      );
      if (frameElements) {
        frameElements.strokeColor = "transparent";
      }

      try {
        const svg = await exportToSvg({
          elements: _elements,
          appState: {
            viewBackgroundColor: backgroundColor,
            exportWithDarkMode: false,
          },
          files: files,
        });

        // Clear previous content
        previewRef.current.innerHTML = "";

        // Scale and append the SVG
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.backgroundColor = "#fafafa";
        previewRef.current.appendChild(svg);
      } catch (error) {
        console.error("Failed to generate preview:", error);
      }
    };

    generatePreview();
  }, [elements, backgroundColor]);

  return (
    <div
      ref={previewRef}
      className="w-full h-28 bg-white rounded border border-gray-200 overflow-hidden"
    />
  );
};
