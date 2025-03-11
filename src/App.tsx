import React from "react";
import { PresentationEmbed } from "./pages/embed/PresentationEmbed";
import { SliderEmbed } from "./pages/embed/SliderEmbed";
import { InscribedEditor } from "./pages/InscribedEditor";

const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  const gistUrl = params.get("gist_url");
  const pathname = window.location.pathname;

  // Check if we're on the /share path
  const isSharePath = pathname.startsWith("/share");
  // Check if we're on the /embed path
  const isEmbedPath = pathname.startsWith("/embed");

  // Render share or embed view or main app
  if ((isSharePath || isEmbedPath) && type === "presentation" && gistUrl) {
    return <PresentationEmbed gistUrl={gistUrl} />;
  }
  if ((isSharePath || isEmbedPath) && type === "slider-template" && gistUrl) {
    return <SliderEmbed gistUrl={gistUrl} />;
  }

  return <InscribedEditor />;
};

export default App;
