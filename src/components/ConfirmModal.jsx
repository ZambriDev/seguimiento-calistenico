import React from "react";

export default function ConfirmModal({
  open,
  title = "Continuar",
  message = "",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      {/* Card */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-800/40 bg-zinc-900/90 p-4 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-700 grid place-items-center text-white">
              {/* mini-logo araña */}
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                <g
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v6" />
                  <path d="M7 4l2.5 3" />
                  <path d="M17 4L14.5 7" />
                  <ellipse cx="12" cy="10" rx="3" ry="4" />
                </g>
              </svg>
            </div>
            <h4 className="text-base font-semibold text-red-200">{title}</h4>
          </div>
          <p className="mt-3 text-sm text-zinc-300">{message}</p>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-200 text-sm hover:bg-zinc-700"
            >
              Pausar
            </button>
            <button
              onClick={onConfirm}
              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm"
            >
              Seguir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
