import React from 'react';

export const GenrePaths: Record<string, (color: string, strokeWidth: number) => React.ReactNode> = {
  'Romance': (color, sw) => (
    <>
      <path d="M10 16C12.2091 16 14 14.2091 14 12C14 9.79086 12.2091 8 10 8C7.79086 8 6 9.79086 6 12C6 14.2091 7.79086 16 10 16Z" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <path d="M14 16C16.2091 16 18 14.2091 18 12C18 9.79086 16.2091 8 14 8C11.79086 8 10 9.79086 10 12C10 14.2091 11.79086 16 14 16Z" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>
  ),
  'Fantasy': (color, sw) => (
    <>
      <path d="M12 4L14.5 9.5L20 12L14.5 14.5L12 20L9.5 14.5L4 12L9.5 9.5L12 4Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <circle cx="12" cy="12" r="1.5" stroke={color} strokeWidth={sw * 0.6} />
    </>
  ),
  'Science Fiction': (color, sw) => (
    <>
      <path d="M7 9H17" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <path d="M5 12H19" stroke={color} strokeWidth={sw * 1.25} strokeLinecap="round" />
      <path d="M9 15H15" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>
  ),
  'Mystery & Thriller': (color, sw) => (
    <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM12 7V17" stroke={color} strokeWidth={sw} strokeLinecap="round" />
  ),
  'Horror': (color, sw) => (
    <path d="M12 3L16 10L21 12L14 15L13 21L8 14L3 11L9 8L12 3Z" stroke={color} strokeWidth={sw} strokeLinejoin="miter" />
  ),
  'Historical Fiction': (color, sw) => (
    <>
      <path d="M6 18H18" stroke={color} strokeWidth={sw * 0.8} strokeLinecap="round" />
      <path d="M9 18V6" stroke={color} strokeWidth={sw * 1.1} strokeLinecap="round" />
      <path d="M15 18V6" stroke={color} strokeWidth={sw * 1.1} strokeLinecap="round" />
      <path d="M7 6H17" stroke={color} strokeWidth={sw * 0.8} strokeLinecap="round" />
    </>
  ),
  'Non-Fiction': (color, sw) => (
    <>
      <path d="M12 3L19.7942 7.5V16.5L12 21L4.20577 16.5V7.5L12 3Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <circle cx="12" cy="12" r="1.5" fill={color} />
    </>
  ),
  'Young Adult (YA)': (color, sw) => (
    <path d="M13 3L10 12H17L11 21" stroke={color} strokeWidth={sw * 1.1} strokeLinecap="round" strokeLinejoin="round" />
  ),
  'Contemporary': (color, sw) => (
    <path d="M14 6H6V18H18V10" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  ),
  'Classics': (color, sw) => (
    <>
      <path d="M5 16C5 12.134 8.13401 9 12 9C15.866 9 19 12.134 19 16" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <path d="M4 18H20" stroke={color} strokeWidth={sw * 0.8} strokeLinecap="round" />
    </>
  )
};

