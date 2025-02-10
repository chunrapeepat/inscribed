import React from "react";
import { EmbedPage } from "./pages/embed/EmbedPage";
import { MainApp } from "./pages/MainApp";

const App: React.FC = () => {
  // Parse URL parameters
  const params = new URLSearchParams(window.location.search);
  const isEmbed = params.get("type") === "slide";
  const gistUrl = params.get("gist_url");

  // Render embed view or main app
  if (isEmbed && gistUrl) {
    return <EmbedPage gistUrl={gistUrl} />;
  }

  return <MainApp />;
};

export default App;
