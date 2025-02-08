import { create } from "zustand";
import { Slide } from "./types";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

interface DocumentSize {
  width: number;
  height: number;
}

interface PresentationState {
  slides: Slide[];
  currentSlideIndex: number;
  documentSize: DocumentSize;
  addSlide: () => void;
  updateSlide: (index: number, elements: ExcalidrawElement[]) => void;
  setCurrentSlide: (index: number) => void;
  deleteSlide: (index: number) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  setDocumentSize: (size: DocumentSize) => void;
}

const createDefaultFrame = ({
  width,
  height,
}: DocumentSize): ExcalidrawElement => {
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

export const useStore = create<PresentationState>((set) => ({
  slides: [
    {
      id: "1",
      elements: [createDefaultFrame({ width: 1920, height: 1080 })],
      name: "Slide 1",
    },
  ],
  currentSlideIndex: 0,
  documentSize: {
    width: 1920,
    height: 1080,
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
}));
