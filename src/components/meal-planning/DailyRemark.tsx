'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface DailyRemarkProps {
  date: Date;
  onRemarkChange?: (remark: string | null) => void;
}

export default function DailyRemark({ date, onRemarkChange }: DailyRemarkProps) {
  const [remark, setRemark] = useState('');
  const [originalRemark, setOriginalRemark] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const dateString = format(date, 'yyyy-MM-dd');

  // Load existing remark for the date
  useEffect(() => {
    const loadRemark = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/daily-remarks?date=${dateString}`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          const remarkText = data.remark?.remark || '';
          setRemark(remarkText);
          setOriginalRemark(remarkText);
          onRemarkChange?.(remarkText || null);
        }
      } catch (error) {
        console.error('Failed to load daily remark:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRemark();
  }, [dateString, onRemarkChange]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (remark.trim()) {
        // Save remark
        const response = await fetch('/api/daily-remarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            date: dateString,
            remark: remark.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
          console.error('Failed to save remark:', errorMessage, errorData);
          throw new Error(`Failed to save remark: ${errorMessage}`);
        }
        
        onRemarkChange?.(remark.trim());
      } else {
        // Delete remark if empty
        const response = await fetch(`/api/daily-remarks?date=${dateString}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
          console.error('Failed to delete remark:', errorMessage, errorData);
          throw new Error(`Failed to delete remark: ${errorMessage}`);
        }
        
        onRemarkChange?.(null);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save daily remark:', error);
      alert(`Failed to save remark: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/daily-remarks?date=${dateString}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Failed to delete remark:', errorMessage, errorData);
        throw new Error(`Failed to delete remark: ${errorMessage}`);
      }
      
      setRemark('');
      setOriginalRemark('');
      onRemarkChange?.(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to delete daily remark:', error);
      alert(`Failed to delete note: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload the original remark
    const loadRemark = async () => {
      try {
        const response = await fetch(`/api/daily-remarks?date=${dateString}`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          const remarkText = data.remark?.remark || '';
          setRemark(remarkText);
          setOriginalRemark(remarkText);
        }
      } catch (error) {
        console.error('Failed to reload daily remark:', error);
      }
    };
    loadRemark();
  };

  if (isLoading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
          <span className="text-sm text-yellow-700">Loading remark...</span>
        </div>
      </div>
    );
  }

  if (!isEditing && !remark) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-sm text-blue-700 font-medium">Add a note for today</span>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Add Note
          </button>
        </div>
      </div>
    );
  }

  if (!isEditing && remark) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1">
            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-medium text-green-700 mb-1">Today's Note</div>
              <div className="text-sm text-green-600">{remark}</div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-green-600 hover:text-green-700 font-medium flex-shrink-0"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span className="text-sm font-medium text-gray-700">
          Note for {format(date, 'MMMM d, yyyy')}
        </span>
      </div>
      
      <textarea
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
        placeholder="Add a note about today's meals, how you felt, or anything noteworthy..."
        className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={3}
        disabled={isSaving}
      />
      
      <div className="flex items-center justify-between gap-2 mt-3">
        <div>
          {/* Only show delete button if there was an original remark */}
          {originalRemark && (
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="px-3 py-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 font-medium"
            >
              {isSaving ? 'Deleting...' : 'Delete Note'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            )}
            {isSaving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
