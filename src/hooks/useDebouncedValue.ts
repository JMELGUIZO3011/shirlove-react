import { useEffect, useState } from 'react'

/**
 * Devuelve `value` con un retardo, para no disparar una petición por cada
 * pulsación de tecla en buscadores que consultan al servidor.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}
