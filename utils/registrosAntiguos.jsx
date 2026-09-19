export const MESES_PARA_ARCHIVAR = 4;

export function obtenerFechaEntrega(fecha) {

  if (!fecha) {
    return null;
  }

  if (fecha?.toDate) {
    return fecha.toDate();
  }

  if (fecha?.seconds) {
    return new Date(
      fecha.seconds * 1000
    );
  }

  if (fecha instanceof Date) {
    return fecha;
  }

  if (
    typeof fecha === 'string'
  ) {

    const partes =
      fecha.split('/');

    if (partes.length === 3) {

      const dia =
        Number(partes[0]);

      const mes =
        Number(partes[1]) - 1;

      const anio =
        Number(partes[2]);

      return new Date(
        anio,
        mes,
        dia
      );
    }

  }

  return null;
}

export function esRegistroAntiguo(
  entrega
) {

  const fechaEntrega =
    obtenerFechaEntrega(
      entrega.fechaCreacion ||
      entrega.fecha
    );

  if (!fechaEntrega) {
    return false;
  }

  const fechaLimite =
    new Date();

  fechaLimite.setHours(
    23,
    59,
    59,
    999
  );

  fechaLimite.setMonth(
    fechaLimite.getMonth() -
    MESES_PARA_ARCHIVAR
  );

  return (
    fechaEntrega <= fechaLimite
  );
}

export function obtenerRegistrosAntiguos(
  entregas
) {

  if (!Array.isArray(entregas)) {
    return [];
  }

  return entregas.filter(
    esRegistroAntiguo
  );
}