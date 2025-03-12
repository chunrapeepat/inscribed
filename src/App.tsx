import React from "react";
import { PresentationEmbed } from "./pages/embed/PresentationEmbed";
import { SliderEmbed } from "./pages/embed/SliderEmbed";
import { InscribedEditor } from "./pages/InscribedEditor";

const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname;

  // Check if we're on the /share path
  const isSharePath = pathname.startsWith("/share");
  // Check if we're on the /embed path
  const isEmbedPath = pathname.startsWith("/embed");
  
  let type: string | null;
  let gistUrl: string | null;
  let filename: string | undefined;
  
  // New format for /share path
  if (isSharePath) {
    const gistParam = params.get("gist");
    if (gistParam) {
      // For share URLs, default to presentation type if not specified
      type = params.get("type") || "presentation";
      // Convert username/gistid to full gist URL
      gistUrl = `https://gist.github.com/${gistParam}`;
      // Get filename from params
      filename = params.get("filename") || undefined;
    } else {
      // Legacy format fallback for /share (shouldn't happen with new links)
      type = params.get("type");
      gistUrl = params.get("gist_url");
      filename = params.get("filename") || undefined;
    }
  } else {
    // Original format for non-share paths (like /embed)
    type = params.get("type");
    gistUrl = params.get("gist_url");
    filename = params.get("filename") || undefined;
  }

  // Render share or embed view or main app
  if ((isSharePath || isEmbedPath) && type === "presentation" && gistUrl) {
    return <PresentationEmbed gistUrl={gistUrl} filename={filename} />;
  }
  if ((isSharePath || isEmbedPath) && type === "slider-template" && gistUrl) {
    return <SliderEmbed gistUrl={gistUrl} filename={filename} />;
  }

  return <InscribedEditor />;
};

export default App;
