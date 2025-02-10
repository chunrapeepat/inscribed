import React, { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useFontsStore } from "../store/custom-fonts";
import { parseFontFaces } from "../utils/fonts";

interface FontsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FontsManagerModal: React.FC<FontsManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { customFonts, addFonts, removeFont } = useFontsStore();
  const [embedCode, setEmbedCode] = useState("");

  if (!isOpen) return null;

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

    // fetch the font content
    const response = await fetch(fontUrl);
    const content = await response.text();
    const fontFaces = parseFontFaces(content);

    addFonts(fontFaces);
    setEmbedCode("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Manage Fonts</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
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

        <div className="p-4 border-t">
          <h3 className="text-lg font-medium mb-3">All Fonts</h3>
          <div className="space-y-2">
            {Object.entries(customFonts).map(([fontFamily, fontFaces]) => (
              <div
                key={fontFamily}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span style={{ fontFamily: fontFamily }}>{fontFamily}</span>
                <button
                  onClick={() => removeFont(fontFamily)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {Object.keys(customFonts).length === 0 && (
              <p className="text-gray-500 text-sm">No fonts added yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
