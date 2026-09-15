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

import { useEntregas } from '../context/EntregasContext';
import { useProductos } from '../context/ProductosContext';

export default function ProductosVendidosScreen({
  navigation,
}) {
  const { entregas } =
    useEntregas();

  const { productos } =
  useProductos();

  const [
    busqueda,
    setBusqueda,
  ] = useState('');

  // ==========================================
  // FORMATO DE DINERO
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
  // AGRUPAR PRODUCTOS VENDIDOS
  // ==========================================

  const productosVendidos =
    useMemo(() => {
      const mapa =
        {};

      entregas.forEach(
        (entrega) => {
          const productos =
            Array.isArray(
              entrega.productos
            )
              ? entrega.productos
              : [];

          productos.forEach(
            (producto) => {
              const id =
                producto.id ||
                producto.productoId ||
                producto.nombre;

              const nombre =
                producto.nombre ||
                'Producto';

              const cantidad =
                Number(
                  producto.cantidad ||
                    0
                );

              const precio =
                Number(
                  String(
                    producto.precio ||
                      0
                  ).replace(
                    ',',
                    '.'
                  )
                );

              const totalProducto =
                cantidad *
                precio;

              if (
                !mapa[id]
              ) {
                mapa[id] = {
                  id,
                  nombre,

                  totalGenerado:
                    0,

                  cantidadEntregas:
                    0,

                  cantidadVendida:
                    0,
                };
              }

              mapa[id].totalGenerado +=
                totalProducto;

              mapa[id].cantidadVendida +=
                cantidad;

              mapa[id].cantidadEntregas +=
                1;
            }
          );
        }
      );

      return Object.values(
        mapa
      );
    }, [
      entregas,
    ]);

  // ==========================================
  // RANKING
  // ==========================================

  const ranking =
    useMemo(() => {
      return [
        ...productosVendidos,
      ].sort(
        (
          a,
          b
        ) => {
          // 1. MAYOR DINERO GENERADO

          if (
            b.totalGenerado !==
            a.totalGenerado
          ) {
            return (
              b.totalGenerado -
              a.totalGenerado
            );
          }

          // 2. MÁS ENTREGAS

          if (
            b.cantidadEntregas !==
            a.cantidadEntregas
          ) {
            return (
              b.cantidadEntregas -
              a.cantidadEntregas
            );
          }

          // 3. NOMBRE

          return a.nombre.localeCompare(
            b.nombre
          );
        }
      );
    }, [
      productosVendidos,
    ]);

  // ==========================================
  // TOTAL GENERADO
  // ==========================================

  const totalGenerado =
    useMemo(() => {
      return productosVendidos.reduce(
        (
          total,
          producto
        ) =>
          total +
          Number(
            producto.totalGenerado ||
              0
          ),
        0
      );
    }, [
      productosVendidos,
    ]);

  // ==========================================
  // PRODUCTOS DISTINTOS
  // ==========================================

  const totalProductos =
    productos.length;

  // ==========================================
  // BUSCADOR
  // ==========================================

  const productosFiltrados =
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
        (producto) =>
          producto.nombre
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
  // POSICIÓN
  // ==========================================

  const obtenerPosicion = (
    productoId
  ) => {
    const posicion =
      ranking.findIndex(
        (producto) =>
          String(
            producto.id
          ) ===
          String(
            productoId
          )
      );

    return posicion + 1;
  };

  // ==========================================
  // TEXTO DEL RANKING
  // ==========================================

  const obtenerRanking = (
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
  // TARJETA PRODUCTO
  // ==========================================

  const renderProducto = ({
    item,
  }) => {
    const posicion =
      obtenerPosicion(
        item.id
      );

    return (
      <View
        style={
          styles.tarjetaProducto
        }
      >
        <View
          style={
            styles.rankingContainer
          }
        >
          <Text
            style={
              styles.rankingTexto
            }
          >
            {obtenerRanking(
              posicion
            )}
          </Text>
        </View>

        <View
          style={
            styles.iconoProducto
          }
        >
          <Ionicons
            name="cube-outline"
            size={23}
            color="#08752F"
          />
        </View>

        <View
          style={
            styles.infoProducto
          }
        >
          <Text
            style={
              styles.nombreProducto
            }
            numberOfLines={
              1
            }
          >
            {item.nombre}
          </Text>

          <View
            style={
              styles.entregasFila
            }
          >
            <Ionicons
              name="receipt-outline"
              size={13}
              color="#777777"
            />

            <Text
              style={
                styles.entregasTexto
              }
            >
              {
                item.cantidadEntregas
              }{' '}
              {item.cantidadEntregas ===
              1
                ? 'entrega registrada'
                : 'entregas registradas'}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.totalContainer
          }
        >
          <Text
            style={
              styles.totalLabel
            }
          >
            Total generado
          </Text>

          <Text
            style={
              styles.totalValor
            }
          >
            {dinero(
              item.totalGenerado
            )}
          </Text>
        </View>
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
            Productos vendidos
          </Text>

          <Text
            style={
              styles.subtituloHeader
            }
          >
            Productos entregados
          </Text>
        </View>
      </View>

      <FlatList
        data={
          productosFiltrados
        }
        renderItem={
          renderProducto
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
                RESUMEN
            ================================= */}

            <View
              style={
                styles.resumen
              }
            >
              <View
                style={
                  styles.resumenIzquierda
                }
              >
                <View
                  style={
                    styles.iconoResumen
                  }
                >
                  <Ionicons
                    name="cube-outline"
                    size={23}
                    color="#08752F"
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.resumenLabel
                    }
                  >
                    Productos
                  </Text>

                  <Text
                    style={
                      styles.resumenNumero
                    }
                  >
                    {
                      totalProductos
                    }
                  </Text>
                </View>
              </View>
            </View>

            {/* =================================
                TOTAL GENERADO
            ================================= */}

            <View
              style={
                styles.totalGeneral
              }
            >
              <View>
                <Text
                  style={
                    styles.totalGeneralTitulo
                  }
                >
                  Total generado
                </Text>

                <Text
                  style={
                    styles.totalGeneralSubtitulo
                  }
                >
                  Valor total de productos entregados
                </Text>
              </View>

              <Text
                style={
                  styles.totalGeneralValor
                }
              >
                {dinero(
                  totalGenerado
                )}
              </Text>
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
                placeholder="Buscar producto..."
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
                  Ranking de productos
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
              name="cube-outline"
              size={58}
              color="#BBBBBB"
            />

            <Text
              style={
                styles.vacioTitulo
              }
            >
              No hay productos vendidos
            </Text>

            <Text
              style={
                styles.vacioTexto
              }
            >
              Los productos utilizados en las entregas aparecerán aquí.
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
    // RESUMEN
    // ========================================

    resumen: {
      minHeight: 76,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      borderRadius: 12,
      paddingHorizontal: 14,
      justifyContent:
        'center',

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

    resumenIzquierda: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    iconoResumen: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor:
        '#E8F6EC',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginRight: 11,
    },

    resumenLabel: {
      fontSize: 10,
      color:
        '#888888',
    },

    resumenNumero: {
      fontSize: 20,
      fontWeight:
        '800',
      color:
        '#08752F',
      marginTop: 2,
    },

    // ========================================
    // TOTAL GENERAL
    // ========================================

    totalGeneral: {
      minHeight: 56,
      borderRadius: 10,
      backgroundColor:
        '#E8F6EC',
      marginTop: 10,
      paddingHorizontal: 12,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    totalGeneralTitulo: {
      fontSize: 12,
      fontWeight:
        '700',
      color:
        '#08752F',
    },

    totalGeneralSubtitulo: {
      fontSize: 8,
      color:
        '#777777',
      marginTop: 2,
    },

    totalGeneralValor: {
      fontSize: 18,
      fontWeight:
        '800',
      color:
        '#08752F',
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
    // TARJETA PRODUCTO
    // ========================================

    tarjetaProducto: {
      minHeight: 75,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      borderRadius: 12,
      marginBottom: 10,
      paddingHorizontal: 10,
      flexDirection:
        'row',
      alignItems:
        'center',

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

    rankingContainer: {
      width: 31,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    rankingTexto: {
      fontSize: 15,
      fontWeight:
        '800',
    },

    iconoProducto: {
      width: 42,
      height: 42,
      borderRadius: 11,
      backgroundColor:
        '#E8F6EC',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginRight: 9,
    },

    infoProducto: {
      flex: 1,
    },

    nombreProducto: {
      fontSize: 12,
      fontWeight:
        '700',
      color:
        '#292929',
    },

    entregasFila: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 4,
      marginTop: 5,
    },

    entregasTexto: {
      fontSize: 9,
      color:
        '#777777',
    },

    // ========================================
    // TOTAL PRODUCTO
    // ========================================

    totalContainer: {
      alignItems:
        'flex-end',
      marginLeft: 8,
    },

    totalLabel: {
      fontSize: 8,
      color:
        '#999999',
    },

    totalValor: {
      fontSize: 13,
      fontWeight:
        '800',
      color:
        '#08752F',
      marginTop: 3,
    },

    // ========================================
    // VACÍO
    // ========================================

    vacio: {
      alignItems:
        'center',
      paddingTop: 60,
      paddingHorizontal: 30,
    },

    vacioTitulo: {
      fontSize: 15,
      fontWeight:
        '700',
      color:
        '#444444',
      marginTop: 10,
    },

    vacioTexto: {
      fontSize: 11,
      color:
        '#888888',
      textAlign:
        'center',
      marginTop: 4,
    },
  });