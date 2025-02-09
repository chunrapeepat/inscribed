import React, { useRef, useEffect } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { useStore } from "../store";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";

export const Canvas: React.FC = () => {
  const { slides, currentSlideIndex, updateSlide, documentSize } = useStore();
  const currentSlide = slides[currentSlideIndex];
  const previousElementsRef = useRef<ExcalidrawElement[]>(
    currentSlide.elements
  );
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);

  const scrollToContent = () => {
    excalidrawAPIRef.current?.scrollToContent(undefined, {
      fitToViewport: true,
      viewportZoomFactor: 0.9,
    });
  };

  useEffect(() => {
    // Update the ref and excalidraw elements when currentSlideIndex changes
    previousElementsRef.current = currentSlide.elements;
    if (excalidrawAPIRef.current) {
      excalidrawAPIRef.current.updateScene({
        elements: currentSlide.elements,
      });
    }
  }, [currentSlideIndex, currentSlide.elements]);

  return (
    <div className="fixed left-72 top-20 right-4 bottom-4 bg-white rounded-lg shadow-lg overflow-hidden">
      <Excalidraw
        excalidrawAPI={(api) => {
          excalidrawAPIRef.current = api;
        }}
        initialData={{
          appState: {
            viewBackgroundColor: "#ffffff",
            width: documentSize.width,
            height: documentSize.height,
          },
        }}
        onChange={(elements) => {
          if (elements.length === 0) {
            excalidrawAPIRef.current?.updateScene({
              elements: currentSlide.elements,
            });
            scrollToContent();
            return;
          }

          const newElements = elements as ExcalidrawElement[];
          if (
            JSON.stringify(previousElementsRef.current) !==
            JSON.stringify(newElements)
          ) {
            previousElementsRef.current = newElements;
            updateSlide(currentSlideIndex, newElements);
          }
        }}
      />
    </div>
  );
};
