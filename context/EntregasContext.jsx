import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';

import { db } from '../firebase/config';

const EntregasContext = createContext();

export const EntregasProvider = ({
  children,
}) => {

  const [
    entregas,
    setEntregas,
  ] = useState([]);

  const [
    abonos,
    setAbonos,
  ] = useState([]);

  // ==========================================
  // LEER ENTREGAS EN TIEMPO REAL
  // ==========================================

  useEffect(() => {

    const referenciaEntregas =
      query(
        collection(
          db,
          'entregas'
        ),
        orderBy(
          'fechaCreacion',
          'desc'
        )
      );

    const cancelarEscucha =
      onSnapshot(
        referenciaEntregas,

        (snapshot) => {

          const listaEntregas =
            snapshot.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            );

          setEntregas(
            listaEntregas
          );
        },

        (error) => {

          console.log(
            'Error al leer entregas:',
            error
          );
        }
      );

    return () =>
      cancelarEscucha();

  }, []);

  // ==========================================
  // LEER ABONOS EN TIEMPO REAL
  // ==========================================

  useEffect(() => {

    const referenciaAbonos =
      query(
        collection(
          db,
          'abonos'
        ),
        orderBy(
          'fechaCreacion',
          'desc'
        )
      );

    const cancelarEscucha =
      onSnapshot(
        referenciaAbonos,

        (snapshot) => {

          const listaAbonos =
            snapshot.docs.map(
              (documento) => ({
                id:
                  documento.id,

                ...documento.data(),
              })
            );

          setAbonos(
            listaAbonos
          );
        },

        (error) => {

          console.log(
            'Error al leer abonos:',
            error
          );
        }
      );

    return () =>
      cancelarEscucha();

  }, []);

  // ==========================================
  // BUSCAR ENTREGA DEL CLIENTE POR FECHA
  // ==========================================

  const buscarEntregaPorFecha = (
    clienteId,
    fecha
  ) => {

    if (
      !clienteId ||
      !fecha
    ) {
      return null;
    }

    return (
      entregas.find(
        (entrega) =>
          String(entrega.clienteId) ===
            String(clienteId) &&
          entrega.fecha === fecha
      ) || null
    );
  };

  // ==========================================
  // AGREGAR ENTREGA
  // ==========================================

  const agregarEntrega = async (
    nuevaEntrega
  ) => {

    try {

      const {
        fechaSeleccionada,
        ...datosEntrega
      } = nuevaEntrega;

      let fechaCreacion =
        serverTimestamp();

      if (
        fechaSeleccionada instanceof
          Date &&
        !Number.isNaN(
          fechaSeleccionada.getTime()
        )
      ) {

        fechaCreacion =
          Timestamp.fromDate(
            fechaSeleccionada
          );
      }

      const entregaGuardar = {
        ...datosEntrega,
        fechaCreacion,
      };

      await addDoc(
        collection(
          db,
          'entregas'
        ),
        entregaGuardar
      );

      return true;

    } catch (error) {

      console.log(
        'Error al agregar entrega:',
        error
      );

      return false;
    }
  };

  // ==========================================
  // REEMPLAZAR ENTREGA
  // ==========================================

  const reemplazarEntrega = async (
    entregaAnterior,
    nuevaEntrega
  ) => {

    try {

      if (
        !entregaAnterior?.id
      ) {
        return {
          ok: false,
          mensaje:
            'No se encontró la entrega que se desea reemplazar.',
        };
      }

      const referenciaEntrega =
        doc(
          db,
          'entregas',
          entregaAnterior.id
        );

      const {
        fechaSeleccionada,
        ...datosNuevaEntrega
      } = nuevaEntrega;

      const ahora =
        new Date();

      const fechaReemplazo =
        Timestamp.fromDate(
          ahora
        );

      const historialAnterior =
        Array.isArray(
          entregaAnterior.historialReemplazos
        )
          ? entregaAnterior.historialReemplazos
          : [];

      const numeroReemplazos =
        Number(
          entregaAnterior.numeroEdiciones
        ) || 0;

      await updateDoc(
        referenciaEntrega,
        {
          ...datosNuevaEntrega,

          // ==================================
          // CONSERVAR REGISTRO ORIGINAL
          // ==================================

          fechaCreacion:
            entregaAnterior.fechaCreacion,

          // ==================================
          // HISTORIAL DE REEMPLAZOS
          // ==================================

          numeroEdiciones:
            numeroReemplazos + 1,

          historialReemplazos: [
            ...historialAnterior,
            fechaReemplazo,
          ],

          fechaUltimoReemplazo:
            fechaReemplazo,

          // ==================================
          // NUEVA TRANSFERENCIA
          // ==================================

          transferenciaConfirmada:
            Number(
              datosNuevaEntrega.pagoTransferencia
            ) > 0
              ? false
              : null,

          transferenciaConDiferencia:
            false,

          fechaConfirmacionTransferencia:
            null,
        }
      );

      return {
        ok: true,
        mensaje:
          'Entrega reemplazada correctamente.',
      };

    } catch (error) {

      console.log(
        'Error al reemplazar entrega:',
        error
      );

      return {
        ok: false,
        mensaje:
          'No se pudo reemplazar la entrega.',
      };
    }
  };

  // ==========================================
  // ACTUALIZAR ENTREGA
  // ==========================================

  const actualizarEntrega = async (
    entregaActualizada
  ) => {

    try {

      const referenciaEntrega =
        doc(
          db,
          'entregas',
          entregaActualizada.id
        );

      const {
        id,
        fechaCreacion,
        ...datosEntrega
      } = entregaActualizada;

      await updateDoc(
        referenciaEntrega,
        datosEntrega
      );

      return true;

    } catch (error) {

      console.log(
        'Error al actualizar entrega:',
        error
      );

      return false;
    }
  };

  const vincularEntregaACliente = async (
    entregaId,
    clienteId
  ) => {
    try {
      if (!entregaId || !clienteId) {
        return {
          ok: false,
          mensaje:
            'No se pudo identificar la entrega o el cliente.',
        };
      }

      const referenciaEntrega = doc(
        db,
        'entregas',
        entregaId
      );

      await updateDoc(
        referenciaEntrega,
        {
          clienteId: clienteId,

          convertidoACliente: true,

          clienteConvertidoId:
            clienteId,

          fechaConversionCliente:
            Timestamp.now(),
        }
      );

      return {
        ok: true,
      };
    } catch (error) {
      console.log(
        'Error al vincular entrega con cliente:',
        error
      );

      return {
        ok: false,
      };
    }
  };

  // ==========================================
  // OBTENER ENTREGAS DE UN CLIENTE
  // ==========================================

  const obtenerEntregasCliente = (
    clienteId
  ) => {

    return entregas.filter(
      (entrega) =>
        String(
          entrega.clienteId
        ) ===
        String(
          clienteId
        )
    );
  };

  // ==========================================
  // OBTENER DEUDAS DE UN CLIENTE
  // ==========================================

  const obtenerDeudasCliente = (
    clienteId
  ) => {

    return entregas
      .filter(
        (entrega) =>
          String(
            entrega.clienteId
          ) ===
            String(
              clienteId
            ) &&
          Number(
            entrega.saldoPendiente
          ) > 0
      )
      .sort(
        (
          entregaA,
          entregaB
        ) => {

          const fechaA =
            entregaA.fechaCreacion
              ?.toMillis
              ? entregaA.fechaCreacion
                  .toMillis()
              : 0;

          const fechaB =
            entregaB.fechaCreacion
              ?.toMillis
              ? entregaB.fechaCreacion
                  .toMillis()
              : 0;

          return (
            fechaA -
            fechaB
          );
        }
      );
  };

  // ==========================================
  // OBTENER SALDO TOTAL DE UN CLIENTE
  // ==========================================

  const obtenerSaldoCliente = (
    clienteId
  ) => {

    return obtenerDeudasCliente(
      clienteId
    ).reduce(
      (
        acumulado,
        entrega
      ) => {

        return (
          acumulado +
          (
            Number(
              entrega.saldoPendiente
            ) || 0
          )
        );
      },
      0
    );
  };

  // ==========================================
  // OBTENER ABONOS DE UNA ENTREGA
  // ==========================================

  const obtenerAbonosEntrega = (
    entregaId
  ) => {

    return abonos.filter(
      (abono) => {

        if (
          Array.isArray(
            abono.distribucion
          )
        ) {

          return (
            abono.distribucion.some(
              (detalle) =>
                String(
                  detalle.entregaId
                ) ===
                String(
                  entregaId
                )
            )
          );
        }

        return (
          String(
            abono.entregaId
          ) ===
          String(
            entregaId
          )
        );
      }
    );
  };

  // ==========================================
  // REGISTRAR ABONO
  // ==========================================

  const registrarAbono = async ({
    clienteId,
    entregaId = null,
    pagoEfectivo = 0,
    pagoTransferencia = 0,
    fechaTrabajo = null,
  }) => {

    try {

      const efectivo =
        Number(
          Number(
            pagoEfectivo
          ).toFixed(2)
        );

      const transferencia =
        Number(
          Number(
            pagoTransferencia
          ).toFixed(2)
        );

      const montoTotal =
        Number(
          (
            efectivo +
            transferencia
          ).toFixed(2)
        );

      // ======================================
      // VALIDACIONES GENERALES
      // ======================================

      if (
        !clienteId
      ) {

        return {
          ok: false,
          mensaje:
            'No se encontró el cliente.',
        };
      }

      if (
        montoTotal <= 0
      ) {

        return {
          ok: false,
          mensaje:
            'Ingrese un valor para el abono.',
        };
      }

      // ======================================
      // DEUDAS DEL CLIENTE
      // ======================================

      let deudas =
        obtenerDeudasCliente(
          clienteId
        );

      if (
        entregaId
      ) {

        deudas =
          deudas.filter(
            (entrega) =>
              String(
                entrega.id
              ) ===
              String(
                entregaId
              )
          );
      }

      if (
        deudas.length === 0
      ) {

        return {
          ok: false,
          mensaje:
            'El cliente no tiene saldos pendientes.',
        };
      }

      const saldoDisponible =
        Number(
          deudas
            .reduce(
              (
                acumulado,
                entrega
              ) =>
                acumulado +
                (
                  Number(
                    entrega.saldoPendiente
                  ) || 0
                ),
              0
            )
            .toFixed(2)
        );

      if (
        montoTotal >
        saldoDisponible
      ) {

        return {
          ok: false,

          mensaje:
            entregaId
              ? 'El abono no puede superar el saldo pendiente de la entrega seleccionada.'
              : 'El abono no puede superar el saldo pendiente total del cliente.',
        };
      }

      // ======================================
      // REFERENCIA DEL NUEVO ABONO
      // ======================================

      const referenciaAbono =
        doc(
          collection(
            db,
            'abonos'
          )
        );

      // ======================================
      // TRANSACCIÓN
      // ======================================

      await runTransaction(
        db,
        async (
          transaction
        ) => {

          // ==================================
          // PRIMERO LEER TODAS LAS ENTREGAS
          // ==================================

          const entregasActuales =
            [];

          for (
            const deuda of deudas
          ) {

            const referenciaEntrega =
              doc(
                db,
                'entregas',
                deuda.id
              );

            const documentoEntrega =
              await transaction.get(
                referenciaEntrega
              );

            if (
              !documentoEntrega.exists()
            ) {

              throw new Error(
                'ENTREGA_NO_EXISTE'
              );
            }

            const datosEntrega =
              documentoEntrega.data();

            const saldoActual =
              Number(
                datosEntrega
                  .saldoPendiente
              ) || 0;

            if (
              saldoActual > 0
            ) {

              entregasActuales.push({
                id:
                  documentoEntrega.id,

                referencia:
                  referenciaEntrega,

                datos:
                  datosEntrega,

                saldo:
                  Number(
                    saldoActual.toFixed(
                      2
                    )
                  ),
              });
            }
          }

          if (
            entregasActuales.length ===
            0
          ) {

            throw new Error(
              'SIN_SALDO'
            );
          }

          // ==================================
          // VALIDAR NUEVAMENTE EL SALDO
          // ==================================

          const saldoActualTotal =
            Number(
              entregasActuales
                .reduce(
                  (
                    acumulado,
                    entrega
                  ) =>
                    acumulado +
                    entrega.saldo,
                  0
                )
                .toFixed(2)
            );

          if (
            montoTotal >
            saldoActualTotal
          ) {

            throw new Error(
              'ABONO_SUPERA_SALDO'
            );
          }

          // ==================================
          // DISTRIBUIR ABONO
          // ==================================

          let restante =
            montoTotal;

          const distribucion =
            [];

          for (
            const entrega of
              entregasActuales
          ) {

            if (
              restante <= 0
            ) {
              break;
            }

            const montoAplicado =
              Number(
                Math.min(
                  restante,
                  entrega.saldo
                ).toFixed(2)
              );

            const nuevoSaldo =
              Number(
                (
                  entrega.saldo -
                  montoAplicado
                ).toFixed(2)
              );

            distribucion.push({
              entregaId:
                entrega.id,

              fechaDeuda:
                entrega.datos
                  .fecha || '',

              saldoAnterior:
                entrega.saldo,

              montoAplicado,

              saldoNuevo:
                nuevoSaldo,
            });

            transaction.update(
              entrega.referencia,
              {
                saldoPendiente:
                  nuevoSaldo,
              }
            );

            restante =
              Number(
                (
                  restante -
                  montoAplicado
                ).toFixed(2)
              );
          }

          // ==================================
          // FECHA REAL DEL PAGO
          // ==================================

          const ahoraReal =
            new Date();

          const ahora =
            fechaTrabajo instanceof Date &&
            !Number.isNaN(
              fechaTrabajo.getTime()
            )
              ? new Date(
                  fechaTrabajo.getFullYear(),
                  fechaTrabajo.getMonth(),
                  fechaTrabajo.getDate(),
                  ahoraReal.getHours(),
                  ahoraReal.getMinutes(),
                  ahoraReal.getSeconds(),
                  0
                )
              : ahoraReal;

          const dia =
            String(
              ahora.getDate()
            ).padStart(
              2,
              '0'
            );

          const mes =
            String(
              ahora.getMonth() +
                1
            ).padStart(
              2,
              '0'
            );

          const anio =
            ahora.getFullYear();

          const hora =
            String(
              ahora.getHours()
            ).padStart(
              2,
              '0'
            );

          const minutos =
            String(
              ahora.getMinutes()
            ).padStart(
              2,
              '0'
            );

          const segundos =
            String(
              ahora.getSeconds()
            ).padStart(
              2,
              '0'
            );

          const fechaPago =
            `${dia}/${mes}/${anio}`;

          const horaPago =
            `${hora}:${minutos}:${segundos}`;

          // ==================================
          // MÉTODOS UTILIZADOS
          // ==================================

          const metodosPago =
            [];

          if (
            efectivo > 0
          ) {
            metodosPago.push(
              'Efectivo'
            );
          }

          if (
            transferencia > 0
          ) {
            metodosPago.push(
              'Transferencia'
            );
          }

          // ==================================
          // GUARDAR MOVIMIENTO
          // ==================================

          transaction.set(
            referenciaAbono,
            {
              clienteId:
                String(
                  clienteId
                ),

              entregaId:
                entregaId
                  ? String(
                      entregaId
                    )
                  : null,

              tipo:
                entregaId
                  ? 'ESPECIFICO'
                  : 'AUTOMATICO',

              monto:
                montoTotal,

              pagoEfectivo:
                efectivo,

              pagoTransferencia:
                transferencia,

              metodosPago,

              transferenciaConfirmada:
                transferencia > 0
                  ? false
                  : null,

              transferenciaConDiferencia:
                false,

              fechaConfirmacionTransferencia:
                null,

              fecha:
                fechaPago,

              hora:
                horaPago,

              fechaCreacion:
              fechaTrabajo instanceof Date &&
              !Number.isNaN(
                fechaTrabajo.getTime()
              )
                ? Timestamp.fromDate(
                    ahora
                  )
                : serverTimestamp(),

              distribucion,
            }
          );
        }
      );

      return {
        ok: true,
        mensaje:
          'Abono registrado correctamente.',
      };

    } catch (error) {

      console.log(
        'Error al registrar abono:',
        error
      );

      if (
        error.message ===
        'ABONO_SUPERA_SALDO'
      ) {

        return {
          ok: false,
          mensaje:
            'El saldo cambió. El abono supera el saldo pendiente actual.',
        };
      }

      if (
        error.message ===
        'SIN_SALDO'
      ) {

        return {
          ok: false,
          mensaje:
            'La deuda seleccionada ya no tiene saldo pendiente.',
        };
      }

      if (
        error.message ===
        'ENTREGA_NO_EXISTE'
      ) {

        return {
          ok: false,
          mensaje:
            'No se encontró una de las entregas.',
        };
      }

      return {
        ok: false,
        mensaje:
          'No se pudo registrar el abono.',
      };
    }
  };

  // ==========================================
