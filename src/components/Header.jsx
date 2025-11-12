export default function Header({ showWeek, setShowWeek }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-700 grid place-items-center text-white">
          {/* Logo araña */}
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v6" />
              <path d="M7 4l2.5 3" />
              <path d="M17 4L14.5 7" />
              <ellipse cx="12" cy="10" rx="3" ry="4" />
              <path d="M5 9l3 1.5" />
              <path d="M19 9l-3 1.5" />
              <path d="M6 14l3-1" />
              <path d="M18 14l-3-1" />
              <path d="M9 13v5" />
              <path d="M15 13v5" />
              <path d="M8 21l2-2" />
              <path d="M16 21l-2-2" />
            </g>
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Seguimiento Calisténico</h1>
          <p className="text-xs text-zinc-400">Tema Spider · móvil primero</p>
        </div>
      </div>
      <button onClick={() => setShowWeek(v => !v)} className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm">
        {showWeek ? "Ver solo HOY" : "Ver plan semanal"}
      </button>
    </div>
  );
}
