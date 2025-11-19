export function formaterNombre(
  nombre: number | null | undefined,
  decimales: number,
) {
  if (nombre == null) {
    return "";
  }

  return Number.isInteger(nombre)
    ? nombre.toString()
    : nombre.toFixed(decimales);
}
