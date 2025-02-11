import { FONT_FAMILY } from "@excalidraw/excalidraw";
import { CustomFontFace } from "../types";

export const getExcalidrawFontId = (fontFamily: string): number => {
  let hash = 0;
  for (let i = 0; i < fontFamily.length; i++) {
    const char = fontFamily.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export const registerExcalidrawFonts = (fontFaces: CustomFontFace[]) => {
  // register fonts to browser
  fontFaces.forEach((fontFace) => {
    const ff = new FontFace(fontFace.fontFamily, fontFace.src, {
      style: fontFace.fontStyle,
      weight: fontFace.fontWeight.toString(),
      unicodeRange: fontFace.unicodeRange,
    });
    if (document.fonts.has(ff)) {
      return;
    }
    document.fonts.add(ff);
  });

  // register fonts to Excalidraw
  const fontFamilies = [
    ...new Set(fontFaces.map((fontFace) => fontFace.fontFamily)),
  ];
  fontFamilies.forEach((fontFamily) => {
    (FONT_FAMILY as { [k: string]: number })[fontFamily] =
      getExcalidrawFontId(fontFamily);
  });
};

export const parseFontFaces = (content: string): CustomFontFace[] => {
  const fontFaces: Array<CustomFontFace> = [];

  // Match each @font-face block including its comment
  const fontFaceRegex = /\/\*\s*([^*]*)\s*\*\/\s*@font-face\s*{([^}]*)}/g;
  let match;

  while ((match = fontFaceRegex.exec(content)) !== null) {
    const subset = match[1].trim();
    const properties = match[2].trim();

    // Parse individual properties
    const fontFamily = properties.match(/font-family:\s*'([^']+)'/)?.[1] || "";
    const fontStyle = properties.match(/font-style:\s*([^;]+)/)?.[1] || "";
    const fontWeight = parseInt(
      properties.match(/font-weight:\s*([^;]+)/)?.[1] || "0"
    );
    const fontDisplay = properties.match(/font-display:\s*([^;]+)/)?.[1] || "";
    const src = properties.match(/src:\s*([^;]+)/)?.[1] || "";
    const unicodeRange =
      properties.match(/unicode-range:\s*([^;]+)/)?.[1] || "";

    fontFaces.push({
      subset,
      fontFamily,
      fontStyle,
      fontWeight,
      fontDisplay,
      src,
      unicodeRange,
    });
  }

  return fontFaces;
};
