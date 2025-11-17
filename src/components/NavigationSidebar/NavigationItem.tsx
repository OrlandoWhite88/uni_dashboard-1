"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavigationItem as NavigationItemType } from './types';
import styles from './NavigationSidebar.module.css';

interface NavigationItemProps {
  item: NavigationItemType;
  isCollapsible?: boolean;
}

const NavigationItem: React.FC<NavigationItemProps> = ({ item, isCollapsible = false }) => {
  const pathname = usePathname();
  const isActive = item.path ? pathname === item.path : false;

  const content = (
    <div className={styles.navigationItemInner}>
      <div className={styles.navigationItemContent}>
        {isCollapsible ? (
          <div className={styles.collapseButton}>
            <img className={styles.vectorIcon} alt="" src="/vector.svg" />
          </div>
        ) : item.icon ? (
          <img 
            className={styles.navigationIcon} 
            loading="lazy" 
            alt={`${item.label} icon`} 
            src={item.icon} 
          />
        ) : item.id === 'settings' ? (
          <svg 
            className={styles.navigationIcon} 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M16.1667 10C16.1667 10.4167 16.125 10.8333 16.0833 11.25L17.9167 12.6667L16.25 15.4167L14.1667 14.5833C13.5833 15.0833 12.9167 15.5 12.1667 15.75L11.6667 17.9167H8.33333L7.83333 15.75C7.08333 15.5 6.41667 15.0833 5.83333 14.5833L3.75 15.4167L2.08333 12.6667L3.91667 11.25C3.875 10.8333 3.83333 10.4167 3.83333 10C3.83333 9.58333 3.875 9.16667 3.91667 8.75L2.08333 7.33333L3.75 4.58333L5.83333 5.41667C6.41667 4.91667 7.08333 4.5 7.83333 4.25L8.33333 2.08333H11.6667L12.1667 4.25C12.9167 4.5 13.5833 4.91667 14.1667 5.41667L16.25 4.58333L17.9167 7.33333L16.0833 8.75C16.125 9.16667 16.1667 9.58333 16.1667 10Z" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
        <div className={styles.navigationText}>
          <div className={styles.navigationLabel}>{item.label}</div>
        </div>
      </div>
    </div>
  );

  if (item.path) {
    return (
      <Link
        href={item.path}
        className={`${styles.navigationItem} ${isActive ? styles.active : ''}`}
      >
        {content}
      </Link>
    );
  }

  if (item.onClick) {
    return (
      <div 
        className={styles.navigationItem} 
        onClick={item.onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            item.onClick?.();
          }
        }}
      >
        {content}
      </div>
    );
  }

  return <div className={styles.navigationItem}>{content}</div>;
};

export default NavigationItem;
