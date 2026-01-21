import React from 'react';

/**
 * =============================================================================
 * LOADING COMPONENT
 * =============================================================================
 * Component hiển thị trạng thái đang tải với nhiều variants
 * 
 * @param {string} variant - Loại hiển thị:  'inline' | 'fullscreen' | 'overlay' | 'button'
 * @param {string} size - Kích thước:  'sm' | 'md' | 'lg'
 * @param {string} text - Dòng chữ hiển thị (optional)
 * @param {string} color - Màu spinner:  'blue' | 'white' | 'gray'
 * @param {string} className - Class bổ sung
 * =============================================================================
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Các variants có sẵn
 */
export const LOADING_VARIANTS = {
  INLINE: 'inline',
  FULLSCREEN: 'fullscreen',
  OVERLAY: 'overlay',
  BUTTON: 'button'
};

/**
 * Các kích thước có sẵn
 */
export const LOADING_SIZES = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg'
};

/**
 * Config kích thước
 */
const SIZE_CONFIG = {
  sm: {
    spinner: 'w-4 h-4',
    text: 'text-xs',
    padding: 'p-2'
  },
  md: {
    spinner: 'w-8 h-8',
    text: 'text-sm',
    padding: 'p-4'
  },
  lg: {
    spinner: 'w-12 h-12',
    text: 'text-base',
    padding: 'p-6'
  }
};

/**
 * Config màu sắc
 */
const COLOR_CONFIG = {
  blue: 'text-blue-600',
  white: 'text-white',
  gray: 'text-gray-500'
};

// =============================================================================
// SPINNER COMPONENT
// =============================================================================

/**
 * SVG Spinner animation
 */
const Spinner = ({ size = 'md', color = 'blue', className = '' }) => {
  const sizeClass = SIZE_CONFIG[size]?.spinner || SIZE_CONFIG.md.spinner;
  const colorClass = COLOR_CONFIG[color] || COLOR_CONFIG.blue;

  return (
    <svg
      className={`animate-spin ${sizeClass} ${colorClass} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// =============================================================================
// LOADING VARIANTS
// =============================================================================

/**
 * Fullscreen Loading - Đè lên toàn bộ màn hình
 */
const FullscreenLoading = ({ size, color, text }) => {
  const textClass = SIZE_CONFIG[size]?.text || SIZE_CONFIG.md.text;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="alert"
      aria-busy="true"
      aria-label={text || 'Đang tải'}
    >
      <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center animate-fade-in">
        <Spinner size={size} color={color} />
        {text && (
          <p className={`mt-4 text-gray-700 font-medium tracking-wide ${textClass}`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Overlay Loading - Đè lên container cha
 */
const OverlayLoading = ({ size, color, text }) => {
  const textClass = SIZE_CONFIG[size]?.text || SIZE_CONFIG.md.text;

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[1px] rounded-lg"
      role="alert"
      aria-busy="true"
    >
      <div className="flex flex-col items-center">
        <Spinner size={size} color={color} />
        {text && (
          <p className={`mt-3 text-gray-600 font-medium ${textClass}`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Inline Loading - Hiển thị trong dòng content
 */
const InlineLoading = ({ size, color, text, className }) => {
  const paddingClass = SIZE_CONFIG[size]?.padding || SIZE_CONFIG.md.padding;
  const textClass = SIZE_CONFIG[size]?.text || SIZE_CONFIG.md.text;

  return (
    <div
      className={`flex flex-col items-center justify-center w-full ${paddingClass} ${className}`}
      role="status"
      aria-label={text || 'Đang tải'}
    >
      <Spinner size={size} color={color} />
      {text && (
        <p className={`mt-2 text-gray-500 ${textClass}`}>
          {text}
        </p>
      )}
    </div>
  );
};

/**
 * Button Loading - Dùng trong button
 */
const ButtonLoading = ({ size = 'sm', color = 'white' }) => {
  return <Spinner size={size} color={color} />;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const Loading = ({
  variant = LOADING_VARIANTS.INLINE,
  size = LOADING_SIZES.MD,
  text,
  color = 'blue',
  className = '',
  // Legacy prop support
  fullScreen = false
}) => {
  // Backward compatibility với prop fullScreen cũ
  const activeVariant = fullScreen ? LOADING_VARIANTS.FULLSCREEN : variant;

  switch (activeVariant) {
    case LOADING_VARIANTS.FULLSCREEN:
      return <FullscreenLoading size={size} color={color} text={text || 'Đang tải.. .'} />;

    case LOADING_VARIANTS.OVERLAY:
      return <OverlayLoading size={size} color={color} text={text} />;

    case LOADING_VARIANTS.BUTTON:
      return <ButtonLoading size={size} color={color} />;

    case LOADING_VARIANTS.INLINE:
    default:
      return <InlineLoading size={size} color={color} text={text} className={className} />;
  }
};

// Export thêm Spinner để dùng riêng nếu cần
export { Spinner };
export default Loading;