import React from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { useStore } from '../store';

export const Canvas: React.FC = () => {
  const { slides, currentSlideIndex, updateSlide, documentSize } = useStore();
  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="fixed left-72 top-20 right-4 bottom-4 bg-white rounded-lg shadow-lg overflow-hidden">
      <Excalidraw
        initialData={{
          elements: currentSlide.elements,
          appState: {
            viewBackgroundColor: '#ffffff',
            width: documentSize.width,
            height: documentSize.height,
          },
        }}
        onChange={(elements) => {
          updateSlide(currentSlideIndex, elements);
        }}
      />
    </div>
  );
};