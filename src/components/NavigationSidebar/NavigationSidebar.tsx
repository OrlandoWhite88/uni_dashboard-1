import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationSidebarProps, NavigationSection, NavigationItem as NavigationItemType, Organization } from './types';
import NavigationItem from './NavigationItem';
import styles from './NavigationSidebar.module.css';

const defaultSections: NavigationSection[] = [
  {
    id: 'classification',
    title: 'Classification',
    items: [
      {
        id: 'single-product',
        label: 'Single Product',
        icon: '/appsiphone.svg', // Using the same icon for consistency
        path: '/dashboard',
      },
      {
        id: 'batch-classification',
        label: 'Batch Classification',
        icon: '/shippingbox.svg',
        path: '/bulk-import',
      },
    ],
  },
  {
    id: 'tariff-info',
    title: 'Tariff Info',
    items: [
      {
        id: 'tariff-calculator',
        label: 'Tariff Calculator',
        icon: '/appsiphone.svg',
        path: '/tariff-calculator',
      },
    ],
  },
  {
    id: 'resources',
    title: 'Resources',
    items: [
      {
        id: 'my-classifications',
        label: 'My Classifications',
        icon: '/folder.svg',
        path: '/classification-history',
      },
      {
        id: 'ushts',
        label: 'USHTS',
        icon: '/textbookclosed.svg',
        onClick: () => window.open('https://hts.usitc.gov/', '_blank'),
      },
    ],
  },
  {
    id: 'settings',
    title: '',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: '', // We'll use a cog emoji or placeholder
        path: '/settings',
      },
    ],
  },
];

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  className = '',
  organizationName = 'Organization',
  organizations = [],
  onOrganizationChange,
  onSearch,
  searchPlaceholder = 'Search',
  sections = defaultSections,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOrganizationDropdownOpen, setIsOrganizationDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<NavigationItemType[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOrganizationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search through navigation items
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results: NavigationItemType[] = [];
    const lowerQuery = query.toLowerCase();

    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.label.toLowerCase().includes(lowerQuery)) {
          results.push(item);
        }
      });
    });

    setSearchResults(results);
    setSelectedResultIndex(-1);
  }, [sections]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    performSearch(value);
    onSearch?.(value);
  }, [onSearch, performSearch]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (selectedResultIndex >= 0 && searchResults[selectedResultIndex]) {
        const result = searchResults[selectedResultIndex];
        if (result.path) {
          navigate(result.path);
        } else if (result.onClick) {
          result.onClick();
        }
        setSearchQuery('');
        setSearchResults([]);
      } else if (searchQuery.trim()) {
        onSearch?.(searchQuery);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResultIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResultIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      setSearchResults([]);
      searchInputRef.current?.blur();
    }
  }, [searchQuery, searchResults, selectedResultIndex, onSearch]);

  const handleOrganizationSelect = (org: Organization) => {
    onOrganizationChange?.(org);
    setIsOrganizationDropdownOpen(false);
  };

  return (
    <div className={`${styles.navigationSidebar} ${className}`}>
      {/* Top Content */}
      <div className={styles.topContent}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <img 
            src="/uni_logo.png" 
            alt="Uni Logo" 
            className={styles.logo}
          />
        </div>

        {/* Organization Selector */}
        <div className={styles.organizationSelection} ref={dropdownRef}>
          <input
            className={styles.organizationName}
            placeholder={organizationName}
            type="text"
            readOnly
            onClick={() => setIsOrganizationDropdownOpen(!isOrganizationDropdownOpen)}
          />
          <div className={styles.dropdownWrapper}>
            <img 
              className={styles.dropdownIcon} 
              alt="Dropdown" 
              src="/dropdown.svg"
              onClick={() => setIsOrganizationDropdownOpen(!isOrganizationDropdownOpen)}
            />
          </div>
          
          {/* Dropdown Menu */}
          {isOrganizationDropdownOpen && organizations.length > 0 && (
            <div className={styles.organizationDropdown}>
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className={styles.organizationOption}
                  onClick={() => handleOrganizationSelect(org)}
                >
                  {org.icon && (
                    <img 
                      src={org.icon} 
                      alt={org.name} 
                      className={styles.organizationIcon}
                    />
                  )}
                  <span>{org.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Container */}
        <div className={styles.mainContent}>
        {/* Search Bar */}
        <div className={styles.searchBarContainer}>
          <div className={styles.searchBar}>
          <div className={styles.search}>
            <img
              className={styles.searchSymbolIcon}
              loading="lazy"
              alt="Search"
              src="/search-symbol.svg"
            />
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <div className={styles.searchKeybind}>
            <div className={styles.keybindText}>⌘K</div>
          </div>
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className={styles.searchResults}>
            {searchResults.map((result, index) => (
              <div
                key={result.id}
                className={`${styles.searchResult} ${
                  index === selectedResultIndex ? styles.selected : ''
                }`}
                onClick={() => {
                  if (result.path) {
                    navigate(result.path);
                  } else if (result.onClick) {
                    result.onClick();
                  }
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                onMouseEnter={() => setSelectedResultIndex(index)}
              >
                {result.icon && (
                  <img 
                    src={result.icon} 
                    alt={result.label} 
                    className={styles.searchResultIcon}
                  />
                )}
                <span>{result.label}</span>
              </div>
            ))}
          </div>
        )}
        </div>

          {/* Navigation Sections */}
          <div className={styles.navigationSections}>
            {sections.map((section) => (
              <div key={section.id} className={styles.navigationSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>{section.title}</div>
                </div>
                <div className={styles.sectionItems}>
                  {section.items.map((item) => (
                    <NavigationItem 
                      key={item.id} 
                      item={item} 
                      isCollapsible={false}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationSidebar;
