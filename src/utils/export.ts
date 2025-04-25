import GIF from "gif.js";
import { exportToBlob, exportToSvg } from "@excalidraw/excalidraw";
import { useDocumentStore } from "../store/document";
import { useFontsStore } from "../store/custom-fonts";
import {
  ExcalidrawElement,
  FileId,
} from "@excalidraw/excalidraw/types/element/types";
import { CustomFontFace, ExportData } from "../types";
import { copy } from "./general";
import { getExcalidrawFontId } from "./fonts";
import { animateSvg } from "excalidraw-animate";

export const exportToHandDrawnGif = async (): Promise<void> => {
  const state = useDocumentStore.getState();
  const { slides, backgroundColor, documentSize, files } = state;

  const animatedSvgList = await Promise.all(
    slides.map(async (slide) => {
      const svg = await exportToSvg({
        elements: slide.elements,
        appState: {
          exportWithDarkMode: false,
          exportBackground: true,
          viewBackgroundColor: backgroundColor,
          width: documentSize.width,
          height: documentSize.height,
        },
        files: files,
      });

      const { finishedMs } = animateSvg(svg, slide.elements as unknown as any);
      return { svg, finishedMs };
    })
  );

  // Get the first SVG and clone it to avoid modifying the original
  const svgElement = animatedSvgList[0].svg.cloneNode(true) as SVGSVGElement;

  // download the svg
  const svgBlob = new Blob([svgElement.outerHTML], {
    type: "image/svg+xml",
  });
  const svgUrl = URL.createObjectURL(svgBlob);
  const a = document.createElement("a");
  a.href = svgUrl;
  a.download = "animated-svg.svg";
  a.click();
  // Style the SVG container
  const svgContainer = document.createElement("div");
  svgContainer.style.position = "fixed";
  svgContainer.style.top = "20px";
  svgContainer.style.right = "20px";
  svgContainer.style.zIndex = "9999";
  svgContainer.style.border = "1px solid #ccc";
  svgContainer.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
  svgContainer.style.background = backgroundColor;
  svgContainer.style.padding = "10px";

  // Style the SVG element
  svgElement.style.display = "block";
  svgElement.style.maxWidth = "600px";
  svgElement.style.maxHeight = "400px";

  // Set an ID for the SVG to reference it later
  svgElement.id = "animated-svg-element";

  // Add the SVG to container
  svgContainer.appendChild(svgElement);
  document.body.appendChild(svgContainer);

  // Add status label
  const statusLabel = document.createElement("div");
  statusLabel.innerText = "Starting recording automatically...";
  statusLabel.style.position = "absolute";
  statusLabel.style.bottom = "10px";
  statusLabel.style.left = "10px";
  statusLabel.style.padding = "8px 12px";
  statusLabel.style.background = "#4285f4";
  statusLabel.style.color = "white";
  statusLabel.style.border = "none";
  statusLabel.style.borderRadius = "4px";
  statusLabel.style.fontSize = "14px";
  svgContainer.appendChild(statusLabel);

  // Add a close button
  const closeButton = document.createElement("button");
  closeButton.innerText = "×";
  closeButton.style.position = "absolute";
  closeButton.style.top = "5px";
  closeButton.style.right = "5px";
  closeButton.style.zIndex = "10000";
  closeButton.style.background = "#ff5555";
  closeButton.style.color = "white";
  closeButton.style.border = "none";
  closeButton.style.borderRadius = "50%";
  closeButton.style.width = "30px";
  closeButton.style.height = "30px";
  closeButton.style.cursor = "pointer";
  closeButton.style.fontSize = "20px";
  closeButton.style.lineHeight = "30px";
  closeButton.style.textAlign = "center";
  closeButton.onclick = () => {
    document.body.removeChild(svgContainer);
  };
  svgContainer.appendChild(closeButton);

  // Start recording automatically after a brief delay to allow SVG animations to begin
  setTimeout(async () => {
    try {
      // Update status
      statusLabel.innerText = "Recording...";
      statusLabel.style.background = "#ccc";

      // Start recording process
      const videoBlob = await recordSvgToVideo(
        svgElement,
        backgroundColor,
        documentSize.width,
        documentSize.height,
        animatedSvgList[0].finishedMs
      );

      // Save the recorded video
      const filename = state.filename || "animation";
      saveVideoFile(filename + ".webm", videoBlob);

      // Update status
      statusLabel.innerText = "Recording Complete!";
      statusLabel.style.background = "#43a047";

      setTimeout(() => {
        statusLabel.innerText = "Recording saved as " + filename + ".webm";
      }, 2000);
    } catch (error) {
      console.error("Error recording animation:", error);
      statusLabel.innerText = "Recording Failed";
      statusLabel.style.background = "#f44336";
    }
  }, 500); // Short delay to ensure SVG is fully rendered
};

