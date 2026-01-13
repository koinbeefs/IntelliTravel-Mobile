// src/components/MapLayerSwitcher.jsx
import { useState } from 'react';
import { Layers } from 'lucide-react';

export default function MapLayerSwitcher({ currentLayer, onLayerChange }) {
  const [open, setOpen] = useState(false);

  const layers = [
    { id: 'street', label: 'Street Map' },
    { id: 'outdoors', label: 'Outdoors' },
    { id: 'satellite', label: 'Satellite' },
  ];

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Layers size={18} className="text-gray-500" />
        <span>
          {layers.find(l => l.id === currentLayer)?.label || 'Map Layer'}
        </span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          className="
            absolute 
            top-full mt-2  /* ensures it opens downward */
            right-0
            w-44
            bg-white 
            rounded-xl 
            shadow-xl 
            border border-gray-100 
            z-50
          "
        >
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => {
                onLayerChange(layer.id);
                setOpen(false);
              }}
              className={`
                w-full text-left px-3 py-2 text-sm flex items-center justify-between
                ${currentLayer === layer.id 
                  ? 'bg-blue-50 text-blue-700 font-semibold' 
                  : 'hover:bg-gray-50 text-gray-700'}
              `}
            >
              <span>{layer.label}</span>
              {currentLayer === layer.id && (
                <span className="text-xs text-blue-600">Selected</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
