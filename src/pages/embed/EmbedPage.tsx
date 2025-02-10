import React from "react";
import { ReadOnlyCanvas } from "../../components/ReadOnlyCanvas";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { BinaryFiles } from "@excalidraw/excalidraw/types/types";
import { FONT_FAMILY } from "@excalidraw/excalidraw";
import { getExcalidrawFontId } from "../../utils/fonts";

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
  fonts: {
    customFonts?: {
      [fontFamily: string]: Array<{
        fontFamily: string;
        src: string;
        fontStyle: string;
        fontWeight: string | number;
        unicodeRange?: string;
      }>;
    };
  };
}

interface EmbedPageProps {
  gistUrl: string;
}

export const EmbedPage: React.FC<EmbedPageProps> = ({ gistUrl }) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<DocumentData | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  React.useEffect(() => {
    const loadTemplate = async () => {
      try {
        // Convert GitHub Gist URL to raw content URL
        // From: https://gist.github.com/username/gistid
        // To: https://gist.githubusercontent.com/username/gistid/raw
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
        setData({ ...gistData.document, fonts: gistData.fonts });
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
    if (!data?.fonts?.customFonts) {
      setFontsLoaded(true);
      return;
    }

    const loadFonts = async () => {
      try {
        const fontLoadPromises = Object.entries(
          data.fonts.customFonts || {}
        ).map(([fontFamily, fontFaces]) =>
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
        // Continue without custom fonts
        setFontsLoaded(true);
      }
    };

    loadFonts();
  }, [data]);

  const handleNextSlide = () => {
    if (data && currentSlideIndex < data.slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    if (data && currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

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
    <ReadOnlyCanvas
      elements={data.slides[currentSlideIndex].elements}
      files={data.files}
      backgroundColor={data.backgroundColor}
      documentSize={data.documentSize}
      onNextSlide={handleNextSlide}
      onPrevSlide={handlePrevSlide}
      currentSlide={currentSlideIndex}
      totalSlides={data.slides.length}
      onJumpToSlide={handleJumpToSlide}
    />
  );
};
