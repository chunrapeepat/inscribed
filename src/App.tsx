import React from "react";
import { EmbedPage } from "./pages/embed/EmbedPage";
import { MainApp } from "./pages/MainApp";

const App: React.FC = () => {
  // Parse URL parameters
  const params = new URLSearchParams(window.location.search);
  const isEmbed = params.get("type") === "template";
  const gistId = params.get("gist_id");

  // Render embed view or main app
  if (isEmbed && gistId) {
    return <EmbedPage gistId={gistId} />;
  }

  return <MainApp />;
};

export default App;
