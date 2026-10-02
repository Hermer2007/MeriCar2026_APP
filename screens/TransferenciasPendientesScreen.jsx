import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import BotonHome from '../components/BotonHome';
import { useEntregas } from '../context/EntregasContext';
import { useClientes } from '../context/ClientesContext';
import { useAlert } from '../context/AlertContext';

export default function TransferenciasPendientesScreen({
  navigation,
}) {

    const { clientes } = useClientes();
    const {
        mostrarAlert,
        } = useAlert();

  const {
    entregas,
    abonos,
    confirmarTransferenciaEntrega,
    confirmarTransferenciaAbono,
    } = useEntregas();

  const [modalVisible, setModalVisible] = useState(false);

    const [
    transferenciaSeleccionada,
    setTransferenciaSeleccionada,
    ] = useState(null);

    const [fechaConfirmacion, setFechaConfirmacion] =
    useState('');

    const [valorConfirmacion, setValorConfirmacion] =
    useState('');

    const [confirmando, setConfirmando] =
    useState(false);  


  // =========================================================
  // FORMATEAR FECHA
  // =========================================================

  function formatearFecha(fecha) {

    if (!fecha) {
      return 'Sin fecha';
    }

    // Si viene como Timestamp de Firebase
    if (fecha?.toDate) {

      const date = fecha.toDate();

      return date.toLocaleDateString(
        'es-EC'
      );
    }

    // Si viene como YYYY-MM-DD
    if (
      typeof fecha === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ) {

      const [
        anio,
        mes,
        dia,
      ] = fecha.split('-');

      return `${dia}/${mes}/${anio}`;
    }

    return String(fecha);
  }

    // =========================================================
    // OBTENER FECHA PARA ORDENAR
    // =========================================================

    function obtenerFechaOrdenable(fecha) {

        if (!fecha) {
            return Number.MAX_SAFE_INTEGER;
        }

        // Timestamp de Firebase
        if (fecha?.toDate) {
            return fecha.toDate().getTime();
        }

        // Timestamp serializado
        if (
            typeof fecha === 'object' &&
            fecha.seconds
        ) {
            return fecha.seconds * 1000;
        }

        // YYYY-MM-DD
        if (
            typeof fecha === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(fecha)
        ) {
            const [anio, mes, dia] =
            fecha.split('-').map(Number);

            return new Date(
            anio,
            mes - 1,
            dia
            ).getTime();
        }

        // DD/MM/YYYY
        if (
            typeof fecha === 'string' &&
            /^\d{2}\/\d{2}\/\d{4}$/.test(fecha)
        ) {
            const [dia, mes, anio] =
            fecha.split('/').map(Number);

            return new Date(
            anio,
            mes - 1,
            dia
            ).getTime();
        }

        const fechaConvertida =
            new Date(fecha);

        const tiempo =
            fechaConvertida.getTime();

        if (Number.isNaN(tiempo)) {
            return Number.MAX_SAFE_INTEGER;
        }

        return tiempo;
        }

  // =========================================================
  // TRANSFERENCIAS PENDIENTES
  // =========================================================

  const transferenciasPendientes = useMemo(() => {

  // ==========================================
  // OBTENER NOMBRE REAL DEL CLIENTE
  // ==========================================

  const obtenerNombreCliente = (clienteId) => {

    const clienteEncontrado =
      (clientes || []).find(
        (cliente) =>
          String(cliente.id) ===
          String(clienteId)
      );

    if (!clienteEncontrado) {
      return 'Cliente Ocasional';
    }

    return (
      clienteEncontrado.nombre ||
      `${clienteEncontrado.nombres || ''} ${
        clienteEncontrado.apellidos || ''
      }`.trim() ||
      'Cliente'
    );
  };


  // ==========================================
  // TRANSFERENCIAS DE ENTREGAS
  // ==========================================

  const pendientesEntregas =
    (entregas || [])
      .filter((entrega) => {

        const valorTransferencia =
          Number(
            entrega.pagoTransferencia || 0
          );

        return (
          valorTransferencia > 0 &&
          entrega.transferenciaConfirmada === false
        );
      })
      .map((entrega) => ({

        id: entrega.id,

        tipo: 'ENTREGA',

        clienteId: entrega.clienteId,

        clienteNombre:
          obtenerNombreCliente(
            entrega.clienteId
          ),

        fecha:
            entrega.fechaTrabajo ||
            entrega.fecha ||
            '',

        monto:
          Number(
            entrega.pagoTransferencia || 0
          ),

        comprobante:
          entrega.comprobante || null,

        referencia: entrega,
      }));


  // ==========================================
  // TRANSFERENCIAS DE ABONOS
  // ==========================================

  const pendientesAbonos =
    (abonos || [])
      .filter((abono) => {

        const valorTransferencia =
          Number(
            abono.pagoTransferencia || 0
          );

        return (
          valorTransferencia > 0 &&
          abono.transferenciaConfirmada === false
        );
      })
      .map((abono) => ({

        id: abono.id,

        tipo: 'ABONO',

        clienteId: abono.clienteId,

        clienteNombre:
          obtenerNombreCliente(
            abono.clienteId
          ),

        fecha:
            abono.fechaTrabajo ||
            abono.fecha ||
            '',

        monto:
          Number(
            abono.pagoTransferencia || 0
          ),

        comprobante:
          abono.comprobante || null,

        referencia: abono,
      }));


  // ==========================================
  // UNIR Y ORDENAR
  // ==========================================

  return [
    ...pendientesEntregas,
    ...pendientesAbonos,
  ].sort((a, b) => {

    const fechaA =
      obtenerFechaOrdenable(a.fecha);

    const fechaB =
      obtenerFechaOrdenable(b.fecha);

    return fechaA - fechaB;
  });

}, [
  entregas,
  abonos,
  clientes,
]);


  // =========================================================
  // RESUMEN
  // =========================================================

  const cantidadPendientes =
    transferenciasPendientes.length;


  const montoTotalPendiente =
    transferenciasPendientes.reduce(
      (total, transferencia) =>
        total +
        Number(
          transferencia.monto || 0
        ),
      0
    );

    const clientesInvolucrados = new Set(
    transferenciasPendientes
        .map((transferencia) => transferencia.clienteId)
        .filter(Boolean)
    ).size;

  // =========================================================
  // CONFIRMAR
  // =========================================================

    function abrirConfirmacion(transferencia) {

    setTransferenciaSeleccionada(
        transferencia
    );

    setFechaConfirmacion('');

    // Colocamos automáticamente
    // el monto pendiente.
    setValorConfirmacion(
        Number(
        transferencia.monto || 0
        ).toFixed(2)
    );

    setModalVisible(true);
    }

    // =========================================================
    // FUNCION ABRIR CALENDARIO 
    // =========================================================
    function abrirCalendarioConfirmacion() {

        const hoy = new Date();

        const fechaInicial = fechaConfirmacion
            ? new Date(`${fechaConfirmacion}T00:00:00`)
            : hoy;

        DateTimePickerAndroid.open({
            value: fechaInicial,
            mode: 'date',
            is24Hour: true,

            // No permitir fechas futuras
            maximumDate: hoy,

            onChange: (
            event,
            fechaSeleccionada
            ) => {

            if (
                event.type !== 'set' ||
                !fechaSeleccionada
            ) {
                return;
            }

            const anio =
                fechaSeleccionada.getFullYear();

            const mes = String(
                fechaSeleccionada.getMonth() + 1
            ).padStart(2, '0');

            const dia = String(
                fechaSeleccionada.getDate()
            ).padStart(2, '0');

            setFechaConfirmacion(
                `${anio}-${mes}-${dia}`
            );
            },
        });
        }

    // =========================================================
    // CERRAR MODAL FUNCION
    // =========================================================

    function cerrarModal() {

    if (confirmando) {
        return;
    }

    setModalVisible(false);

    setTransferenciaSeleccionada(
        null
    );

    setFechaConfirmacion('');

    setValorConfirmacion('');
    }

    // =========================================================
    // CONFIRMACION REAL
    // =========================================================

    async function confirmarTransferencia() {

        if (!transferenciaSeleccionada) {
            return;
        }

        const valor = Number(
            String(valorConfirmacion)
            .replace(',', '.')
        );

        if (
            !Number.isFinite(valor) ||
            valor <= 0
        ) {
            mostrarAlert({
                titulo: 'Valor inválido',
                mensaje:
                    'Ingrese un valor válido para confirmar.',
                tipo: 'warning',
                textoConfirmar: 'Aceptar',
                });

            return;
        }

        if (!fechaConfirmacion) {
            mostrarAlert({
                titulo: 'Fecha requerida',
                mensaje:
                    'Seleccione la fecha de confirmación.',
                tipo: 'warning',
                textoConfirmar: 'Aceptar',
                });
            return;
        }

        try {

            setConfirmando(true);

            let resultado;

            if (
            transferenciaSeleccionada.tipo ===
            'ENTREGA'
            ) {

            resultado =
                await confirmarTransferenciaEntrega({
                entregaId:
                    transferenciaSeleccionada.id,

                montoRecibido:
                    valor,

                fechaTransferencia:
                    fechaConfirmacion,
                });

            } else {

            resultado =
                await confirmarTransferenciaAbono({
                abonoId:
                    transferenciaSeleccionada.id,

                montoRecibido:
                    valor,

                fechaTransferencia:
                    fechaConfirmacion,
                });
            }

            // Si el contexto rechazó la operación
            if (!resultado?.ok) {
                mostrarAlert({
                    titulo: 'No se pudo confirmar',
                    mensaje:
                    resultado?.mensaje ||
                    'No se pudo confirmar la transferencia.',
                    tipo: 'warning',
                    textoConfirmar: 'Aceptar',
                });
                return;
                }

            setModalVisible(false);
            setTransferenciaSeleccionada(
            null
            );

            setFechaConfirmacion('');

            setValorConfirmacion('');

            mostrarAlert({
                titulo: 'Transferencia confirmada',
                mensaje:
                    resultado?.mensaje ||
                    'La transferencia fue confirmada correctamente.',
                tipo: 'success',
                textoConfirmar: 'Aceptar',
                });

        } catch (error) {

            console.log(
            'Error al confirmar transferencia:',
            error
            );

            mostrarAlert({
                titulo: 'Error',
                mensaje:
                    'No se pudo confirmar la transferencia.',
                tipo: 'error',
                textoConfirmar: 'Aceptar',
                });

        } finally {

            setConfirmando(false);
        }
        }

  // =========================================================
  // INTERFAZ
  // =========================================================

  return (

    <View style={styles.container}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#08752F"
      />


      {/* =====================================================
          HEADER
      ===================================================== */}

      <View style={styles.header}>

        <TouchableOpacity
          style={styles.regresar}
          onPress={() =>
            navigation.goBack()
          }
        >

          <Ionicons
            name="arrow-back"
            size={29}
            color="#FFFFFF"
          />

        </TouchableOpacity>


        <View style={styles.headerCentro}>

          <Text style={styles.tituloHeader}>
            Transferencias
          </Text>

          <Text style={styles.subtituloHeader}>
            Pendientes de confirmación
          </Text>

        </View>


        <BotonHome
          navigation={navigation}
        />

      </View>


      {/* =====================================================
          CONTENIDO
      ===================================================== */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.contenido
        }
        showsVerticalScrollIndicator={
          false
        }
      >


        {/* ===================================================
            RESUMEN
        =================================================== */}

        <View style={styles.resumenCard}>

            {/* ICONO */}
            <View style={styles.resumenIconoContainer}>
                <Ionicons
                name="swap-horizontal-outline"
                size={32}
                color="#B77900"
                />
            </View>


            {/* TRANSFERENCIAS PENDIENTES */}
            <View style={styles.resumenDato}>

                <Text style={styles.resumenNumero}>
                {cantidadPendientes}
                </Text>

                <Text style={styles.resumenTexto}>
                Transferencias
                </Text>

                <Text style={styles.resumenTexto}>
                pendientes
                </Text>

            </View>


            <View style={styles.separadorResumen} />


            {/* MONTO TOTAL */}
            <View style={styles.resumenDato}>

                <Text style={styles.resumenNumero}>
                ${montoTotalPendiente.toFixed(2)}
                </Text>

                <Text style={styles.resumenTexto}>
                Monto total
                </Text>

                <Text style={styles.resumenTexto}>
                pendiente
                </Text>

            </View>


            <View style={styles.separadorResumen} />


            {/* CLIENTES INVOLUCRADOS */}
            <View style={styles.resumenDato}>

                <Text style={styles.resumenNumero}>
                {clientesInvolucrados}
                </Text>

                <Text style={styles.resumenTexto}>
                Clientes
                </Text>

                <Text style={styles.resumenTexto}>
                involucrados
                </Text>

            </View>

            </View>

        {/* ===================================================
            TITULO LISTADO
        =================================================== */}

        <View style={styles.encabezadoLista}>

          <Text style={styles.tituloSeccion}>
            Listado de transferencias
          </Text>

          <Text style={styles.descripcion}>
            Transferencias pendientes de confirmar,
            ordenadas desde la más antigua.
          </Text>

        </View>


        {/* ===================================================
            SIN TRANSFERENCIAS
        =================================================== */}

        {transferenciasPendientes.length === 0 ? (

          <View style={styles.vacio}>

            <View style={styles.vacioIcono}>

              <Ionicons
                name="checkmark-circle-outline"
                size={43}
                color="#08752F"
              />

            </View>


            <Text style={styles.vacioTitulo}>
              Sin transferencias pendientes
            </Text>


            <Text style={styles.vacioTexto}>
              Todas las transferencias registradas
              han sido confirmadas.
            </Text>

          </View>

        ) : (

          // =================================================
          // LISTADO
          // =================================================

          transferenciasPendientes.map(
            (transferencia) => (

              <View
                key={
                  `${transferencia.tipo}-${transferencia.id}`
                }
                style={styles.tarjeta}
              >


                {/* ===========================================
                    ICONO CLIENTE
                =========================================== */}

                <View
                  style={
                    styles.iconoClienteContainer
                  }
                >

                  <Ionicons
                    name="person-outline"
                    size={29}
                    color="#08752F"
                  />

                </View>


                {/* ===========================================
                    INFORMACIÓN
                =========================================== */}

                <View style={styles.tarjetaInfo}>

                  <Text
                    style={styles.clienteNombre}
                    numberOfLines={1}
                  >

                    {
                      transferencia.clienteNombre
                    }

                  </Text>


                  <View style={styles.detalleFila}>

                    <Ionicons
                      name={
                        transferencia.tipo ===
                        'ENTREGA'
                          ? 'cube-outline'
                          : 'cash-outline'
                      }
                      size={14}
                      color="#6F7785"
                    />

                    <Text style={styles.tipo}>

                      {transferencia.tipo ===
                      'ENTREGA'
                        ? 'Transferencia registrada'
                        : 'Abono de saldo'}

                    </Text>

                  </View>


                  <View style={styles.detalleFila}>

                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#6F7785"
                    />

                    <Text style={styles.fecha}>

                      {formatearFecha(
                        transferencia.fecha
                      )}

                    </Text>

                  </View>


                  <Text style={styles.monto}>

                    $
                    {Number(
                      transferencia.monto
                    ).toFixed(2)}

                  </Text>

                </View>


                {/* ===========================================
                    BOTÓN CONFIRMAR
                =========================================== */}

                <TouchableOpacity
                  style={
                    styles.botonConfirmar
                  }
                  activeOpacity={0.8}
                  onPress={() =>
                    abrirConfirmacion(
                      transferencia
                    )
                  }
                >

                  <Ionicons
                    name="checkmark-circle-outline"
                    size={19}
                    color="#5E4500"
                  />

                  <Text
                    style={
                      styles.botonConfirmarTexto
                    }
                  >
                    Confirmar
                  </Text>
                </TouchableOpacity>
              </View>
            )
          )
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModal}
        >

        <View style={styles.modalFondo}>

            <View style={styles.modalContenido}>


            {/* ICONO */}

            <View style={styles.modalIcono}>

                <Ionicons
                name="checkmark-circle-outline"
                size={32}
                color="#B77900"
                />

            </View>


            {/* TITULO */}

            <Text style={styles.modalTitulo}>
                Confirmar transferencia
            </Text>

            <Text style={styles.modalSubtitulo}>
                Complete los datos para confirmar
                esta transferencia.
            </Text>


            {/* CLIENTE */}

            {transferenciaSeleccionada && (

                <View style={styles.modalCliente}>

                <Ionicons
                    name="person-outline"
                    size={18}
                    color="#08752F"
                />

                <View style={{ flex: 1 }}>

                    <Text style={styles.modalClienteNombre}>
                    {
                        transferenciaSeleccionada
                        .clienteNombre
                    }
                    </Text>
                    <Text style={styles.modalClienteTipo}>

                    {transferenciaSeleccionada
                        .tipo === 'ENTREGA'
                        ? 'Transferencia por confirmar'
                        : 'Abono de saldo'}
                    </Text>
                </View>
                </View>
            )}

            {/* FECHA */}

            <Text style={styles.labelModal}>
                Fecha de confirmación
                </Text>

                <TouchableOpacity
                style={styles.inputModalContainer}
                activeOpacity={0.7}
                onPress={abrirCalendarioConfirmacion}
                >
                <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#777777"
                />

                <Text style={styles.inputFechaModal}>
                    {fechaConfirmacion
                    ? formatearFecha(fechaConfirmacion)
                    : 'Seleccione una fecha'}
                </Text>

                <Ionicons
                    name="chevron-down-outline"
                    size={18}
                    color="#777777"
                />
                </TouchableOpacity>

            {/* VALOR */}

            <Text style={styles.labelModal}>
                Valor confirmado
            </Text>

            <View style={styles.inputModalContainer}>

                <Text style={styles.simboloDolar}>
                $
                </Text>

                <TextInput
                style={styles.inputModal}
                value={valorConfirmacion}
                onChangeText={setValorConfirmacion}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#AAAAAA"
                />

            </View>


            {/* BOTONES */}

            <View style={styles.modalBotones}>

                <TouchableOpacity
                style={styles.botonCancelar}
                onPress={cerrarModal}
                disabled={confirmando}
                >

                <Text style={styles.botonCancelarTexto}>
                    Cancelar
                </Text>

                </TouchableOpacity>


                <TouchableOpacity
                style={[
                    styles.botonConfirmarModal,

                    confirmando &&
                    styles.botonDeshabilitado,
                ]}
                onPress={
                    confirmarTransferencia
                }
                disabled={confirmando}
                >

                <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#FFFFFF"
                />

                <Text
                    style={
                    styles.botonConfirmarModalTexto
                    }
                >
                    {confirmando
                    ? 'Confirmando...'
                    : 'Confirmar'}
                </Text>

                </TouchableOpacity>

            </View>


            </View>

        </View>

        </Modal>

    </View>
  );
}


// =========================================================
// ESTILOS
// =========================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F7F8F9',
  },


  // =======================================================
  // HEADER
  // =======================================================

  header: {
    height: 105,
    backgroundColor: '#08752F',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 14,
  },

  regresar: {
    position: 'absolute',
    left: 17,
    bottom: 15,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerCentro: {
    alignItems: 'center',
  },

  tituloHeader: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },

  subtituloHeader: {
    color: '#DDEEE2',
    fontSize: 12,
    marginTop: 2,
  },


  // =======================================================
  // SCROLL
  // =======================================================

  scroll: {
    flex: 1,
  },

  contenido: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 45,
  },


  // =======================================================
  // RESUMEN
  // =======================================================

  resumenCard: {
    backgroundColor: '#FFF8E6',

    borderWidth: 1,
    borderColor: '#F2D899',

    borderRadius: 16,

    paddingVertical: 18,
    paddingHorizontal: 13,

    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 25,
  },

  resumenIconoContainer: {
    width: 54,
    height: 54,

    borderRadius: 27,

    backgroundColor: '#FFEDBD',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,
  },

  resumenDato: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resumenNumero: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202020',
    marginBottom: 3,
  },

  resumenFecha: {
    fontSize: 13,
  },

  resumenTexto: {
    fontSize: 10,
    color: '#6F7785',
    textAlign: 'center',
    lineHeight: 14,
  },

  separadorResumen: {
    width: 1,
    height: 53,
    backgroundColor: '#E9C978',
    marginHorizontal: 5,
  },


  // =======================================================
  // ENCABEZADO LISTADO
  // =======================================================

  encabezadoLista: {
    marginBottom: 14,
  },

  tituloSeccion: {
    fontSize: 18,
    fontWeight: '700',
    color: '#252525',
  },

  descripcion: {
    fontSize: 11,
    color: '#7C8491',
    marginTop: 4,
    lineHeight: 16,
  },


  // =======================================================
  // TARJETA
  // =======================================================

  tarjeta: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E1E4E8',

    borderRadius: 14,

    paddingVertical: 14,
    paddingHorizontal: 12,

    marginBottom: 11,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 2,

    elevation: 1,
  },


  // =======================================================
  // ICONO CLIENTE
  // =======================================================

  iconoClienteContainer: {
    width: 49,
    height: 49,

    borderRadius: 25,

    backgroundColor: '#E8F5EC',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 11,
  },


  // =======================================================
  // INFORMACIÓN CLIENTE
  // =======================================================

  tarjetaInfo: {
    flex: 1,
    paddingRight: 8,
  },

  clienteNombre: {
    fontSize: 14,
    fontWeight: '700',
    color: '#252525',
    marginBottom: 4,
  },

  detalleFila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  tipo: {
    fontSize: 10.5,
    color: '#6F7785',
    marginLeft: 5,
  },

  fecha: {
    fontSize: 10.5,
    color: '#6F7785',
    marginLeft: 5,
  },

  monto: {
    fontSize: 17,
    fontWeight: '800',
    color: '#08752F',
    marginTop: 5,
  },


  // =======================================================
  // BOTÓN CONFIRMAR
  // =======================================================

  botonConfirmar: {
    minWidth: 94,
    height: 40,

    backgroundColor: '#FFF8E6',

    borderWidth: 1,
    borderColor: '#D6A72C',

    borderRadius: 9,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 10,

    gap: 5,
    },

  botonConfirmarTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5E4500',
  },


  // =======================================================
  // ESTADO VACÍO
  // =======================================================

  vacio: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E1E4E8',

    borderRadius: 14,

    paddingVertical: 32,
    paddingHorizontal: 20,

    alignItems: 'center',
  },

  vacioIcono: {
    width: 62,
    height: 62,

    borderRadius: 31,

    backgroundColor: '#E8F5EC',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 10,
  },

  vacioTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#252525',
  },

  vacioTexto: {
    fontSize: 11,
    color: '#7C8491',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 16,
  },

  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 22,
    },

    modalContenido: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    },

    modalIcono: {
    width: 58,
    height: 58,
    borderRadius: 29,

    backgroundColor: '#FFF8E6',

    borderWidth: 1,
    borderColor: '#F2D899',

    alignSelf: 'center',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 10,
    },

    modalTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#252525',
    textAlign: 'center',
    },

    modalSubtitulo: {
    fontSize: 11,
    color: '#7C8491',
    textAlign: 'center',

    marginTop: 4,
    marginBottom: 18,
    },

    modalCliente: {
    backgroundColor: '#F4F9F5',

    borderWidth: 1,
    borderColor: '#DCEADF',

    borderRadius: 10,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 9,

    paddingHorizontal: 12,
    paddingVertical: 10,

    marginBottom: 17,
    },

    modalClienteNombre: {
    fontSize: 13,
    fontWeight: '700',
    color: '#252525',
    },

    modalClienteTipo: {
    fontSize: 10,
    color: '#7C8491',
    marginTop: 2,
    },

    labelModal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',

    marginBottom: 6,
    },

    inputModalContainer: {
    height: 46,

    borderWidth: 1,
    borderColor: '#DADDE1',

    borderRadius: 9,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 11,

    marginBottom: 15,

    backgroundColor: '#FFFFFF',
    },

    inputModal: {
    flex: 1,

    fontSize: 13,
    color: '#252525',

    marginLeft: 7,
    },

    simboloDolar: {
    fontSize: 15,
    fontWeight: '700',
    color: '#08752F',
    },

    modalBotones: {
    flexDirection: 'row',
    gap: 10,

    marginTop: 4,
    },

    botonCancelar: {
    flex: 1,
    height: 44,

    borderWidth: 1,
    borderColor: '#D5D8DC',

    borderRadius: 9,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#FFFFFF',
    },

    botonCancelarTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666666',
    },

    botonConfirmarModal: {
    flex: 1,
    height: 44,

    borderRadius: 9,

    backgroundColor: '#08752F',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 5,
    },

    botonConfirmarModalTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    },

    botonDeshabilitado: {
    opacity: 0.55,
    },

    inputFechaModal: {
    flex: 1,
    fontSize: 13,
    color: '#252525',
    marginLeft: 7,
    },

});