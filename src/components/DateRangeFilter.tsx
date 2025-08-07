import React, { useState } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, addDays, subDays } from 'date-fns';

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

interface DateRangeFilterProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  selectedRange,
  onRangeChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Helper function to get pay cycle dates (25th to 24th)
  const getPayCycleStart = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    if (day >= 25) {
      // If we're on or after the 25th, this pay cycle started on the 25th of this month
      return new Date(year, month, 25);
    } else {
      // If we're before the 25th, this pay cycle started on the 25th of last month
      return new Date(year, month - 1, 25);
    }
  };

  const getPayCycleEnd = (startDate: Date) => {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    // End date is 24th of next month
    return new Date(year, month + 1, 24);
  };

  const getCurrentPayCycle = () => {
    const today = new Date();
    const start = getPayCycleStart(today);
    const end = getPayCycleEnd(start);
    return { start, end };
  };

  const getPreviousPayCycle = (monthsBack: number) => {
    const today = new Date();
    const currentStart = getPayCycleStart(today);
    const targetStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - monthsBack, 25);
    const targetEnd = getPayCycleEnd(targetStart);
    return { start: targetStart, end: targetEnd };
  };
  const presetRanges: DateRange[] = [
    {
      startDate: format(getCurrentPayCycle().start, 'yyyy-MM-dd'),
      endDate: format(getCurrentPayCycle().end, 'yyyy-MM-dd'),
      label: 'Current Pay Cycle'
    },
    {
      startDate: format(getPreviousPayCycle(1).start, 'yyyy-MM-dd'),
      endDate: format(getPreviousPayCycle(1).end, 'yyyy-MM-dd'),
      label: 'Previous Pay Cycle'
    },
    {
      startDate: format(getPreviousPayCycle(2).start, 'yyyy-MM-dd'),
      endDate: format(getCurrentPayCycle().end, 'yyyy-MM-dd'),
      label: 'Last 3 Pay Cycles'
    },
    {
      startDate: format(getPreviousPayCycle(5).start, 'yyyy-MM-dd'),
      endDate: format(getCurrentPayCycle().end, 'yyyy-MM-dd'),
      label: 'Last 6 Pay Cycles'
    },
    {
      startDate: format(startOfYear(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfYear(new Date()), 'yyyy-MM-dd'),
      label: 'This Year'
    }
  ];

  const handlePresetSelect = (range: DateRange) => {
    onRangeChange(range);
    setIsOpen(false);
  };

  const handleCustomRange = () => {
    if (customStart && customEnd) {
      onRangeChange({
        startDate: customStart,
        endDate: customEnd,
        label: `${format(new Date(customStart), 'MMM d')} - ${format(new Date(customEnd), 'MMM d, yyyy')}`
      });
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        <Calendar className="h-4 w-4 mr-2" />
        {selectedRange.label}
        <Filter className="h-4 w-4 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filter by Date Range</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preset Ranges */}
            <div className="space-y-2 mb-6">
              <h4 className="text-sm font-medium text-gray-700">Quick Select</h4>
              {presetRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => handlePresetSelect(range)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                    selectedRange.label === range.label
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Custom Range */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Range</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={handleCustomRange}
                disabled={!customStart || !customEnd}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Apply Custom Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Default date range (current month)
export const getDefaultDateRange = (): DateRange => ({
  startDate: format((() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
    if (day >= 25) {
      return new Date(year, month, 25);
    } else {
      return new Date(year, month - 1, 25);
    }
  })(), 'yyyy-MM-dd'),
  endDate: format((() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
    if (day >= 25) {
      return new Date(year, month + 1, 24);
    } else {
      return new Date(year, month, 24);
    }
  })(), 'yyyy-MM-dd'),
  label: 'Current Pay Cycle'
});