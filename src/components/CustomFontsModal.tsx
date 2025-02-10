import React, { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useFontsStore } from "../store/custom-fonts";
import {
  type FontFace as CustomFontFace,
  getExcalidrawFontId,
  parseFontFaces,
} from "../utils/fonts";
import { FONT_FAMILY } from "@excalidraw/excalidraw";

interface CustomFontsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomFontsModal: React.FC<CustomFontsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { customFonts, addFonts, removeFont } = useFontsStore();
  const [embedCode, setEmbedCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Add ref for the search input
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [hasInitiallyFocused, setHasInitiallyFocused] = useState(false);

  // Modify useEffect to only focus on initial open
  useEffect(() => {
    if (isOpen && !hasInitiallyFocused) {
      const timeoutId = setTimeout(() => {
        searchInputRef.current?.focus();
        setHasInitiallyFocused(true);
      }, 0);

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      window.addEventListener("keydown", handleEscape);
      return () => {
        window.removeEventListener("keydown", handleEscape);
        clearTimeout(timeoutId);
      };
    }

    // Reset the focus state when modal closes
    if (!isOpen) {
      setHasInitiallyFocused(false);
    }
  }, [isOpen, onClose, hasInitiallyFocused]);

  const registerExcalidrawFonts = (fontFaces: CustomFontFace[]) => {
    fontFaces.forEach((fontFace) => {
      document.fonts.add(
        new FontFace(fontFace.fontFamily, fontFace.src, {
          style: fontFace.fontStyle,
          weight: fontFace.fontWeight.toString(),
          unicodeRange: fontFace.unicodeRange,
        })
      );
    });

    // register fonts to Excalidraw
    const fontFamilies = [
      ...new Set(fontFaces.map((fontFace) => fontFace.fontFamily)),
    ];
    fontFamilies.forEach((fontFamily) => {
      (FONT_FAMILY as { [k: string]: number })[fontFamily] =
        getExcalidrawFontId(fontFamily);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const linkPattern =
      /href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/;
    const importPattern =
      /@import url\(['"]?(https:\/\/fonts\.googleapis\.com\/css2\?[^'"]+)['"]?\)/;

    const linkMatch = embedCode.match(linkPattern);
    const importMatch = embedCode.match(importPattern);

    const fontUrl = linkMatch?.[1] || importMatch?.[1];
    if (!fontUrl) {
      alert("Invalid Google Fonts embed code");
      return;
    }

    const response = await fetch(fontUrl);
    const content = await response.text();
    const fontFaces = parseFontFaces(content);

    addFonts(fontFaces);
    setEmbedCode("");
  };

  useEffect(() => {
    const unregisteredFonts: CustomFontFace[] = [];
    Object.entries(customFonts).forEach(([fontFamily, fontFaces]) => {
      fontFaces.forEach((fontFace) => {
        const ff = new FontFace(fontFamily, fontFace.src, {
          style: fontFace.fontStyle,
          weight: fontFace.fontWeight.toString(),
          unicodeRange: fontFace.unicodeRange,
        });
        if (!document.fonts.has(ff)) {
          unregisteredFonts.push(fontFace);
        }
      });
    });
    registerExcalidrawFonts(unregisteredFonts);
  }, [customFonts]);

  const handleFontClick = (fontFamily: string) => {
    const event = new CustomEvent("fontSelected", {
      detail: { fontFamily },
    });
    window.dispatchEvent(event);
    onClose();
  };

  if (!isOpen) return null;

  const filteredFonts = Object.entries(customFonts).filter(([fontFamily]) =>
    fontFamily.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md border-b">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-semibold">Custom Fonts</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="mb-3">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search fonts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {filteredFonts.map(([fontFamily]) => (
              <div
                key={fontFamily}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span
                  style={{ fontFamily: fontFamily }}
                  onClick={() => handleFontClick(fontFamily)}
                  className="cursor-pointer hover:opacity-75"
                >
                  {fontFamily}
                </span>
                <button
                  onClick={() => removeFont(fontFamily)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {filteredFonts.length === 0 && (
              <p className="text-gray-500 text-sm">
                {Object.keys(customFonts).length === 0
                  ? "No fonts added yet"
                  : "No matching fonts found"}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label
              htmlFor="embedCode"
              className="block text-sm font-medium text-gray-700"
            >
              Google Fonts Embed Code
            </label>
            <textarea
              id="embedCode"
              value={embedCode}
              onChange={(e) => setEmbedCode(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px]"
              placeholder="Paste Google Fonts <link> tag here..."
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Font
          </button>
        </form>
      </div>
    </div>
  );
};
