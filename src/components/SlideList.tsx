import React from 'react';
import { useStore } from '../store';
import { SlidePreview } from './SlidePreview';

export const SlideList: React.FC = () => {
  const { slides, currentSlideIndex, setCurrentSlide, reorderSlides } = useStore();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-t-2', 'border-blue-500');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('border-t-2', 'border-blue-500');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-t-2', 'border-blue-500');
    
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== toIndex) {
      reorderSlides(fromIndex, toIndex);
    }
  };

  return (
    <div className="fixed left-4 top-20 bottom-4 w-64 bg-white rounded-lg shadow-lg overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Slides</h2>
        <div className="space-y-4">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => setCurrentSlide(index)}
              className={`p-3 rounded-lg cursor-move transition-colors ${
                currentSlideIndex === index
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="text-gray-500 text-sm font-medium">Slide {index + 1}</div>
                <div className="flex-1 text-sm truncate">{slide.name}</div>
              </div>
              <SlidePreview elements={slide.elements} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};