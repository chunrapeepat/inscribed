import React from "react";
import { PresentationEmbed } from "./pages/embed/PresentationEmbed";
import { SliderEmbed } from "./pages/embed/SliderEmbed";
import { InscribedEditor } from "./pages/InscribedEditor";

const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  const gistUrl = params.get("gist_url");

  // Render embed view or main app
  if (type === "presentation" && gistUrl) {
    return <PresentationEmbed gistUrl={gistUrl} />;
  }
  if (type === "slider-template" && gistUrl) {
    return <SliderEmbed gistUrl={gistUrl} />;
  }

  return <InscribedEditor />;
};

export default App;
