import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { BinaryFiles } from "@excalidraw/excalidraw/types/types";

export interface Slide {
  id: string;
  elements: ExcalidrawElement[];
}

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export type CustomFontFace = {
  subset: string;
  fontFamily: string;
  fontStyle: string;
  fontWeight: number;
  fontDisplay: string;
  src: string;
  unicodeRange: string;
};

export type ExportData = {
  name: string;
  document: {
    backgroundColor: string;
    slides: Slide[];
    files: BinaryFiles;
    documentSize: { width: number; height: number };
  };
  fonts: {
    customFonts: { [fontFamily: string]: CustomFontFace[] };
  };
};
