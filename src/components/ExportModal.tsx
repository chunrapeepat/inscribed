import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  exportToGif,
  fetchDataFromGist,
  fetchDataFromRawGist,
  downloadInsFile,
  generateEmbedCode,
  handleImport,
  GistFileData,
  generateExportData,
  exportToPdf,
  exportToVideo,
  exportToHandDrawnSVG,
} from "../utils/export";
import { useDocumentStore } from "../store/document";
import { useFontsStore } from "../store/custom-fonts";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const exportOptions = [
  {
    id: "import",
    title: "Import",
    description:
      "Import inscribed data (.ins file) This option will overwrite your data, backup your current data before importing",
  },
  {
    id: "import-gist",
    title: "Import from Gist",
    description:
      "Import inscribed data from a GitHub Gist URL. This option will overwrite your data.",
  },
  {
    id: "export-data",
    title: "Export Data",
    description: "Export your current data for later editing",
  },
  {
    id: "gif",
    title: "Export as GIF",
    description: "Create an animated GIF. Good for sharing on social media.",
  },
  {
    id: "pdf",
    title: "Export as PDF",
    description:
      "Create a PDF document with all your slides. Good for printing or sharing as documents.",
  },
  {
    id: "video",
    title: "Export as Video (WebM)",
    description:
      "Create an MP4 video of your slides. Good for presentations and sharing on video platforms.",
  },
  {
    id: "hand-drawn-video",
    title: "Export as Hand Drawn Animation Video (Self recording)",
    description:
      "Create a video with hand-drawn animation effect for your social media posts or educational videos. Self-record and use it with your own video editing tools.",
  },
  {
    id: "embed-presentation",
    title: "Embed Presentation",
    description:
      "Create an iframe embed of your slides. Good for embeding on website, documentation, Notion/Obsidian.",
  },
  {
    id: "embed-slider-template",
    title: "Embed with Slider Template",
    description:
      "Create an iframe embed with slider template. Good for visualizing a step by step process e.g. algorithm",
  },
  {
    id: "get-shareable-link",
    title: "Get Shareable Link",
    description:
      "Generate a direct shareable link from your Gist URL for easy sharing",
  },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = React.useState<string | null>(
    null
  );
  const [exportFileName, setExportFileName] = React.useState("");
  const [gistId, setGistId] = React.useState("");
  const [frameDelay, setFrameDelay] = React.useState("100");
  const [loopVideo, setLoopVideo] = React.useState(false);
  const [videoDuration, setVideoDuration] = React.useState("10");
  const [exportProgress, setExportProgress] = React.useState<number | null>(
    null
  );
  const [exportScale, setExportScale] = React.useState<number>(1);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [embedCode, setEmbedCode] = useState("");
  const [gistFiles, setGistFiles] = useState<GistFileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isLoadingGist, setIsLoadingGist] = useState(false);
  const [importedGistUrl, setImportedGistUrl] = useState<string | null>(null);

  // GIF preview states
  const [previewGifUrl, setPreviewGifUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState<number | null>(null);

  // Video preview states
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideoPreview, setIsGeneratingVideoPreview] =
    useState(false);
  const [previewVideoProgress, setPreviewVideoProgress] = useState<
    number | null
  >(null);

  const { filename } = useDocumentStore();

  // update default export filename
  useEffect(() => {
    setExportFileName(filename || "");
  }, [filename]);

  // ESC shortcut
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [isOpen, onClose]);

  // Reset importedGistUrl on first modal load or when refreshing the page
  useEffect(() => {
    // This effect will run on component mount
    // We reset the importedGistUrl to ensure it starts fresh on page load
    if (!isOpen) {
      setImportedGistUrl(null);
    }
  }, []); // Empty dependency array means this runs once on mount

  if (!isOpen) return null;

  const handleClose = () => {
    setShowEmbedCode(false);
    setEmbedCode("");
    setGistId("");
    setSelectedOption(null);
    setGistFiles([]);
    setSelectedFile(null);
    setIsLoadingGist(false);

    // Clean up any GIF preview
    if (previewGifUrl) {
      URL.revokeObjectURL(previewGifUrl);
      setPreviewGifUrl(null);
    }
    setPreviewProgress(null);
    setIsGeneratingPreview(false);

    // Clean up any video preview
    if (previewVideoUrl) {
      URL.revokeObjectURL(previewVideoUrl);
      setPreviewVideoUrl(null);
    }
    setPreviewVideoProgress(null);
    setIsGeneratingVideoPreview(false);

    // Don't reset importedGistUrl here, as we want to persist it between modal openings

    onClose();
  };

  const handleExport = async () => {
    if (!selectedOption) return;
    if (
      (selectedOption === "export-data" ||
        selectedOption === "gif" ||
        selectedOption === "pdf" ||
        selectedOption === "video") &&
      !exportFileName.trim()
    )
      return;
    if (
      (selectedOption === "embed-presentation" ||
        selectedOption === "embed-slider-template" ||
        selectedOption === "get-shareable-link" ||
        selectedOption === "import-gist") &&
      !gistId.trim()
    )
      return;
    if (
      (selectedOption === "gif" || selectedOption === "video") &&
      (!frameDelay || parseInt(frameDelay) < 1)
    )
      return;
    if (
      selectedOption === "video" &&
      loopVideo &&
      (!videoDuration || parseInt(videoDuration) < 1)
    )
      return;

    try {
      if (selectedOption === "import") {
        const fileInput = document.getElementById(
          "fileUpload"
        ) as HTMLInputElement;
        if (!fileInput.files?.length) return;

        // Reset imported Gist URL when importing a file
        setImportedGistUrl(null);

        await handleImport(fileInput.files[0]);
        onClose();
      } else if (selectedOption === "import-gist") {
        // If we already have gist files and a selected file, proceed with import
        if (gistFiles.length > 0 && selectedFile) {
          // Find the selected file in gistFiles
          const selectedGistFile = gistFiles.find(
            (file) => file.filename === selectedFile
          );
          if (selectedGistFile) {
            // Import the data directly from the selected file
            const documentStore = useDocumentStore.getState();
            const fontsStore = useFontsStore.getState();

            // Reset the store with import data
            documentStore.resetStore(selectedGistFile.content.document);

            // Add fonts if not already present
            if (selectedGistFile.content.fonts?.customFonts) {
              Object.keys(selectedGistFile.content.fonts.customFonts).forEach(
                (fontFamily) => {
                  if (!fontsStore.customFonts[fontFamily]) {
                    fontsStore.addFonts(
                      selectedGistFile.content.fonts.customFonts[fontFamily]
                    );
                  }
                }
              );
            }

            // Save the imported Gist URL
            setImportedGistUrl(gistId);

            onClose();
            return;
          }
        }

        // Otherwise fetch from the gist
        setIsLoadingGist(true);
        try {
          // Check if it's a raw gist URL
          if (gistId.includes("raw")) {
            const result = await fetchDataFromRawGist(gistId);

            // Import directly since raw URLs only contain one file
            const documentStore = useDocumentStore.getState();
            const fontsStore = useFontsStore.getState();

            // Reset the store with import data
            documentStore.resetStore(result.document);

            // Add fonts if not already present
            if (result.fonts?.customFonts) {
              Object.keys(result.fonts.customFonts).forEach((fontFamily) => {
                if (!fontsStore.customFonts[fontFamily]) {
                  fontsStore.addFonts(result.fonts.customFonts[fontFamily]);
                }
              });
            }

            // Save the imported Gist URL
            setImportedGistUrl(gistId);

            onClose();
            return;
          }

          const result = await fetchDataFromGist(gistId);

          // If result is an array, we have multiple files to choose from
          if (Array.isArray(result)) {
            setGistFiles(result);
            setSelectedFile(result[0].filename); // Select first file by default
            setIsLoadingGist(false);
            return; // Wait for user to select a file
          }

          // Single file result, import directly
          const documentStore = useDocumentStore.getState();
          const fontsStore = useFontsStore.getState();

          // Reset the store with import data
          documentStore.resetStore(result.document);

          // Add fonts if not already present
          if (result.fonts?.customFonts) {
            Object.keys(result.fonts.customFonts).forEach((fontFamily) => {
              if (!fontsStore.customFonts[fontFamily]) {
                fontsStore.addFonts(result.fonts.customFonts[fontFamily]);
              }
            });
          }

          // Save the imported Gist URL
          setImportedGistUrl(gistId);

          onClose();
        } finally {
          setIsLoadingGist(false);
        }
        return;
      } else if (selectedOption === "export-data") {
        const exportData = generateExportData(exportFileName);
        downloadInsFile(exportData, exportFileName);
        setExportFileName("");
        setSelectedOption(null);
      } else if (selectedOption === "gif") {
        setExportProgress(0);
        await exportToGif({
          fileName: exportFileName,
          frameDelay: parseInt(frameDelay),
          onProgress: (progress) => setExportProgress(progress),
          scale: exportScale,
        });
        setExportProgress(null);
        setSelectedOption(null);
        setExportFileName("");
        setFrameDelay("100");
      } else if (selectedOption === "hand-drawn-video") {
        setExportProgress(0);

        // Get the animated SVG elements
        const animatedSvgs = await exportToHandDrawnSVG();

        // Display the SVGs for preview
        if (animatedSvgs && animatedSvgs.length > 0) {
          displayHandDrawnPreview(animatedSvgs);
          // Close the modal when showing the preview
          onClose();
        } else {
          throw new Error("Failed to generate animated SVGs");
        }

        setExportProgress(100);
        return;
      } else if (selectedOption === "pdf") {
        setExportProgress(0);
        await exportToPdf({
          fileName: exportFileName,
          onProgress: (progress) => setExportProgress(progress),
          scale: exportScale,
        });
        setExportProgress(null);
        setSelectedOption(null);
        setExportFileName("");
      } else if (selectedOption === "video") {
        setExportProgress(0);
        await exportToVideo({
          fileName: exportFileName,
          frameDelay: parseInt(frameDelay),
          loopToReachDuration: loopVideo,
          durationInSeconds: loopVideo ? parseInt(videoDuration) : undefined,
          onProgress: (progress) => setExportProgress(progress),
          scale: exportScale,
        });
        setExportProgress(null);
        setSelectedOption(null);
        setExportFileName("");
        setFrameDelay("100");
      } else if (
        selectedOption === "embed-presentation" ||
        selectedOption === "embed-slider-template" ||
        selectedOption === "get-shareable-link"
      ) {
        // If we already have gist files and a selected file, proceed with that
        if (gistFiles.length > 0 && selectedFile) {
          // Use a query parameter for filename instead of fragment identifier
          const fileParam = `&filename=${encodeURIComponent(selectedFile)}`;

          if (selectedOption === "get-shareable-link") {
            // Generate shareable link instead of iframe code
            if (gistId.includes("raw")) {
              // For raw URLs, use the entire URL encoded
              const shareableLink = `${
                window.location.origin
              }/share?gist=${encodeURIComponent(gistId)}${fileParam}`;
              setEmbedCode(shareableLink);
            } else {
              // For regular gist URLs
              const gistMatch = gistId.match(
                /gist\.github\.com\/([^/]+\/[^/]+)/
              );
              if (gistMatch) {
                // If it's a full gist URL, use it directly
                const shareableLink = `${
                  window.location.origin
                }/share?gist=${encodeURIComponent(gistId)}${fileParam}`;
                setEmbedCode(shareableLink);
              } else {
                // If it's just a gist ID or username/gistid format
                const gistShortId = gistId;
                const shareableLink = `${window.location.origin}/share?gist=${gistShortId}${fileParam}`;
                setEmbedCode(shareableLink);
              }
            }
            setShowEmbedCode(true);
          } else {
            // Generate iframe code for other embed options
            const embedType =
              selectedOption === "embed-presentation"
                ? "presentation"
                : "slider-template";
            const iframeCode = generateEmbedCode(
              embedType,
              `${gistId}${fileParam}`
            );
            setEmbedCode(iframeCode);
            setShowEmbedCode(true);
          }
          return;
        }

        // Otherwise fetch from the gist
        setIsLoadingGist(true);
        try {
          // Check if it's a raw gist URL
          if (gistId.includes("raw")) {
            // For raw URLs, we can use them directly without fetching
            if (selectedOption === "get-shareable-link") {
              // For shareable links with raw URLs, encode the entire URL
              const shareableLink = `${
                window.location.origin
              }/share?gist=${encodeURIComponent(gistId)}`;
              setEmbedCode(shareableLink);
            } else {
              // For embed options with raw URLs
              const embedType =
                selectedOption === "embed-presentation"
                  ? "presentation"
                  : "slider-template";
              // Pass the raw URL directly to the embed code generator
              const iframeCode = generateEmbedCode(
                embedType,
                encodeURIComponent(gistId)
              );
              setEmbedCode(iframeCode);
            }
            setShowEmbedCode(true);
            setIsLoadingGist(false);
            return;
          }

          const result = await fetchDataFromGist(gistId);

          // If result is an array, we have multiple files to choose from
          if (Array.isArray(result)) {
            setGistFiles(result);
            setSelectedFile(result[0].filename); // Select first file by default
            setIsLoadingGist(false);
            return; // Wait for user to select a file
          }

          // Single file result, proceed with generating link/embed
          if (selectedOption === "get-shareable-link") {
            // Generate shareable link instead of iframe code
            if (gistId.includes("raw")) {
              // For raw URLs, use the entire URL encoded
              const shareableLink = `${
                window.location.origin
              }/share?gist=${encodeURIComponent(gistId)}`;
              setEmbedCode(shareableLink);
            } else {
              // For regular gist URLs
              const gistMatch = gistId.match(
                /gist\.github\.com\/([^/]+\/[^/]+)/
              );
              if (gistMatch) {
                // If it's a full gist URL, use it directly
                const shareableLink = `${
                  window.location.origin
                }/share?gist=${encodeURIComponent(gistId)}`;
                setEmbedCode(shareableLink);
              } else {
                // If it's just a gist ID or username/gistid format
                const gistShortId = gistId;
                const shareableLink = `${window.location.origin}/share?gist=${gistShortId}`;
                setEmbedCode(shareableLink);
              }
            }
            setShowEmbedCode(true);
          } else {
            // Generate iframe code for other embed options
            const embedType =
              selectedOption === "embed-presentation"
                ? "presentation"
                : "slider-template";
            const iframeCode = generateEmbedCode(embedType, gistId);
            setEmbedCode(iframeCode);
            setShowEmbedCode(true);
          }
        } finally {
          setIsLoadingGist(false);
        }
        return;
      }

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Export failed. Please try again."
      );
      setExportProgress(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExport();
  };

  // Function to generate a preview GIF
  const handlePreviewGif = async () => {
    // Clear any existing preview
    if (previewGifUrl) {
      URL.revokeObjectURL(previewGifUrl);
      setPreviewGifUrl(null);
    }

    setIsGeneratingPreview(true);
    setPreviewProgress(0);

    try {
      // Use the existing exportToGif function with 'preview' as the filename
      // to indicate we want to get the URL rather than download
      const url = (await exportToGif({
        fileName: "preview",
        frameDelay: parseInt(frameDelay) || 100,
        onProgress: (progress) => setPreviewProgress(progress),
        scale: exportScale,
      })) as string;

      setPreviewGifUrl(url);
    } catch (error) {
      console.error("Error generating preview GIF:", error);
    } finally {
      setIsGeneratingPreview(false);
      setPreviewProgress(null);
    }
  };

  // Function to generate a preview Video
  const handlePreviewVideo = async () => {
    // Clear any existing preview
    if (previewVideoUrl) {
      URL.revokeObjectURL(previewVideoUrl);
      setPreviewVideoUrl(null);
    }

    setIsGeneratingVideoPreview(true);
    setPreviewVideoProgress(0);

    try {
      // Use the existing exportToVideo function with 'preview' as the filename
      // to indicate we want to get the URL rather than download
      const url = (await exportToVideo({
        fileName: "preview",
        frameDelay: parseInt(frameDelay) || 100,
        loopToReachDuration: loopVideo,
        durationInSeconds: loopVideo ? parseInt(videoDuration) : undefined,
        onProgress: (progress) => setPreviewVideoProgress(progress),
        scale: exportScale,
      })) as string;

      setPreviewVideoUrl(url);
    } catch (error) {
      console.error("Error generating preview Video:", error);
    } finally {
      setIsGeneratingVideoPreview(false);
      setPreviewVideoProgress(null);
    }
  };

  // Function to display SVG animation preview
  const displayHandDrawnPreview = (svgElements: SVGSVGElement[]) => {
    const state = useDocumentStore.getState();
    const { backgroundColor } = state;

    // Variables to track current state
    let currentFrameIndex = 0;
    let isPlaying = true;
    let animationTimer: number | null = null;

    // Create container for SVG display - make it fullscreen
    const svgContainer = document.createElement("div");
    svgContainer.id = "hand-drawn-preview-container";
    svgContainer.style.position = "fixed";
    svgContainer.style.top = "0";
    svgContainer.style.left = "0";
    svgContainer.style.right = "0";
    svgContainer.style.bottom = "0";
    svgContainer.style.zIndex = "9999999";
    svgContainer.style.background = backgroundColor;
    svgContainer.style.display = "flex";
    svgContainer.style.flexDirection = "column";
    svgContainer.style.alignItems = "center";
    svgContainer.style.justifyContent = "center";
    svgContainer.style.padding = "20px";

    // Create a wrapper for the SVG to help with centering
    const svgWrapper = document.createElement("div");
    svgWrapper.style.flexGrow = "1";
    svgWrapper.style.display = "flex";
    svgWrapper.style.alignItems = "center";
    svgWrapper.style.justifyContent = "center";
    svgWrapper.style.width = "100%";
    svgContainer.appendChild(svgWrapper);

    // Create frame counter display
    const frameCounter = document.createElement("div");
    frameCounter.style.position = "absolute";
    frameCounter.style.top = "15px";
    frameCounter.style.right = "25px";
    frameCounter.style.color = "black";
    frameCounter.style.fontSize = "16px";
    frameCounter.textContent = `Frame: ${currentFrameIndex + 1}/${
      svgElements.length
    }`;
    svgContainer.appendChild(frameCounter);

    // Function to display a specific SVG frame
    const displayFrame = (frameIndex: number) => {
      // Clear any existing animation timer
      if (animationTimer !== null) {
        window.clearTimeout(animationTimer);
        animationTimer = null;
      }

      // Update current frame index
      currentFrameIndex = frameIndex;
      frameCounter.textContent = `Frame: ${currentFrameIndex + 1}/${
        svgElements.length
      }`;

      // Clear the wrapper
      svgWrapper.innerHTML = "";

      // Clone the SVG for this frame
      const svgClone = svgElements[frameIndex].cloneNode(true) as SVGSVGElement;
      svgClone.id = "hand-drawn-preview-svg";

      // Style the SVG element - larger size for recording
      svgClone.style.display = "block";
      svgClone.style.maxWidth = "100%";
      svgClone.style.maxHeight = "80vh";

      // Add the SVG to wrapper
      svgWrapper.appendChild(svgClone);

      // Find all animations in the SVG to determine when they end
      const animations = svgClone.querySelectorAll(
        "animate, animateTransform, animateMotion"
      );

      // If playing and there are more frames, schedule the next frame
      if (isPlaying && frameIndex < svgElements.length - 1) {
        // Find the max duration of animations in current frame
        let maxDuration = 0;
        animations.forEach((anim: Element) => {
          const dur = anim.getAttribute("dur");
          if (dur) {
            // Parse the duration (usually in seconds, like "2s")
            const seconds = parseFloat(dur.replace("s", ""));
            if (!isNaN(seconds)) {
              maxDuration = Math.max(maxDuration, seconds * 1000);
            }
          }
        });

        // If no animation duration found, use default
        const frameDuration = maxDuration > 0 ? maxDuration : 2000;

        // Schedule next frame
        animationTimer = window.setTimeout(() => {
          displayFrame(frameIndex + 1);
        }, frameDuration + 100); // Add slight buffer to ensure animations complete
      }
    };

    // Create controls container
    const controlsContainer = document.createElement("div");
    controlsContainer.style.display = "flex";
    controlsContainer.style.gap = "10px";
    controlsContainer.style.padding = "7px";
    controlsContainer.style.marginTop = "20px";
    controlsContainer.style.background = "#f8f9fa";
    controlsContainer.style.borderRadius = "8px";
    controlsContainer.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";

    // Add Previous Frame button
    const prevButton = document.createElement("button");
    prevButton.innerText = "Previous Frame";
    prevButton.style.padding = "7px 12px";
    prevButton.style.background = "#5f6368";
    prevButton.style.color = "white";
    prevButton.style.border = "none";
    prevButton.style.borderRadius = "4px";
    prevButton.style.cursor = "pointer";
    prevButton.style.fontSize = "16px";
    prevButton.onclick = () => {
      isPlaying = false; // Stop auto-playback
      if (currentFrameIndex > 0) {
        displayFrame(currentFrameIndex - 1);
      }
    };
    controlsContainer.appendChild(prevButton);

    // Add Start/Play button
    const playButton = document.createElement("button");
    playButton.innerText = "Play All Frames";
    playButton.style.padding = "7px 12px";
    playButton.style.background = "#4285f4";
    playButton.style.color = "white";
    playButton.style.border = "none";
    playButton.style.borderRadius = "4px";
    playButton.style.cursor = "pointer";
    playButton.style.fontSize = "16px";
    playButton.onclick = () => {
      isPlaying = true;
      displayFrame(0); // Start from the first frame
    };
    controlsContainer.appendChild(playButton);

    // Add Next Frame button
    const nextButton = document.createElement("button");
    nextButton.innerText = "Next Frame";
    nextButton.style.padding = "7px 12px";
    nextButton.style.background = "#5f6368";
    nextButton.style.color = "white";
    nextButton.style.border = "none";
    nextButton.style.borderRadius = "4px";
    nextButton.style.cursor = "pointer";
    nextButton.style.fontSize = "16px";
    nextButton.onclick = () => {
      isPlaying = false; // Stop auto-playback
      if (currentFrameIndex < svgElements.length - 1) {
        displayFrame(currentFrameIndex + 1);
      }
    };
    controlsContainer.appendChild(nextButton);

    // Add Replay Current button
    const replayCurrentButton = document.createElement("button");
    replayCurrentButton.innerText = "Replay Current";
    replayCurrentButton.style.padding = "7px 12px";
    replayCurrentButton.style.background = "#34a853";
    replayCurrentButton.style.color = "white";
    replayCurrentButton.style.border = "none";
    replayCurrentButton.style.borderRadius = "4px";
    replayCurrentButton.style.cursor = "pointer";
    replayCurrentButton.style.fontSize = "16px";
    replayCurrentButton.onclick = () => {
      isPlaying = false; // Stop auto-playback
      displayFrame(currentFrameIndex); // Replay current frame
    };
    controlsContainer.appendChild(replayCurrentButton);

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.innerText = "Exit Preview";
    closeButton.style.padding = "7px 12px";
    closeButton.style.background = "#ea4335";
    closeButton.style.color = "white";
    closeButton.style.border = "none";
    closeButton.style.borderRadius = "4px";
    closeButton.style.cursor = "pointer";
    closeButton.style.fontSize = "16px";
    closeButton.onclick = () => {
      // Clear any timer before removing
      if (animationTimer !== null) {
        window.clearTimeout(animationTimer);
      }
      document.body.removeChild(svgContainer);
    };
    controlsContainer.appendChild(closeButton);

    // Add controls to the container
    svgContainer.appendChild(controlsContainer);

    // Add container to the body
    document.body.appendChild(svgContainer);

    // Start displaying frames
    displayFrame(0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999]">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Export Presentation</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="mb-2 text-sm text-gray-500">
            Need help?{" "}
            <a
              href="https://github.com/chunrapeepat/inscribed/blob/master/docs/export-options.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Learn how each option works
            </a>
          </p>
          {!showEmbedCode ? (
            <>
              <div className="mb-4">
                <select
                  id="export-option"
                  value={selectedOption || ""}
                  onChange={(e) => setSelectedOption(e.target.value || null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select an option</option>
                  {exportOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
                {selectedOption && (
                  <p className="text-gray-600 text-sm mt-2">
                    {
                      exportOptions.find(
                        (option) => option.id === selectedOption
                      )?.description
                    }
                  </p>
                )}
              </div>

              {selectedOption === "import" && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label
                    htmlFor="fileUpload"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Select File
                  </label>
                  <input
                    type="file"
                    id="fileUpload"
                    accept=".ins"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      file:cursor-pointer cursor-pointer"
                    required
                  />

                  <p className="text-xs text-gray-500 mt-4">
                    <b>Pro tip:</b> drag and drop your .ins file on Inscribed
                    editor for fast import.
                  </p>
                </div>
              )}

              {selectedOption === "import-gist" && (
                <form
                  onSubmit={handleSubmit}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <label
                    htmlFor="importGistUrl"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Gist URL
                  </label>
                  <input
                    type="text"
                    id="importGistUrl"
                    value={gistId}
                    onChange={(e) => {
                      setGistId(e.target.value);
                      // Clear gist files when URL changes
                      if (gistFiles.length > 0) {
                        setGistFiles([]);
                        setSelectedFile(null);
                      }
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter GitHub Gist URL (or raw gist URL)"
                    required
                  />

                  {isLoadingGist && (
                    <div className="mt-2 text-sm text-gray-600 flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                      Loading Gist files...
                    </div>
                  )}

                  {gistFiles.length > 0 && (
                    <div className="mt-3">
                      <label
                        htmlFor="importGistFile"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Select File
                      </label>
                      <select
                        id="importGistFile"
                        value={selectedFile || ""}
                        onChange={(e) => setSelectedFile(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {gistFiles.map((file) => (
                          <option key={file.filename} value={file.filename}>
                            {file.filename}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Found {gistFiles.length} valid Inscribed data files in
                        this Gist
                      </p>
                    </div>
                  )}
                </form>
              )}

              {selectedOption === "export-data" && (
                <form
                  onSubmit={handleSubmit}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <label
                    htmlFor="fileName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Export File Name
                  </label>
                  <input
                    type="text"
                    id="fileName"
                    value={exportFileName}
                    onChange={(e) => setExportFileName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter file name"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    <b>Pro tip:</b> use <b>cmd/ctrl + s</b> shortcut to export
                    file
                  </p>
                </form>
              )}

              {selectedOption === "gif" && (
                <form
                  onSubmit={handleSubmit}
                  className="mt-4 pt-4 border-t border-gray-200 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="gifFileName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      GIF File Name
                    </label>
                    <input
                      type="text"
                      id="gifFileName"
                      value={exportFileName}
                      onChange={(e) => setExportFileName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter file name (.gif)"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <label
                        htmlFor="frameDelay"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Frame Delay (ms)
                      </label>
                      <button
                        type="button"
                        onClick={handlePreviewGif}
                        disabled={isGeneratingPreview}
                        className="text-blue-600 hover:text-blue-800 space-x-1 text-sm"
                      >
                        <span>(preview GIF)</span>
                      </button>
                    </div>
                    <input
                      type="number"
                      id="frameDelay"
                      value={frameDelay}
                      onChange={(e) => setFrameDelay(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter delay in milliseconds"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gifResolution"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Resolution
                    </label>
                    <div className="mt-1 flex space-x-4">
                      {[1, 2, 3].map((scale) => (
                        <label key={scale} className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio h-4 w-4 text-blue-600"
                            checked={exportScale === scale}
                            onChange={() => setExportScale(scale)}
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {scale}x
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Higher resolution results in larger file size but better
                      quality.
                    </p>
                  </div>

                  {/* Preview GIF Progress */}
                  {isGeneratingPreview && previewProgress !== null && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${previewProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1 text-center">
                        Generating preview: {Math.round(previewProgress)}%
                      </p>
                    </div>
                  )}

                  {/* Preview GIF Display */}
                  {previewGifUrl && (
                    <div className="mt-2 border rounded-lg p-2">
                      <p className="text-xs text-gray-500 mb-1">Preview:</p>
                      <div className="flex justify-center">
                        <img
                          src={previewGifUrl}
                          alt="GIF Preview"
                          className="max-h-64 max-w-full object-contain rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* Export Progress */}
                  {exportProgress !== null && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1 text-center">
                        Generating GIF: {Math.round(exportProgress)}%
                      </p>
                    </div>
                  )}
                </form>
              )}

              {selectedOption === "pdf" && (
                <form
                  onSubmit={handleSubmit}
                  className="mt-4 pt-4 border-t border-gray-200 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="pdfFileName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      PDF File Name
                    </label>
                    <input
                      type="text"
                      id="pdfFileName"
                      value={exportFileName}
                      onChange={(e) => setExportFileName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter file name (.pdf)"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pdfResolution"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Resolution
                    </label>
                    <div className="mt-1 flex space-x-4">
                      {[1, 2, 3].map((scale) => (
                        <label key={scale} className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio h-4 w-4 text-blue-600"
                            checked={exportScale === scale}
                            onChange={() => setExportScale(scale)}
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {scale}x
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Higher resolution results in larger file size but better
                      quality.
                    </p>
                  </div>

                  {/* Export Progress */}
                  {exportProgress !== null && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1 text-center">
                        Generating PDF: {Math.round(exportProgress)}%
                      </p>
                    </div>
                  )}
                </form>
              )}

              {selectedOption === "video" && (
                <form
                  onSubmit={handleSubmit}
                  className="mt-4 pt-4 border-t border-gray-200 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="videoFileName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Video File Name
                    </label>
                    <input
                      type="text"
                      id="videoFileName"
                      value={exportFileName}
                      onChange={(e) => setExportFileName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter file name (.mp4)"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <label
                        htmlFor="videoFrameDelay"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Frame Delay (ms)
                      </label>
                      <button
                        type="button"
                        onClick={handlePreviewVideo}
                        disabled={isGeneratingVideoPreview}
                        className="text-blue-600 hover:text-blue-800 space-x-1 text-sm"
                      >
                        <span>(preview video)</span>
                      </button>
                    </div>
                    <input
                      type="number"
                      id="videoFrameDelay"
                      value={frameDelay}
                      onChange={(e) => setFrameDelay(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter delay in milliseconds"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="videoResolution"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Resolution
                    </label>
                    <div className="mt-1 flex space-x-4">
                      {[1, 2, 3].map((scale) => (
                        <label key={scale} className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio h-4 w-4 text-blue-600"
                            checked={exportScale === scale}
                            onChange={() => setExportScale(scale)}
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {scale}x
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Higher resolution results in larger file size but better
                      quality.
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="loopVideo"
                      checked={loopVideo}
                      onChange={(e) => setLoopVideo(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="loopVideo"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Loop video to reach total duration
                    </label>
                  </div>

                  {loopVideo && (
                    <div>
                      <label
                        htmlFor="videoDuration"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Total Duration (seconds)
                      </label>
                      <input
                        type="number"
                        id="videoDuration"
                        value={videoDuration}
                        onChange={(e) => setVideoDuration(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter duration in seconds"
                        min="1"
                        required={loopVideo}
                      />
                    </div>
                  )}

                  {/* Preview Video Progress */}
                  {isGeneratingVideoPreview &&
                    previewVideoProgress !== null && (
                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${previewVideoProgress}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-1 text-center">
                          Generating preview: {Math.round(previewVideoProgress)}
                          %
                        </p>
                      </div>
                    )}

                  {/* Preview Video Display */}
                  {previewVideoUrl && (
                    <div className="mt-2 border rounded-lg p-2">
                      <p className="text-xs text-gray-500 mb-1">Preview:</p>
                      <div className="flex justify-center">
                        <video
                          src={previewVideoUrl}
                          controls
                          autoPlay
                          loop
                          className="max-h-64 max-w-full object-contain rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* Export Progress */}
                  {exportProgress !== null && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1 text-center">
                        Generating Video: {Math.round(exportProgress)}%
                      </p>
                    </div>
                  )}
                </form>
              )}

              {selectedOption === "hand-drawn-video" && (
                <form
                  onSubmit={handleSubmit}
                  className="mt-4 pt-4 border-t border-gray-200 space-y-4"
                >
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h3 className="text-blue-800 font-medium text-sm mb-2">
                      Screen Recording Instructions:
                    </h3>
                    <ol className="text-sm text-gray-700 space-y-1 pl-5 list-decimal">
                      <li>
                        Use your own screen recording tool (e.g., QuickTime,
                        OBS, etc.)
                      </li>
                      <li>
                        Position your recording window to capture the animation
                      </li>
                      <li>Record the animation and save as video</li>
                      <li>
                        Use the "Replay Animation" button if you need to restart
                        the animation
                      </li>
                    </ol>
                  </div>

                  <div className="text-xs text-gray-500">
                    This amazing feature is made possible by{" "}
                    <a
                      href="https://github.com/dai-shi/excalidraw-animate"
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      excalidraw-animate
                    </a>
                  </div>
                </form>
              )}

              {(selectedOption === "embed-presentation" ||
                selectedOption === "embed-slider-template" ||
                selectedOption === "get-shareable-link") && (
                <form
                  onSubmit={handleSubmit}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="gistId"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Gist URL
                    </label>
                    <div className="space-x-1 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          const exportData =
                            generateExportData("embedding-data");
                          navigator.clipboard.writeText(
                            JSON.stringify(exportData)
                          );
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        (copy data)
                      </button>
                      {importedGistUrl && (
                        <a
                          href={importedGistUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          (existing gist →)
                        </a>
                      )}
                      <a
                        href="https://gist.github.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        (new gist →)
                      </a>
                    </div>
                  </div>
                  <input
                    type="text"
                    id="gistId"
                    value={gistId}
                    onChange={(e) => {
                      setGistId(e.target.value);
                      // Clear gist files when URL changes
                      if (gistFiles.length > 0) {
                        setGistFiles([]);
                        setSelectedFile(null);
                      }
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter GitHub Gist URL (or raw gist URL)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    <b>Pro tip:</b> use raw gist URL to increase the rate limit.
                  </p>

                  {isLoadingGist && (
                    <div className="mt-2 text-sm text-gray-600 flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                      Loading Gist files...
                    </div>
                  )}

                  {gistFiles.length > 0 && (
                    <div className="mt-3">
                      <label
                        htmlFor="gistFile"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Select File
                      </label>
                      <select
                        id="gistFile"
                        value={selectedFile || ""}
                        onChange={(e) => setSelectedFile(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {gistFiles.map((file) => (
                          <option key={file.filename} value={file.filename}>
                            {file.filename}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Found {gistFiles.length} valid Inscribed data files in
                        this Gist
                      </p>
                    </div>
                  )}
                </form>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">
                {selectedOption === "embed-presentation"
                  ? "Embed Presentation"
                  : selectedOption === "embed-slider-template"
                  ? "Embed Slider Template"
                  : "Shareable Link"}
              </h3>
              <textarea
                value={embedCode}
                readOnly
                onClick={(e) => e.currentTarget.select()}
                className={`w-full p-3 border rounded-md font-mono text-sm ${
                  selectedOption === "get-shareable-link" ? "h-12" : "h-32"
                }`}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(embedCode);
                    alert("Copied to clipboard!");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {selectedOption === "get-shareable-link"
                    ? "Copy Link"
                    : "Copy Code"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {!showEmbedCode && (
          <div className="p-4 border-t bg-gray-50 rounded-b-lg">
            <button
              type="submit"
              onClick={handleExport}
              disabled={
                !selectedOption ||
                (selectedOption === "export-data" && !exportFileName.trim()) ||
                (selectedOption === "gif" &&
                  (!exportFileName.trim() ||
                    !frameDelay ||
                    parseInt(frameDelay) < 1)) ||
                (selectedOption === "pdf" && !exportFileName.trim()) ||
                (selectedOption === "video" &&
                  (!exportFileName.trim() ||
                    !frameDelay ||
                    parseInt(frameDelay) < 1)) ||
                ((selectedOption === "embed-presentation" ||
                  selectedOption === "embed-slider-template" ||
                  selectedOption === "get-shareable-link" ||
                  selectedOption === "import-gist") &&
                  (!gistId.trim() || (gistFiles.length > 0 && !selectedFile)))
              }
              className={`w-full py-2 px-4 rounded-lg transition-colors ${
                selectedOption &&
                !(selectedOption === "export-data" && !exportFileName.trim()) &&
                !(
                  selectedOption === "gif" &&
                  (!exportFileName.trim() ||
                    !frameDelay ||
                    parseInt(frameDelay) < 1)
                ) &&
                !(selectedOption === "pdf" && !exportFileName.trim()) &&
                !(
                  selectedOption === "video" &&
                  (!exportFileName.trim() ||
                    !frameDelay ||
                    parseInt(frameDelay) < 1)
                ) &&
                !(
                  (selectedOption === "embed-presentation" ||
                    selectedOption === "embed-slider-template" ||
                    selectedOption === "get-shareable-link" ||
                    selectedOption === "import-gist") &&
                  (!gistId.trim() || (gistFiles.length > 0 && !selectedFile))
                )
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 cursor-not-allowed text-gray-500"
              }`}
            >
              {selectedOption === "import"
                ? "Upload File"
                : selectedOption === "import-gist"
                ? "Import"
                : selectedOption === "hand-drawn-video"
                ? "Preview and Self-Record"
                : selectedOption
                ? "Export"
                : "Select an option"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
