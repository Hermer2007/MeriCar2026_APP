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



      const documentoEntrega =

        await addDoc(

          collection(

            db,

            'entregas'

          ),

          {

            ...entregaGuardar,



            // Permite identificar que esta

            // entrega puede formar parte

            // del sistema de deshacer

            accionCreadaEn:

              serverTimestamp(),



            accionDeshecha:

              false,

          }

        );



      return {

        ok: true,

        id: documentoEntrega.id,

      };



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




  // ==========================================
  // COBRO COMBINADO: ENTREGA ACTUAL + DEUDAS
  // ==========================================
  // Esta operación es atómica: nunca registra una entrega nueva
  // sin actualizar los saldos anteriores incluidos en el cobro.
  // La distribución se aplica primero a las deudas seleccionadas
  // (en el orden recibido) y después a la entrega de hoy.
  const registrarEntregaConSaldos = async ({
    nuevaEntrega,
    idsDeudas = [],
    comprobante = null,
  }) => {
    try {
      if (!nuevaEntrega?.clienteId) {
        return { ok: false, mensaje: 'Seleccione un cliente registrado.' };
      }
      const ids = [...new Set(idsDeudas.map(String))];
      if (ids.length === 0) {
        return { ok: false, mensaje: 'Seleccione al menos un saldo anterior.' };
      }
      const centavos = (v) => Math.round((Number(v) || 0) * 100);
      const totalHoy = centavos(nuevaEntrega.total);
      const efectivo = centavos(nuevaEntrega.pagoEfectivo);
      const transferencia = centavos(nuevaEntrega.pagoTransferencia);
      const pagado = efectivo + transferencia;
      if (totalHoy <= 0 || efectivo < 0 || transferencia < 0 || !Number.isFinite(pagado)) {
        return { ok: false, mensaje: 'Revise los valores de la entrega.' };
      }
      const referenciaNueva = doc(collection(db, 'entregas'));
      const referenciaAbono = doc(collection(db, 'abonos'));
      const referenciasDeuda = ids.map(id => doc(db, 'entregas', id));
      const fechaAhora = new Date();
      const fechaPago = `${String(fechaAhora.getDate()).padStart(2, '0')}/${String(fechaAhora.getMonth() + 1).padStart(2, '0')}/${fechaAhora.getFullYear()}`;
      const horaPago = `${String(fechaAhora.getHours()).padStart(2, '0')}:${String(fechaAhora.getMinutes()).padStart(2, '0')}:${String(fechaAhora.getSeconds()).padStart(2, '0')}`;
      const tieneComprobante = transferencia > 0 && Boolean(comprobante?.uri);
      let resumen = null;
      await runTransaction(db, async (transaction) => {
        // Firestore requiere realizar todas las lecturas antes de escribir.
        const documentos = [];
        for (const referencia of referenciasDeuda) {
          documentos.push(await transaction.get(referencia));
        }
        const deudas = documentos.map((documento, i) => {
          if (!documento.exists()) throw new Error('DEUDA_NO_EXISTE');
          const datos = documento.data();
          if (String(datos.clienteId) !== String(nuevaEntrega.clienteId)) {
            throw new Error('DEUDA_OTRO_CLIENTE');
          }
          const saldo = centavos(datos.saldoPendiente);
          if (saldo <= 0) throw new Error('DEUDA_SIN_SALDO');
          return { id: documento.id, referencia: referenciasDeuda[i], datos, saldo };
        });
        const totalAnterior = deudas.reduce((sum, d) => sum + d.saldo, 0);
        if (pagado > totalHoy + totalAnterior) throw new Error('PAGO_EXCESIVO');
        let restante = pagado;
        const distribucion = [];
        for (const deuda of deudas) {
          const aplicado = Math.min(restante, deuda.saldo);
          if (aplicado > 0) {
            transaction.update(deuda.referencia, {
              saldoPendiente: (deuda.saldo - aplicado) / 100,
            });
            distribucion.push({
              entregaId: deuda.id,
              fechaDeuda: deuda.datos.fecha || '',
              saldoAnterior: deuda.saldo / 100,
              montoAplicado: aplicado / 100,
              saldoNuevo: (deuda.saldo - aplicado) / 100,
            });
            restante -= aplicado;
          }
        }
        const pagadoAnterior = pagado - restante;
        // Distribución por método: efectivo primero, luego transferencia.
        const efectivoAnterior = Math.min(efectivo, pagadoAnterior);
        const transferenciaAnterior = pagadoAnterior - efectivoAnterior;
        const efectivoHoy = efectivo - efectivoAnterior;
        const transferenciaHoy = transferencia - transferenciaAnterior;
        const { fechaSeleccionada, ...datosEntrega } = nuevaEntrega;
        const fechaCreacion = fechaSeleccionada instanceof Date && !Number.isNaN(fechaSeleccionada.getTime())
          ? Timestamp.fromDate(fechaSeleccionada) : serverTimestamp();
        transaction.set(referenciaNueva, {
          ...datosEntrega,
          total: totalHoy / 100,
          abona: restante / 100,
          saldoPendiente: (totalHoy - restante) / 100,
          pagoEfectivo: efectivoHoy / 100,
          pagoTransferencia: transferenciaHoy / 100,
          metodosPago: [
            ...(efectivoHoy > 0 ? ['Efectivo'] : []),
            ...(transferenciaHoy > 0 ? ['Transferencia'] : []),
          ],
          transferenciaConfirmada: transferenciaHoy > 0 ? tieneComprobante : null,
          tieneComprobanteTransferencia: transferenciaHoy > 0 && tieneComprobante,
          fechaCreacion,
          accionCreadaEn: serverTimestamp(),
          accionDeshecha: false,
          cobroCombinadoId: referenciaAbono.id,
          saldosIncluidosIds: ids,
        });
        if (pagadoAnterior > 0) {
          transaction.set(referenciaAbono, {
            clienteId: String(nuevaEntrega.clienteId),
            entregaId: null,
            tipo: 'AUTOMATICO',
            monto: pagadoAnterior / 100,
            pagoEfectivo: efectivoAnterior / 100,
            pagoTransferencia: transferenciaAnterior / 100,
            metodosPago: [
              ...(efectivoAnterior > 0 ? ['Efectivo'] : []),
              ...(transferenciaAnterior > 0 ? ['Transferencia'] : []),
            ],
            transferenciaConfirmada: transferenciaAnterior > 0 ? tieneComprobante : null,
            transferenciaConDiferencia: false,
            fechaConfirmacionTransferencia: tieneComprobante ? fechaPago : null,
            tieneComprobanteTransferencia: Boolean(tieneComprobante),
            comprobanteTransferencia: tieneComprobante ? comprobante.uri : null,
            comprobanteTransferenciaRuta: tieneComprobante ? comprobante.nombre || null : null,
            comprobanteTransferenciaFecha: tieneComprobante ? fechaPago : null,
            comprobanteTomadoPorId: tieneComprobante ? comprobante.usuarioId || null : null,
            comprobanteTomadoPorNombre: tieneComprobante ? comprobante.usuarioNombre || null : null,
            fecha: fechaPago,
            hora: horaPago,
            fechaCreacion: serverTimestamp(),
            distribucion,
            cobroCombinadoEntregaId: referenciaNueva.id,
          });
        }
        resumen = {
          entregaId: referenciaNueva.id,
          abonoId: pagadoAnterior > 0 ? referenciaAbono.id : null,
          totalACobrar: (totalHoy + totalAnterior) / 100,
          pagadoAnterior: pagadoAnterior / 100,
          pagadoHoy: restante / 100,
          saldoPendienteHoy: (totalHoy - restante) / 100,
        };
      });
      return { ok: true, ...resumen };
    } catch (error) {
      console.log('Error al registrar cobro combinado:', error);
      const mensajes = {
        DEUDA_NO_EXISTE: 'Una de las deudas ya no existe.',
        DEUDA_OTRO_CLIENTE: 'Las deudas seleccionadas no pertenecen a este cliente.',
        DEUDA_SIN_SALDO: 'Una de las deudas seleccionadas ya fue pagada.',
        PAGO_EXCESIVO: 'El pago no puede superar el total a cobrar.',
      };
      return { ok: false, mensaje: mensajes[error.message] || 'No se pudo registrar el cobro combinado.' };
    }
  };

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

    comprobante = null,

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



      const tieneComprobante =

        transferencia > 0 &&

        comprobante?.uri;



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

                  ? tieneComprobante

                    ? true

                    : false

                  : null,



              transferenciaConDiferencia:

                false,



              fechaConfirmacionTransferencia:

                tieneComprobante

                  ? fechaPago

                  : null,



              tieneComprobanteTransferencia:

                tieneComprobante

                  ? true

                  : false,



              comprobanteTransferencia:

                tieneComprobante

                  ? comprobante.uri

                  : null,



              comprobanteTransferenciaRuta:

                tieneComprobante

                  ? comprobante.nombre || null

                  : null,



              comprobanteTransferenciaFecha:

                tieneComprobante

                  ? fechaPago

                  : null,



              comprobanteTomadoPorId:

                tieneComprobante

                  ? comprobante.usuarioId || null

                  : null,



              comprobanteTomadoPorNombre:

                tieneComprobante

                  ? comprobante.usuarioNombre || null

                  : null, tieneComprobanteTransferencia:

                tieneComprobante

                  ? true

                  : false,



              comprobanteTransferencia:

                tieneComprobante

                  ? comprobante.uri

                  : null,



              comprobanteTransferenciaRuta:

                tieneComprobante

                  ? comprobante.nombre || null

                  : null,



              comprobanteTransferenciaFecha:

                tieneComprobante

                  ? fechaPago

                  : null,



              comprobanteTomadoPorId:

                tieneComprobante

                  ? comprobante.usuarioId || null

                  : null,



              comprobanteTomadoPorNombre:

                tieneComprobante

                  ? comprobante.usuarioNombre || null

                  : null,



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

  // DESHACER ÚLTIMA ACCIÓN DEL DÍA

  // ==========================================



  const deshacerUltimaAccion = async (

    clienteId

  ) => {

    try {



      if (!clienteId) {

        return {

          ok: false,

          codigo: 'SIN_CLIENTE',

          mensaje:

            'No se pudo identificar al cliente.',

        };

      }



      // ======================================

      // FECHA ACTUAL

      // ======================================



      const ahora = new Date();



      const inicioHoy = new Date(

        ahora.getFullYear(),

        ahora.getMonth(),

        ahora.getDate(),

        0,

        0,

        0,

        0

      );



      const finHoy = new Date(

        ahora.getFullYear(),

        ahora.getMonth(),

        ahora.getDate(),

        23,

        59,

        59,

        999

      );



      // ======================================

      // BUSCAR ABONOS REVERSIBLES DE HOY

      // ======================================



      const abonosHoy = (abonos || [])

        .filter((abono) => {



          if (

            String(abono.clienteId) !==

            String(clienteId)

          ) {

            return false;

          }



          if (

            abono.deshacerAplicado === true

          ) {

            return false;

          }



          if (

            !Array.isArray(

              abono.distribucion

            ) ||

            abono.distribucion.length === 0

          ) {

            return false;

          }



          const fecha =

            abono.fechaCreacion?.toDate

              ? abono.fechaCreacion.toDate()

              : null;



          if (!fecha) {

            return false;

          }



          return (

            fecha >= inicioHoy &&

            fecha <= finHoy

          );

        })

        .map((abono) => ({

          tipoAccion: 'ABONO',

          fechaAccion:

            abono.fechaCreacion.toMillis(),

          datos: abono,

        }));



      // ======================================

      // BUSCAR ENTREGAS CREADAS HOY

      // ======================================



      const entregasHoy = (entregas || [])

        .filter((entrega) => {



          if (

            String(entrega.clienteId) !==

            String(clienteId)

          ) {

            return false;

          }



          if (

            entrega.accionDeshecha === true

          ) {

            return false;

          }



          const timestamp =

            entrega.accionCreadaEn ||

            entrega.fechaCreacion;



          const fecha =

            timestamp?.toDate

              ? timestamp.toDate()

              : null;



          if (!fecha) {

            return false;

          }



          return (

            fecha >= inicioHoy &&

            fecha <= finHoy

          );

        })

        .map((entrega) => {



          const timestamp =

            entrega.accionCreadaEn ||

            entrega.fechaCreacion;



          return {

            tipoAccion:

              'CREAR_ENTREGA',



            fechaAccion:

              timestamp.toMillis(),



            datos: entrega,

          };

        });



      // ======================================

      // UNIR TODAS LAS ACCIONES

      // ======================================



      const acciones = [

        ...abonosHoy,

        ...entregasHoy,

      ].sort(

        (a, b) =>

          b.fechaAccion -

          a.fechaAccion

      );



      if (acciones.length === 0) {

        return {

          ok: false,

          codigo:

            'SIN_ACCIONES_HOY',

          mensaje:

            'No existen modificaciones realizadas hoy que puedan deshacerse.',

        };

      }



      // ======================================

      // ÚLTIMA ACCIÓN REAL

      // ======================================



      const ultimaAccion =

        acciones[0];



      // ======================================

      // CASO 1: ENTREGA NUEVA

      // ======================================



      if (

        ultimaAccion.tipoAccion ===

        'CREAR_ENTREGA'

      ) {



        const entrega =

          ultimaAccion.datos;



        // Seguridad:

        // no eliminar si ya existen abonos

        // relacionados con esta entrega.



        const tieneAbonos =

          (abonos || []).some(

            (abono) => {



              if (

                abono.deshacerAplicado ===

                true

              ) {

                return false;

              }



              if (

                String(

                  abono.entregaId

                ) ===

                String(entrega.id)

              ) {

                return true;

              }



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

                        entrega.id

                      ) &&

                      Number(

                        detalle.montoAplicado ||

                        0

                      ) > 0

                  )

                );

              }



              return false;

            }

          );



        if (tieneAbonos) {

          return {

            ok: false,

            codigo:

              'ENTREGA_CON_ABONOS',

            mensaje:

              'Primero debe deshacer el abono relacionado con esta entrega.',

          };

        }



        await deleteDoc(

          doc(

            db,

            'entregas',

            entrega.id

          )

        );



        return {

          ok: true,

          tipo: 'CREAR_ENTREGA',

          mensaje:

            'La última entrega registrada fue deshecha correctamente.',

        };

      }



      // ======================================

      // CASO 2: ABONO

      // ======================================



      if (

        ultimaAccion.tipoAccion ===

        'ABONO'

      ) {



        const ultimoAbono =

          ultimaAccion.datos;



        const distribucion =

          ultimoAbono.distribucion;



        const referenciaAbono =

          doc(

            db,

            'abonos',

            ultimoAbono.id

          );



        await runTransaction(

          db,

          async (transaction) => {



            const entregasRestaurar =

              [];



            // PRIMERO LEER

            for (

              const detalle of

              distribucion

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



              entregasRestaurar.push({

                referencia:

                  referenciaEntrega,

                detalle,

              });

            }



            // DESPUÉS ESCRIBIR

            for (

              const item of

              entregasRestaurar

            ) {



              transaction.update(

                item.referencia,

                {

                  saldoPendiente:

                    Number(

                      item.detalle

                        .saldoAnterior ||

                      0

                    ),

                }

              );

            }



            // MARCAR ABONO DESHECHO

            transaction.update(

              referenciaAbono,

              {

                deshacerAplicado:

                  true,



                fechaDeshacer:

                  Timestamp.now(),

              }

            );

          }

        );



        return {

          ok: true,

          tipo: 'ABONO',



          cantidadEntregas:

            distribucion.length,



          mensaje:

            distribucion.length > 1

              ? `Abono deshecho. Se restauraron ${distribucion.length} entregas.`

              : 'El último abono fue deshecho correctamente.',

        };

      }



      return {

        ok: false,

        mensaje:

          'La última acción no puede deshacerse.',

      };



    } catch (error) {



      console.log(

        'Error al deshacer última acción:',

        error

      );



      if (

        error.message ===

        'ENTREGA_NO_EXISTE'

      ) {

        return {

          ok: false,

          mensaje:

            'No se pudo restaurar el estado porque una entrega relacionada ya no existe.',

        };

      }



      return {

        ok: false,

        mensaje:

          'No se pudo deshacer la última acción.',

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

  // ELIMINAR ENTREGA DEL HISTORIAL

  // SOLO ENTREGA DEL DÍA ACTUAL

  // ==========================================



  const eliminarEntregaHistorial = async (

    entregaId

  ) => {

    try {

      if (!entregaId) {

        return {

          ok: false,

          mensaje:

            'No se pudo identificar la entrega.',

        };

      }



      // ======================================

      // BUSCAR ENTREGA

      // ======================================



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



      // ======================================

      // OBTENER FECHA ACTUAL

      // FORMATO DD/MM/YYYY

      // ======================================



      const ahora = new Date();



      const dia = String(

        ahora.getDate()

      ).padStart(2, '0');



      const mes = String(

        ahora.getMonth() + 1

      ).padStart(2, '0');



      const anio =

        ahora.getFullYear();



      const fechaHoy =

        `${dia}/${mes}/${anio}`;



      // ======================================

      // SOLO SE PUEDE ELIMINAR HOY

      // ======================================



      if (

        entregaActual.fecha !== fechaHoy

      ) {

        return {

          ok: false,

          mensaje:

            'Solo se pueden eliminar entregas registradas en la fecha actual.',

        };

      }



      // ======================================

      // VERIFICAR ABONOS POSTERIORES

      // ======================================



      const tieneAbonos =

        (abonos || []).some(

          (abono) => {

            // Abono específico

            if (

              String(

                abono.entregaId

              ) ===

              String(entregaId)

            ) {

              return true;

            }



            // Abono distribuido

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

                    String(entregaId) &&

                    Number(

                      detalle.montoAplicado ||

                      0

                    ) > 0

                )

              );

            }



            return false;

          }

        );



      if (tieneAbonos) {

        return {

          ok: false,

          codigo:

            'TIENE_ABONOS',

          mensaje:

            'Esta entrega posee abonos posteriores y no puede eliminarse.',

        };

      }



      // ======================================

      // ELIMINAR ENTREGA

      // ======================================



      const referenciaEntrega =

        doc(

          db,

          'entregas',

          entregaId

        );



      await deleteDoc(

        referenciaEntrega

      );



      return {

        ok: true,

        mensaje:

          'Entrega eliminada correctamente.',

      };



    } catch (error) {

      console.log(

        'Error al eliminar entrega del historial:',

        error

      );



      return {

        ok: false,

        mensaje:

          'No se pudo eliminar la entrega.',

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
        registrarEntregaConSaldos,

        reemplazarEntrega,

        actualizarEntrega,

        buscarEntregaPorFecha,



        obtenerEntregasCliente,

        obtenerDeudasCliente,

        obtenerSaldoCliente,

        obtenerAbonosEntrega,



        registrarAbono,

        deshacerUltimaAccion,

        confirmarTransferenciaAbono,

        confirmarTransferenciaEntrega,

        eliminarEntregaHistorial,

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