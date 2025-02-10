import React from "react";
import { EmbedPage } from "./pages/embed/EmbedPage";
import { EmbedSlider } from "./pages/embed/EmbedSlider";
import { MainApp } from "./pages/MainApp";

const App: React.FC = () => {
  // Parse URL parameters
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  const gistUrl = params.get("gist_url");

  // Render embed view or main app
  if (type === "presentation" && gistUrl) {
    return <EmbedPage gistUrl={gistUrl} />;
  }

  if (type === "slider-template" && gistUrl) {
    return <EmbedSlider gistUrl={gistUrl} />;
  }

  return <MainApp />;
};

export default App;
