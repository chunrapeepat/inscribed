import React, { useEffect, useRef } from 'react';
import { exportToSvg } from '@excalidraw/excalidraw';
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

interface SlidePreviewProps {
  elements: ExcalidrawElement[];
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({ elements }) => {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generatePreview = async () => {
      if (!previewRef.current) return;

      try {
        const svg = await exportToSvg({
          elements,
          appState: {
            viewBackgroundColor: '#ffffff',
            exportWithDarkMode: false,
          },
          files: null,
        });

        // Clear previous content
        previewRef.current.innerHTML = '';
        
        // Scale and append the SVG
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.backgroundColor = 'white';
        previewRef.current.appendChild(svg);
      } catch (error) {
        console.error('Failed to generate preview:', error);
      }
    };

    generatePreview();
  }, [elements]);

  return (
    <div 
      ref={previewRef}
      className="w-full h-20 bg-white rounded border border-gray-200 overflow-hidden"
    />
  );
};