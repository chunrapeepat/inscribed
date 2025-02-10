import React, { useRef, useEffect } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { useStore } from "../store/document";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import {
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types/types";
import { Slide, Writeable } from "../types";
import { useModalStore } from "../store/modal";

export const Canvas: React.FC = () => {
  const {
    slides,
    currentSlideIndex,
    updateSlide,
    documentSize,
    files,
    setFiles,
    backgroundColor,
  } = useStore();
  const { openModal } = useModalStore();
  const currentSlide = slides[currentSlideIndex];
  const previousElementsRef = useRef<ExcalidrawElement[]>(
    currentSlide.elements
  );
  const previousFilesRef = useRef<BinaryFiles | null>(null);
  const previousSelectionIdsRef = useRef<{ [id: string]: boolean }>({});
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);

  const scrollToFrame = (frame: ExcalidrawElement) => {
    excalidrawAPIRef.current?.scrollToContent(frame, {
      fitToViewport: true,
      viewportZoomFactor: 0.9,
    });
  };

  const handleTextSelectionChange = (ids: string[]) => {
    // add custom fonts to the popup
    const fontFamilyPopup = document.querySelector(
      "div.Stack.Stack_vertical.App-menu_top__left fieldset:nth-child(3) > div"
    );
    if (!fontFamilyPopup) return;

    const codeLabel = document.createElement("label");
    codeLabel.title = "Custom Fonts";
    codeLabel.innerHTML = `
        <input type="radio" name="custom-fonts">
        <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="20" x2="7" y2="20"></line><line x1="14" y1="20" x2="21" y2="20"></line><line x1="6.9" y1="15" x2="13.8" y2="15"></line><line x1="10.2" y1="6.3" x2="16" y2="20"></line><polyline points="5 20 11 4 13 4 20 20"></polyline></g></svg>
      `;

    codeLabel.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal("fonts-manager");
    });

    fontFamilyPopup.appendChild(codeLabel);
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
      }
    });
  }, [documentSize, currentSlideIndex]);

  useEffect(() => {
    // handle background color change
    if (!excalidrawAPIRef.current) return;

    excalidrawAPIRef.current.updateScene({
      appState: {
        viewBackgroundColor: backgroundColor,
      },
    });
  }, [backgroundColor]);

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
    <div
      style={{ left: "17rem" }}
      className="fixed top-24 right-4 bottom-4 bg-white rounded-lg shadow-lg overflow-hidden"
    >
      <Excalidraw
        excalidrawAPI={(api) => {
          excalidrawAPIRef.current = api;
        }}
        initialData={{
          appState: {
            viewBackgroundColor: backgroundColor,
            width: documentSize.width,
            height: documentSize.height,
          },
          files,
        }}
        onChange={(elements, appState, files) => {
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

          // handle selection change
          if (
            JSON.stringify(appState.selectedElementIds) !==
            JSON.stringify(previousSelectionIdsRef.current)
          ) {
            handleTextSelectionChange(Object.keys(appState.selectedElementIds));
            previousSelectionIdsRef.current = appState.selectedElementIds;
          }
        }}
      />
    </div>
  );
};
