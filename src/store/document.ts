import { create } from "zustand";
import { Slide } from "../types";
import {
  ExcalidrawElement,
  FileId,
} from "@excalidraw/excalidraw/types/element/types";
import { BinaryFiles } from "@excalidraw/excalidraw/types/types";

interface DocumentSize {
  width: number;
  height: number;
}

interface PresentationState {
  files: BinaryFiles;
  slides: Slide[];
  currentSlideIndex: number;
  documentSize: DocumentSize;
  addSlide: () => void;
  updateSlide: (index: number, elements: ExcalidrawElement[]) => void;
  setCurrentSlide: (index: number) => void;
  deleteSlide: (index: number) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  setDocumentSize: (size: DocumentSize) => void;
  setFiles: (files: BinaryFiles) => void;
}

const DEFAULT_FRAME_WIDTH = 1080;
const DEFAULT_FRAME_HEIGHT = 1080;

const createDefaultFrame = (
  { width, height }: DocumentSize = {
    width: DEFAULT_FRAME_WIDTH,
    height: DEFAULT_FRAME_HEIGHT,
  }
): ExcalidrawElement => {
  return {
    id: "frame",
    type: "rectangle",
    x: 0,
    y: 0,
    width,
    height,
    angle: 0,
    strokeColor: "#228be6",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "dashed",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: 500058849,
    version: 80,
    versionNonce: 1663891759,
    isDeleted: false,
    boundElements: null,
    updated: 1739002348526,
    link: null,
    locked: true,
  };
};

const loadInitialData = () => {
  const slides = [
    {
      id: "1",
      elements: [createDefaultFrame()],
      name: "Slide 1",
    },
  ];
  const files: BinaryFiles = {};

  // prune unused files
  const usedFileIds = slides
    .map((slide) => slide.elements)
    .flat()
    .filter((e) => e.type === "image")
    .map((e) => e.fileId);

  const unusedFileIds = Object.keys(files).filter(
    (fileId) => !usedFileIds.includes(fileId as FileId)
  );
  unusedFileIds.forEach((fileId) => {
    delete files[fileId as FileId];
  });

  return {
    slides,
    files,
  };
};

const { slides, files } = loadInitialData();

export const useStore = create<PresentationState>((set) => ({
  slides,
  files,
  currentSlideIndex: 0,
  documentSize: {
    width: DEFAULT_FRAME_WIDTH,
    height: DEFAULT_FRAME_HEIGHT,
  },
  addSlide: () =>
    set((state) => ({
      slides: [
        ...state.slides,
        {
          id: Date.now().toString(),
          elements: [createDefaultFrame(state.documentSize)],
          name: `Slide ${state.slides.length + 1}`,
        },
      ],
      currentSlideIndex: state.slides.length,
    })),
  updateSlide: (index, elements) =>
    set((state) => {
      const currentElements = state.slides[index]?.elements;
      if (JSON.stringify(currentElements) === JSON.stringify(elements)) {
        return state;
      }

      return {
        slides: state.slides.map((slide, i) =>
          i === index ? { ...slide, elements } : slide
        ),
      };
    }),
  setCurrentSlide: (index) => set({ currentSlideIndex: index }),
  deleteSlide: (index) =>
    set((state) => {
      if (state.slides.length <= 1) {
        return state;
      }
      return {
        slides: state.slides.filter((_, i) => i !== index),
        currentSlideIndex: Math.max(
          0,
          state.currentSlideIndex - (index <= state.currentSlideIndex ? 1 : 0)
        ),
      };
    }),
  reorderSlides: (fromIndex, toIndex) =>
    set((state) => {
      const newSlides = [...state.slides];
      const [movedSlide] = newSlides.splice(fromIndex, 1);
      newSlides.splice(toIndex, 0, movedSlide);

      return {
        slides: newSlides,
        currentSlideIndex:
          state.currentSlideIndex === fromIndex
            ? toIndex
            : state.currentSlideIndex,
      };
    }),
  setDocumentSize: (size) => set({ documentSize: size }),
  setFiles: (files) => set({ files }),
}));
