import React, { useState, useEffect } from "react";
import { Slider } from "@mui/material";
import { styled } from "@mui/material/styles";

interface SliderNavigationProps {
  currentSlide: number;
  totalSlides: number;
  onSlideChange: (slide: number) => void;
}

const StyledSlider = styled(Slider)({
  color: "#1a73e8",
  height: 8,
  width: "100%",
  maxWidth: "700px",
  transform: "translateY(3px)",
  "& .MuiSlider-thumb": {
    height: 15,
    width: 15,
    backgroundColor: "#fff",
    border: "2px solid currentColor",
    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
      boxShadow: "inherit",
    },
  },
  "& .MuiSlider-track": {
    height: 5,
    borderRadius: 4,
  },
  "& .MuiSlider-rail": {
    height: 5,
    borderRadius: 4,
    opacity: 0.3,
  },
});

export const SliderNavigation: React.FC<SliderNavigationProps> = ({
  currentSlide,
  totalSlides,
  onSlideChange,
}): JSX.Element => {
  const [inputValue, setInputValue] = useState((currentSlide + 1).toString());

  // Update input value when currentSlide changes
  useEffect(() => {
    setInputValue((currentSlide + 1).toString());
  }, [currentSlide]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (currentSlide < totalSlides - 1) {
          onSlideChange(currentSlide + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (currentSlide > 0) {
          onSlideChange(currentSlide - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, totalSlides, onSlideChange]);

  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center p-2 bg-gray-100 border-t border-gray-300 backdrop-blur z-20">
      <div className="flex items-center justify-center gap-3 w-full max-w-[1000px] px-4">
        <div className="flex items-center gap-2 min-w-[100px] justify-end">
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
                  onSlideChange(page);
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
            className="w-16 px-2 py-1.5 text-center border rounded bg-white"
          />
          <span className="text-sm text-gray-600 w-12">/ {totalSlides}</span>
        </div>

        <div className="flex-1">
          <StyledSlider
            value={currentSlide}
            onChange={(_, value) => onSlideChange(value as number)}
            min={0}
            max={totalSlides - 1}
            step={1}
          />
        </div>
      </div>

      <div className="absolute right-4">
        <a
          href="https://inscribed.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Made by inscribed.app
        </a>
      </div>
    </div>
  );
};
