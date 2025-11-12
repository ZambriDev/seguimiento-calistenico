import { todayISO } from "../lib/date";
import { defaultState, saveState } from "../lib/storage";
import { WEEK } from "../lib/constants";

export default function ExportImport({ state, setState }) {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seguimiento_calistenico_${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const data = JSON.parse(String(rd.result));
        if (data && Array.isArray(data.days) && data.days.length === WEEK.length) {
          setState(data);
          saveState(data);
        } else {
          alert("Archivo inválido o incompatible.");
        }
      } catch { alert("No se pudo leer el JSON."); }
    };
    rd.readAsText(file);
  };

  const resetAll = () => {
    const ok = window.confirm("¿Estás seguro de que quieres reiniciar todo el progreso? Esta acción no se puede deshacer.");
    if (!ok) return;
    const fresh = defaultState();
    setState(fresh);
    saveState(fresh);
    navigator.vibrate?.(40);
    alert("Progreso reiniciado correctamente");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={exportJson} className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-100 text-sm">Exportar JSON</button>
      <label className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-100 text-sm cursor-pointer">
        Importar JSON
        <input type="file" accept="application/json" className="hidden" onChange={onImport} />
      </label>
      <button onClick={resetAll} className="px-3 py-2 rounded-xl bg-zinc-800 text-red-300 text-sm">Reiniciar</button>
    </div>
  );
}
