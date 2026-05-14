import { Building2, Calendar, Hash, Shield } from 'lucide-react';
import branding from '../branding.config';
import type { TenderPackage } from '../types';

interface HeaderProps {
  activeTenderPackage?: TenderPackage | null;
}

function daysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Header({ activeTenderPackage }: HeaderProps) {
  const days = activeTenderPackage
    ? daysUntil(activeTenderPackage.tenderSubmissionDueDate)
    : null;

  return (
    <header className="shrink-0 z-10">
      {/* Primary brand bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.orgName}
              className="h-9 w-auto object-contain"
            />
          ) : (
            <div className={`${branding.logoAccentClass ?? 'bg-blue-600'} p-2 rounded-lg text-white`}>
              <Building2 size={22} />
            </div>
          )}
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
              {branding.orgName}
            </span>
            {branding.orgTagline && (
              <p className="text-xs text-slate-500 leading-tight">{branding.orgTagline}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200 text-slate-600">
            <Shield size={16} className="text-emerald-600" />
            Staff Privacy Mode On
          </div>
          <div className="w-9 h-9 bg-slate-200 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-500 text-sm">
            JD
          </div>
        </div>
      </div>

      {/* Secondary context band — only shown inside a tender package */}
      {activeTenderPackage && (
        <div className="bg-blue-700 px-6 py-1.5 flex items-center gap-4 text-white text-sm">
          <span className="font-semibold truncate max-w-xs">
            {activeTenderPackage.packageName}
          </span>
          <span className="text-blue-300">|</span>
          <span className="flex items-center gap-1 text-blue-100 whitespace-nowrap">
            <Hash size={13} />
            {activeTenderPackage.packageControlNumber}
          </span>
          <span className="text-blue-300">|</span>
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Calendar size={13} />
            {days === null ? '—' : days > 0
              ? <><span className="font-medium text-white">Submission due in {days}d</span></>
              : days === 0
                ? <span className="font-semibold text-yellow-300">Due today</span>
                : <span className="font-semibold text-red-300">Overdue by {Math.abs(days)}d</span>
            }
          </span>
        </div>
      )}
    </header>
  );
}
