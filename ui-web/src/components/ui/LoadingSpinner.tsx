export default function LoadingSpinner({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const s = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="relative">
        <div className={`${s[size]} rounded-full border-2 border-slate-100`} />
        <div className={`${s[size]} rounded-full border-2 border-transparent border-t-[#284074] animate-spin absolute inset-0`} />
        <div className={`${s[size]} rounded-full border-2 border-transparent border-r-[#284074]/30 animate-spin absolute inset-0`} style={{ animationDuration: '1.5s' }} />
      </div>
      {label && <p className="text-xs font-medium text-slate-400 animate-pulse">{label}</p>}
    </div>
  );
}