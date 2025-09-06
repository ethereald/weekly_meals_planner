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
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Title and Date Navigation */}
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Meal Planning</h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevious}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                    {getDateDisplay()}
                  </div>
                  <button
                    onClick={handleNext}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleToday}
                    className="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
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
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
