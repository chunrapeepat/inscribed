import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../store';

interface DocumentSizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentSizeModal: React.FC<DocumentSizeModalProps> = ({ isOpen, onClose }) => {
  const { documentSize, setDocumentSize } = useStore();
  const [width, setWidth] = useState(documentSize.width.toString());
  const [height, setHeight] = useState(documentSize.height.toString());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDocumentSize({
      width: Math.max(100, Math.min(4000, parseInt(width) || 1920)),
      height: Math.max(100, Math.min(4000, parseInt(height) || 1080))
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Document Size</h2>
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
              <label htmlFor="width" className="block text-sm font-medium text-gray-700">
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
              <label htmlFor="height" className="block text-sm font-medium text-gray-700">
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
            <div className="text-sm text-gray-500">
              <p>Recommended sizes:</p>
              <ul className="list-disc list-inside">
                <li>HD (1920 × 1080)</li>
                <li>4K (3840 × 2160)</li>
                <li>Square (1080 × 1080)</li>
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Size
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};