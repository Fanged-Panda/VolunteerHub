import React from 'react';

const stylesByStatus = {
  Applied: 'bg-blue-100 text-blue-800 border-blue-200',
  Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Assigned: 'bg-amber-100 text-amber-800 border-amber-200',
  Completed: 'bg-slate-200 text-slate-800 border-slate-300',
};

export default function StatusBadge({ status = 'Applied' }) {
  const classes = stylesByStatus[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${classes}`}>
      {status}
    </span>
  );
}
