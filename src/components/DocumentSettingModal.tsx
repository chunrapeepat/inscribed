import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  DEFAULT_FRAME_HEIGHT,
  DEFAULT_FRAME_WIDTH,
  useDocumentStore,
} from "../store/document";
import { HexColorPicker } from "react-colorful";

interface DocumentSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentSettingModal: React.FC<DocumentSettingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { documentSize, setDocumentSize, backgroundColor, setBackgroundColor } =
    useDocumentStore();
  const [width, setWidth] = useState(documentSize.width.toString());
  const [height, setHeight] = useState(documentSize.height.toString());
  const [color, setColor] = useState(backgroundColor);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // ESC shortcut
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDocumentSize({
      width: Math.max(
        100,
        Math.min(
          DEFAULT_FRAME_WIDTH * 5,
          parseInt(width) || DEFAULT_FRAME_WIDTH
        )
      ),
      height: Math.max(
        100,
        Math.min(
          DEFAULT_FRAME_HEIGHT * 5,
          parseInt(height) || DEFAULT_FRAME_HEIGHT
        )
      ),
    });
    setBackgroundColor(color);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Document Setting</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="width"
                className="block text-sm font-medium text-gray-700"
              >
                Width (px)
              </label>
              <input
                type="number"
                id="width"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="100"
                max="4000"
                required
              />
            </div>
            <div>
              <label
                htmlFor="height"
                className="block text-sm font-medium text-gray-700"
              >
                Height (px)
              </label>
              <input
                type="number"
                id="height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="100"
                max="4000"
                required
              />
            </div>
            <div>
              <label
                htmlFor="backgroundColor"
                className="block text-sm font-medium text-gray-700"
              >
                Background Color
              </label>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-10 h-10 rounded border border-gray-300"
                  style={{ backgroundColor: color }}
                  aria-label="Choose background color"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="#FFFFFF"
                />
              </div>
              {showColorPicker && (
                <div className="absolute mt-2 z-10">
                  <div
                    className="fixed inset-0"
                    onClick={() => setShowColorPicker(false)}
                  />
                  <HexColorPicker
                    color={color}
                    onChange={setColor}
                    className="relative"
                  />
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              <p>Recommanded size:</p>
              <ul className="list-disc list-inside">
                <li>16:9 Widescreen (1920 × 1080)</li>
                <li>4:3 Standard (1600 × 1200)</li>
                <li>1:1 Square (1080 × 1080)</li>
                <li>9:16 Portrait (1080 × 1920)</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Change
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
