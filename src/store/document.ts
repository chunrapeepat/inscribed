import { create } from "zustand";
import { ExportData, Slide } from "../types";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { BinaryFiles } from "@excalidraw/excalidraw/types/types";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";

interface DocumentSize {
  width: number;
  height: number;
}
interface DocumentState {
  _initialized: boolean;
  _isSidebarCollapsed: boolean;
  backgroundColor: string;
  files: BinaryFiles;
  slides: Slide[];
  currentSlideIndex: number;
  documentSize: DocumentSize;
  setInitialized: () => void;
  addSlide: () => void;
  addSlideAfterIndex: (index: number) => void;
  updateSlide: (index: number, elements: ExcalidrawElement[]) => void;
  setCurrentSlide: (index: number) => void;
  deleteSlide: (index: number) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  setDocumentSize: (size: DocumentSize) => void;
  setFiles: (files: BinaryFiles) => void;
  setBackgroundColor: (color: string) => void;
  resetStore: (data: ExportData["document"]) => void;
  toggleSidebar: () => void;
  getSidebarCollapsed: () => boolean;
}

export const DEFAULT_FRAME_WIDTH = 1080;
export const DEFAULT_FRAME_HEIGHT = 1080;
const DEFAULT_BACKGROUND_COLOR = "#ffffff";

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
    version: 1,
    versionNonce: 1663891759,
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: true,
  };
};

const generateFrameId = () => {
  return Date.now().toString();
};

// Custom storage object
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await idbGet(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await idbDel(name);
  },
};

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      _initialized: false,
      _isSidebarCollapsed: false,
      backgroundColor: DEFAULT_BACKGROUND_COLOR,
      slides: [
        {
          id: generateFrameId(),
          elements: [createDefaultFrame()],
        },
      ],
      files: {},
      currentSlideIndex: 0,
      documentSize: {
        width: DEFAULT_FRAME_WIDTH,
        height: DEFAULT_FRAME_HEIGHT,
      },
      setInitialized: () => set({ _initialized: true }),
      addSlide: () =>
        set((state) => ({
          slides: [
            ...state.slides,
            {
              id: generateFrameId(),
              elements: [createDefaultFrame(state.documentSize)],
            },
          ],
          currentSlideIndex: state.slides.length,
        })),
      addSlideAfterIndex: (index: number) =>
        set((state) => ({
          slides: [
            ...state.slides.slice(0, index + 1),
            {
              id: generateFrameId(),
              elements: [createDefaultFrame(state.documentSize)],
            },
            ...state.slides.slice(index + 1),
          ],
          currentSlideIndex: index + 1,
        })),
      updateSlide: (index, elements) =>
        set((state) => {
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
              state.currentSlideIndex -
                (index <= state.currentSlideIndex ? 1 : 0)
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
      setBackgroundColor: (color) => set({ backgroundColor: color }),
      resetStore: (data) =>
        set({
          backgroundColor: data.backgroundColor,
          slides: data.slides,
          files: data.files,
          documentSize: data.documentSize,
          currentSlideIndex: 0,
        }),
      toggleSidebar: () =>
        set((state) => ({ _isSidebarCollapsed: !state._isSidebarCollapsed })),
      getSidebarCollapsed: () => get()._isSidebarCollapsed,
    }),
    {
      name: "document-store",
      storage: createJSONStorage(() => storage, {}),
      onRehydrateStorage: (state) => () => state.setInitialized(),
    }
  )
);
