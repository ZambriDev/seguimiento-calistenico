export default function DietCard() {
  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-green-800/40 p-4 shadow">
      <h3 className="text-lg font-semibold text-green-300">Dieta sugerida</h3>
      <ul className="mt-2 text-sm text-zinc-200 list-disc ml-5 space-y-1">
        <li>Prioriza proteína magra.</li>
        <li>Evita ultraprocesados y bebidas calóricas.</li>
        <li>Base de vegetales, frutas, legumbres y agua.</li>
        <li>3–4 comidas constantes.</li>
        <li>Constancia &gt; perfección diaria.</li>
      </ul>
    </div>
  );
}
