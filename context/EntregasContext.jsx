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
        actualizarEntrega,

        obtenerEntregasCliente,
        obtenerDeudasCliente,
        obtenerSaldoCliente,
        obtenerAbonosEntrega,

        registrarAbono,
        eliminarEntregas,
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