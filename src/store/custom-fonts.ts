import { create } from "zustand";
import { FontFace } from "../utils/fonts";

interface CustomFontsState {
  customFonts: {
    [fontFamily: string]: FontFace[];
  };
  addFonts: (fontFaces: FontFace[]) => void;
  removeFont: (fontFamily: string) => void;
}

export const useFontsStore = create<CustomFontsState>((set, get) => ({
  customFonts: {},
  addFonts: (fontFaces: FontFace[]) =>
    set((state) => {
      fontFaces.forEach((fontFace) => {
        state.customFonts[fontFace.fontFamily] = [
          ...(state.customFonts[fontFace.fontFamily] || []),
          fontFace,
        ];
      });
      return state;
    }),
  removeFont: (fontFamily) =>
    set((state) => {
      const { [fontFamily]: _, ...rest } = state.customFonts;
      return { customFonts: rest };
    }),
}));
