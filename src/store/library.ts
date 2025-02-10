import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LibraryItems } from "@excalidraw/excalidraw/types/types";

interface LibraryState {
  libraryItems: LibraryItems;
  setItems: (items: LibraryItems) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      libraryItems: [],
      setItems: (items: LibraryItems) =>
        set({
          libraryItems: items,
        }),
    }),
    {
      name: "excalidraw-library-store",
      storage: createJSONStorage(() => localStorage, {}),
    }
  )
);
