export default function Header({ showWeek, setShowWeek }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-700 grid place-items-center text-white">
          {/* Logo araña */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
                <path d="M12 14H12.01M9 11.5L4.5 10L3 6M9 12.5L4 14L3.5 17M9 13L6 16.5L8 21M9 11L6 7L7.2 3M15 11.5L19.5 10L21 6M15 12.5L20 14L20.5 17M15 13L18 16.5L16 21M15 11L18 7L16.8 3M15 14C15 15.6569 13.6569 17 12 17C10.3431 17 9 15.6569 9 14C9 13.3333 9.21745 12.7175 9.58529 12.2195C9.80373 11.9237 9.91295 11.7758 9.95062 11.7017C9.99705 11.6104 10.0031 11.5944 10.0283 11.4951C10.0488 11.4145 10.0575 11.3103 10.0749 11.1018L10.3255 8.09689C10.3797 7.44678 10.4068 7.12173 10.5437 6.99076C10.6624 6.87726 10.8292 6.82925 10.99 6.86233C11.1756 6.90049 11.3713 7.16144 11.7627 7.68333L12.0002 8L12.2377 7.68333C12.6292 7.16144 12.8249 6.90049 13.0105 6.86233C13.1713 6.82925 13.3381 6.87726 13.4568 6.99076C13.5937 7.12173 13.6208 7.44678 13.675 8.09689L13.9252 11.1017C13.9425 11.3102 13.9512 11.4145 13.9717 11.4951C13.997 11.5944 14.003 11.6104 14.0494 11.7017C14.0871 11.7758 14.1963 11.9237 14.4148 12.2195C14.7826 12.7176 15 13.3334 15 14Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> 
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
