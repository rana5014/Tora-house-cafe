import React from 'react';

export const MadaLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-auto' }) => (
  <svg viewBox="0 0 100 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="32" rx="4" fill="#007953" />
    <path d="M14 8h8c4.4 0 8 3.6 8 8s-3.6 8-8 8h-8V8zm6 12h2c2.2 0 4-1.8 4-4s-1.8-4-4-4h-2v8z" fill="#FFFFFF" />
    <circle cx="56" cy="16" r="8" fill="#F4B400" />
    <path d="M48 16c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8z" fill="#005B94" opacity="0.85" />
    <text x="70" y="21" fill="#FFFFFF" fontFamily="sans-serif" fontSize="13" fontWeight="bold">mada</text>
  </svg>
);

export const VisaLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-auto' }) => (
  <svg viewBox="0 0 70 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="70" height="24" rx="4" fill="#1A1F71" />
    <path d="M18.5 4L13.8 20H9.5L6.3 7.8C6.1 7 5.8 6.4 5.2 6.1C4.2 5.5 2.8 5 1.5 4.8L1.6 4H8.7C9.7 4 10.5 4.7 10.7 5.8L12.4 14.8L16.6 4H18.5ZM23.4 14.9C23.4 11.5 18.7 11.3 18.7 9.5C18.7 8.9 19.3 8.2 20.6 8.1C21.2 8 22.9 7.9 24.6 8.7L25.3 5.4C24.4 5.1 23.1 4.7 21.6 4.7C17.7 4.7 15 6.8 15 9.8C15 12 17 13.2 18.5 13.9C20.1 14.7 20.6 15.2 20.6 15.9C20.6 17 19.3 17.5 18.1 17.5C16.2 17.5 15.1 17 14.2 16.5L13.5 19.9C14.6 20.4 16.5 20.8 18.4 20.8C22.6 20.8 25.3 18.7 25.4 14.9H23.4ZM34 20H37.8L34.5 4H31.1C30.4 4 29.8 4.4 29.5 5L24.8 20H28.8L29.6 17.8H34.4L34 20ZM30.7 14.7L32.7 9.1L33.9 14.7H30.7ZM44.2 4L41.3 20H37.5L40.4 4H44.2Z" fill="#FFFFFF" />
  </svg>
);

export const MastercardLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-auto' }) => (
  <svg viewBox="0 0 60 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="36" rx="4" fill="#0A0A0A" />
    <circle cx="23" cy="18" r="12" fill="#EB001B" />
    <circle cx="37" cy="18" r="12" fill="#F79E1B" fillOpacity="0.9" />
    <path d="M30 9.2A11.96 11.96 0 0025.2 18 11.96 11.96 0 0030 26.8 11.96 11.96 0 0034.8 18 11.96 11.96 0 0030 9.2z" fill="#FF5F00" />
  </svg>
);

export const ApplePayLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-auto' }) => (
  <svg viewBox="0 0 70 30" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="70" height="30" rx="4" fill="#000000" stroke="#333333" strokeWidth="1" />
    <path d="M19.3 13.5c-.1-1.8 1.4-2.8 1.5-2.8-.8-1.2-2.1-1.4-2.6-1.4-1.1-.1-2.2.7-2.8.7-.6 0-1.5-.7-2.5-.7-1.3 0-2.5.8-3.1 1.9-1.3 2.3-.3 5.7 1 7.5.6.9 1.4 1.9 2.4 1.9.9 0 1.3-.6 2.4-.6 1.1 0 1.4.6 2.4.6 1 0 1.7-.9 2.3-1.8.7-1 1-2 1-2.1-.1-.1-1.9-.7-1.9-2.8zM17.4 8.2c.5-.6.8-1.4.7-2.2-.7 0-1.6.5-2.1 1-.5.5-.9 1.4-.8 2.2.8.1 1.7-.4 2.2-1z" fill="#FFFFFF" />
    <text x="26" y="20" fill="#FFFFFF" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="13" fontWeight="600">Pay</text>
  </svg>
);

export const CashLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-auto' }) => (
  <svg viewBox="0 0 60 30" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="30" rx="4" fill="#0F3822" stroke="#1B5E39" strokeWidth="1" />
    <circle cx="30" cy="15" r="7" stroke="#22C55E" strokeWidth="2" />
    <text x="30" y="19" textAnchor="middle" fill="#4ADE80" fontFamily="sans-serif" fontSize="11" fontWeight="bold">SAR</text>
    <rect x="6" y="6" width="4" height="4" rx="1" fill="#22C55E" />
    <rect x="50" y="6" width="4" height="4" rx="1" fill="#22C55E" />
    <rect x="6" y="20" width="4" height="4" rx="1" fill="#22C55E" />
    <rect x="50" y="20" width="4" height="4" rx="1" fill="#22C55E" />
  </svg>
);
