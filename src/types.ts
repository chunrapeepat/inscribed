import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

export interface Slide {
  id: string;
  elements: ExcalidrawElement[];
}

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