// CONFIRMAR TRANSFERENCIA DE UN ABONO
// ==========================================

const confirmarTransferenciaAbono = async ({
  abonoId,
  montoRecibido,
  fechaTransferencia,
}) => {

  try {

    const abonoActual =
      abonos.find(
        (abono) =>
          String(abono.id) ===
          String(abonoId)
      );

    if (!abonoActual) {
      return {
        ok: false,
        mensaje:
          'No se encontró el abono.',
      };
    }

    const transferenciaAnterior =
      Number(
        abonoActual.pagoTransferencia || 0
      );

    const transferenciaRecibida =
      Number(montoRecibido);

    if (
      Number.isNaN(transferenciaRecibida) ||
      transferenciaRecibida < 0
    ) {
      return {
        ok: false,
        mensaje:
          'Ingrese un valor válido para la transferencia.',
      };
    }

    if (
      transferenciaRecibida >
      transferenciaAnterior
    ) {
      return {
        ok: false,
        mensaje:
          'El valor recibido no puede superar la transferencia registrada.',
      };
    }

    if (!fechaTransferencia) {
      return {
        ok: false,
        mensaje:
          'Seleccione la fecha de la transferencia.',
      };
    }

    if (
      abonoActual.transferenciaConfirmada ===
      true
    ) {
      return {
        ok: false,
        mensaje:
          'Esta transferencia ya fue confirmada.',
      };
    }

    const diferencia =
      Number(
        (
          transferenciaAnterior -
          transferenciaRecibida
        ).toFixed(2)
      );

    const valoresCoinciden =
      diferencia === 0;

    const distribucionOriginal =
      Array.isArray(
        abonoActual.distribucion
      )
        ? abonoActual.distribucion
        : [];

    const referenciaAbono =
      doc(
        db,
        'abonos',
        abonoId
      );

    await runTransaction(
      db,
      async (transaction) => {

        // ======================================
        // LEER ENTREGAS AFECTADAS
        // ======================================

        const entregasAfectadas =
          [];

        if (diferencia > 0) {

          for (
            const detalle of
            distribucionOriginal
          ) {

            const referenciaEntrega =
              doc(
                db,
                'entregas',
                detalle.entregaId
              );

            const documentoEntrega =
              await transaction.get(
                referenciaEntrega
              );

            if (
              !documentoEntrega.exists()
            ) {
              throw new Error(
                'ENTREGA_NO_EXISTE'
              );
            }

            entregasAfectadas.push({
              detalle,
              referencia:
                referenciaEntrega,
              datos:
                documentoEntrega.data(),
            });
          }
        }

        // ======================================
        // DEVOLVER LA DIFERENCIA
        // DESDE LA ÚLTIMA DEUDA AFECTADA
        // ======================================

        let diferenciaRestante =
          diferencia;

        const nuevaDistribucion =
          distribucionOriginal.map(
            (detalle) => ({
              ...detalle,
            })
          );

        for (
          let indice =
            entregasAfectadas.length - 1;

          indice >= 0 &&
          diferenciaRestante > 0;

          indice--
        ) {

          const entregaAfectada =
            entregasAfectadas[indice];

          const detalle =
            nuevaDistribucion[indice];

          const montoAplicado =
            Number(
              detalle.montoAplicado || 0
            );

          const montoDevolver =
            Number(
              Math.min(
                diferenciaRestante,
                montoAplicado
              ).toFixed(2)
            );

          const saldoActual =
            Number(
              entregaAfectada.datos
                .saldoPendiente || 0
            );

          const nuevoSaldo =
            Number(
              (
                saldoActual +
                montoDevolver
              ).toFixed(2)
            );

          const nuevoMontoAplicado =
            Number(
              (
                montoAplicado -
                montoDevolver
              ).toFixed(2)
            );

          transaction.update(
            entregaAfectada.referencia,
            {
              saldoPendiente:
                nuevoSaldo,
            }
          );

          detalle.montoAplicado =
            nuevoMontoAplicado;

          detalle.saldoNuevo =
            Number(
              (
                Number(
                  detalle.saldoAnterior ||
                  0
                ) -
                nuevoMontoAplicado
              ).toFixed(2)
            );

          diferenciaRestante =
            Number(
              (
                diferenciaRestante -
                montoDevolver
              ).toFixed(2)
            );
        }

        if (
          diferenciaRestante > 0
        ) {
          throw new Error(
            'DISTRIBUCION_INSUFICIENTE'
          );
        }

        // ======================================
        // ACTUALIZAR EL ABONO
        // ======================================

          const efectivo =
            Number(
              abonoActual.pagoEfectivo || 0
            );

          const nuevoMontoTotal =
            Number(
              (
                efectivo +
                transferenciaRecibida
              ).toFixed(2)
            );

          transaction.update(
            referenciaAbono,
            {
              pagoTransferencia:
                Number(
                  transferenciaRecibida.toFixed(
                    2
                  )
                ),

              monto:
                nuevoMontoTotal,

              transferenciaConfirmada:
                true,

              transferenciaConDiferencia:
                !valoresCoinciden,

              fechaConfirmacionTransferencia:
                fechaTransferencia,

              distribucion:
                nuevaDistribucion,
            }
          );
        }
      );

      return {
        ok: true,

        diferencia:
          !valoresCoinciden,

        mensaje:
          valoresCoinciden
            ? 'Transferencia confirmada correctamente.'
            : 'Transferencia actualizada correctamente.',
      };

    } catch (error) {

      console.log(
        'Error al confirmar transferencia del abono:',
        error
      );

      if (
        error.message ===
        'ENTREGA_NO_EXISTE'
      ) {
        return {
          ok: false,
          mensaje:
            'No se encontró una de las entregas relacionadas con el abono.',
        };
      }

      if (
        error.message ===
        'DISTRIBUCION_INSUFICIENTE'
      ) {
        return {
          ok: false,
          mensaje:
            'No se pudo corregir la distribución del abono.',
        };
      }

      return {
        ok: false,
        mensaje:
          'No se pudo confirmar la transferencia.',
      };
    }
  };

    // ==========================================
  // CONFIRMAR TRANSFERENCIA DE UNA ENTREGA
  // ==========================================

  const confirmarTransferenciaEntrega = async ({
    entregaId,
    montoRecibido,
    fechaTransferencia,
    comprobante = null,
  }) => {

    try {

      const entregaActual =
        entregas.find(
          (entrega) =>
            String(entrega.id) ===
            String(entregaId)
        );

      if (!entregaActual) {
        return {
          ok: false,
          mensaje:
            'No se encontró la entrega.',
        };
      }

      const transferenciaAnterior =
        Number(
          entregaActual.pagoTransferencia || 0
        );

      const transferenciaRecibida =
        Number(montoRecibido);

      if (
        Number.isNaN(transferenciaRecibida) ||
        transferenciaRecibida < 0
      ) {
        return {
          ok: false,
          mensaje:
            'Ingrese un valor válido para la transferencia.',
        };
      }

      if (
        transferenciaRecibida >
        transferenciaAnterior
      ) {
        return {
          ok: false,
          mensaje:
            'El valor recibido no puede superar la transferencia registrada.',
        };
      }

      if (!fechaTransferencia) {
        return {
          ok: false,
          mensaje:
            'Seleccione la fecha de la transferencia.',
        };
      }

      const valoresCoinciden =
        Math.round(
          transferenciaRecibida * 100
        ) ===
        Math.round(
          transferenciaAnterior * 100
        );

      const diferenciaCentavos =
        Math.round(
          transferenciaAnterior * 100
        ) -
        Math.round(
          transferenciaRecibida * 100
        );

      const abonoActualCentavos =
        Math.round(
          (
            Number(
              entregaActual.abona
            ) || 0
          ) * 100
        );

      const saldoActualCentavos =
        Math.round(
          (
            Number(
              entregaActual.saldoPendiente
            ) || 0
          ) * 100
        );

      const nuevoAbono =
        Math.max(
          0,
          (
            abonoActualCentavos -
            diferenciaCentavos
          ) / 100
        );

      const nuevoSaldo =
        (
          saldoActualCentavos +
          diferenciaCentavos
        ) / 100;

      const referenciaEntrega =
        doc(
          db,
          'entregas',
          entregaId
        );

      await updateDoc(
        referenciaEntrega,
        {
          pagoTransferencia:
            Number(
              transferenciaRecibida.toFixed(2)
            ),

          abona:
            Number(
              nuevoAbono.toFixed(2)
            ),

          saldoPendiente:
            Number(
              nuevoSaldo.toFixed(2)
            ),

          transferenciaConfirmada:
            true,

          transferenciaConDiferencia:
            !valoresCoinciden,

          fechaConfirmacionTransferencia:
            valoresCoinciden
              ? null
              : fechaTransferencia,

          ...(comprobante
            ? {
                tieneComprobanteTransferencia: true,

                comprobanteTransferencia:
                  comprobante.uri,

                comprobanteTransferenciaRuta:
                  comprobante.nombre,

                comprobanteTransferenciaFecha:
                  Timestamp.now(),

                comprobanteTomadoPorId:
                  comprobante.usuarioId || null,

                comprobanteTomadoPorNombre:
                  comprobante.usuarioNombre || 'Usuario',
              }
            : {}),
        }
      );

      return {
        ok: true,
        diferencia:
          !valoresCoinciden,

        mensaje:
          valoresCoinciden
            ? 'Transferencia confirmada correctamente.'
            : 'Transferencia actualizada correctamente.',
      };

    } catch (error) {

      console.log(
        'Error al confirmar transferencia:',
        error
      );

      return {
        ok: false,
        mensaje:
          'No se pudo confirmar la transferencia.',
      };
    }
  };

  // ==========================================
