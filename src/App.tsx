import React from "react";
import { Embed } from "./pages/Embed";
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

      // Check if the gist parameter is a full raw URL
      if (gistParam.includes("raw")) {
        gistUrl = gistParam; // Use the raw URL directly
      } else if (gistParam.startsWith("https://gist.github.com/")) {
        gistUrl = gistParam; // Use the full gist URL directly
      } else {
        // Convert username/gistid to full gist URL
        gistUrl = `https://gist.github.com/${gistParam}`;
      }

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

  // Render embed view or main app
  if (
    (isSharePath || isEmbedPath) &&
    (type === "presentation" || type === "slider-template") &&
    gistUrl
  ) {
    return (
      <Embed
        gistUrl={gistUrl}
        filename={filename}
        type={type as "presentation" | "slider-template"}
      />
    );
  }

  return <InscribedEditor />;
};

export default App;
