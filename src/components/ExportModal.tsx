import React from 'react';
import { X } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const exportOptions = [
    {
      id: 'gif',
      title: 'Export as GIF',
      description: 'Create an animated GIF of your slides',
    },
    {
      id: 'template',
      title: 'Export as Template',
      description: 'Save your slides as a reusable template',
    },
    {
      id: 'slider',
      title: 'Export as Slider',
      description: 'Create a standalone presentation viewer',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Export Presentation</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {exportOptions.map((option) => (
            <div
              key={option.id}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
            >
              <h3 className="font-medium text-lg">{option.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{option.description}</p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};