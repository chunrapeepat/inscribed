import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

export interface Slide {
  id: string;
  elements: ExcalidrawElement[];
  name: string;
}

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
