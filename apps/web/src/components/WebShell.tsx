import React from 'react';

/**
 * Legacy wrapper kept for pages not yet migrated. The site header, footer and providers now
 * live in the root layout, so this simply renders its children.
 */
export const WebShell: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
