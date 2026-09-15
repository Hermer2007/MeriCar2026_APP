import React, {
  useMemo,
  useState,
} from 'react';

import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useClientes } from '../context/ClientesContext';
import { useEntregas } from '../context/EntregasContext';

export default function CuentasCobrarScreen({
  navigation,
}) {
  const { clientes } =
    useClientes();

  const { entregas } =
    useEntregas();

  const [
    busqueda,
    setBusqueda,
  ] = useState('');

  const [
    clienteAbierto,
    setClienteAbierto,
  ] = useState(null);

  // ==========================================
  // FORMATO DINERO
  // ==========================================

  const dinero = (
    valor
  ) => {
    const numero =
      Number(
        valor || 0
      );

    return `$${numero.toFixed(
      2
    )}`;
  };

  // ==========================================
  // SOLO ENTREGAS CON SALDO
  // ==========================================

  const entregasConSaldo =
    useMemo(() => {
      return entregas.filter(
        (entrega) =>
          entrega.clienteId !==
            null &&
          entrega.clienteId !==
            undefined &&
          Number(
            entrega.saldoPendiente ||
              0
          ) > 0
      );
    }, [
      entregas,
    ]);

  // ==========================================
  // DEUDA TOTAL GENERAL
  // ==========================================

  const deudaTotal =
    useMemo(() => {
      return entregasConSaldo.reduce(
        (
          total,
          entrega
        ) =>
          total +
          Number(
            entrega.saldoPendiente ||
              0
          ),
        0
      );
    }, [
      entregasConSaldo,
    ]);

  // ==========================================
  // CLIENTES CON DEUDAS
  // ==========================================

  const clientesConDeuda =
    useMemo(() => {
      return clientes
        .map(
          (cliente) => {
            const saldos =
              entregasConSaldo.filter(
                (entrega) =>
                  String(
                    entrega.clienteId
                  ) ===
                  String(
                    cliente.id
                  )
              );

            const saldoTotal =
              saldos.reduce(
                (
                  total,
                  entrega
                ) =>
                  total +
                  Number(
                    entrega.saldoPendiente ||
                      0
                  ),
                0
              );

            const nombre =
              cliente.nombre ||
              `${cliente.nombres || ''} ${
                cliente.apellidos ||
                ''
              }`.trim() ||
              'Cliente';

            return {
              ...cliente,

              nombreMostrar:
                nombre,

              cantidadSaldos:
                saldos.length,

              saldoTotal,

              saldos,
            };
          }
        )
        .filter(
          (cliente) =>
            cliente.saldoTotal >
            0
        );
    }, [
      clientes,
      entregasConSaldo,
    ]);

  // ==========================================
  // RANKING
  // MAYOR DEUDA PRIMERO
  // ==========================================

  const ranking =
    useMemo(() => {
      return [
        ...clientesConDeuda,
      ].sort(
        (
          a,
          b
        ) => {
          if (
            b.saldoTotal !==
            a.saldoTotal
          ) {
            return (
              b.saldoTotal -
              a.saldoTotal
            );
          }

          if (
            b.cantidadSaldos !==
            a.cantidadSaldos
          ) {
            return (
              b.cantidadSaldos -
              a.cantidadSaldos
            );
          }

          return a.nombreMostrar.localeCompare(
            b.nombreMostrar
          );
        }
      );
    }, [
      clientesConDeuda,
    ]);

  // ==========================================
  // BUSCADOR
  // ==========================================

  const clientesFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (
        !texto
      ) {
        return ranking;
      }

      return ranking.filter(
        (cliente) =>
          `${cliente.nombreMostrar} ${
            cliente.telefono ||
            ''
          }`
            .toLowerCase()
            .includes(
              texto
            )
      );
    }, [
      ranking,
      busqueda,
    ]);

  // ==========================================
  // ABRIR / CERRAR CLIENTE
  // ==========================================

  const cambiarClienteAbierto = (
    clienteId
  ) => {
    if (
      String(
        clienteAbierto
      ) ===
      String(
        clienteId
      )
    ) {
      setClienteAbierto(
        null
      );

      return;
    }

    setClienteAbierto(
      clienteId
    );
  };

  // ==========================================
  // TARJETA CLIENTE
  // ==========================================

  const renderCliente = ({
    item,
    index,
  }) => {
    const abierto =
      String(
        clienteAbierto
      ) ===
      String(
        item.id
      );

    return (
      <View
        style={
          styles.tarjeta
        }
      >
        <TouchableOpacity
          activeOpacity={
            0.75
          }
          onPress={() =>
            cambiarClienteAbierto(
              item.id
            )
          }
        >
          {/* ===================================
              CABECERA
          =================================== */}

          <View
            style={
              styles.cabeceraCliente
            }
          >
            <View
              style={
                styles.avatar
              }
            >
              <Ionicons
                name="person"
                size={21}
                color="#08752F"
              />
            </View>

            <View
              style={
                styles.infoCliente
              }
            >
              <View
                style={
                  styles.nombreFila
                }
              >
                <Text
                  style={
                    styles.posicion
                  }
                >
                  #{index + 1}
                </Text>

                <Text
                  style={
                    styles.nombre
                  }
                  numberOfLines={
                    1
                  }
                >
                  {
                    item.nombreMostrar
                  }
                </Text>
              </View>

              <Text
                style={
                  styles.telefono
                }
              >
                {item.telefono ||
                  'Sin teléfono'}
              </Text>
            </View>

            {/* SALDOS */}

            <View
              style={
                styles.saldosBadge
              }
            >
              <Text
                style={
                  styles.saldosNumero
                }
              >
                {
                  item.cantidadSaldos
                }
              </Text>

              <Text
                style={
                  styles.saldosTexto
                }
              >
                saldos
              </Text>
            </View>

            <Ionicons
              name={
                abierto
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={20}
              color="#08752F"
              style={
                styles.flecha
              }
            />
          </View>

          {/* ===================================
              SALDO TOTAL DEL CLIENTE
          =================================== */}

          <View
            style={
              styles.separador
            }
          />

          <View
            style={
              styles.saldoCliente
            }
          >
            <Text
              style={
                styles.saldoLabel
              }
            >
              Saldo pendiente
            </Text>

            <Text
              style={
                styles.saldoValor
              }
            >
              {dinero(
                item.saldoTotal
              )}
            </Text>
          </View>
        </TouchableOpacity>

        {/* =====================================
            HISTORIAL DE SALDOS
        ===================================== */}

        {abierto && (
          <View
            style={
              styles.historial
            }
          >
            <View
              style={
                styles.historialTituloFila
              }
            >
              <Ionicons
                name="time-outline"
                size={18}
                color="#08752F"
              />

              <Text
                style={
                  styles.historialTitulo
                }
              >
                Historial de saldos
              </Text>
            </View>

            {item.saldos.map(
  (
    saldo,
    posicion
  ) => (
    <TouchableOpacity
      key={
        saldo.id ||
        `${item.id}-${posicion}`
      }
      style={
        styles.saldoHistorial
      }
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate(
          'EditarEntrega',
          {
            cliente: item,
            entrega: saldo,
          }
        )
      }
    >
      <View
        style={
          styles.fechaContainer
        }
      >
        <Ionicons
          name="calendar-outline"
          size={17}
          color="#777777"
        />

        <Text
          style={
            styles.fechaTexto
          }
        >
          {saldo.fecha ||
            'Sin fecha'}
        </Text>
      </View>

      <View
        style={
          styles.valorHistorialContainer
        }
      >
        <Text
          style={
            styles.pendientePequeno
          }
        >
          Pendiente
        </Text>

        <View
          style={
            styles.saldoConFlecha
          }
        >
          <Text
            style={
              styles.valorHistorial
            }
          >
            {dinero(
              saldo.saldoPendiente
            )}
          </Text>

          <Ionicons
            name="chevron-forward"
            size={17}
            color="#08752F"
          />
        </View>
      </View>
    </TouchableOpacity>
  )
)}
          </View>
        )}
      </View>
    );
  };

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

      {/* =====================================
          HEADER
      ===================================== */}

      <View
        style={
          styles.header
        }
      >
        <TouchableOpacity
          style={
            styles.regresar
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
              styles.tituloHeader
            }
          >
            Cuentas por cobrar
          </Text>

          <Text
            style={
              styles.subtituloHeader
            }
          >
            Saldos pendientes
          </Text>
        </View>
      </View>

      <FlatList
        data={
          clientesFiltrados
        }
        renderItem={
          renderCliente
        }
        keyExtractor={(
          item
        ) =>
          String(
            item.id
          )
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.lista
        }
        ListHeaderComponent={
          <>
            {/* =================================
                DEUDA TOTAL
            ================================= */}

            <View
              style={
                styles.deudaGeneral
              }
            >
              <View>
                <Text
                  style={
                    styles.deudaLabel
                  }
                >
                  Deuda total
                </Text>

                <Text
                  style={
                    styles.deudaValor
                  }
                >
                  {dinero(
                    deudaTotal
                  )}
                </Text>
              </View>

              <View
                style={
                  styles.walletIcon
                }
              >
                <Ionicons
                  name="wallet-outline"
                  size={27}
                  color="#08752F"
                />
              </View>
            </View>

            {/* =================================
                BUSCADOR
            ================================= */}

            <View
              style={
                styles.buscadorContainer
              }
            >
              <Ionicons
                name="search-outline"
                size={21}
                color="#777777"
              />

              <TextInput
                style={
                  styles.buscador
                }
                placeholder="Buscar cliente..."
                placeholderTextColor="#999999"
                value={
                  busqueda
                }
                onChangeText={
                  setBusqueda
                }
              />
            </View>

            {/* =================================
                RANKING
            ================================= */}

            {ranking.length >
              0 && (
              <View
                style={
                  styles.rankingTitulo
                }
              >
                <Ionicons
                  name="podium-outline"
                  size={20}
                  color="#D71920"
                />

                <Text
                  style={
                    styles.rankingTexto
                  }
                >
                  Clientes con mayor saldo pendiente
                </Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View
            style={
              styles.sinDeudas
            }
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={58}
              color="#08752F"
            />

            <Text
              style={
                styles.sinDeudasTitulo
              }
            >
              Sin cuentas pendientes
            </Text>

            <Text
              style={
                styles.sinDeudasDescripcion
              }
            >
              Actualmente no existen clientes con saldos pendientes.
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ============================================
// ESTILOS
// ============================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F7F8F9',
    },

    // ========================================
    // HEADER
    // ========================================

    header: {
      height: 105,
      backgroundColor:
        '#08752F',
      justifyContent:
        'flex-end',
      alignItems:
        'center',
      paddingBottom: 14,
    },

    regresar: {
      position:
        'absolute',
      left: 17,
      bottom: 15,
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
    },

    tituloHeader: {
      color:
        '#FFFFFF',
      fontSize: 20,
      fontWeight:
        '700',
    },

    subtituloHeader: {
      color:
        '#DDEEE2',
      fontSize: 11,
      marginTop: 2,
    },

    // ========================================
    // LISTA
    // ========================================

    lista: {
      paddingHorizontal: 12,
      paddingTop: 14,
      paddingBottom: 35,
    },

    // ========================================
    // DEUDA GENERAL
    // ========================================

    deudaGeneral: {
      minHeight: 78,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      borderRadius: 12,
      paddingHorizontal: 14,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',

      shadowColor:
        '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.04,
      shadowRadius: 3,

      elevation: 2,
    },

    deudaLabel: {
      fontSize: 10,
      color:
        '#888888',
    },

    deudaValor: {
      fontSize: 22,
      fontWeight:
        '800',
      color:
        '#D71920',
      marginTop: 3,
    },

    walletIcon: {
      width: 47,
      height: 47,
      borderRadius: 24,
      backgroundColor:
        '#E8F6EC',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    // ========================================
    // BUSCADOR
    // ========================================

    buscadorContainer: {
      height: 48,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E0E0E0',
      borderRadius: 10,
      marginTop: 11,
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 12,
    },

    buscador: {
      flex: 1,
      marginLeft: 8,
      fontSize: 13,
      color:
        '#222222',
    },

    // ========================================
    // RANKING
    // ========================================

    rankingTitulo: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 7,
      marginTop: 16,
      marginBottom: 8,
    },

    rankingTexto: {
      fontSize: 13,
      fontWeight:
        '700',
      color:
        '#333333',
    },

    // ========================================
    // TARJETA
    // ========================================

    tarjeta: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      borderRadius: 12,
      marginBottom: 10,
      paddingHorizontal: 12,

      shadowColor:
        '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.04,
      shadowRadius: 3,

      elevation: 2,
    },

    cabeceraCliente: {
      minHeight: 67,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        '#E8F6EC',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    infoCliente: {
      flex: 1,
      marginLeft: 10,
    },

    saldoConFlecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    },

    nombreFila: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    posicion: {
      fontSize: 11,
      color:
        '#D71920',
      fontWeight:
        '800',
      marginRight: 5,
    },

    nombre: {
      flex: 1,
      fontSize: 13,
      fontWeight:
        '700',
      color:
        '#292929',
    },

    telefono: {
      fontSize: 9,
      color:
        '#888888',
      marginTop: 3,
    },

    // ========================================
    // BADGE SALDOS
    // ========================================

    saldosBadge: {
      minWidth: 56,
      minHeight: 41,
      borderRadius: 20,
      backgroundColor:
        '#FFF0F0',
      alignItems:
        'center',
      justifyContent:
        'center',
      paddingHorizontal: 8,
    },

    saldosNumero: {
      fontSize: 13,
      fontWeight:
        '800',
      color:
        '#D71920',
    },

    saldosTexto: {
      fontSize: 8,
      color:
        '#D71920',
    },

    flecha: {
      marginLeft: 5,
    },

    separador: {
      height: 1,
      backgroundColor:
        '#EEEEEE',
    },

    // ========================================
    // SALDO CLIENTE
    // ========================================

    saldoCliente: {
      minHeight: 53,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    saldoLabel: {
      fontSize: 10,
      color:
        '#888888',
    },

    saldoValor: {
      fontSize: 16,
      color:
        '#D71920',
      fontWeight:
        '800',
    },

    // ========================================
    // HISTORIAL
    // ========================================

    historial: {
      borderTopWidth: 1,
      borderTopColor:
        '#EAEAEA',
      paddingBottom: 7,
    },

    historialTituloFila: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 6,
      paddingVertical: 10,
    },

    historialTitulo: {
      fontSize: 11,
      fontWeight:
        '700',
      color:
        '#08752F',
    },

    saldoHistorial: {
      minHeight: 50,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      borderTopWidth: 1,
      borderTopColor:
        '#F0F0F0',
    },

    fechaContainer: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 7,
    },

    fechaTexto: {
      fontSize: 11,
      color:
        '#555555',
      fontWeight:
        '600',
    },

    valorHistorialContainer: {
      alignItems:
        'flex-end',
    },

    pendientePequeno: {
      fontSize: 8,
      color:
        '#999999',
    },

    valorHistorial: {
      fontSize: 12,
      color:
        '#D71920',
      fontWeight:
        '800',
      marginTop: 2,
    },

    // ========================================
    // SIN DEUDAS
    // ========================================

    sinDeudas: {
      alignItems:
        'center',
      paddingTop: 60,
      paddingHorizontal: 30,
    },

    sinDeudasTitulo: {
      fontSize: 15,
      fontWeight:
        '700',
      color:
        '#444444',
      marginTop: 10,
    },

    sinDeudasDescripcion: {
      fontSize: 11,
      color:
        '#888888',
      textAlign:
        'center',
      marginTop: 4,
    },
  });