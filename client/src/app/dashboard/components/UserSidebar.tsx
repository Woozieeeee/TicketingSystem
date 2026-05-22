"use client";

interface UserSidebarProps {
  user: {
    username?: string;
    dept?: string;
    role?: string;
  };
  deptAccent: {
    color: string;
    bgTw: string;
    colorTw: string;
    textTw: string;
    borderTw: string;
  };
}

export default function UserSidebar({ user, deptAccent }: UserSidebarProps) {
  return (
    <div
      className="w-full max-w-full min-w-0 rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm transition-all duration-300 animate-slideUpFade h-auto"
      style={{ animationDelay: "0.5s", animationFillMode: "both" }}
    >
      {/* Top Profile Header Section */}
      <div className="flex items-center gap-3.5 min-w-0 mb-5">
        {/* Responsive Avatar Square */}
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-[1.5px] flex items-center justify-center font-black text-sm sm:text-base flex-shrink-0 shadow-sm transition-transform group-hover:scale-105 ${deptAccent.bgTw} ${deptAccent.colorTw} ${deptAccent.borderTw}`}
        >
          {user?.username?.charAt(0)?.toUpperCase()}
        </div>
        
        {/* Dynamic Typography Identity Wrapper */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="font-bold text-sm sm:text-base text-slate-900 truncate leading-tight tracking-tight">
            {user?.username}
          </p>
          <div className="flex min-w-0">
            <span
              className={`inline-block px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate max-w-full ${deptAccent.bgTw} ${deptAccent.textTw}`}
              title={user?.dept}
            >
              {user?.dept}
            </span>
          </div>
        </div>
      </div>

      {/* Main Metadata Grid Matrix */}
      <div className="space-y-0.5 min-w-0">
        {[
          { label: "Role", value: user?.role },
          { label: "Department", value: user?.dept },
          { label: "Access Level", value: user?.role },
        ].map(({ label, value }, i) => (
          <div key={label} className="group min-w-0">
            <div className="flex items-center justify-between gap-4 py-3 min-w-0">
              {/* Parameter Label Element */}
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 select-none">
                {label}
              </span>
              
              {/* Dynamic Property Value Output */}
              <span 
                className="text-xs sm:text-sm font-semibold text-slate-700 truncate text-right pl-2 min-w-0 flex-1 break-words"
                title={value || "System"}
              >
                {value || "System"}
              </span>
            </div>
            
            {/* Soft, minimal divider replacement */}
            {i < 2 && <div className="border-b border-slate-100/80 w-full" />}
          </div>
        ))}
      </div>

      {/* Online Status Branding Section */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 select-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
          System Online
        </span>
      </div>
    </div>
  );
}