'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, addMonths, subMonths, isToday } from 'date-fns';

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  onClose?: () => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export default function Calendar({
  selectedDate,
  onDateSelect,
  onClose,
  minDate,
  maxDate,
  className = ''
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Get all days to display in the calendar
  const getDaysInCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Start on Sunday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  // Check if a date is selectable
  const isDateSelectable = (date: Date) => {
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return true;
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (!isDateSelectable(date)) return;
    onDateSelect(date);
  };

  const days = getDaysInCalendar();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-xl p-5 min-w-[280px] ${className}`}>
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
          title="Previous month"
        >
          <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900 select-none">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
          title="Next month"
        >
          <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2 select-none">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);
          const isSelectable = isDateSelectable(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={!isSelectable}
              className={`
                relative w-10 h-10 text-sm rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                ${isSelected
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : isCurrentDay
                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm'
                    : isCurrentMonth
                      ? isSelectable
                        ? 'text-gray-900 hover:bg-gray-100 hover:shadow-sm'
                        : 'text-gray-400 cursor-not-allowed opacity-60'
                      : isSelectable
                        ? 'text-gray-400 hover:bg-gray-50'
                        : 'text-gray-300 cursor-not-allowed opacity-40'
                }
              `}
            >
              {format(day, 'd')}
              {isCurrentDay && !isSelected && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer with quick actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleDateClick(new Date())}
            className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleDateClick(addDays(new Date(), 1))}
            className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            Tomorrow
          </button>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}