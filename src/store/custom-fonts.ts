import { create } from "zustand";
import { FontFace } from "../utils/fonts";
import { persist, createJSONStorage } from "zustand/middleware";

interface CustomFontsState {
  customFonts: {
    [fontFamily: string]: FontFace[];
  };
  addFonts: (fontFaces: FontFace[]) => void;
  removeFont: (fontFamily: string) => void;
}

export const useFontsStore = create<CustomFontsState>()(
  persist(
    (set, get) => ({
      customFonts: {},
      addFonts: (fontFaces: FontFace[]) =>
        set((state) => {
          const newState = { ...state.customFonts };
          fontFaces.forEach((fontFace) => {
            newState[fontFace.fontFamily] = [
              ...(newState[fontFace.fontFamily] || []),
              fontFace,
            ];
          });
          return { customFonts: newState };
        }),
      removeFont: (fontFamily) =>
        set((state) => {
          const newState = { ...state.customFonts };
          delete newState[fontFamily];
          return { customFonts: newState };
        }),
    }),
    {
      name: "custom-fonts-store",
      storage: createJSONStorage(() => localStorage, {}),
    }
  )
);
