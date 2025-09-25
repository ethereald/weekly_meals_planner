'use client';

import { useState, useRef, useEffect } from 'react';
import { format, parse, isValid } from 'date-fns';
import Calendar from './Calendar';

interface DatePickerProps {
  value?: string; // ISO date string (YYYY-MM-DD)
  onChange: (dateString: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  className = '',
  id,
  required = false,
  disabled = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input value when value prop changes
  useEffect(() => {
    if (value) {
      try {
        const date = parse(value, 'yyyy-MM-dd', new Date());
        if (isValid(date)) {
          setInputValue(format(date, 'MMM d, yyyy'));
        } else {
          setInputValue(value);
        }
      } catch (error) {
        setInputValue(value);
      }
    } else {
      setInputValue('');
    }
  }, [value]);

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    onChange(dateString);
    setIsOpen(false);
  };

  // Handle input change (for manual typing)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Try to parse the input as various date formats
    const formats = ['MMM d, yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'M/d/yyyy'];
    
    for (const formatStr of formats) {
      try {
        const parsedDate = parse(newValue, formatStr, new Date());
        if (isValid(parsedDate)) {
          const dateString = format(parsedDate, 'yyyy-MM-dd');
          onChange(dateString);
          return;
        }
      } catch (error) {
        // Continue to next format
      }
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // If input is invalid, reset to the current value
    if (value) {
      try {
        const date = parse(value, 'yyyy-MM-dd', new Date());
        if (isValid(date)) {
          setInputValue(format(date, 'MMM d, yyyy'));
        }
      } catch (error) {
        setInputValue('');
      }
    } else {
      setInputValue('');
    }
  };

  // Get selected date for calendar
  const selectedDate = value ? (() => {
    try {
      const date = parse(value, 'yyyy-MM-dd', new Date());
      return isValid(date) ? date : undefined;
    } catch (error) {
      return undefined;
    }
  })() : undefined;

  return (
    <div ref={containerRef} className="relative">
      {/* Input field with calendar icon */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-10 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all ${className}`}
          autoComplete="off"
          title="You can type a date (e.g., 'Oct 25, 2025' or '10/25/2025') or use the calendar"
        />
        
        {/* Calendar icon button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Calendar dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full sm:w-auto animate-in slide-in-from-top-2 duration-200">
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onClose={() => setIsOpen(false)}
            minDate={minDate}
            maxDate={maxDate}
            className="shadow-2xl border-2 w-full sm:w-auto"
          />
        </div>
      )}
    </div>
  );
}