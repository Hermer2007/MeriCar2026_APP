import React, { useMemo } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useEntregas } from '../context/EntregasContext';
import { useAlert } from '../context/AlertContext';

const ClienteDetalleScreen = ({
  navigation,
  route,
}) => {

  const cliente =
    route.params?.cliente;

  const {
    obtenerEntregasCliente,
  } = useEntregas();

  const historial =
    cliente
      ? obtenerEntregasCliente(
          cliente.id
        )
      : [];

  // ==========================================
  // CLIENTE
  // ==========================================

  const nombreCompleto =
    useMemo(() => {

      if (!cliente) {
        return 'Cliente';
      }

      return (
        cliente.nombre ||
        `${cliente.nombres || ''} ${
          cliente.apellidos || ''
        }`.trim()
      );

    }, [cliente]);

  // ==========================================
  // SALDO PENDIENTE TOTAL
  // ==========================================

  const saldoPendienteTotal =
    historial.reduce(
      (
        acumulado,
        entrega
      ) => {

        const saldo =
          Number(
            entrega.saldoPendiente
          ) || 0;

        return (
          acumulado +
          Math.max(
            saldo,
            0
          )
        );
      },
      0
    );

  // ==========================================
  // NAVEGACIÓN
  // ==========================================

  const editarEntrega = (
    entrega
  ) => {

    navigation.navigate(
      'EditarEntrega',
      {
        cliente,
        entrega,
      }
    );
  };

  const nuevaEntrega = () => {

    navigation.navigate(
      'NuevaEntrega',
      {
        cliente,
      }
    );
  };

  // ==========================================
  // ALERTA
  // ==========================================

  const {
    mostrarAlert,
  } = useAlert();

  const cerrarSesion = () => {

    mostrarAlert({
      titulo:
        'Cerrar sesión',

      mensaje:
        '¿Desea salir de la aplicación?',

      tipo:
        'question',

      mostrarCancelar:
        true,

      textoCancelar:
        'Cancelar',

      textoConfirmar:
        'Salir',

      onConfirmar: () => {
        navigation.replace(
          'Login'
        );
      },
    });
  };

  // ==========================================
  // RENDER ENTREGA
  // ==========================================

  const renderEntrega = ({
    item,
  }) => {

    const saldoCero =
      Number(
        item.saldoPendiente
      ) === 0;

    const metodos =
      Array.isArray(
        item.metodosPago
      )
        ? item.metodosPago
        : item.metodoPago
        ? [
            item.metodoPago,
          ]
        : [];

    const sinMetodoPago =
      metodos.length === 0;

    return (
      <View
        style={
          styles.tarjeta
        }
      >

        {/* CABECERA DE ENTREGA */}

        <View
          style={
            styles.encabezadoEntrega
          }
        >

          <View
            style={
              styles.fechaContainer
            }
          >

            <Ionicons
              name="calendar-outline"
              size={19}
              color="#08752F"
            />

            <Text
              style={
                styles.fecha
              }
            >
              {item.fecha}
            </Text>

            <View
              style={
                styles.badgeEntrega
              }
            >

              <Ionicons
                name="arrow-up"
                size={12}
                color="#08752F"
              />

              <Text
                style={
                  styles.badgeTexto
                }
              >
                Entrega
              </Text>

            </View>

          </View>

          <TouchableOpacity
            style={
              styles.botonEditar
            }
            onPress={() =>
              editarEntrega(
                item
              )
            }
          >

            <Ionicons
              name="pencil"
              size={21}
              color="#08752F"
            />

          </TouchableOpacity>

        </View>

        {/* PRODUCTOS */}

        <View
          style={
            styles.productos
          }
        >

          {Array.isArray(
            item.productos
          ) &&
            item.productos.map(
              (
                producto,
                index
              ) => (

                <View
                  key={`${item.id}-${index}`}
                  style={
                    styles.productoFila
                  }
                >

                  <Text
                    style={
                      styles.productoCantidad
                    }
                  >
                    {producto.cantidad} x $
                    {Number(
                      producto.precio
                    ).toFixed(
                      2
                    )}
                  </Text>

                  {index <
                    item.productos.length -
                      1 && (

                    <Text
                      style={
                        styles.signoMas
                      }
                    >
                      +
                    </Text>

                  )}

                </View>

              )
            )}

        </View>

        <View
          style={
            styles.separador
          }
        />

        {/* TOTAL / ABONA */}

        <View
          style={
            styles.resumenFila
          }
        >

          <View
            style={
              styles.resumenItem
            }
          >

            <Text
              style={
                styles.resumenLabel
              }
            >
              Total:
            </Text>

            <Text
              style={
                styles.total
              }
            >
              $
              {Number(
                item.total
              ).toFixed(
                2
              )}
            </Text>

          </View>

          <View
            style={
              styles.divisorVertical
            }
          />

          <View
            style={
              styles.resumenItem
            }
          >

            <Text
              style={
                styles.resumenLabel
              }
            >
              Abona:
            </Text>

            <Text
              style={
                styles.abona
              }
            >
              $
              {Number(
                item.abona
              ).toFixed(
                2
              )}
            </Text>

          </View>

        </View>

        {/* MÉTODO DE PAGO */}

        <View
          style={
            styles.metodoPagoContainer
          }
        >

          <Text
            style={
              styles.metodoLabel
            }
          >
            Método de pago:
          </Text>

          <View
            style={
              styles.metodosContainer
            }
          >

            {sinMetodoPago && (

              <View
                style={
                  styles.metodoItem
                }
              >

                <Ionicons
                  name="close-circle-outline"
                  size={17}
                  color="#D71920"
                />

                <Text
                  style={
                    styles.noPagaTexto
                  }
                >
                  No paga
                </Text>

              </View>

            )}

            {metodos.includes(
              'Efectivo'
            ) && (

              <View
                style={
                  styles.metodoItem
                }
              >

                <Ionicons
                  name="cash-outline"
                  size={17}
                  color="#08752F"
                />

                <Text
                  style={
                    styles.metodoTexto
                  }
                >
                  Efectivo
                </Text>

                <Text
                  style={
                    styles.metodoMonto
                  }
                >
                  $
                  {Number(
                    item.pagoEfectivo ??
                      (
                        item.metodoPago ===
                        'Efectivo'
                          ? item.abona
                          : 0
                      )
                  ).toFixed(
                    2
                  )}
                </Text>

              </View>

            )}

            {metodos.includes(
              'Transferencia'
            ) && (

              <View
                style={
                  styles.metodoItem
                }
              >

                <Ionicons
                  name="card-outline"
                  size={17}
                  color="#08752F"
                />

                <Text
                  style={
                    styles.metodoTexto
                  }
                >
                  Transferencia
                </Text>

                <Text
                  style={
                    styles.metodoMonto
                  }
                >
                  $
                  {Number(
                    item.pagoTransferencia ??
                      (
                        item.metodoPago ===
                        'Transferencia'
                          ? item.abona
                          : 0
                      )
                  ).toFixed(
                    2
                  )}
                </Text>

              </View>

            )}

          </View>

        </View>

        {/* SALDO */}

        <View
          style={
            styles.saldoFila
          }
        >

          <Text
            style={
              styles.saldoLabel
            }
          >
            Saldo pendiente:
          </Text>

          <Text
            style={[
              styles.saldo,

              saldoCero
                ? styles.saldoCero
                : styles.saldoPendiente,
            ]}
          >
            $
            {Number(
              item.saldoPendiente
            ).toFixed(
              2
            )}
          </Text>

        </View>

      </View>
    );
  };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <View
      style={
        styles.container
      }
    >

      <StatusBar
        barStyle="light-content"
        backgroundColor="#08752F"
      />

      {/* HEADER */}

      <View
        style={
          styles.header
        }
      >

        <TouchableOpacity
          style={
            styles.botonRegresar
          }
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

        <View
          style={
            styles.headerCentro
          }
        >

          <Text
            style={
              styles.nombreCliente
            }
          >
            {nombreCompleto}
          </Text>

          <Text
            style={
              styles.telefonoCliente
            }
          >
            {cliente?.telefono || ''}
          </Text>

        </View>

      </View>

      {/* TITULO Y SALDO TOTAL */}

      <View
        style={
          styles.historialEncabezado
        }
      >

        <Text
          style={
            styles.historialTitulo
          }
        >
          Historial
        </Text>

        <View
          style={
            styles.saldoTotalContainer
          }
        >

          <Text
            style={
              styles.saldoTotalLabel
            }
          >
            Saldo pendiente total
          </Text>

          <Text
            style={[
              styles.saldoTotalValor,

              saldoPendienteTotal <=
              0
                ? styles.saldoTotalCero
                : styles.saldoTotalPendiente,
            ]}
          >
            $
            {saldoPendienteTotal.toFixed(
              2
            )}
          </Text>

        </View>

      </View>

      {/* HISTORIAL */}

      <FlatList
        data={
          historial
        }
        keyExtractor={(
          item
        ) =>
          item.id
        }
        renderItem={
          renderEntrega
        }
        contentContainerStyle={
          styles.lista
        }
        showsVerticalScrollIndicator={
          false
        }
        ListEmptyComponent={

          <View
            style={
              styles.vacio
            }
          >

            <Ionicons
              name="receipt-outline"
              size={55}
              color="#BBBBBB"
            />

            <Text
              style={
                styles.vacioTitulo
              }
            >
              Sin entregas registradas
            </Text>

            <Text
              style={
                styles.vacioSubtitulo
              }
            >
              Las entregas realizadas al cliente aparecerán aquí.
            </Text>

          </View>

        }
      />

      {/* NUEVA ENTREGA */}

      <View
        style={
          styles.botonNuevaContainer
        }
      >

        <TouchableOpacity
          style={
            styles.botonNueva
          }
          onPress={
            nuevaEntrega
          }
        >

          <Ionicons
            name="add"
            size={26}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.textoNueva
            }
          >
            Nueva entrega
          </Text>

        </TouchableOpacity>

      </View>

      {/* BARRA INFERIOR */}

      <View
        style={
          styles.bottomNavigation
        }
      >

        <TouchableOpacity
          style={
            styles.navItem
          }
          onPress={() =>
            navigation.navigate(
              'Home'
            )
          }
        >

          <Ionicons
            name="home"
            size={27}
            color="#08752F"
          />

          <Text
            style={
              styles.navActivo
            }
          >
            Inicio
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.navItem
          }
          onPress={() =>
            navigation.navigate(
              'Perfil'
            )
          }
        >

          <Ionicons
            name="person"
            size={27}
            color="#222222"
          />

          <Text
            style={
              styles.navTexto
            }
          >
            Perfil
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.navItem
          }
          onPress={
            cerrarSesion
          }
        >

          <Ionicons
            name="log-out-outline"
            size={29}
            color="#222222"
          />

          <Text
            style={
              styles.navTexto
            }
          >
            Salir
          </Text>

        </TouchableOpacity>

      </View>

    </View>
  );
};

