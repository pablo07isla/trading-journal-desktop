/**
 * Formatea una fecha para mostrar en hora de Colombia (UTC-5)
 * @param dateString - Fecha en formato ISO string o timestamp (normalmente desde DB en UTC)
 * @param options - Opciones de formateo
 * @returns Fecha formateada en hora de Colombia (UTC-5)
 */
export const formatDateToSystemTimezone = (
  dateString: string | number | Date,
  options: {
    includeTime?: boolean;
  } = {}
): string => {
  const { includeTime = true } = options;

  try {
    const date = new Date(dateString);

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return "Fecha inválida";
    }

    // Convertir a hora de Colombia (UTC-5: restar 5 horas a UTC)
    const colombiaTime = new Date(date.getTime() - 5 * 60 * 60 * 1000);

    // Si solo queremos la fecha sin hora
    if (!includeTime) {
      // dd/mm/yyyy
      const day = String(colombiaTime.getUTCDate()).padStart(2, "0");
      const month = String(colombiaTime.getUTCMonth() + 1).padStart(2, "0");
      const year = colombiaTime.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }

    // dd/mm/yyyy hh:mm
    const day = String(colombiaTime.getUTCDate()).padStart(2, "0");
    const month = String(colombiaTime.getUTCMonth() + 1).padStart(2, "0");
    const year = colombiaTime.getUTCFullYear();
    const hour = String(colombiaTime.getUTCHours()).padStart(2, "0");
    const minute = String(colombiaTime.getUTCMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hour}:${minute}`;
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return "Error en fecha";
  }
};

/**
 * Formatea una fecha para trades MT5 con formato compacto en hora de Colombia
 * @param dateString - Fecha en formato ISO string o timestamp (desde DB en UTC)
 * @returns Fecha formateada compacta para tablas en hora de Colombia
 */
export const formatTradeDate = (dateString: string | number | Date): string => {
  return formatDateToSystemTimezone(dateString, {
    includeTime: true,
  });
};

/**
 * Formatea una fecha para cuentas MT5 en hora de Colombia
 * @param dateString - Fecha en formato ISO string o timestamp (desde DB en UTC)
 * @returns Fecha formateada para cuentas en hora de Colombia
 */
export const formatAccountDate = (
  dateString: string | number | Date
): string => {
  return formatDateToSystemTimezone(dateString, {
    includeTime: true,
  });
};

/**
 * Obtiene la fecha actual en hora de Colombia en formato legible
 * @returns Fecha y hora actual en hora de Colombia
 */
export const getCurrentSystemDateTime = (): string => {
  return formatDateToSystemTimezone(new Date());
};
