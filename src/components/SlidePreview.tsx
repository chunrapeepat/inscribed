import React, { useEffect, useRef } from "react";
import { exportToSvg } from "@excalidraw/excalidraw";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { useDocumentStore } from "../store/document";
import { copy } from "../utils/general";
import { useFontsStore } from "../store/custom-fonts";

interface SlidePreviewProps {
  elements: ExcalidrawElement[];
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({ elements }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef<boolean>(false);
  const { backgroundColor, files, _isSlideListFocused } = useDocumentStore();
  const fontStore = useFontsStore.getState();

  useEffect(() => {
    const generatePreview = async () => {
      if (!previewRef.current) return;

      // disable frame from preview
      const _elements = copy(elements);
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

        previewRef.current.innerHTML = "";

        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.backgroundColor = "#fafafa";
        previewRef.current.appendChild(svg);
      } catch (error) {
        console.error("Failed to generate preview:", error);
      }
    };

    if (fontStore._initialized) {
      generatePreview();
    }

    if (!_isSlideListFocused || !initializedRef.current) {
      generatePreview();
      initializedRef.current = true;
    }
  }, [_isSlideListFocused, elements, backgroundColor, fontStore._initialized]);

  return (
    <div
      ref={previewRef}
      className="w-full h-28 bg-white rounded border border-gray-200 overflow-hidden"
    />
  );
};
