import GIF from "gif.js";
import { exportToBlob } from "@excalidraw/excalidraw";
import { useDocumentStore } from "../store/document";
import { useFontsStore } from "../store/custom-fonts";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { ExportData } from "../types";
import { copy } from "./general";

export const exportToImageUrls = async (
  data: ExportData["document"]
): Promise<string[]> => {
  const { slides, backgroundColor, documentSize, files } = data;

  const urls: string[] = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const elements = copy(slide.elements);
    const frame = elements.find((el: ExcalidrawElement) => el.id === "frame");
    if (frame) {
      frame.strokeColor = "transparent";
    }

    const blob = await exportToBlob({
      elements,
      appState: {
        exportWithDarkMode: false,
        exportBackground: true,
        viewBackgroundColor: backgroundColor,
        width: documentSize.width,
        height: documentSize.height,
      },
      files,
      getDimensions: () => ({
        width: documentSize.width,
        height: documentSize.height,
      }),
    });

    const url = URL.createObjectURL(blob);
    urls.push(url);
  }

  return urls;
};

interface ExportGifOptions {
  fileName: string;
  frameDelay: number;
  onProgress?: (progress: number) => void;
}
export const exportToGif = async ({
  fileName,
  frameDelay,
  onProgress,
}: ExportGifOptions): Promise<void> => {
  const state = useDocumentStore.getState();
  const { slides, backgroundColor, documentSize } = state;

  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: documentSize.width,
    height: documentSize.height,
    workerScript: "/gif.worker.js",
  });

  try {
    const imageUrls = await exportToImageUrls({
      slides,
      backgroundColor,
      documentSize,
      files: state.files,
    });

    // Convert URLs to Images and add to GIF
    for (let i = 0; i < imageUrls.length; i++) {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = imageUrls[i];
      });

      gif.addFrame(image, { delay: frameDelay });

      if (onProgress) {
        onProgress(((i + 1) / imageUrls.length) * 100);
      }
    }

    imageUrls.forEach(URL.revokeObjectURL);

    // render and download gif
    return new Promise((resolve) => {
      gif.on("finished", (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName.endsWith(".gif")
          ? fileName
          : `${fileName}.gif`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        resolve();
      });

      gif.render();
    });
  } catch (error) {
    console.error("Error exporting to GIF:", error);
    throw error;
  }
};

export const fetchDataFromGist = async (url: string): Promise<ExportData> => {
  if (!url.startsWith("https://gist.github.com/")) {
    throw new Error("Please enter a valid GitHub Gist URL");
  }

  const rawUrl =
    url.replace("gist.github.com", "gist.githubusercontent.com") + "/raw";

  const response = await fetch(rawUrl, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(
      "Failed to fetch Gist. Please check the URL and try again."
    );
  }

  const gistData = await response.json();
  if (!gistData?.document?.slides) {
    throw new Error("Invalid presentation data format");
  }

  return gistData;
};

// download a file with the .ins extension
export const downloadInsFile = (data: ExportData, fileName: string) => {
  const jsonData = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const fullFileName = fileName.endsWith(".ins") ? fileName : `${fileName}.ins`;

  link.href = url;
  link.download = fullFileName;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateEmbedCode = (
  type: "presentation" | "slider-template",
  gistUrl: string
): string => {
  return `<iframe
  src="${window.location.origin}/embed?type=${type}&gist_url=${gistUrl}"
  width="100%"
  height="500"
  frameborder="0"
  allowfullscreen
></iframe>`;
};

type ImportData = {
  document: ExportData["document"];
  fonts: ExportData["fonts"];
};
export const handleImport = async (file: File) => {
  const documentStore = useDocumentStore.getState();
  const fontsStore = useFontsStore.getState();

  const fileContent = await file.text();
  const importData: ImportData = JSON.parse(fileContent);

  // reset the store with import data
  documentStore.resetStore(importData.document);

  // add fonts if not already present
  if (importData.fonts?.customFonts) {
    Object.keys(importData.fonts.customFonts).forEach((fontFamily) => {
      if (!fontsStore.customFonts[fontFamily]) {
        fontsStore.addFonts(importData.fonts.customFonts[fontFamily]);
      }
    });
  }
};
