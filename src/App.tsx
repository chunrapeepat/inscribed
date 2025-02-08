import React from 'react';
import { Toolbar } from './components/Toolbar';
import { SlideList } from './components/SlideList';
import { Canvas } from './components/Canvas';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Toolbar />
      <SlideList />
      <Canvas />
    </div>
  );
}

export default App;