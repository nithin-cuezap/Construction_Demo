import React from 'react';

interface EmptyDropZoneProps {
  text: string;
  icon: React.ReactNode;
  small?: boolean;
}

export default function EmptyDropZone({ text, icon, small = false }: EmptyDropZoneProps) {
  return (
    <div className={`flex-1 flex flex-col items-center justify-center text-slate-400 ${small ? 'py-2' : 'py-8'}`}>
      {icon}
      <span className={`font-medium ${small ? 'text-xs' : 'text-sm'}`}>{text}</span>
    </div>
  );
}
