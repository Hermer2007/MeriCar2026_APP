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
import BotonHome from '../components/BotonHome';

export default function ClientesEntregasScreen({
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

  // ==========================================
  // DINERO
  // ==========================================

  const dinero = (
    valor
  ) => {
    const numero =
      Number(
        valor || 0
      );

    if (
      numero < 0
    ) {
      return `-$${Math.abs(
        numero
      ).toFixed(2)}`;
    }

    return `$${numero.toFixed(
      2
    )}`;
  };

  // ==========================================
  // ENTREGAS DE CLIENTES
  // ==========================================

  const entregasClientes =
    useMemo(() => {
      return entregas.filter(
        (entrega) =>
          entrega.clienteId !==
            null &&
          entrega.clienteId !==
            undefined
      );
    }, [
      entregas,
    ]);

  // ==========================================
  // RESUMEN GENERAL
  // ==========================================

  const resumenGeneral =
    useMemo(() => {
      const totalClientes =
        clientes.length;

      const totalEntregas =
        entregasClientes.length;

      const totalAbonado =
        entregasClientes.reduce(
          (
            total,
            entrega
          ) =>
            total +
            Number(
              entrega.abona ||
                0
            ),
          0
        );

      const totalPendiente =
        entregasClientes.reduce(
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

      return {
        totalClientes,
        totalEntregas,
        totalAbonado,
        totalPendiente,
      };
    }, [
      clientes,
      entregasClientes,
    ]);

  // ==========================================
  // INFORMACIÓN DE CADA CLIENTE
  // ==========================================

  const clientesConDatos =
    useMemo(() => {
      return clientes.map(
        (cliente) => {
          const historial =
            entregasClientes.filter(
              (entrega) =>
                String(
                  entrega.clienteId
                ) ===
                String(
                  cliente.id
                )
            );

          const numeroEntregas =
            historial.length;

          const totalAbonado =
            historial.reduce(
              (
                total,
                entrega
              ) =>
                total +
                Number(
                  entrega.abona ||
                    0
                ),
              0
            );

          const saldoPendiente =
            historial.reduce(
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

          const totalEntregado =
            totalAbonado +
            saldoPendiente;

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

            numeroEntregas,

            totalAbonado,

            saldoPendiente,

            totalEntregado,
          };
        }
      );
    }, [
      clientes,
      entregasClientes,
    ]);

  // ==========================================
  // RANKING
  // ==========================================

  const ranking =
    useMemo(() => {
      return [
        ...clientesConDatos,
      ].sort(
        (
          a,
          b
        ) => {
          // 1. MÁS ENTREGAS

          if (
            b.numeroEntregas !==
            a.numeroEntregas
          ) {
            return (
              b.numeroEntregas -
              a.numeroEntregas
            );
          }

          // 2. MÁS ABONADO

          if (
            b.totalAbonado !==
            a.totalAbonado
          ) {
            return (
              b.totalAbonado -
              a.totalAbonado
            );
          }

          // 3. MENOS SALDO

          if (
            a.saldoPendiente !==
            b.saldoPendiente
          ) {
            return (
              a.saldoPendiente -
              b.saldoPendiente
            );
          }

          // 4. NOMBRE

          return a.nombreMostrar.localeCompare(
            b.nombreMostrar
          );
        }
      );
    }, [
      clientesConDatos,
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
  // POSICIÓN DEL RANKING
  // ==========================================

  const obtenerPosicion = (
    clienteId
  ) => {
    const posicion =
      ranking.findIndex(
        (cliente) =>
          String(
            cliente.id
          ) ===
          String(
            clienteId
          )
      );

    return posicion + 1;
  };

  // ==========================================
  // ICONO DEL RANKING
  // ==========================================

  const obtenerRankingTexto = (
    posicion
  ) => {
    if (
      posicion === 1
    ) {
      return '🥇';
    }

    if (
      posicion === 2
    ) {
      return '🥈';
    }

    if (
      posicion === 3
    ) {
      return '🥉';
    }

    return `#${posicion}`;
  };

  // ==========================================
  // VER HISTORIAL
  // ==========================================

  const verHistorial = (
    cliente
  ) => {
    navigation.navigate(
      'ClienteDetalle',
      {
        cliente,
      }
    );
  };

  // ==========================================
  // TARJETA CLIENTE
  // ==========================================

  const renderCliente = ({
    item,
  }) => {
    const posicion =
      obtenerPosicion(
        item.id
      );

    return (
      <View
        style={
          styles.tarjetaCliente
        }
      >
        {/* CABECERA */}

        <View
          style={
            styles.clienteCabecera
          }
        >
          <View
            style={
              styles.avatar
            }
          >
            <Ionicons
              name="person-outline"
              size={23}
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
                  styles.rankingTexto
                }
              >
                {obtenerRankingTexto(
                  posicion
                )}
              </Text>

              <Text
                style={
                  styles.nombreCliente
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

          <View
            style={
              styles.entregasBadge
            }
          >
            <Text
              style={
                styles.entregasNumero
              }
            >
              {
                item.numeroEntregas
              }
            </Text>

            <Text
              style={
                styles.entregasTexto
              }
            >
              entregas
            </Text>
          </View>
        </View>

        {/* DATOS */}

        <View
          style={
            styles.separador
          }
        />

        <View
          style={
            styles.resumenCliente
          }
        >
          <View
            style={
              styles.columnaCliente
            }
          >
            <Text
              style={
                styles.labelCliente
              }
            >
              Entregado
            </Text>

            <Text
              style={
                styles.valorEntregado
              }
            >
              {dinero(
                item.totalEntregado
              )}
            </Text>
          </View>

          <View
            style={
              styles.columnaCliente
            }
          >
            <Text
              style={
                styles.labelCliente
              }
            >
              Abonado
            </Text>

            <Text
              style={
                styles.valorAbonado
              }
            >
              {dinero(
                item.totalAbonado
              )}
            </Text>
          </View>

          <View
            style={
              styles.columnaCliente
            }
          >
            <Text
              style={
                styles.labelCliente
              }
            >
              Pendiente
            </Text>

            <Text
              style={[
                styles.valorPendiente,

                item.saldoPendiente <=
                  0 &&
                  styles.valorSinPendiente,
              ]}
            >
              {dinero(
                item.saldoPendiente
              )}
            </Text>
          </View>
        </View>

        {/* HISTORIAL */}

        <TouchableOpacity
          style={
            styles.historialBoton
          }
          activeOpacity={
            0.7
          }
          onPress={() =>
            verHistorial(
              item
            )
          }
        >
          <Text
            style={
              styles.historialTexto
            }
          >
            Ver historial de entregas
          </Text>

          <Ionicons
            name="chevron-forward"
            size={18}
            color="#08752F"
          />
        </TouchableOpacity>
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

      {/* HEADER */}

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
            Clientes y Entregas
          </Text>

          <Text
            style={
              styles.subtituloHeader
            }
          >
            Resumen general de clientes
          </Text>
        </View>

        <BotonHome navigation={navigation} />
      </View>

      <FlatList
        data={
          clientesFiltrados
        }
        keyExtractor={(
          item
        ) =>
          String(
            item.id
          )
        }
        renderItem={
          renderCliente
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.lista
        }
        ListHeaderComponent={
          <>
            {/* ===================================
                RESUMEN GENERAL
            =================================== */}

            <View
              style={
                styles.resumenGeneral
              }
            >
              <View
                style={
                  styles.filaResumen
                }
              >
                <View
                  style={
                    styles.resumenItem
                  }
                >
                  <Text
                    style={
                      styles.resumenTitulo
                    }
                  >
                    Clientes
                  </Text>

                  <Text
                    style={
                      styles.resumenNumero
                    }
                  >
                    {
                      resumenGeneral.totalClientes
                    }
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
                      styles.resumenTitulo
                    }
                  >
                    Entregas
                  </Text>

                  <Text
                    style={
                      styles.resumenNumero
                    }
                  >
                    {
                      resumenGeneral.totalEntregas
                    }
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.divisorHorizontal
                }
              />

              <View
                style={
                  styles.filaResumen
                }
              >
                <View
                  style={
                    styles.resumenItem
                  }
                >
                  <Text
                    style={
                      styles.resumenTitulo
                    }
                  >
                    Total abonado
                  </Text>

                  <Text
                    style={
                      styles.totalAbonado
                    }
                  >
                    {dinero(
                      resumenGeneral.totalAbonado
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.resumenItemDerecha
                  }
                >
                  <Text
                    style={
                      styles.resumenTitulo
                    }
                  >
                    Saldo pendiente
                  </Text>

                  <Text
                    style={[
                      styles.totalPendiente,

                      resumenGeneral.totalPendiente <=
                        0 &&
                        styles.totalSinPendiente,
                    ]}
                  >
                    {dinero(
                      resumenGeneral.totalPendiente
                    )}
                  </Text>
                </View>
              </View>
            </View>

            {/* ===================================
                BUSCADOR
            =================================== */}

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

            {/* ===================================
                TÍTULO RANKING
            =================================== */}

            {ranking.length >
              0 && (
              <View
                style={
                  styles.rankingTituloContainer
                }
              >
                <Ionicons
                  name="trophy-outline"
                  size={20}
                  color="#08752F"
                />

                <Text
                  style={
                    styles.rankingTitulo
                  }
                >
                  Ranking de clientes
                </Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View
            style={
              styles.vacio
            }
          >
            <Ionicons
              name="people-outline"
              size={55}
              color="#BBBBBB"
            />

            <Text
              style={
                styles.vacioTitulo
              }
            >
              No se encontraron clientes
            </Text>

            <Text
              style={
                styles.vacioTexto
              }
            >
              Los clientes registrados aparecerán aquí.
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
      paddingHorizontal: 16,
      paddingTop: 13,
      paddingBottom: 35,
    },

    // ========================================
    // RESUMEN GENERAL
    // ========================================

    resumenGeneral: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      paddingHorizontal: 12,
      paddingVertical: 12,

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

    filaResumen: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    resumenItem: {
      flex: 1,
    },

    resumenItemDerecha: {
      flex: 1,
      alignItems:
        'flex-end',
    },

    resumenTitulo: {
      fontSize: 10,
      color:
        '#8A8A8A',
    },

    resumenNumero: {
      fontSize: 18,
      fontWeight:
        '800',
      color:
        '#08752F',
      marginTop: 2,
    },

    totalAbonado: {
      fontSize: 17,
      fontWeight:
        '800',
      color:
        '#08752F',
      marginTop: 3,
    },

    totalPendiente: {
      fontSize: 17,
      fontWeight:
        '800',
      color:
        '#D71920',
      marginTop: 3,
    },

    totalSinPendiente: {
      color:
        '#08752F',
    },

    divisorVertical: {
      width: 1,
      height: 38,
      backgroundColor:
        '#E8E8E8',
      marginHorizontal: 10,
    },

    divisorHorizontal: {
      height: 1,
      backgroundColor:
        '#E8E8E8',
      marginVertical: 10,
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
      marginTop: 12,
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

    rankingTituloContainer: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 7,
      marginTop: 16,
      marginBottom: 8,
    },

    rankingTitulo: {
      fontSize: 14,
      fontWeight:
        '700',
      color:
        '#333333',
    },

    // ========================================
    // TARJETA CLIENTE
    // ========================================

    tarjetaCliente: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      marginBottom: 12,
      paddingHorizontal: 11,
      paddingTop: 12,

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

    clienteCabecera: {
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
        '#E7F5EB',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    infoCliente: {
      flex: 1,
      marginLeft: 10,
    },

    nombreFila: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    rankingTexto: {
      fontSize: 15,
      fontWeight:
        '800',
      marginRight: 6,
    },

    nombreCliente: {
      flex: 1,
      fontSize: 13,
      fontWeight:
        '700',
      color:
        '#292929',
    },

    telefono: {
      fontSize: 10,
      color:
        '#888888',
      marginTop: 2,
    },

    entregasBadge: {
      minWidth: 57,
      minHeight: 41,
      borderRadius: 20,
      backgroundColor:
        '#EAF7ED',
      alignItems:
        'center',
      justifyContent:
        'center',
      paddingHorizontal: 9,
    },

    entregasNumero: {
      fontSize: 13,
      fontWeight:
        '800',
      color:
        '#08752F',
    },

    entregasTexto: {
      fontSize: 8,
      color:
        '#08752F',
    },

    separador: {
      height: 1,
      backgroundColor:
        '#EEEEEE',
      marginTop: 11,
    },

    // ========================================
    // RESUMEN CLIENTE
    // ========================================

    resumenCliente: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      paddingVertical: 11,
    },

    columnaCliente: {
      flex: 1,
    },

    labelCliente: {
      fontSize: 9,
      color:
        '#999999',
    },

    valorEntregado: {
      fontSize: 12,
      fontWeight:
        '700',
      color:
        '#333333',
      marginTop: 3,
    },

    valorAbonado: {
      fontSize: 12,
      fontWeight:
        '700',
      color:
        '#08752F',
      marginTop: 3,
    },

    valorPendiente: {
      fontSize: 12,
      fontWeight:
        '700',
      color:
        '#D71920',
      marginTop: 3,
    },

    valorSinPendiente: {
      color:
        '#08752F',
    },

    // ========================================
    // HISTORIAL
    // ========================================

    historialBoton: {
      minHeight: 39,
      borderTopWidth: 1,
      borderTopColor:
        '#EEEEEE',
      flexDirection:
        'row',
      justifyContent:
        'flex-end',
      alignItems:
        'center',
      gap: 3,
    },

    historialTexto: {
      fontSize: 10,
      fontWeight:
        '700',
      color:
        '#08752F',
    },

    // ========================================
    // VACÍO
    // ========================================

    vacio: {
      alignItems:
        'center',
      paddingTop: 55,
    },

    vacioTitulo: {
      fontSize: 15,
      fontWeight:
        '700',
      color:
        '#555555',
      marginTop: 12,
    },

    vacioTexto: {
      fontSize: 11,
      color:
        '#999999',
      marginTop: 4,
      textAlign:
        'center',
    },
  });