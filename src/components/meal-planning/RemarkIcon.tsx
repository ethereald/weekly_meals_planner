'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import RemarkModal from './RemarkModal';

interface RemarkIconProps {
  date: Date;
  className?: string;
  size?: 'small' | 'medium';
  showAddButton?: boolean; // New prop to show "add" button when no remark exists
  externalRefreshTrigger?: number; // External trigger for forcing refresh
  onRemarkChange?: () => void; // Callback when remark changes
}

export default function RemarkIcon({ 
  date, 
  className = '', 
  size = 'small', 
  showAddButton = false,
  externalRefreshTrigger = 0,
  onRemarkChange 
}: RemarkIconProps) {
  const [hasRemark, setHasRemark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const dateString = format(date, 'yyyy-MM-dd');

  // Load remark for the date
  useEffect(() => {
    const loadRemark = async () => {
      setIsLoading(true); // Always set loading to true when starting
      try {
        const response = await fetch(`/api/daily-remarks?date=${dateString}`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          const remarkText = data.remark?.remark || '';
          setHasRemark(!!remarkText);
        } else {
          // If response is not ok, assume no remark exists
          setHasRemark(false);
        }
      } catch (error) {
        console.error('Failed to load remark:', error);
        setHasRemark(false); // Set to false on error
      } finally {
        setIsLoading(false);
      }
    };

    loadRemark();
  }, [dateString, refreshTrigger, externalRefreshTrigger]); // Add externalRefreshTrigger to dependency array

  const handleRemarkChange = () => {
    setRefreshTrigger(prev => prev + 1); // Force refresh
    onRemarkChange?.(); // Call external callback if provided
  };

  // Show small placeholder while loading
  if (isLoading) {
    const iconSize = size === 'small' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className={`${iconSize} opacity-30 ${className}`}>
        <div className={`${iconSize} bg-gray-200 rounded animate-pulse`}></div>
      </div>
    );
  }

  // If no remark exists, show add button only if showAddButton is true
  if (!hasRemark && !showAddButton) {
    return null;
  }

  const iconSize = size === 'small' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <>
      <button
        className={`transition-colors flex items-center justify-center ${
          hasRemark 
            ? 'text-blue-600 hover:text-blue-700' 
            : 'text-gray-400 hover:text-gray-600'
        } ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        title={hasRemark ? `Note for ${format(date, 'MMM d')}` : `Add note for ${format(date, 'MMM d')}`}
      >
        {hasRemark ? (
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        ) : (
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 4v16m8-8H4" 
            />
          </svg>
        )}
      </button>

      <RemarkModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        date={date}
        onRemarkChange={handleRemarkChange}
      />
    </>
  );
}
