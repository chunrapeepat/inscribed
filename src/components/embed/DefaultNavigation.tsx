import React, { useState, useEffect } from "react";

interface DefaultNavigationProps {
  currentSlide: number;
  totalSlides: number;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  onJumpToSlide?: (slide: number) => void;
}

export const DefaultNavigation: React.FC<DefaultNavigationProps> = ({
  currentSlide,
  totalSlides,
  onNextSlide,
  onPrevSlide,
  onJumpToSlide,
}) => {
  const [inputValue, setInputValue] = useState((currentSlide + 1).toString());

  // update input value when currentSlide changes
  useEffect(() => {
    setInputValue((currentSlide + 1).toString());
  }, [currentSlide]);

  return (
    <div
      className="flex items-center justify-center gap-4 p-2 
                    bg-gray-100 border-t border-gray-300 backdrop-blur z-20"
    >
      <button
        onClick={onPrevSlide}
        className="p-2 rounded-lg hover:bg-white/80 disabled:opacity-50 transition-colors"
        disabled={currentSlide === 0}
      >
        ←
      </button>

      <div className="flex items-center gap-2 px-2 border-l border-r border-gray-200">
        <input
          type="number"
          min={1}
          max={totalSlides}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const page = parseInt(inputValue) - 1;
              if (!isNaN(page) && page >= 0 && page < totalSlides) {
                onJumpToSlide?.(page);
              } else {
                // Reset to current slide if invalid
                setInputValue((currentSlide + 1).toString());
              }
            }
          }}
          onBlur={() => {
            // Reset to current slide on blur
            setInputValue((currentSlide + 1).toString());
          }}
          className="w-16 px-2 py-1 text-center border rounded bg-white"
        />
        <span className="text-sm text-gray-600">/ {totalSlides}</span>
      </div>

      <button
        onClick={onNextSlide}
        className="p-2 rounded-lg hover:bg-white/80 disabled:opacity-50 transition-colors"
        disabled={currentSlide === totalSlides - 1}
      >
        →
      </button>
    </div>
  );
};
