import GIF from "gif.js";
import { exportToBlob } from "@excalidraw/excalidraw";
import { useStore } from "../store/document";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

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
  const state = useStore.getState();
  const { slides, backgroundColor, documentSize } = state;

  // Create GIF
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: documentSize.width,
    height: documentSize.height,
    workerScript: "/public/gif.worker.js",
  });

  // Convert each slide to an image
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];

    // Filter out the frame element (first element) as we'll set background color instead
    const elements = slide.elements.filter(
      (el: ExcalidrawElement) => el.id !== "frame"
    );

    try {
      const blob = await exportToBlob({
        elements,
        appState: {
          exportWithDarkMode: false,
          exportBackground: true,
          viewBackgroundColor: backgroundColor,
          width: documentSize.width,
          height: documentSize.height,
        },
        files: state.files,
        getDimensions: () => ({
          width: documentSize.width,
          height: documentSize.height,
        }),
      });

      // Convert blob to image
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = URL.createObjectURL(blob);
      });

      // Add frame to GIF
      gif.addFrame(image, { delay: frameDelay });

      // Update progress
      if (onProgress) {
        onProgress(((i + 1) / slides.length) * 100);
      }
    } catch (error) {
      console.error(`Error processing slide ${i}:`, error);
      throw new Error(`Failed to process slide ${i}`);
    }
  }

  // Render and download GIF
  return new Promise((resolve, _) => {
    gif.on("finished", (blob: Blob) => {
      console.log("blob", blob);
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName.endsWith(".gif") ? fileName : `${fileName}.gif`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      resolve();
    });

    gif.render();
  });
};
