export type FontFace = {
  subset: string;
  fontFamily: string;
  fontStyle: string;
  fontWeight: number;
  fontDisplay: string;
  src: string;
  unicodeRange: string;
};

export const parseFontFaces = (content: string): FontFace[] => {
  const fontFaces: Array<FontFace> = [];

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
