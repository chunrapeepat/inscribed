import GIF from "gif.js";
import { exportToBlob } from "@excalidraw/excalidraw";
import { useDocumentStore } from "../store/document";
import { useFontsStore } from "../store/custom-fonts";
import {
  ExcalidrawElement,
  FileId,
} from "@excalidraw/excalidraw/types/element/types";
import { CustomFontFace, ExportData } from "../types";
import { copy } from "./general";
import { getExcalidrawFontId } from "./fonts";

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
}: ExportGifOptions): Promise<string | void> => {
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

    // render and return promise
    return new Promise((resolve) => {
      gif.on("finished", (blob: Blob) => {
        const url = URL.createObjectURL(blob);

        // If fileName is 'preview', just return the URL
        if (fileName === "preview") {
          resolve(url);
          return;
        }

        // Otherwise download the file
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

interface GistFile {
  filename: string;
  raw_url: string;
  content: string;
}

interface GistResponse {
  files: Record<string, GistFile>;
}

export interface GistFileData {
  filename: string;
  content: ExportData;
}

// Function to check if content is valid inscribed data
const isValidInscribedData = (data: any): boolean => {
  return Boolean(data?.document?.slides);
};

// Function to fetch data from raw Gist URL
export const fetchDataFromRawGist = async (
  url: string
): Promise<ExportData> => {
  if (!url.startsWith("https://gist.githubusercontent.com/")) {
    throw new Error("Please enter a valid raw GitHub Gist URL");
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        "Failed to fetch Gist. Please check the URL and try again."
      );
    }

    const data = await response.json();
    if (!isValidInscribedData(data)) {
      throw new Error("The file does not contain valid Inscribed data");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch or parse the Gist data");
  }
};

// Extract gist ID from URL
const extractGistId = (url: string): string => {
  // Match either a gist URL or a direct link to a file in a gist
  const match = url.match(/gist\.github\.com\/[^/]+\/([a-zA-Z0-9]+)/);
  if (!match || !match[1]) {
    throw new Error("Please enter a valid GitHub Gist URL");
  }
  return match[1];
};

// Extract targeted filename from URL query parameter if present
const extractTargetedFilename = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const filenameParam = urlObj.searchParams.get("filename");
    if (filenameParam) {
      return filenameParam;
    }

    // Fallback to fragment identifier for backward compatibility
    const fileMatch = url.match(/#file-([a-zA-Z0-9_-]+)/);
    return fileMatch ? fileMatch[1].replace(/-/g, ".") : null;
  } catch (e) {
    // If URL parsing fails, try fragment as fallback
    const fileMatch = url.match(/#file-([a-zA-Z0-9_-]+)/);
    return fileMatch ? fileMatch[1].replace(/-/g, ".") : null;
  }
};

export const fetchDataFromGist = async (
  url: string
): Promise<ExportData | GistFileData[]> => {
  if (!url.startsWith("https://gist.github.com/")) {
    throw new Error("Please enter a valid GitHub Gist URL");
  }

  // Extract gist ID and targeted filename
  const gistId = extractGistId(url);
  const targetedFilename = extractTargetedFilename(url);

  // Use GitHub API to fetch the gist and all its files
  const apiUrl = `https://api.github.com/gists/${gistId}`;

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      "Failed to fetch Gist. Please check the URL and try again."
    );
  }

  const gistResponse: GistResponse = await response.json();

  // If specific file is targeted in the URL
  if (targetedFilename) {
    // Find the targeted file
    const fileEntry = Object.entries(gistResponse.files).find(
      ([key]) => key.toLowerCase() === targetedFilename.toLowerCase()
    );

    if (!fileEntry) {
      throw new Error(`File "${targetedFilename}" not found in this Gist`);
    }

    const [filename, fileData] = fileEntry;

    try {
      const content = JSON.parse(fileData.content);
      if (isValidInscribedData(content)) {
        return content;
      } else {
        throw new Error(
          `File "${filename}" does not contain valid Inscribed data`
        );
      }
    } catch (e) {
      throw new Error(`Error parsing JSON from file "${filename}"`);
    }
  }

  // Check for multiple valid files
  const validFiles: GistFileData[] = [];

  for (const [filename, fileData] of Object.entries(gistResponse.files)) {
    try {
      const content = JSON.parse(fileData.content);
      if (isValidInscribedData(content)) {
        validFiles.push({
          filename,
          content,
        });
      }
    } catch (e) {
      // Skip invalid files
      continue;
    }
  }

  if (validFiles.length === 0) {
    throw new Error("No valid Inscribed data files found in this Gist");
  }

  if (validFiles.length === 1) {
    // If only one valid file, return it directly
    return validFiles[0].content;
  }

  // Return all valid files to let user choose
  return validFiles;
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
  // Extract any filename parameter if present
  let urlToUse = gistUrl;
  let filenameParam = "";

  try {
    if (gistUrl.includes("filename=")) {
      // We'll properly format the URL to separate the base URL and parameters
      const baseGistUrl = gistUrl.split("?")[0]; // Get the base URL without params
      const params = new URLSearchParams(gistUrl.split("?")[1] || "");
      const filename = params.get("filename");

      if (filename) {
        urlToUse = baseGistUrl;
        filenameParam = `&filename=${encodeURIComponent(filename)}`;
      }
    }
  } catch (e) {
    console.error("Error parsing gist URL:", e);
    // Continue with the original URL if there's an error
  }

  return `<iframe
  style="border: 1px solid #ccc; border-radius: 0.5rem;"
  src="${window.location.origin}/embed?type=${type}&gist_url=${urlToUse}${filenameParam}"
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

  // set filename
  documentStore.setFilename(file.name.replace(".ins", ""));

  // add fonts if not already present
  if (importData.fonts?.customFonts) {
    Object.keys(importData.fonts.customFonts).forEach((fontFamily) => {
      if (!fontsStore.customFonts[fontFamily]) {
        fontsStore.addFonts(importData.fonts.customFonts[fontFamily]);
      }
    });
  }
};

export const generateExportData = (fileName: string) => {
  const documentStore = useDocumentStore.getState();
  const fontsStore = useFontsStore.getState();

  // prune unused files
  const usedFileIds = documentStore.slides
    .map((slide) => slide.elements)
    .flat()
    .filter((e) => e.type === "image")
    .map((e) => e.fileId);
  const unusedFileIds = Object.keys(documentStore.files).filter(
    (fileId) => !usedFileIds.includes(fileId as FileId)
  );
  const files = { ...documentStore.files };
  unusedFileIds.forEach((fileId) => {
    delete files[fileId as FileId];
  });

  // prune unused fonts
  const elements = documentStore.slides.map((slide) => slide.elements).flat();
  const usedFontIds = elements
    .filter((e) => e.type === "text")
    .map((e) => e.fontFamily);

  const customFonts: { [key: string]: CustomFontFace[] } = {};
  Object.keys(fontsStore.customFonts).forEach((fontFamily) => {
    if (usedFontIds.includes(getExcalidrawFontId(fontFamily))) {
      customFonts[fontFamily] = fontsStore.customFonts[fontFamily];
    }
  });

  // set the filename to store
  documentStore.setFilename(fileName);

  return {
    name: fileName,
    document: {
      backgroundColor: documentStore.backgroundColor,
      slides: documentStore.slides,
      files,
      documentSize: documentStore.documentSize,
    },
    fonts: {
      customFonts,
    },
  };
};

interface ExportPdfOptions {
  fileName: string;
  onProgress?: (progress: number) => void;
}

export const exportToPdf = async ({
  fileName,
  onProgress,
}: ExportPdfOptions): Promise<void> => {
  const state = useDocumentStore.getState();
  const { slides, backgroundColor, documentSize } = state;

  try {
    // Dynamically import jspdf to reduce bundle size
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation:
        documentSize.width > documentSize.height ? "landscape" : "portrait",
      unit: "px",
      format: [documentSize.width, documentSize.height],
    });

    // Export each slide as an image and add to PDF
    const imageUrls = await exportToImageUrls({
      slides,
      backgroundColor,
      documentSize,
      files: state.files,
    });

    for (let i = 0; i < imageUrls.length; i++) {
      // Add a new page for each slide after the first one
      if (i > 0) {
        pdf.addPage([documentSize.width, documentSize.height]);
      }

      // Add the image to the PDF
      pdf.addImage(
        imageUrls[i],
        "PNG",
        0,
        0,
        documentSize.width,
        documentSize.height
      );

      if (onProgress) {
        onProgress(((i + 1) / imageUrls.length) * 100);
      }
    }

    // Clean up image URLs
    imageUrls.forEach(URL.revokeObjectURL);

    // Save the PDF
    const fullFileName = fileName.endsWith(".pdf")
      ? fileName
      : `${fileName}.pdf`;
    pdf.save(fullFileName);
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw error;
  }
};

interface ExportVideoOptions {
  fileName: string;
  frameDelay: number;
  onProgress?: (progress: number) => void;
}

export const exportToVideo = async ({
  fileName,
  frameDelay,
  onProgress,
}: ExportVideoOptions): Promise<string | void> => {
  const state = useDocumentStore.getState();
  const { slides, backgroundColor, documentSize } = state;

  try {
    // Get all slide images
    const imageUrls = await exportToImageUrls({
      slides,
      backgroundColor,
      documentSize,
      files: state.files,
    });

    if (onProgress) {
      onProgress(10); // Image export complete
    }

    // Create a canvas element
    const canvas = document.createElement("canvas");
    canvas.width = documentSize.width;
    canvas.height = documentSize.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Set up recorder with canvas stream
    const stream = canvas.captureStream(30); // 30 FPS
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 5000000, // 5 Mbps
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    // Start recording
    recorder.start();

    // Function to draw frames
    const drawFrame = (index: number) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Update progress
          if (onProgress) {
            // Scale progress from 10-90% during frame rendering
            const progress = 10 + (index / imageUrls.length) * 80;
            onProgress(progress);
          }

          setTimeout(resolve, frameDelay); // Maintain frame delay
        };
        img.src = imageUrls[index];
      });
    };

    // Process all frames
    for (let i = 0; i < imageUrls.length; i++) {
      await drawFrame(i);
    }

    // Stop recording and create video
    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        try {
          if (onProgress) onProgress(95); // Almost done

          const blob = new Blob(chunks, { type: "video/mp4" });
          const videoUrl = URL.createObjectURL(blob);

          if (onProgress) onProgress(100); // Done

          // If fileName is 'preview', return the URL
          if (fileName === "preview") {
            resolve(videoUrl);
            return;
          }

          // Otherwise download the file
          const link = document.createElement("a");
          link.href = videoUrl;
          link.download = fileName.endsWith(".mp4")
            ? fileName
            : `${fileName}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up
          imageUrls.forEach(URL.revokeObjectURL);

          // Only revoke the URL if not a preview
          if (fileName !== "preview") {
            URL.revokeObjectURL(videoUrl);
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      // Stop recording after all frames have been drawn
      recorder.stop();
    });
  } catch (error) {
    console.error("Error exporting to video:", error);
    throw error;
  }
};
