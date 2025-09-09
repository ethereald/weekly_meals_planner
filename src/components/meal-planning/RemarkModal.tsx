'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface RemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  onRemarkChange?: () => void; // Callback to refresh the parent component
}

export default function RemarkModal({ isOpen, onClose, date, onRemarkChange }: RemarkModalProps) {
  const [remark, setRemark] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedRemark, setEditedRemark] = useState('');

  const dateString = format(date, 'yyyy-MM-dd');

  // Load remark when modal opens
  useEffect(() => {
    if (isOpen) {
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
            setEditedRemark(remarkText);
          }
        } catch (error) {
          console.error('Failed to load remark:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadRemark();
    }
  }, [isOpen, dateString]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editedRemark.trim()) {
        // Save remark
        const response = await fetch('/api/daily-remarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            date: dateString,
            remark: editedRemark.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save remark');
        }
        
        setRemark(editedRemark.trim());
      } else {
        // Delete remark if empty
        await handleDelete();
      }
      
      setIsEditing(false);
      onRemarkChange?.(); // Notify parent component
    } catch (error) {
      console.error('Failed to save remark:', error);
      alert('Failed to save note. Please try again.');
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
        throw new Error('Failed to delete remark');
      }
      
      setRemark('');
      setEditedRemark('');
      setIsEditing(false);
      
      // Notify parent component and close modal
      onRemarkChange?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete remark:', error);
      alert('Failed to delete note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedRemark(remark);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setEditedRemark(remark);
    setIsEditing(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Note for {format(date, 'MMM d, yyyy')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading note...</span>
            </div>
          ) : isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  Edit note for {format(date, 'MMM d, yyyy')}
                </span>
              </div>
              
              <textarea
                value={editedRemark}
                onChange={(e) => setEditedRemark(e.target.value)}
                placeholder="Add a note about today's meals, how you felt, or anything noteworthy..."
                className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                disabled={isSaving}
              />
            </div>
          ) : remark ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1">
                  <div className="text-gray-900 whitespace-pre-wrap">{remark}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mb-4">No note found for this day</p>
              <button
                onClick={handleEdit}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Add a note
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 p-6 border-t border-gray-200">
          {isEditing ? (
            <>
              <div>
                {remark && (
                  <button
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? 'Deleting...' : 'Delete Note'}
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isSaving && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  )}
                  {isSaving ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                {remark && (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    Edit Note
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
