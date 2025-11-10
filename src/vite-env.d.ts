/// <reference types="vite/client" />

// Declaración para el módulo virtual del plugin PWA
declare module 'virtual:pwa-register' {
  export function registerSW(options?: { immediate?: boolean }): void;
}
