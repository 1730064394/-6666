import { useState } from 'react';
import { SearchRequest } from '../types';

interface SearchFormProps {
  onSearch: (request: SearchRequest) => void;
  isLoading: boolean;
}

const PLATFORMS = [
  { value: 'all', label: 'All Platforms' },
  { value: 'mturk', label: 'Amazon MTurk' },
  { value: 'prolific', label: 'Prolific' },
  { value: 'clickworker', label: 'Clickworker' },
  { value: 'picoworkers', label: 'Picoworkers' },
];

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [keyword, setKeyword] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['all']);

  const handlePlatformChange = (platform: string) => {
    if (platform === 'all') {
      setSelectedPlatforms(['all']);
    } else {
      const newPlatforms = selectedPlatforms.includes('all') 
        ? [platform]
        : selectedPlatforms.includes(platform)
          ? selectedPlatforms.filter(p => p !== platform)
          : [...selectedPlatforms, platform];
      setSelectedPlatforms(newPlatforms);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    
    onSearch({
      keyword: keyword.trim(),
      platforms: selectedPlatforms,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter keyword to search..."
          disabled={isLoading}
          className="search-input"
        />
        <button
          type="submit"
          disabled={isLoading || !keyword.trim()}
          className="search-button"
        >
          {isLoading ? (
            <span className="spinner"></span>
          ) : (
            '🔍 Search'
          )}
        </button>
      </div>
      
      <div className="platform-selector">
        <span className="selector-label">Select platforms:</span>
        <div className="platform-tags">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.value}
              type="button"
              onClick={() => handlePlatformChange(platform.value)}
              className={`platform-tag ${selectedPlatforms.includes(platform.value) ? 'selected' : ''}`}
            >
              {platform.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
