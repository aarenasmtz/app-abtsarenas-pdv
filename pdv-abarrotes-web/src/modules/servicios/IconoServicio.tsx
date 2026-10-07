import React from 'react';

interface IconoServicioProps {
  tipo:
    | 'cfe'
    | 'telmex'
    | 'agua'
    | 'naturgy'
    | 'izzi'
    | 'sky'
    | 'totalplay'
    | 'megacable'
    | 'dish'
    | 'gas'
    | 'peaje'
    | 'avon'
    | 'jafra'
    | 'marykay'
    | 'netflix'
    | 'spotify'
    | 'playstation'
    | 'xbox'
    | 'gobierno'
    | 'telefonia'
    | 'generico';
  size?: number;
}

export const IconoServicio: React.FC<IconoServicioProps> = ({ tipo, size = 32 }) => {
  switch (tipo) {
    case 'cfe':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#00843D" />
          <path
            d="M26 10L14 26H24L22 38L34 22H24L26 10Z"
            fill="#FACC15"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'telmex':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#005BA4" />
          <path d="M12 24C12 17.37 17.37 12 24 12C30.63 12 36 17.37 36 24" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
          <path d="M16 28C16 23.58 19.58 20 24 20C28.42 20 32 23.58 32 28" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="24" cy="32" r="3.5" fill="#FFFFFF" />
        </svg>
      );

    case 'agua':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#0284C7" />
          <path
            d="M24 10C24 10 15 22 15 28C15 32.97 19.03 37 24 37C28.97 37 33 32.97 33 28C33 22 24 10 24 10Z"
            fill="#BAE6FD"
          />
          <path
            d="M21 28C21 24 23 20 24 18C25 20 27 24 27 28C27 29.65 25.65 31 24 31C22.35 31 21 29.65 21 28Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'naturgy':
    case 'gas':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#D97706" />
          <path
            d="M24 11C24 11 29 18 29 24C29 27.5 26.5 30 24 30C21.5 30 19 27.5 19 24C19 18 24 11 24 11Z"
            fill="#FEF08A"
          />
          <path
            d="M24 18C24 18 27 22 27 25C27 26.65 25.65 28 24 28C22.35 28 21 26.65 21 25C21 22 24 18 24 18Z"
            fill="#EF4444"
          />
        </svg>
      );

    case 'izzi':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#E11D48" />
          <circle cx="16" cy="18" r="3.5" fill="#FFFFFF" />
          <rect x="13.5" y="24" width="5" height="12" rx="2" fill="#FFFFFF" />
          <circle cx="24" cy="18" r="3.5" fill="#FFFFFF" />
          <rect x="21.5" y="24" width="5" height="12" rx="2" fill="#FFFFFF" />
          <circle cx="32" cy="18" r="3.5" fill="#FFFFFF" />
          <rect x="29.5" y="24" width="5" height="12" rx="2" fill="#FFFFFF" />
        </svg>
      );

    case 'sky':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#1E3A8A" />
          <path
            d="M12 28C14 20 22 14 30 14M14 32C18 24 26 18 34 18M18 36C22 28 30 22 36 22"
            stroke="#93C5FD"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="33" cy="15" r="3" fill="#FACC15" />
        </svg>
      );

    case 'totalplay':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#4F46E5" />
          <path
            d="M18 15L34 24L18 33V15Z"
            fill="#FACC15"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'megacable':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#0284C7" />
          <path
            d="M14 30L20 18L24 25L28 18L34 30"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'dish':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#DC2626" />
          <path
            d="M14 24C14 18 19 14 26 14C31 14 34 17 34 21C34 25 31 28 26 28H14V24Z"
            fill="#FFFFFF"
          />
          <circle cx="24" cy="21" r="3" fill="#DC2626" />
        </svg>
      );

    case 'peaje':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#2563EB" />
          <path
            d="M14 32V20C14 18 16 16 19 16H29C32 16 34 18 34 20V32"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path d="M12 32H36" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
          <circle cx="19" cy="26" r="2.5" fill="#FACC15" />
          <circle cx="29" cy="26" r="2.5" fill="#FACC15" />
        </svg>
      );

    case 'avon':
    case 'marykay':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#DB2777" />
          <path
            d="M24 14C24 14 20 20 20 24C20 26.2 21.8 28 24 28C26.2 28 28 26.2 28 24C28 20 24 14 24 14Z"
            fill="#FBCFE8"
          />
          <path d="M16 32C18 34 21 35 24 35C27 35 30 34 32 32" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'jafra':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#9333EA" />
          <path
            d="M18 16H30M24 16V30C24 33 21 34 18 33"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'netflix':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#111827" />
          <path d="M16 13V35H21V19L27 35H32V13H27V29L21 13H16Z" fill="#E50914" />
        </svg>
      );

    case 'spotify':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#1DB954" />
          <path
            d="M15 20C20 18.5 28 19 33 22M16 25C20.5 23.5 27 24 31 26.5M17 30C20.5 28.5 25.5 29 29 31"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'playstation':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#003791" />
          <path
            d="M20 15V33L26 31V21L28 22V28L34 26V18C34 15 31 14 28 15L20 15Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'xbox':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#107C10" />
          <circle cx="24" cy="24" r="16" fill="#107C10" stroke="#FFFFFF" strokeWidth="2.5" />
          <path
            d="M18 16C21 21 24 25 24 25C24 25 27 21 30 16M15 28C19 24 24 24 24 24C24 24 29 24 33 28"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'gobierno':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#047857" />
          <path
            d="M24 12L12 18V20H36V18L24 12ZM16 22V30M21 22V30M27 22V30M32 22V30M12 32V34H36V32H12Z"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="#0284C7" />
          <path
            d="M16 24H32M24 16V32"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      );
  }
};
