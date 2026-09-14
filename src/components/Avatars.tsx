import React from 'react';

interface AvatarProps {
  name: string;
  className?: string;
}

export const PlayerAvatar: React.FC<AvatarProps> = ({ name, className = 'w-full h-full' }) => {
  switch (name) {
    case '赌神':
    case 'You':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="18" fill="#E0F2FE" />
          {/* Head */}
          <circle cx="18" cy="15" r="7" fill="#38BDF8" />
          {/* Hair/Cap */}
          <path d="M11 14C11 10.5 14 8 18 8C22 8 25 10.5 25 14V15H11V14Z" fill="#0284C7" />
          {/* Glasses */}
          <rect x="13" y="14" width="4" height="2.5" rx="1" fill="#0F172A" />
          <rect x="19" y="14" width="4" height="2.5" rx="1" fill="#0F172A" />
          <line x1="17" y1="15" x2="19" y2="15" stroke="#0F172A" strokeWidth="1" />
          {/* Body/Shoulders */}
          <path d="M7 32C7 26 12 24 18 24C24 24 29 26 29 32" fill="#0284C7" />
        </svg>
      );

    case 'Alex':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="18" fill="#CCFBF1" />
          <circle cx="18" cy="15" r="7" fill="#2DD4BF" />
          {/* Hair */}
          <path d="M12 13C12 9 15 7.5 18 7.5C21 7.5 24 9 24 13C24 13 22 10 18 10C14 10 12 13 12 13Z" fill="#0D9488" />
          {/* Eyes */}
          <circle cx="15.5" cy="15" r="1" fill="#134E4A" />
          <circle cx="20.5" cy="15" r="1" fill="#134E4A" />
          {/* Smile */}
          <path d="M16 18C17 19 19 19 20 18" stroke="#134E4A" strokeWidth="1" strokeLinecap="round" />
          {/* Body */}
          <path d="M8 32C8 26 12.5 24 18 24C23.5 24 28 26 28 32" fill="#0D9488" />
        </svg>
      );

    case 'Elena':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="18" fill="#FFE4E6" />
          <circle cx="18" cy="15" r="6.5" fill="#FB7185" />
          {/* Long Hair */}
          <path d="M11 16C11 10 14 8 18 8C22 8 25 10 25 16C25 21 24 24 23 25C22 21 22 17 22 14C22 14 19 10 14 14C14 17 14 21 13 25C12 24 11 21 11 16Z" fill="#E11D48" />
          {/* Eyes */}
          <circle cx="16" cy="15" r="1" fill="#881337" />
          <circle cx="20" cy="15" r="1" fill="#881337" />
          {/* Body */}
          <path d="M8 32C8 26.5 12.5 24.5 18 24.5C23.5 24.5 28 26.5 28 32" fill="#E11D48" />
        </svg>
      );

    case 'Marcus':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="18" fill="#EDE9FE" />
          <circle cx="18" cy="15" r="7" fill="#A78BFA" />
          {/* Modern Crop Hair */}
          <path d="M12 12C12 9 15 8 18 8C21 8 24 9 24 12V13H12V12Z" fill="#6D28D9" />
          {/* Eyes */}
          <circle cx="15.5" cy="15" r="1" fill="#4C1D95" />
          <circle cx="20.5" cy="15" r="1" fill="#4C1D95" />
          {/* Beard/Jawline */}
          <path d="M15 19C16 20.5 20 20.5 21 19" stroke="#6D28D9" strokeWidth="1.2" strokeLinecap="round" />
          {/* Body */}
          <path d="M7 32C7 26 12 24 18 24C24 24 29 26 29 32" fill="#6D28D9" />
        </svg>
      );

    case 'Sophia':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="18" fill="#FEF3C7" />
          <circle cx="18" cy="15" r="6.5" fill="#FBBF24" />
          {/* Ponytail Hair */}
          <path d="M12 14C12 9.5 14.5 7.5 18 7.5C21.5 7.5 24 9.5 24 14C24 17 22 17 22 13C22 10 14 10 14 13C14 17 12 17 12 14Z" fill="#D97706" />
          <circle cx="24.5" cy="12.5" r="2.5" fill="#D97706" />
          {/* Eyes */}
          <circle cx="16" cy="15" r="1" fill="#78350F" />
          <circle cx="20" cy="15" r="1" fill="#78350F" />
          {/* Smile */}
          <path d="M16.5 18C17.5 19 18.5 19 19.5 18" stroke="#78350F" strokeWidth="1" strokeLinecap="round" />
          {/* Body */}
          <path d="M8 32C8 26.5 12.5 24.5 18 24.5C23.5 24.5 28 26.5 28 32" fill="#D97706" />
        </svg>
      );

    case 'Leo':
    default:
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="18" fill="#F1F5F9" />
          <circle cx="18" cy="15" r="7" fill="#94A3B8" />
          {/* Cap / Beanie */}
          <path d="M11 13C11 9.5 14 8 18 8C22 8 25 9.5 25 13H11Z" fill="#475569" />
          {/* Eyes */}
          <circle cx="15.5" cy="15.5" r="1" fill="#0F172A" />
          <circle cx="20.5" cy="15.5" r="1" fill="#0F172A" />
          {/* Body */}
          <path d="M7 32C7 26 12 24 18 24C24 24 29 26 29 32" fill="#475569" />
        </svg>
      );
  }
};

