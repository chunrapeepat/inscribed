import React, { useRef, useEffect, useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { useDocumentStore } from "../store/document";
import {
  ExcalidrawElement,
  ExcalidrawImageElement,
  FileId,
} from "@excalidraw/excalidraw/types/element/types";
import {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  Gesture,
} from "@excalidraw/excalidraw/types/types";
import { Slide, Writeable } from "../types";
import { useModalStore } from "../store/modal";
import { getExcalidrawFontId } from "../utils/fonts";
import { useLibraryStore } from "../store/library";
import { copy } from "../utils/general";
import { getImageDimensions } from "../utils/excalidraw";

export const Canvas: React.FC = () => {
  const {
    slides,
    currentSlideIndex,
    updateSlide,
    documentSize,
    files,
    setFiles,
    backgroundColor,
  } = useDocumentStore();
  const { openModal } = useModalStore();
  const { libraryItems, setItems } = useLibraryStore();
  const currentSlide = slides[currentSlideIndex];
  const previousElementsRef = useRef<ExcalidrawElement[]>(
    currentSlide.elements
  );
  const previousFilesRef = useRef<BinaryFiles | null>(null);
  const previousSelectionIdsRef = useRef<{ [id: string]: boolean }>({});
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const previousPointerRef = useRef<PointerEvent | null>(null);

  const scrollToFrame = (frame: ExcalidrawElement) => {
    excalidrawAPIRef.current?.scrollToContent(frame, {
      fitToViewport: true,
      viewportZoomFactor: 0.9,
    });
  };

  const handleTextSelectionChange = (ids: string[]) => {
    // check if label already exists
    const addCustomFontsLabel = () => {
      const existingLabel = document.getElementById("open-custom-fonts-modal");
      if (existingLabel) {
        existingLabel.remove();
      }

      // add custom fonts button to the popup
      const elements = excalidrawAPIRef.current
        ?.getSceneElements()
        .filter((e) => ids.includes(e.id));
      const isAllText = elements?.every((e) => e.type === "text");
      if (!isAllText) return;

      const fontFamilyPopup = document.querySelector(
        "div.Stack.Stack_vertical.App-menu_top__left fieldset:nth-child(3) > div"
      );
      if (!fontFamilyPopup) return;

      const label = document.createElement("label");
      label.id = "open-custom-fonts-modal";
      label.title = "Custom Fonts";
      label.innerHTML = `
        <input type="radio" name="custom-fonts">
        <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="20" x2="7" y2="20"></line><line x1="14" y1="20" x2="21" y2="20"></line><line x1="6.9" y1="15" x2="13.8" y2="15"></line><line x1="10.2" y1="6.3" x2="16" y2="20"></line><polyline points="5 20 11 4 13 4 20 20"></polyline></g></svg>
      `;

      fontFamilyPopup.appendChild(label);
      label.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal("custom-fonts-modal");
      });
    };

    addCustomFontsLabel();
  };

  // apply font to selected items after user selects a font
  useEffect(() => {
    const handleFontSelected = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { fontFamily } = customEvent.detail;

      const selectedIds = Object.keys(previousSelectionIdsRef.current);
      const selectedElements: Writeable<ExcalidrawElement>[] = copy(
        excalidrawAPIRef.current?.getSceneElements() as object
      );
      selectedElements?.forEach((e: Writeable<ExcalidrawElement>) => {
        if (e.type === "text" && selectedIds.includes(e.id)) {
          e.fontFamily = getExcalidrawFontId(fontFamily);
        }
      });
      excalidrawAPIRef.current?.updateScene({
        elements: selectedElements,
      });
    };

    window.addEventListener("fontSelected", handleFontSelected);
    return () => {
      window.removeEventListener("fontSelected", handleFontSelected);
    };
  }, []);

  // handle document size change
  useEffect(() => {
    if (!excalidrawAPIRef.current) return;

    const _slides = copy(slides);
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

  // handle background color change
  useEffect(() => {
    if (!excalidrawAPIRef.current) return;

    excalidrawAPIRef.current.updateScene({
      appState: {
        viewBackgroundColor: backgroundColor,
      },
    });
  }, [backgroundColor]);

  // Update the ref and excalidraw elements when currentSlideIndex changes
  useEffect(() => {
    previousElementsRef.current = currentSlide.elements;
    if (excalidrawAPIRef.current) {
      excalidrawAPIRef.current.updateScene({
        elements: currentSlide.elements,
      });
    }
  }, [currentSlideIndex, currentSlide.elements]);

  const onPointerUpdate = (payload: {
    pointer: {
      x: number;
      y: number;
      tool: "pointer" | "laser";
    };
    button: "down" | "up";
    pointersMap: Gesture["pointers"];
  }) => {
    if (payload.button === "down") {
      previousPointerRef.current = { type: "down" } as PointerEvent;
    } else if (
      payload.button === "up" &&
      previousPointerRef.current?.type === "down"
    ) {
      previousPointerRef.current = null;

      updateSlide(
        currentSlideIndex,
        copy(excalidrawAPIRef.current?.getSceneElements() as object)
      );
    }
  };

  const onChange = useCallback(
    (
      elements: readonly ExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles
    ) => {
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

      // handle files change
      if (JSON.stringify(previousFilesRef.current) !== JSON.stringify(files)) {
        setFiles(files);
        previousFilesRef.current = files;

        const latestFileId = Object.keys(files).sort((a, b) => {
          return (files[b]?.created ?? 0) - (files[a]?.created ?? 0);
        })[0];

        if (latestFileId && files[latestFileId]) {
          const fileData = files[latestFileId];
          if (fileData.dataURL) {
            getImageDimensions(fileData.dataURL).then(({ width, height }) => {
              const elements =
                excalidrawAPIRef.current?.getSceneElements() ?? [];
              elements.forEach((element) => {
                if (element.type === "image" && element.fileId === null) {
                  const imageElement =
                    element as Writeable<ExcalidrawImageElement>;
                  imageElement.fileId = latestFileId as FileId;
                  imageElement.width = width;
                  imageElement.height = height;
                }
              });
              excalidrawAPIRef.current?.updateScene({
                elements: elements,
              });
            });
          }
        }
      }

      // handle selection change
      if (
        JSON.stringify(appState.selectedElementIds) !==
        JSON.stringify(previousSelectionIdsRef.current)
      ) {
        handleTextSelectionChange(Object.keys(appState.selectedElementIds));
        previousSelectionIdsRef.current = appState.selectedElementIds;
        // update state when users move the items
        updateSlide(currentSlideIndex, copy(elements));
      }
    },
    [currentSlide.elements, currentSlideIndex]
  );

  return (
    <div
      style={{ left: "17rem" }}
      className="fixed top-24 right-4 bottom-4 bg-white rounded-lg shadow-lg overflow-hidden"
    >
      <Excalidraw
        excalidrawAPI={(api) => {
          excalidrawAPIRef.current = api;
        }}
        onPointerUpdate={onPointerUpdate}
        initialData={{
          files,
          appState: {
            viewBackgroundColor: backgroundColor,
            width: documentSize.width,
            height: documentSize.height,
            isLoading: false,
            errorMessage: null,
            gridSize: null,
          },
          libraryItems: libraryItems,
        }}
        gridModeEnabled={false}
        onLibraryChange={(items) => {
          setItems(items);
        }}
        onPaste={(data) => {
          const newElements = [
            ...slides[currentSlideIndex].elements,
            ...(data as { elements: ExcalidrawElement[] }).elements,
          ];
          excalidrawAPIRef.current?.updateScene({
            elements: newElements,
          });
          updateSlide(currentSlideIndex, newElements);
          return false;
        }}
        onChange={onChange}
      />
    </div>
  );
};
