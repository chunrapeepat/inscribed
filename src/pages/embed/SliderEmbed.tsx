import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ReadOnlyCanvas } from "../../components/ReadOnlyCanvas";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { BinaryFiles } from "@excalidraw/excalidraw/types/types";
import { FONT_FAMILY } from "@excalidraw/excalidraw";
import { getExcalidrawFontId } from "../../utils/fonts";
import { SliderNavigation } from "../../components/SliderNavigation";

interface DocumentData {
  slides: Array<{
    elements: ExcalidrawElement[];
  }>;
  files: BinaryFiles;
  backgroundColor: string;
  documentSize: {
    width: number;
    height: number;
  };
  customFonts?: {
    [fontFamily: string]: Array<{
      fontFamily: string;
      src: string;
      fontStyle: string;
      fontWeight: string | number;
      unicodeRange?: string;
    }>;
  };
}

interface SliderEmbedProps {
  gistUrl: string;
}

const theme = createTheme({
  // Optional: customize theme if needed
});

export const SliderEmbed: React.FC<SliderEmbedProps> = ({ gistUrl }) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<DocumentData | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  React.useEffect(() => {
    const loadTemplate = async () => {
      try {
        const rawUrl = gistUrl.replace(
          "gist.github.com",
          "gist.githubusercontent.com"
        );

        const response = await fetch(`${rawUrl}/raw`, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const gistData = await response.json();
        setData(gistData.document);
        setLoading(false);
      } catch (error: unknown) {
        console.error("Failed to load template:", error);
        setError("Failed to load template");
        setLoading(false);
      }
    };

    loadTemplate();
  }, [gistUrl]);

  // Register fonts when data is loaded
  React.useEffect(() => {
    if (!data?.customFonts) {
      setFontsLoaded(true);
      return;
    }

    const loadFonts = async () => {
      try {
        const fontLoadPromises = Object.entries(data!.customFonts!).map(
          ([fontFamily, fontFaces]) =>
            Promise.all(
              fontFaces.map(async (fontFace) => {
                const ff = new FontFace(fontFamily, fontFace.src, {
                  style: fontFace.fontStyle,
                  weight: fontFace.fontWeight.toString(),
                  unicodeRange: fontFace.unicodeRange,
                });

                await ff.load();
                document.fonts.add(ff);

                // Register with Excalidraw
                (FONT_FAMILY as { [k: string]: number })[fontFamily] =
                  getExcalidrawFontId(fontFamily);
              })
            )
        );

        await Promise.all(fontLoadPromises);
        setFontsLoaded(true);
      } catch (err) {
        console.error("Failed to load fonts:", err);
        setFontsLoaded(true);
      }
    };

    loadFonts();
  }, [data?.customFonts]);

  const handleJumpToSlide = (index: number) => {
    setCurrentSlideIndex(index);
  };

  if (loading || !fontsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading template...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        No data available
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="relative h-screen">
        <ReadOnlyCanvas
          elements={data.slides[currentSlideIndex].elements}
          files={data.files}
          backgroundColor={data.backgroundColor}
          documentSize={data.documentSize}
          currentSlide={currentSlideIndex}
          totalSlides={data.slides.length}
          onJumpToSlide={handleJumpToSlide}
        />
        <SliderNavigation
          currentSlide={currentSlideIndex}
          totalSlides={data.slides.length}
          onSlideChange={handleJumpToSlide}
        />
      </div>
    </ThemeProvider>
  );
};
