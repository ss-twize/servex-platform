'use client';

import React from 'react';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
      {icon && (
        <div className="text-[#5E7488] w-10 h-10 flex items-center justify-center">
          {icon}
        </div>
      )}
      <p className="text-sm text-[#5E7488] max-w-xs">{message}</p>
    </div>
  );
}

export default EmptyState;
