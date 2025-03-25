import React, { useEffect } from "react";
import { ReadOnlyCanvas } from "../../components/embed/ReadOnlyCanvas";
import { registerExcalidrawFonts } from "../../utils/fonts";
import { ExportData } from "../../types";
import { fetchDataFromGist } from "../../utils/export";

interface PresentationEmbedProps {
  gistUrl: string;
  filename?: string;
}

export const PresentationEmbed: React.FC<PresentationEmbedProps> = ({
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

    const loadFonts = async () => {
      const customFonts = [];
      for (const fontFamily in data.fonts.customFonts) {
        customFonts.push(...data.fonts.customFonts[fontFamily]);
      }
      await registerExcalidrawFonts(customFonts);
      setFontsLoaded(true);
    };

    loadFonts();
  }, [data]);

  const handleNextSlide = () => {
    if (data && currentSlideIndex < data.document.slides.length - 1) {
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
      initialData={data}
      onNextSlide={handleNextSlide}
      onPrevSlide={handlePrevSlide}
      currentSlide={currentSlideIndex}
      totalSlides={data.document.slides.length}
      onJumpToSlide={handleJumpToSlide}
    />
  );
};
