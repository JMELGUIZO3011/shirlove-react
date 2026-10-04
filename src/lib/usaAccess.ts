// Token de acceso al Módulo USA (segunda capa de seguridad, independiente del
// login del panel). Se guarda en sessionStorage para que al cerrar la pestaña
// haya que volver a ingresar la contraseña del módulo.

export const USA_TOKEN_STORAGE_KEY = 'usa_token'
export const USA_ACCESS_REVOKED_EVENT = 'usa-access-revoked'
// Código que devuelve el backend (403) cuando falta o venció el token del módulo.
export const USA_ACCESO_REQUERIDO = 'USA_ACCESO_REQUERIDO'

export function getUsaToken(): string | null {
  try {
    return sessionStorage.getItem(USA_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setUsaToken(token: string) {
  try {
    sessionStorage.setItem(USA_TOKEN_STORAGE_KEY, token)
  } catch {
    /* almacenamiento no disponible: la sesión del módulo durará lo que dure la página */
  }
}

export function clearUsaToken() {
  try {
    sessionStorage.removeItem(USA_TOKEN_STORAGE_KEY)
  } catch {
    /* ignorar */
  }
}

// Borra el token y avisa a la UI (UsaGate) para que vuelva a pedir la contraseña.
export function revokeUsaAccess() {
  clearUsaToken()
  window.dispatchEvent(new Event(USA_ACCESS_REVOKED_EVENT))
}