// ELIMINAR ENTREGAS
// ==========================================

  const eliminarEntregas = async (
    idsEntregas
  ) => {

    try {

      if (
        !Array.isArray(idsEntregas) ||
        idsEntregas.length === 0
      ) {

        return {
          ok: false,
          mensaje:
            'No existen registros seleccionados.',
        };
      }

      const eliminaciones =
        idsEntregas.map(
          (entregaId) => {

            const referenciaEntrega =
              doc(
                db,
                'entregas',
                entregaId
              );

            return deleteDoc(
              referenciaEntrega
            );
          }
        );

      await Promise.all(
        eliminaciones
      );

      return {
        ok: true,
        mensaje:
          idsEntregas.length === 1
            ? 'Registro eliminado correctamente.'
            : `${idsEntregas.length} registros eliminados correctamente.`,
      };

    } catch (error) {

      console.log(
        'Error al eliminar entregas:',
        error
      );

      return {
        ok: false,
        mensaje:
          'No se pudieron eliminar los registros seleccionados.',
      };
    }
  };

  // ==========================================
  // PROVIDER
  // ==========================================

  return (
    <EntregasContext.Provider
      value={{
        entregas,
        abonos,

        agregarEntrega,
        reemplazarEntrega,
        actualizarEntrega,
        buscarEntregaPorFecha,

        obtenerEntregasCliente,
        obtenerDeudasCliente,
        obtenerSaldoCliente,
        obtenerAbonosEntrega,

        registrarAbono,
        confirmarTransferenciaAbono,
        confirmarTransferenciaEntrega,
        eliminarEntregas,
        vincularEntregaACliente,
      }}
    >
      {children}
    </EntregasContext.Provider>
  );
};

export const useEntregas = () =>
  useContext(
    EntregasContext
  );