import { config, euro } from './config.ts'

export type Service = 'fenster' | 'pflaster' | 'terrasse'

/** Richtpreis für Standardfenster – alles andere wird vorher individuell abgesprochen. */
export const windowsPrice = (count: number) => euro(count * config.prices.perWindow)
