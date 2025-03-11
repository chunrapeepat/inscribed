import React, { useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ReadOnlyCanvas } from "../../components/embed/ReadOnlyCanvas";
import { registerExcalidrawFonts } from "../../utils/fonts";
import { SliderNavigation } from "../../components/embed/SliderNavigation";
import { ExportData } from "../../types";
import { fetchDataFromGist } from "../../utils/export";

interface SliderEmbedProps {
  gistUrl: string;
  filename?: string;
}

export const SliderEmbed: React.FC<SliderEmbedProps> = ({
  gistUrl,
  filename,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<ExportData | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const gistData = await fetchDataFromGist(gistUrl);
        if (Array.isArray(gistData)) {
          if (filename) {
            const file = gistData.find((file) => file.filename === filename);
            if (file) {
              setData(file.content);
            }
          } else {
            setData(gistData[0].content);
          }
        } else {
          setData(gistData);
        }
        setLoading(false);
      } catch (e: unknown) {
        console.error("Failed to load template:", e);
        setError("Failed to load template");
        setLoading(false);
      }
    };

    loadData();
  }, [gistUrl]);

  // register fonts when data is loaded
  useEffect(() => {
    if (!data?.fonts?.customFonts) {
      return;
    }

    const customFonts = [];
    for (const fontFamily in data.fonts.customFonts) {
      customFonts.push(...data.fonts.customFonts[fontFamily]);
    }
    registerExcalidrawFonts(customFonts);
    setFontsLoaded(true);
  }, [data]);

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
    <ThemeProvider theme={createTheme()}>
      <div className="relative h-screen">
        <ReadOnlyCanvas
          initialData={data}
          currentSlide={currentSlideIndex}
          totalSlides={data.document.slides.length}
          onJumpToSlide={handleJumpToSlide}
        />
        <SliderNavigation
          currentSlide={currentSlideIndex}
          totalSlides={data.document.slides.length}
          onSlideChange={handleJumpToSlide}
        />
      </div>
    </ThemeProvider>
  );
};
