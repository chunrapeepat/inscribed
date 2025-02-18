import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LibraryItems } from "@excalidraw/excalidraw/types/types";

import algorithmDefaultLibrary from "./default-library/algorithms-and-data-structures-arrays-matrices-trees.json";

// handle excalidraw library items
interface LibraryState {
  libraryItems: LibraryItems;
  setItems: (items: LibraryItems) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      libraryItems:
        algorithmDefaultLibrary.libraryItems as unknown as LibraryItems,
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