/**
 * Records an SVG animation to a video file
 * @param svgElement The SVG element to record
 * @param backgroundColor Background color for the video
 * @param width Width of the video
 * @param height Height of the video
 * @param duration Duration of the animation in milliseconds
 * @returns Promise resolving to a video blob
 */
const recordSvgToVideo = (
  svgElement: SVGSVGElement,
  backgroundColor: string,
  width: number,
  height: number,
  duration: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Create hidden container for recording elements
      const recordingContainer = document.createElement("div");
      recordingContainer.style.position = "absolute";
      recordingContainer.style.left = "-9999px";
      recordingContainer.style.top = "-9999px";
      document.body.appendChild(recordingContainer);

      // Create canvas for rendering frames
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Add canvas to container
      recordingContainer.appendChild(canvas);

      // Set up recording
      const chunks: Blob[] = [];
      const stream = canvas.captureStream(30); // 30 fps
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm; codecs=vp9",
        videoBitsPerSecond: 5000000, // 5 Mbps for better quality
      });

      // Handle recorded data
      recorder.ondataavailable = (event) => {
        const blob = event.data;
        if (blob && blob.size) {
          chunks.push(blob);
        }
      };

      // Clean up when recording stops
      recorder.onstop = () => {
        document.body.removeChild(recordingContainer);
        resolve(new Blob(chunks, { type: "video/webm" }));
      };

      // Start recording
      recorder.start();

      // Rendering loop variables
      let startTime = Date.now();
      const endTime = startTime + duration;

      // Function to render current state of SVG to canvas
      const renderFrame = () => {
        // Clear canvas with the background color
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Create a new SVG data URL from the current state of the animated SVG
        const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
        const svgData = new XMLSerializer().serializeToString(svgClone);
        const svgBlob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(svgBlob);

        // Create temporary image to render SVG
        const img = new Image();
        img.onload = () => {
          // Draw the image to the canvas
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);

          // Check if recording should continue
          const currentTime = Date.now();
          if (currentTime < endTime) {
            // Schedule next frame
            setTimeout(renderFrame, 1000 / 30); // Aim for 30fps
          } else {
            // Finish recording
            recorder.stop();
          }
        };

        // Handle image load error
        img.onerror = () => {
          console.error("Failed to load SVG image");
          URL.revokeObjectURL(url);

          // Continue to next frame anyway
          const currentTime = Date.now();
          if (currentTime < endTime) {
            setTimeout(renderFrame, 1000 / 30);
          } else {
            recorder.stop();
          }
        };

        // Load the SVG data
        img.src = url;
      };

      // Start the rendering loop
      renderFrame();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Saves a video blob as a downloadable file
 * @param filename Name of the file to save
 * @param blob Video blob to save
 */
const saveVideoFile = (filename: string, blob: Blob): void => {
  const a = document.createElement("a");
  a.download = filename;
  a.href = URL.createObjectURL(blob);
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  document.body.removeChild(a);
};

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
const isValidInscribedData = (data: unknown): boolean => {
  return Boolean(
    data &&
      typeof data === "object" &&
      "document" in data &&
      data.document &&
      typeof data.document === "object" &&
      "slides" in data.document
  );
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
  } catch {
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
    } catch {
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
    } catch {
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
  loopToReachDuration?: boolean;
  durationInSeconds?: number;
  onProgress?: (progress: number) => void;
}

export const exportToVideo = async ({
  fileName,
  frameDelay,
  loopToReachDuration = false,
  durationInSeconds = 0,
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

    // Calculate how many times to loop the slides
    let totalLoops = 1;
    if (loopToReachDuration && durationInSeconds > 0) {
      // Calculate total duration of one loop in milliseconds
      const singleLoopDurationMs = imageUrls.length * frameDelay;
      // Convert target duration to milliseconds
      const targetDurationMs = durationInSeconds * 1000;
      // Calculate how many loops we need to reach target duration
      totalLoops = Math.ceil(targetDurationMs / singleLoopDurationMs);
    }

    // Process all frames with looping if needed
    for (let loop = 0; loop < totalLoops; loop++) {
      for (let i = 0; i < imageUrls.length; i++) {
        await drawFrame(i);

        // Update progress to reflect current loop
        if (onProgress && totalLoops > 1) {
          const loopProgress =
            (loop * imageUrls.length + i) / (totalLoops * imageUrls.length);
          // Scale progress from 10-90% during frame rendering
          const progress = 10 + loopProgress * 80;
          onProgress(progress);
        }
      }
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
