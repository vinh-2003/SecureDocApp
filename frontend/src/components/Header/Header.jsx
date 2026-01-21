import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, createSearchParams } from 'react-router-dom';

// Components
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';
import SearchPreviewDropdown from './SearchPreviewDropdown';

import { AdvancedSearchForm } from '../Search';
import { ChangePasswordModal } from '../Profile';

// Hooks
import { useSearchPreview } from '../../hooks';

/**
 * =============================================================================
 * HEADER COMPONENT
 * =============================================================================
 * Header chính của ứng dụng bao gồm: 
 * - Mobile menu toggle
 * - Search bar với preview dropdown
 * - User menu
 * =============================================================================
 */
const Header = ({ onToggleSidebar }) => {
    const navigate = useNavigate();

    // Refs
    const searchRef = useRef(null);

    // State
    const [showAdvancedModal, setShowAdvancedModal] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);

    // Search preview hook
    const searchPreview = useSearchPreview({
        debounceMs: 500,
        previewLimit: 5
    });

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                searchPreview.closeDropdown();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchPreview]);

    // === HANDLERS ===

    // Navigate to search page
    const goToSearchPage = (params) => {
        searchPreview.closeDropdown();
        setShowAdvancedModal(false);

        // Remove display names from URL
        const { ownerDisplayName, locationDisplayName, ...rawParams } = params;

        // Filter empty params
        const cleanParams = Object.fromEntries(
            Object.entries(rawParams).filter(([_, v]) =>
                v != null && v !== '' && v !== false
            )
        );

        navigate({
            pathname: '/search',
            search: `?${createSearchParams(cleanParams)}`
        });
    };

    // Handle Enter key
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && searchPreview.keyword.trim()) {
            goToSearchPage({ keyword: searchPreview.keyword });
        }
    };

    // Handle advanced search apply
    const handleAdvancedApply = (data) => {
        goToSearchPage(data);
    };

    // Handle view all from preview
    const handleViewAll = () => {
        goToSearchPage({ keyword: searchPreview.keyword });
    };

    return (
        <>
            <header className="h-16 bg-white shadow-sm sticky top-0 z-40 flex items-center justify-between px-6">
                {/* Left:  Mobile Toggle */}
                <div className="flex items-center gap-4">
                    
                </div>

                {/* Center: Search Bar */}
                <div className="flex-1 max-w-3xl relative mx-4" ref={searchRef}>
                    <SearchBar
                        value={searchPreview.keyword}
                        onChange={searchPreview.setKeyword}
                        onKeyDown={handleKeyDown}
                        onFocus={searchPreview.handleFocus}
                        onAdvancedClick={() => setShowAdvancedModal(true)}
                    />

                    {/* Preview Dropdown */}
                    {searchPreview.showDropdown && searchPreview.keyword.trim() && (
                        <SearchPreviewDropdown
                            results={searchPreview.previewResults}
                            isLoading={searchPreview.isSearching}
                            keyword={searchPreview.keyword}
                            onResultClick={searchPreview.closeDropdown}
                            onViewAll={handleViewAll}
                        />
                    )}
                </div>

                {/* Right: User Menu */}
                <UserMenu
                    onChangePassword={() => setShowChangePassword(true)}
                />
            </header>

            {/* Modals */}
            {showAdvancedModal && (
                <AdvancedSearchForm
                    initialValues={searchPreview.getCurrentParams()}
                    onClose={() => setShowAdvancedModal(false)}
                    onApply={handleAdvancedApply}
                />
            )}

            {showChangePassword && (
                <ChangePasswordModal
                    isOpen={showChangePassword}
                    onClose={() => setShowChangePassword(false)}
                />
            )}
        </>
    );
};

export default Header;