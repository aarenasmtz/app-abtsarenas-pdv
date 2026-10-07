import React from 'react';

interface IconoCompaniaProps {
  tipo: 'telcel' | 'movistar' | 'att' | 'bait' | 'unefon' | 'virgin' | 'pillofon' | 'diri' | 'generico';
  size?: number;
}

export const IconoCompania: React.FC<IconoCompaniaProps> = ({ tipo, size = 32 }) => {
  switch (tipo) {
    case 'telcel':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#002F6C" />
          <path d="M14 18H34V23H27V36H21V23H14V18Z" fill="#FFFFFF" />
          <circle cx="34" cy="16" r="3" fill="#009FDB" />
        </svg>
      );
    case 'movistar':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#00A9E0" />
          <path
            d="M13 32C13 25.5 16.5 16 21 16C24 16 24 24 27 24C30 24 31 16 34 16C36.5 16 35 25.5 35 32"
            stroke="#5BC500"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'att':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#009FDB" />
          <ellipse cx="24" cy="24" rx="16" ry="16" fill="#007AB8" />
          <path d="M10 24C10 20 16 17 24 17C32 17 38 20 38 24C38 28 32 31 24 31C16 31 10 28 10 24Z" fill="#FFFFFF" />
          <ellipse cx="24" cy="24" rx="8" ry="4" fill="#007AB8" />
        </svg>
      );
    case 'bait':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#EA580C" />
          <path
            d="M16 24C16 19.5 20 16 24 16C28 16 32 19.5 32 24C32 28.5 28 32 24 32C20 32 16 28.5 16 24Z"
            stroke="#FFFFFF"
            strokeWidth="3.5"
          />
          <circle cx="24" cy="24" r="4" fill="#FDE047" />
        </svg>
      );
    case 'unefon':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#D97706" />
          <circle cx="24" cy="24" r="14" fill="#FDB813" />
          <path d="M18 20V28C18 31.3 20.7 34 24 34C27.3 34 30 31.3 30 28V20H26V28C26 29.1 25.1 30 24 30C22.9 30 22 29.1 22 28V20H18Z" fill="#D97706" />
        </svg>
      );
    case 'virgin':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#DC2626" />
          <path d="M15 16L24 34L33 16H27L24 24L21 16H15Z" fill="#FFFFFF" />
        </svg>
      );
    case 'pillofon':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#DB2777" />
          <path d="M16 16H25C28.3 16 31 18.7 31 22C31 25.3 28.3 28 25 28H21V34H16V16ZM21 24H24.5C25.9 24 27 22.9 27 21.5C27 20.1 25.9 19 24.5 19H21V24Z" fill="#FFFFFF" />
        </svg>
      );
    case 'diri':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#7C3AED" />
          <path d="M16 16H25C29.4 16 33 19.6 33 24C33 28.4 29.4 32 25 32H16V16ZM21 21V27H24.5C26.2 27 27.5 25.7 27.5 24C27.5 22.3 26.2 21 24.5 21H21Z" fill="#FFFFFF" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#0284C7" />
          <path d="M24 14V34M14 24H34" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
  }
};
