import React from "react";
import { Toolbar } from "../components/Toolbar";
import { SlideList } from "../components/SlideList";
import { Canvas } from "../components/Canvas";

export const MainApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Toolbar />
      <SlideList />
      <Canvas />
    </div>
  );
};
