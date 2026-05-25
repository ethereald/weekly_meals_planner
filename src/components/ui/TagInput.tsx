'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { TAG_COLORS } from '@/lib/utils/tagColors';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ selectedTags, onTagsChange, placeholder = "Type to add tags..." }: TagInputProps) {
  const [existingTags, setExistingTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch existing tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tags', {
          credentials: 'include',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setExistingTags(data.tags || []);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  // Filter tags based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = existingTags.filter(tag => 
        tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedTags.includes(tag.name)
      );
      setFilteredTags(filtered);
      setShowDropdown(true);
    } else {
      setFilteredTags([]);
      setShowDropdown(false);
    }
  }, [inputValue, existingTags, selectedTags]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === 'Backspace' && inputValue === '' && selectedTags.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  // Add a tag
  const addTag = (tagName: string) => {
    if (tagName && !selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName]);
      setInputValue('');
      setShowDropdown(false);
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  // Select tag from dropdown
  const selectTag = (tag: Tag) => {
    addTag(tag.name);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Resolve display colors: redistribute duplicate-colored existing tags
  const resolvedTagColors = useMemo(() => {
    const colorMap = new Map<string, string>(); // tag name -> display color
    const colorUsage = new Map<string, number>();
    existingTags.forEach(t => colorUsage.set(t.color, (colorUsage.get(t.color) || 0) + 1));
    const usedColors = new Set<string>();

    // First pass: tags with a unique stored color keep it
    existingTags.forEach(tag => {
      if ((colorUsage.get(tag.color) || 0) === 1) {
        colorMap.set(tag.name, tag.color);
        usedColors.add(tag.color);
      }
    });

    // Second pass: tags with duplicate stored colors get redistributed
    existingTags.forEach(tag => {
      if ((colorUsage.get(tag.color) || 0) > 1 && !colorMap.has(tag.name)) {
        let hash = 0;
        for (let i = 0; i < tag.name.length; i++) {
          hash = tag.name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hashColor = TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
        const assignedColor = usedColors.has(hashColor)
          ? (TAG_COLORS.find(c => !usedColors.has(c)) ?? hashColor)
          : hashColor;
        colorMap.set(tag.name, assignedColor);
        usedColors.add(assignedColor);
      }
    });

    return { colorMap, usedColors };
  }, [existingTags]);

  // Get tag color: resolved for existing tags, best-effort unique for new tags
  const getTagColor = (tagName: string) => {
    if (resolvedTagColors.colorMap.has(tagName)) {
      return resolvedTagColors.colorMap.get(tagName)!;
    }
    // New (unsaved) tag: hash-based but try to avoid colors used by existing tags
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hashColor = TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
    if (!resolvedTagColors.usedColors.has(hashColor)) return hashColor;
    return TAG_COLORS.find(c => !resolvedTagColors.usedColors.has(c)) ?? hashColor;
  };

  return (
    <div className="relative">
      <div className="w-full px-2 py-1 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white">
        <div className="flex flex-wrap gap-2 items-center">{/* Match Recipe Database gap-2 */}
          {/* Selected tags */}
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
              style={{ 
                backgroundColor: `${getTagColor(tag)}20`,
                color: getTagColor(tag),
                borderColor: `${getTagColor(tag)}60`
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:opacity-70 focus:outline-none"
                style={{ color: getTagColor(tag) }}
              >
                ×
              </button>
            </span>
          ))}
          
          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onFocus={() => inputValue && setShowDropdown(true)}
            placeholder={selectedTags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div ref={dropdownRef} className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading tags...</div>
          ) : (
            <>
              {filteredTags.length > 0 && (
                <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                  Existing tags
                </div>
              )}
              
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => selectTag(tag)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center gap-2"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  ></span>
                  <span className="text-sm">{tag.name}</span>
                </button>
              ))}
              
              {inputValue.trim() && !filteredTags.some(tag => tag.name.toLowerCase() === inputValue.toLowerCase()) && (
                <>
                  {filteredTags.length > 0 && <div className="border-t border-gray-200"></div>}
                  <button
                    type="button"
                    onClick={() => addTag(inputValue.trim())}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center gap-2"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getTagColor(inputValue.trim()) }}
                    ></span>
                    <span className="text-sm">
                      Create "<span className="font-medium">{inputValue.trim()}</span>"
                    </span>
                  </button>
                </>
              )}
              
              {filteredTags.length === 0 && !inputValue.trim() && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Type to search or create new tags
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {/* Help text */}
      <p className="text-xs text-gray-500 mt-1">
        Type tag names and press Enter or comma to add. Click × to remove.
      </p>
    </div>
  );
}
