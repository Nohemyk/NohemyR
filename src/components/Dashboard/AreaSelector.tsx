import React from 'react';
import { ChevronDown, Building2 } from 'lucide-react';
import { Area } from '../../types';

interface AreaSelectorProps {
  areas: Area[];
  selectedArea: string;
  onAreaChange: (areaId: string) => void;
}

export const AreaSelector: React.FC<AreaSelectorProps> = ({
  areas,
  selectedArea,
  onAreaChange,
}) => {
  const selectedAreaData = areas.find(area => area.id === selectedArea);

  return (
    <div className="relative">
      <div className="flex items-center space-x-3 bg-white rounded-lg border border-gray-200 px-4 py-2 shadow-sm">
        <Building2 className="w-5 h-5 text-gray-400" />
        <select
          value={selectedArea}
          onChange={(e) => onAreaChange(e.target.value)}
          className="bg-transparent border-none focus:outline-none text-sm font-medium text-gray-700 pr-8 appearance-none cursor-pointer"
        >
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {selectedAreaData && (
        <div className="flex items-center mt-2">
          <div
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: selectedAreaData.color }}
          />
          <span className="text-xs text-gray-500 font-medium">
            {selectedAreaData.code}
          </span>
        </div>
      )}
    </div>
  );
};