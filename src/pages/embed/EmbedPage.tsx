import React from "react";
import { ReadOnlyCanvas } from "../../components/ReadOnlyCanvas";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { BinaryFiles } from "@excalidraw/excalidraw/types/types";

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
}

interface EmbedPageProps {
  gistUrl: string;
}

export const EmbedPage: React.FC<EmbedPageProps> = ({ gistUrl }) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<DocumentData | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);

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

  if (loading) {
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
    />
  );
};
