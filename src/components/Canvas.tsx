import React, { useRef, useEffect } from "react";
import { Excalidraw, FONT_FAMILY } from "@excalidraw/excalidraw";
import { useStore } from "../store/document";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import {
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types/types";
import { Slide, Writeable } from "../types";

export const Canvas: React.FC = () => {
  const {
    slides,
    currentSlideIndex,
    updateSlide,
    documentSize,
    files,
    setFiles,
  } = useStore();
  const currentSlide = slides[currentSlideIndex];
  const previousElementsRef = useRef<ExcalidrawElement[]>(
    currentSlide.elements
  );
  const previousFilesRef = useRef<BinaryFiles | null>(null);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);

  const scrollToFrame = (frame: ExcalidrawElement) => {
    excalidrawAPIRef.current?.scrollToContent(frame, {
      fitToViewport: true,
      viewportZoomFactor: 0.9,
    });
  };

  useEffect(() => {
    // handle document size change
    if (!excalidrawAPIRef.current) return;

    const _slides = JSON.parse(JSON.stringify(slides));
    _slides.forEach((_slide: Slide, index: number) => {
      const frame: Writeable<ExcalidrawElement> | undefined =
        _slide.elements.find(
          (element: ExcalidrawElement) => element.id === "frame"
        );
      if (frame) {
        frame.width = documentSize.width;
        frame.height = documentSize.height;
      }

      updateSlide(index, _slide.elements);

      if (index === currentSlideIndex) {
        excalidrawAPIRef.current?.updateScene({
          elements: _slide.elements,
        });
        scrollToFrame(frame as ExcalidrawElement);
      }
    });
  }, [documentSize, currentSlideIndex]);

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
          files,
        }}
        onChange={(elements, _, files) => {
          if (elements.length === 0) {
            excalidrawAPIRef.current?.updateScene({
              elements: currentSlide.elements,
            });
            scrollToFrame(
              currentSlide.elements.find(
                (element) => element.id === "frame"
              ) as ExcalidrawElement
            );
            return;
          }

          // handle element change
          const newElements = elements as ExcalidrawElement[];
          if (
            JSON.stringify(previousElementsRef.current) !==
            JSON.stringify(newElements)
          ) {
            previousElementsRef.current = newElements;
            updateSlide(currentSlideIndex, newElements);
          }

          // handle file change
          if (
            JSON.stringify(previousFilesRef.current) !== JSON.stringify(files)
          ) {
            setFiles(files);
            previousFilesRef.current = files;
          }
        }}
      />
    </div>
  );
};
