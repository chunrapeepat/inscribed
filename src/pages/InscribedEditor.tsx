import React, { useState, useEffect } from "react";
import { Toolbar } from "../components/Toolbar";
import { SlideList } from "../components/SlideList";
import { Canvas } from "../components/Canvas";

export const InscribedEditor: React.FC = () => {
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);

  useEffect(() => {
    // Check if the device is mobile using window width
    const isMobile = window.innerWidth <= 768;
    setShowMobileOverlay(isMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 relative">
      <Toolbar />
      <SlideList />
      <Canvas />

      <a
        href="https://github.com/chunrapeepat/inscribed/issues/new"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-[-40px] top-1/2 transform -translate-y-1/2 -rotate-90 bg-white shadow-md hover:shadow-lg rounded-lg px-4 py-2 hover:bg-gray-50 transition-all duration-200 border border-gray-200"
      >
        Feedback
      </a>

      {/* Mobile overlay */}
      {showMobileOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm text-center">
            <h2 className="text-xl font-semibold mb-4">
              Desktop Experience Recommended
            </h2>
            <p className="mb-6">
              This website is optimized for desktop viewing. For the best
              experience, please use a desktop or laptop computer.
            </p>
            <button
              onClick={() => setShowMobileOverlay(false)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              I understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
