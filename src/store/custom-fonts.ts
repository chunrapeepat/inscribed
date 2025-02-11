import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CustomFontFace } from "../types";

interface CustomFontsState {
  customFonts: {
    [fontFamily: string]: CustomFontFace[];
  };
  addFonts: (fontFaces: CustomFontFace[]) => void;
  removeFont: (fontFamily: string) => void;
}

export const useFontsStore = create<CustomFontsState>()(
  persist(
    (set, get) => ({
      customFonts: {},
      addFonts: (fontFaces: CustomFontFace[]) =>
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
