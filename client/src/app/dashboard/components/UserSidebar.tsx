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
      className="card bg-white border border-slate-200 p-6 animate-slideUpFade h-auto shadow-sm"
      style={{ animationDelay: "0.5s", animationFillMode: "both" }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className={`w-12 h-12 rounded-lg border-1.5 flex items-center justify-center font-black text-base flex-shrink-0 ${deptAccent.bgTw} ${deptAccent.colorTw} ${deptAccent.borderTw}`}
        >
          {user?.username?.charAt(0)?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-slate-900 mb-1 truncate">
            {user?.username}
          </p>
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold ${deptAccent.bgTw} ${deptAccent.textTw}`}
          >
            {user?.dept}
          </span>
        </div>
      </div>
      <div className="divider my-2.5" />
      {[
        { label: "Role", value: user?.role },
        { label: "Department", value: user?.dept },
        { label: "Access Level", value: user?.role },
      ].map(({ label, value }, i, arr) => (
        <div key={label}>
          <div className="flex items-center justify-between py-2.75">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {label}
            </span>
            <span className="text-sm font-bold text-slate-700">
              {value || "System"}
            </span>
          </div>
          {i < arr.length - 1 && <div className="divider my-0" />}
        </div>
      ))}
      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          System Online
        </span>
      </div>
    </div>
  );
}