'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';

interface MealPlanningLayoutProps {
  children: React.ReactNode;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  view: 'daily' | 'weekly' | 'monthly';
  onViewChange: (view: 'daily' | 'weekly' | 'monthly') => void;
}

export default function MealPlanningLayout({
  children,
  currentDate,
  onDateChange,
  view,
  onViewChange
}: MealPlanningLayoutProps) {
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'daily') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (view === 'weekly') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'daily') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (view === 'weekly') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getDateDisplay = () => {
    if (view === 'daily') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (view === 'weekly') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${format(startOfWeek, 'MMM d')} - ${format(endOfWeek, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-gray-50 pb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col gap-3 sm:gap-4">
              {/* Title Row */}
              <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <Link
                    href="/"
                    className="p-1 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </Link>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Meal Planning</h1>
                </div>
                
                {/* View Toggle - Desktop Only */}
                <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                  {([
                    { 
                      value: 'daily', 
                      label: 'Daily',
                      icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707' 
                    },
                    { 
                      value: 'weekly', 
                      label: 'Weekly',
                      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' 
                    },
                    { 
                      value: 'monthly', 
                      label: 'Monthly',
                      icon: 'M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' 
                    }
                  ] as const).map((viewOption) => (
                    <button
                      key={viewOption.value}
                      onClick={() => onViewChange(viewOption.value)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        view === viewOption.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={viewOption.icon} />
                      </svg>
                      {viewOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile View Toggle - Separate Row */}
              <div className="sm:hidden">
                <div className="grid grid-cols-3 gap-2 bg-gray-100 rounded-lg p-2">
                  {([
                    { 
                      value: 'daily', 
                      label: 'Day',
                      icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707' 
                    },
                    { 
                      value: 'weekly', 
                      label: 'Week',
                      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' 
                    },
                    { 
                      value: 'monthly', 
                      label: 'Month',
                      icon: 'M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' 
                    }
                  ] as const).map((viewOption) => (
                    <button
                      key={viewOption.value}
                      onClick={() => onViewChange(viewOption.value)}
                      className={`flex flex-col items-center gap-1 px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                        view === viewOption.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={viewOption.icon} />
                      </svg>
                      {viewOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Navigation Row */}
              <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                <button
                  onClick={handlePrevious}
                  className="p-1 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="text-base sm:text-lg font-semibold text-gray-900 text-center sm:text-left flex-1 sm:flex-initial min-w-0 px-2">
                  <div className="truncate">
                    {getDateDisplay()}
                  </div>
                </div>
                
                <button
                  onClick={handleNext}
                  className="p-1 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <button
                  onClick={handleToday}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex-shrink-0"
                >
                  Today
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
