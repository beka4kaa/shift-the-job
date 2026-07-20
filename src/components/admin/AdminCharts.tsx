'use client';

import type { AdminTrendPoint } from '@/lib/admin';

function points(values: number[], width: number, height: number) {
  const max = Math.max(...values, 1);
  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - (value / max) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(' ');
}

export function RevenueChart({ data }: { data: AdminTrendPoint[] }) {
  const width = 760;
  const height = 240;
  const gross = points(data.map((item) => item.gross), width, height);
  const platform = points(data.map((item) => item.platform), width, height);
  return (
    <div>
      <div className="mb-5 flex items-center gap-5 text-xs text-black/45"><span className="flex items-center gap-2"><i className="h-2 w-2 bg-[#171813]" />Gross volume</span><span className="flex items-center gap-2"><i className="h-2 w-2 bg-[#91a838]" />Platform revenue</span></div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full overflow-visible" role="img" aria-label="Revenue over the last twelve months">
        {[0, 1, 2, 3, 4].map((line) => <line key={line} x1="0" x2={width} y1={(height / 4) * line} y2={(height / 4) * line} stroke="rgba(0,0,0,.08)" />)}
        <polyline points={gross} fill="none" stroke="#171813" strokeWidth="4" vectorEffect="non-scaling-stroke" />
        <polyline points={platform} fill="none" stroke="#91a838" strokeWidth="4" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-3 grid grid-cols-6 gap-2 text-[10px] text-black/35 sm:grid-cols-12">{data.map((item) => <span key={item.key} className="text-center">{item.label}</span>)}</div>
    </div>
  );
}

export function GrowthBars({ data }: { data: AdminTrendPoint[] }) {
  const max = Math.max(...data.map((item) => item.users), 1);
  return (
    <div className="flex h-56 items-end gap-2 border-b border-black/10 pt-6">
      {data.map((item) => <div key={item.key} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="opacity-0 text-[10px] font-semibold group-hover:opacity-100">{item.users}</span><div className="w-full bg-[#171813] transition-colors group-hover:bg-[#91a838]" style={{ height: `${Math.max((item.users / max) * 170, item.users ? 8 : 2)}px` }} /><span className="hidden text-[9px] text-black/35 sm:block">{item.label.split(' ')[0]}</span></div>)}
    </div>
  );
}