export default ClienteDetalleScreen;

// ==========================================
// ESTILOS
// ==========================================

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        '#FFFFFF',
    },

    header: {
      height: 115,
      backgroundColor:
        '#08752F',
      justifyContent:
        'flex-end',
      alignItems:
        'center',
      paddingBottom: 17,
    },

    botonRegresar: {
      position:
        'absolute',
      left: 18,
      bottom: 18,
      width: 45,
      height: 45,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    headerCentro: {
      alignItems:
        'center',
      paddingHorizontal: 65,
    },

    nombreCliente: {
      color:
        '#FFFFFF',
      fontSize: 22,
      fontWeight:
        '700',
      textAlign:
        'center',
    },

    telefonoCliente: {
      color:
        '#E2F2E6',
      fontSize: 14,
      marginTop: 2,
      textAlign:
        'center',
    },

    // ========================================
    // HISTORIAL / SALDO TOTAL
    // ========================================

    historialEncabezado: {
      paddingHorizontal: 20,
      paddingTop: 15,
      paddingBottom: 7,
    },

    historialTitulo: {
      color:
        '#08752F',
      fontSize: 16,
      fontWeight:
        '700',
      marginBottom: 8,
    },

    saldoTotalContainer: {
      minHeight: 48,
      borderWidth: 1,
      borderColor:
        '#F0CACA',
      borderRadius: 10,
      backgroundColor:
        '#FFF7F7',
      paddingHorizontal: 13,
      paddingVertical: 9,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    saldoTotalLabel: {
      flex: 1,
      color:
        '#666666',
      fontSize: 12,
      fontWeight:
        '600',
      marginRight: 10,
    },

    saldoTotalValor: {
      fontSize: 18,
      fontWeight:
        '800',
    },

    saldoTotalPendiente: {
      color:
        '#D71920',
    },

    saldoTotalCero: {
      color:
        '#08752F',
    },

    lista: {
      paddingHorizontal: 20,
      paddingTop: 5,
      paddingBottom: 20,
    },

    // ========================================
    // TARJETAS
    // ========================================

    tarjeta: {
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      borderRadius: 13,
      backgroundColor:
        '#FFFFFF',
      padding: 14,
      marginBottom: 12,

      elevation: 2,

      shadowColor:
        '#000000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: {
        width: 0,
        height: 2,
      },
    },

    encabezadoEntrega: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    fechaContainer: {
      flex: 1,
      flexDirection:
        'row',
      alignItems:
        'center',
      flexWrap:
        'wrap',
      gap: 7,
      paddingRight: 5,
    },

    fecha: {
      fontSize: 15,
      fontWeight:
        '700',
      color:
        '#202020',
    },

    badgeEntrega: {
      minHeight: 25,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 7,
      backgroundColor:
        '#E7F3EA',
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 3,
    },

    badgeTexto: {
      color:
        '#08752F',
      fontSize: 11,
      fontWeight:
        '600',
    },

    botonEditar: {
      width: 38,
      height: 38,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    productos: {
      marginTop: 9,
      flexDirection:
        'row',
      alignItems:
        'center',
      flexWrap:
        'wrap',
    },

    productoFila: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    productoCantidad: {
      fontSize: 15,
      color:
        '#282828',
    },

    signoMas: {
      marginHorizontal: 12,
      color:
        '#08752F',
      fontSize: 20,
      fontWeight:
        '700',
    },

    separador: {
      minHeight: 1,
      backgroundColor:
        '#E5E5E5',
      marginVertical: 11,
    },

    resumenFila: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    resumenItem: {
      flex: 1,
      flexDirection:
        'row',
      alignItems:
        'center',
      flexWrap:
        'wrap',
      gap: 6,
    },

    divisorVertical: {
      width: 1,
      minHeight: 22,
      backgroundColor:
        '#E3E3E3',
      marginHorizontal: 10,
    },

    resumenLabel: {
      fontSize: 12,
      color:
        '#666666',
    },

    total: {
      fontSize: 14,
      fontWeight:
        '700',
      color:
        '#08752F',
    },

    abona: {
      fontSize: 14,
      fontWeight:
        '700',
      color:
        '#08752F',
    },

    // ========================================
    // MÉTODOS DE PAGO
    // ========================================

    metodoPagoContainer: {
      marginTop: 11,
    },

    metodoLabel: {
      fontSize: 12,
      color:
        '#666666',
      marginBottom: 5,
    },

    metodosContainer: {
      gap: 5,
    },

    metodoItem: {
      flexDirection:
        'row',
      alignItems:
        'center',
      flexWrap:
        'wrap',
      gap: 5,
    },

    metodoTexto: {
      fontSize: 12,
      fontWeight:
        '700',
      color:
        '#08752F',
    },

    metodoMonto: {
      fontSize: 12,
      fontWeight:
        '700',
      color:
        '#08752F',
    },

    noPagaTexto: {
      fontSize: 12,
      fontWeight:
        '700',
      color:
        '#D71920',
    },

    // ========================================
    // SALDO
    // ========================================

    saldoFila: {
      marginTop: 10,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'flex-end',
      flexWrap:
        'wrap',
      gap: 5,
    },

    saldoLabel: {
      fontSize: 12,
      color:
        '#666666',
    },

    saldo: {
      fontSize: 15,
      fontWeight:
        '700',
    },

    saldoCero: {
      color:
        '#08752F',
    },

    saldoPendiente: {
      color:
        '#D71920',
    },

    // ========================================
    // VACÍO
    // ========================================

    vacio: {
      alignItems:
        'center',
      paddingTop: 70,
      paddingHorizontal: 30,
    },

    vacioTitulo: {
      marginTop: 12,
      fontSize: 17,
      fontWeight:
        '700',
      color:
        '#555555',
      textAlign:
        'center',
    },

    vacioSubtitulo: {
      marginTop: 5,
      textAlign:
        'center',
      color:
        '#999999',
      fontSize: 13,
    },

    // ========================================
    // NUEVA ENTREGA
    // ========================================

    botonNuevaContainer: {
      paddingHorizontal: 20,
      paddingVertical: 9,
      backgroundColor:
        '#FFFFFF',
    },

    botonNueva: {
      minHeight: 52,
      borderRadius: 10,
      backgroundColor:
        '#08752F',
      flexDirection:
        'row',
      justifyContent:
        'center',
      alignItems:
        'center',
      gap: 7,
      paddingVertical: 12,
      paddingHorizontal: 15,
    },

    textoNueva: {
      color:
        '#FFFFFF',
      fontSize: 16,
      fontWeight:
        '700',
    },

    // ========================================
    // NAVEGACIÓN
    // ========================================

    bottomNavigation: {
      height: 78,
      borderTopWidth: 1,
      borderTopColor:
        '#E5E5E5',
      backgroundColor:
        '#FFFFFF',
      flexDirection:
        'row',
    },

    navItem: {
      flex: 1,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    navActivo: {
      color:
        '#08752F',
      fontSize: 12,
      fontWeight:
        '700',
      marginTop: 3,
    },

    navTexto: {
      color:
        '#333333',
      fontSize: 12,
      marginTop: 3,
    },

  });