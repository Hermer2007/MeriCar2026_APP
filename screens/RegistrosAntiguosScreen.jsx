import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import BotonHome from '../components/BotonHome';
import { useEntregas } from '../context/EntregasContext';
import { obtenerRegistrosAntiguos } from '../utils/registrosAntiguos';
import { useClientes } from '../context/ClientesContext';
import { useAlert } from '../context/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegistrosAntiguosScreen({
  navigation,
}) {
  const insets = useSafeAreaInsets();  

  const { mostrarAlert } = useAlert();  

  const {
  entregas,
  eliminarEntregas,
  registrarAbono,
} = useEntregas();

  const { clientes } = useClientes();

  const [
    seleccionados,
    setSeleccionados,
  ] = useState([]);

  const [
    eliminando,
    setEliminando,
  ] = useState(false);

  const [
  modalAbonoVisible,
  setModalAbonoVisible,
] = useState(false);

const [
  entregaAbono,
  setEntregaAbono,
] = useState(null);

const [
  pagoEfectivo,
  setPagoEfectivo,
] = useState('');

const [
  pagoTransferencia,
  setPagoTransferencia,
] = useState('');

const [
  guardandoAbono,
  setGuardandoAbono,
] = useState(false);

  const obtenerNombreCliente = (
    clienteId
  ) => {

    const cliente = clientes.find(
      (item) =>
        String(item.id) ===
        String(clienteId)
    );

    if (!cliente) {
      return 'Cliente';
    }

    return (
      cliente.nombre ||
      `${cliente.nombres || ''} ${
        cliente.apellidos || ''
      }`.trim() ||
      'Cliente'
    );
  };

  const registrosAntiguos =
    obtenerRegistrosAntiguos(
      entregas
    );

  const estaSeleccionado = (id) => {

    return seleccionados.includes(id);
  };

  const seleccionarRegistro = (id) => {

    if (estaSeleccionado(id)) {

      setSeleccionados(
        seleccionados.filter(
          (item) => item !== id
        )
      );

    } else {

      setSeleccionados([
        ...seleccionados,
        id,
      ]);
    }
  };

  const todosSeleccionados =
    registrosAntiguos.length > 0 &&
    seleccionados.length ===
      registrosAntiguos.length;

  const seleccionarTodos = () => {

    if (todosSeleccionados) {

      setSeleccionados([]);

    } else {

      setSeleccionados(
        registrosAntiguos.map(
          (entrega) => entrega.id
        )
      );
    }
  };

  const obtenerSeleccionados = () => {

    return registrosAntiguos.filter(
      (entrega) =>
        seleccionados.includes(
          entrega.id
        )
    );
  };

  const abrirModalAbono = (
    entrega
    ) => {

    setEntregaAbono(entrega);

    setPagoEfectivo('');
    setPagoTransferencia('');

    setModalAbonoVisible(true);
    };

    const cerrarModalAbono = () => {

    if (guardandoAbono) {
        return;
    }

    setModalAbonoVisible(false);
    setEntregaAbono(null);

    setPagoEfectivo('');
    setPagoTransferencia('');
    };

    const guardarAbono = async () => {

    if (
        !entregaAbono ||
        guardandoAbono
    ) {
        return;
    }

    const efectivo =
        Number(
        String(pagoEfectivo)
            .replace(',', '.')
        ) || 0;

    const transferencia =
        Number(
        String(pagoTransferencia)
            .replace(',', '.')
        ) || 0;

    const totalAbono =
        Number(
        (
            efectivo +
            transferencia
        ).toFixed(2)
        );

    const saldoPendiente =
        Number(
        Number(
            entregaAbono.saldoPendiente ||
            0
        ).toFixed(2)
        );

    if (totalAbono <= 0) {

        mostrarAlert({
        titulo: 'Abono inválido',
        mensaje:
            'Ingrese un valor para realizar el abono.',
        tipo: 'warning',
        });

        return;
    }

    if (
        totalAbono >
        saldoPendiente
    ) {

        mostrarAlert({
        titulo: 'Abono inválido',
        mensaje:
            'Ingrese un valor para realizar el abono.',
        tipo: 'warning',
        });

        return;
    }

    setGuardandoAbono(true);

    const resultado =
        await registrarAbono({
        clienteId:
            entregaAbono.clienteId,

        entregaId:
            entregaAbono.id,

        pagoEfectivo:
            efectivo,

        pagoTransferencia:
            transferencia,
        });

    setGuardandoAbono(false);

    if (resultado.ok) {

        setModalAbonoVisible(false);
        setEntregaAbono(null);

        setPagoEfectivo('');
        setPagoTransferencia('');

        mostrarAlert({
        titulo: 'Abono registrado',
        mensaje:
            resultado.mensaje,
        tipo: 'success',
        });

    } else {

        mostrarAlert({
        titulo: 'No se pudo registrar',
        mensaje:
            resultado.mensaje,
        tipo: 'danger',
        });
    }
    };

  const ejecutarEliminacion =
    async () => {

      if (eliminando) {
        return;
      }

      setEliminando(true);

      const resultado =
        await eliminarEntregas(
          seleccionados
        );

      setEliminando(false);

      if (resultado.ok) {

        setSeleccionados([]);

        mostrarAlert({
            titulo: 'Registros eliminados',
            mensaje:
            resultado.mensaje,
            tipo: 'success',
        });

        } else {

        mostrarAlert({
            titulo: 'No se pudo eliminar',
            mensaje:
            resultado.mensaje,
            tipo: 'danger',
        });
        }
    };

  const confirmarEliminacion = () => {

    if (
      seleccionados.length === 0
    ) {
      return;
    }

    const registrosSeleccionados =
      obtenerSeleccionados();

    const registrosConDeuda =
      registrosSeleccionados.filter(
        (entrega) =>
          Number(
            entrega.saldoPendiente
          ) > 0
      );

    const saldoTotalPendiente =
      registrosConDeuda.reduce(
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

    if (
      registrosConDeuda.length > 0
    ) {

      mostrarAlert({
        titulo:
            'Registros con saldo pendiente',

        mensaje:
            `${registrosConDeuda.length} de los ${registrosSeleccionados.length} registros seleccionados mantienen un saldo pendiente de $${saldoTotalPendiente.toFixed(2)}.\n\nSi continúa, estas deudas serán eliminadas definitivamente.`,

        tipo:
            'danger',

        textoCancelar:
            'Cancelar',

        textoConfirmar:
            'Eliminar',

        mostrarCancelar:
            true,

        onConfirmar:
            ejecutarEliminacion,
        });

      return;
    }

    mostrarAlert({
    titulo:
        seleccionados.length === 1
        ? 'Eliminar registro'
        : 'Eliminar registros',

    mensaje:
        seleccionados.length === 1
        ? 'El registro seleccionado será eliminado definitivamente. Esta acción no se puede deshacer.'
        : `Los ${seleccionados.length} registros seleccionados serán eliminados definitivamente. Esta acción no se puede deshacer.`,

    tipo:
        'danger',

    textoCancelar:
        'Cancelar',

    textoConfirmar:
        'Eliminar',

    mostrarCancelar:
        true,

    onConfirmar:
        ejecutarEliminacion,
    });
  };

  return (

    <View style={styles.container}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#08752F"
      />

      <View style={styles.header}>

        <TouchableOpacity
          style={styles.botonRegresar}
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

        <Text style={styles.tituloHeader}>
          Registros antiguos
        </Text>

        <BotonHome
          navigation={navigation}
        />

      </View>

      <View style={styles.contenido}>

        <View style={styles.informacion}>

          <Ionicons
            name="information-circle-outline"
            size={25}
            color="#08752F"
          />

          <Text
            style={
              styles.textoInformacion
            }
          >
            Los registros con una antigüedad
            de 1 mes aparecerán en este
            apartado para que puedan ser
            revisados y eliminados
            manualmente.
          </Text>

        </View>

        {registrosAntiguos.length === 0 ? (

          <View style={styles.vacio}>

            <Ionicons
              name="trash-bin-outline"
              size={65}
              color="#C7C7C7"
            />

            <Text
              style={styles.vacioTitulo}
            >
              Sin registros antiguos
            </Text>

            <Text
              style={styles.vacioTexto}
            >
              Actualmente no existen
              registros que hayan cumplido
              el tiempo de antigüedad.
            </Text>

          </View>

        ) : (

          <View
            style={styles.areaRegistros}
          >

            <View
              style={styles.barraSeleccion}
            >

              <TouchableOpacity
                style={
                  styles.seleccionarTodos
                }
                onPress={
                  seleccionarTodos
                }
              >

                <Ionicons
                  name={
                    todosSeleccionados
                      ? 'checkbox'
                      : 'square-outline'
                  }
                  size={23}
                  color="#08752F"
                />

                <Text
                  style={
                    styles.textoSeleccionarTodos
                  }
                >
                  Seleccionar todos
                </Text>

              </TouchableOpacity>

              <Text
                style={
                  styles.cantidadSeleccionados
                }
              >
                {seleccionados.length}{' '}
                seleccionados
              </Text>

            </View>

            <ScrollView
              style={styles.lista}
              contentContainerStyle={
                styles.listaContenido
              }
              showsVerticalScrollIndicator={
                false
              }
            >

              {registrosAntiguos.map(
                (entrega) => {

                  const saldo =
                    Number(
                      entrega.saldoPendiente
                    ) || 0;

                  const seleccionado =
                    estaSeleccionado(
                      entrega.id
                    );

                  return (

                    <TouchableOpacity
                      key={entrega.id}
                      activeOpacity={0.8}
                      onPress={() =>
                        seleccionarRegistro(
                          entrega.id
                        )
                      }
                      style={[
                        styles.tarjeta,

                        seleccionado &&
                          styles.tarjetaSeleccionada,
                      ]}
                    >

                      <View
                        style={
                          styles.tarjetaSuperior
                        }
                      >

                        <View
                          style={
                            styles.informacionCliente
                          }
                        >

                          <Text
                            style={
                              styles.cliente
                            }
                          >
                            {obtenerNombreCliente(
                              entrega.clienteId
                            )}
                          </Text>

                          <Text
                            style={
                              styles.fecha
                            }
                          >
                            {entrega.fecha}
                          </Text>

                        </View>

                        <Ionicons
                          name={
                            seleccionado
                              ? 'checkbox'
                              : 'square-outline'
                          }
                          size={25}
                          color={
                            seleccionado
                              ? '#08752F'
                              : '#777777'
                          }
                        />

                      </View>

                      <View
                        style={
                          styles.separador
                        }
                      />

                      <View
                        style={styles.fila}
                      >

                        <Text
                          style={styles.label}
                        >
                          Total
                        </Text>

                        <Text
                          style={styles.total}
                        >
                          $
                          {Number(
                            entrega.total || 0
                          ).toFixed(2)}
                        </Text>

                      </View>

                      <View
                        style={styles.fila}
                      >

                        <Text
                          style={styles.label}
                        >
                          Saldo pendiente
                        </Text>

                        <Text
                          style={[
                            styles.saldo,

                            saldo > 0
                              ? styles.saldoPendiente
                              : styles.saldoPagado,
                          ]}
                        >
                          $
                          {saldo.toFixed(2)}
                        </Text>

                      </View>

                      {saldo > 0 ? (

                        <View>

                            <View
                            style={
                                styles.estadoPendiente
                            }
                            >

                            <Ionicons
                                name="warning-outline"
                                size={17}
                                color="#D71920"
                            />

                            <Text
                                style={
                                styles.estadoPendienteTexto
                                }
                            >
                                Esta entrega mantiene
                                una deuda pendiente
                            </Text>

                            </View>

                            <TouchableOpacity
                            style={styles.botonAbonar}
                            onPress={(evento) => {

                                evento.stopPropagation();

                                abrirModalAbono(
                                entrega
                                );
                            }}
                            >

                            <Ionicons
                                name="cash-outline"
                                size={18}
                                color="#08752F"
                            />

                            <Text
                                style={
                                styles.textoBotonAbonar
                                }
                            >
                                Abonar
                            </Text>

                            </TouchableOpacity>

                        </View>

                        ) : (

                        <View
                          style={
                            styles.estadoPagado
                          }
                        >

                          <Ionicons
                            name="checkmark-circle-outline"
                            size={17}
                            color="#08752F"
                          />

                          <Text
                            style={
                              styles.estadoPagadoTexto
                            }
                          >
                            Pagado
                          </Text>

                        </View>

                      )}

                    </TouchableOpacity>
                  );
                }
              )}

            </ScrollView>

            {seleccionados.length > 0 && (

              <View
                style={[
                    styles.contenedorEliminar,
                    {
                    paddingBottom:
                        12 + insets.bottom,
                    },
                ]}
                >

                <TouchableOpacity
                  style={[
                    styles.botonEliminar,

                    eliminando &&
                      styles.botonDeshabilitado,
                  ]}
                  disabled={eliminando}
                  onPress={
                    confirmarEliminacion
                  }
                >

                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.textoEliminar
                    }
                  >
                    {eliminando
                      ? 'Eliminando...'
                      : seleccionados.length ===
                          1
                        ? 'Eliminar 1 registro'
                        : `Eliminar ${seleccionados.length} registros`}
                  </Text>

                </TouchableOpacity>

              </View>

            )}

          </View>

        )}

      </View>

      <Modal
        visible={modalAbonoVisible}
        transparent
        animationType="fade"
        onRequestClose={
            cerrarModalAbono
        }
        >

        <View
            style={styles.fondoModal}
        >

            <View
            style={styles.modalAbono}
            >

            <Text
                style={styles.tituloModal}
            >
                Registrar abono
            </Text>

            {entregaAbono && (

                <>
                <Text
                    style={
                    styles.clienteModal
                    }
                >
                    {obtenerNombreCliente(
                    entregaAbono.clienteId
                    )}
                </Text>

                <View
                    style={
                    styles.resumenModal
                    }
                >

                    <Text
                    style={
                        styles.labelModal
                    }
                    >
                    Saldo pendiente
                    </Text>

                    <Text
                    style={
                        styles.saldoModal
                    }
                    >
                    $
                    {Number(
                        entregaAbono
                        .saldoPendiente ||
                        0
                    ).toFixed(2)}
                    </Text>

                </View>
                </>

            )}

            <Text
                style={styles.labelCampo}
            >
                Efectivo
            </Text>

            <TextInput
                style={styles.input}
                value={pagoEfectivo}
                onChangeText={
                setPagoEfectivo
                }
                keyboardType="decimal-pad"
                placeholder="0.00"
            />

            <Text
                style={styles.labelCampo}
            >
                Transferencia
            </Text>

            <TextInput
                style={styles.input}
                value={
                pagoTransferencia
                }
                onChangeText={
                setPagoTransferencia
                }
                keyboardType="decimal-pad"
                placeholder="0.00"
            />

            <View
                style={
                styles.botonesModal
                }
            >

                <TouchableOpacity
                style={
                    styles.botonCancelarModal
                }
                disabled={guardandoAbono}
                onPress={
                    cerrarModalAbono
                }
                >

                <Text
                    style={
                    styles.textoCancelarModal
                    }
                >
                    Cancelar
                </Text>

                </TouchableOpacity>

                <TouchableOpacity
                style={[
                    styles.botonGuardarAbono,

                    guardandoAbono &&
                    styles.botonDeshabilitado,
                ]}
                disabled={guardandoAbono}
                onPress={guardarAbono}
                >

                <Text
                    style={
                    styles.textoGuardarAbono
                    }
                >
                    {guardandoAbono
                    ? 'Guardando...'
                    : 'Abonar'}
                </Text>

                </TouchableOpacity>

            </View>

            </View>

        </View>

        </Modal>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 115,
    backgroundColor: '#08752F',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 17,
  },

  tituloHeader: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    height: 40,
  },

  botonRegresar: {
    position: 'absolute',
    left: 18,
    bottom: 17,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },

  contenido: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  informacion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F7F2',
    borderWidth: 1,
    borderColor: '#D7E9DC',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },

  textoInformacion: {
    flex: 1,
    color: '#555555',
    fontSize: 13,
    lineHeight: 19,
  },

  vacio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 80,
  },

  vacioTitulo: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#555555',
  },

  vacioTexto: {
    marginTop: 6,
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 19,
  },

  areaRegistros: {
    flex: 1,
  },

  barraSeleccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 8,
  },

  seleccionarTodos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  textoSeleccionarTodos: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },

  cantidadSeleccionados: {
    fontSize: 12,
    color: '#777777',
  },

  lista: {
    flex: 1,
  },

  listaContenido: {
    paddingBottom: 20,
  },

  tarjeta: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },

  tarjetaSeleccionada: {
    borderColor: '#08752F',
    borderWidth: 2,
    backgroundColor: '#F5FAF6',
  },

  tarjetaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  informacionCliente: {
    flex: 1,
    paddingRight: 10,
  },

  cliente: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },

  fecha: {
    marginTop: 3,
    fontSize: 12,
    color: '#777777',
  },

  separador: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12,
  },

  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },

  label: {
    fontSize: 13,
    color: '#666666',
  },

  total: {
    fontSize: 14,
    fontWeight: '700',
    color: '#08752F',
  },

  saldo: {
    fontSize: 14,
    fontWeight: '700',
  },

  saldoPendiente: {
    color: '#D71920',
  },

  saldoPagado: {
    color: '#08752F',
  },

  estadoPendiente: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  estadoPendienteTexto: {
    flex: 1,
    fontSize: 11,
    color: '#D71920',
  },

  estadoPagado: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  estadoPagadoTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#08752F',
  },

  contenedorEliminar: {
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },

  botonEliminar: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#D71920',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  botonDeshabilitado: {
    opacity: 0.6,
  },

  textoEliminar: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  botonAbonar: {
    marginTop: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#08752F',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFFFFF',
    },

    textoBotonAbonar: {
    color: '#08752F',
    fontSize: 14,
    fontWeight: '700',
    },

    fondoModal: {
    flex: 1,
    backgroundColor:
        'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 25,
    },

    modalAbono: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    },

    tituloModal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    textAlign: 'center',
    },

    clienteModal: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    },

    resumenModal: {
    marginTop: 18,
    marginBottom: 18,
    padding: 13,
    borderRadius: 10,
    backgroundColor: '#F0F7F2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    },

    labelModal: {
    fontSize: 13,
    color: '#555555',
    },

    saldoModal: {
    fontSize: 17,
    fontWeight: '700',
    color: '#D71920',
    },

    labelCampo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 6,
    },

    input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 10,
    paddingHorizontal: 13,
    fontSize: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    },

    botonesModal: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
    },

    botonCancelarModal: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'center',
    },

    textoCancelarModal: {
    color: '#555555',
    fontSize: 14,
    fontWeight: '700',
    },

    botonGuardarAbono: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#08752F',
    justifyContent: 'center',
    alignItems: 'center',
    },

    textoGuardarAbono: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    },

});