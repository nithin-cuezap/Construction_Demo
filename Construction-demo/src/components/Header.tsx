import { Building2, Clock, FileText, Shield } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0 z-10">
      <div className="flex items-center gap-4">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <Building2 size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Downtown Commercial Plaza</h1>
          <div className="flex items-center text-sm text-slate-500 gap-2 mt-0.5">
            <span className="flex items-center gap-1"><FileText size={14}/> Tender #8492</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock size={14}/> Closes in 12 Days</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200 text-slate-600">
          <Shield size={16} className="text-emerald-600" />
          Staff Privacy Mode On
        </div>
        <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-500">
          JD
        </div>
      </div>
    </header>
  )}
