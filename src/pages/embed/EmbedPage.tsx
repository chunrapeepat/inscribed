import React from "react";
import { Canvas } from "../../components/Canvas";
import { useStore } from "../../store/document";

interface EmbedPageProps {
  gistId: string;
}

export const EmbedPage: React.FC<EmbedPageProps> = ({ gistId }) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const documentStore = useStore();

  React.useEffect(() => {
    const loadTemplate = async () => {
      try {
        // TODO: Implement Gist loading logic
        // const data = await fetchGistData(gistId);
        // documentStore.resetStore(data);
        console.log("Loading template with gist ID:", gistId);
        setLoading(false);
      } catch (error: unknown) {
        console.error("Failed to load template:", error);
        setError("Failed to load template");
        setLoading(false);
      }
    };

    loadTemplate();
  }, [gistId, documentStore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading template...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <Canvas readOnly={true} />
    </div>
  );
};
