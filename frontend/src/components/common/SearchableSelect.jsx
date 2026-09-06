import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, UserPlus, X } from 'lucide-react';

export const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Search...',
  addNewLabel = 'Add new',
  onAddNew,
  required = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedOption = options.find((option) => String(option.value) === String(value));
  const selectedLabel = selectedOption?.label || (value ? String(value) : '');
  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleInputChange = (event) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setIsOpen(true);
    onChange(nextQuery);
  };

  const handleSelect = (option) => {
    onChange(option.value);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = (event) => {
    event.stopPropagation();
    setQuery('');
    onChange('');
    setIsOpen(true);
  };

  const handleAddNew = () => {
    setIsOpen(false);
    onAddNew(query.trim() || selectedLabel);
  };

  return (
    <div className="searchable-select" ref={containerRef}>
      <div className="searchable-select-input-wrap">
        <Search size={15} aria-hidden="true" />
        <input
          type="text"
          className="form-input searchable-select-input"
          value={query || selectedLabel}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required && !value}
          autoComplete="off"
        />
        {(query || selectedLabel) && (
          <button
            type="button"
            className="searchable-select-clear"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleClear}
            aria-label="Clear search"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown size={16} aria-hidden="true" />
      </div>

      {isOpen && (
        <div className="searchable-select-menu">
          <div className="searchable-select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  className={`searchable-select-option ${String(option.value) === String(value) ? 'is-selected' : ''}`}
                  key={option.value}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option)}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="searchable-select-empty">No matching results</div>
            )}
          </div>
          <button
            type="button"
            className="searchable-select-add"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleAddNew}
          >
            <UserPlus size={14} /> {addNewLabel}
          </button>
        </div>
      )}
    </div>
  );
};
