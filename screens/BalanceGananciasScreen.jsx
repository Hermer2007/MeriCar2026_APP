import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEntregas } from '../context/EntregasContext';
import { useProductos } from '../context/ProductosContext';
import BotonHome from '../components/BotonHome';

export default function BalanceGananciasScreen({
  navigation,
}) {
  const { entregas } = useEntregas();
  const { productos } = useProductos();

  const insets = useSafeAreaInsets();

  // ==========================================
  // FECHA ACTUAL
  // ==========================================

  const obtenerFechaActual = () => {
    const ahora = new Date();

    const dia = String(
      ahora.getDate()
    ).padStart(2, '0');

    const mes = String(
      ahora.getMonth() + 1
    ).padStart(2, '0');

    const anio =
      ahora.getFullYear();

    return `${dia}/${mes}/${anio}`;
  };

  const [
    fechaActual,
    setFechaActual,
  ] = useState(
    obtenerFechaActual()
  );

  // ==========================================
  // ACTUALIZAR FECHA AUTOMÁTICAMENTE
  // ==========================================

  useEffect(() => {
    const intervalo =
      setInterval(() => {
        setFechaActual(
          obtenerFechaActual()
        );
      }, 60000);

    return () =>
      clearInterval(intervalo);
  }, []);

  // ==========================================
  // CONVERTIR A CENTAVOS
  // ==========================================

  const aCentavos = (valor) => {
    return Math.round(
      (Number(valor) || 0) * 100
    );
  };

  // ==========================================
  // PRODUCTOS VENDIDOS HOY
  // ==========================================

  const productosVendidos =
    useMemo(() => {
      const agrupados = {};

      const entregasHoy =
        (entregas || []).filter(
          (entrega) =>
            entrega.fecha ===
            fechaActual
        );

      entregasHoy.forEach(
        (entrega) => {
          const productosEntrega =
            Array.isArray(
              entrega.productos
            )
              ? entrega.productos
              : [];

          productosEntrega.forEach(
            (productoEntrega) => {
              const cantidad =
                Number(
                  productoEntrega.cantidad
                ) || 0;

              const precioVenta =
                Number(
                  productoEntrega.precio
                ) || 0;

              if (cantidad <= 0) {
                return;
              }

              const productoCatalogo =
                (productos || []).find(
                  (producto) =>
                    String(
                      producto.id
                    ) ===
                    String(
                      productoEntrega.id
                    )
                );

              const precioCompra =
                Number(
                  productoCatalogo
                    ?.precioCompra
                ) || 0;

              const clave =
                String(
                  productoEntrega.id ||
                    productoEntrega.nombre
                );

              if (!agrupados[clave]) {
                agrupados[clave] = {
                  id: clave,

                  nombre:
                    productoEntrega.nombre ||
                    productoCatalogo
                      ?.nombre ||
                    'Producto',

                  cantidad: 0,

                  totalVendidoCentavos:
                    0,

                  costoCompraCentavos:
                    0,
                };
              }

              agrupados[
                clave
              ].cantidad +=
                cantidad;

              agrupados[
                clave
              ].totalVendidoCentavos +=
                cantidad *
                aCentavos(
                  precioVenta
                );

              agrupados[
                clave
              ].costoCompraCentavos +=
                cantidad *
                aCentavos(
                  precioCompra
                );
            }
          );
        }
      );

      return Object.values(
        agrupados
      )
        .map((producto) => {
          const gananciaCentavos =
            producto.totalVendidoCentavos -
            producto.costoCompraCentavos;

          return {
            ...producto,

            totalVendido:
              producto.totalVendidoCentavos /
              100,

            costoCompra:
              producto.costoCompraCentavos /
              100,

            ganancia:
              gananciaCentavos /
              100,

            gananciaCentavos,
          };
        })
        .sort(
          (a, b) =>
            b.gananciaCentavos -
            a.gananciaCentavos
        );
    }, [
      entregas,
      productos,
      fechaActual,
    ]);

  // ==========================================
  // GANANCIA TOTAL
  // ==========================================

  const gananciaTotalCentavos =
    productosVendidos.reduce(
      (
        acumulado,
        producto
      ) =>
        acumulado +
        producto.gananciaCentavos,
      0
    );

  const gananciaTotal =
    gananciaTotalCentavos / 100;

  // ==========================================
  // FORMATEAR DINERO
  // ==========================================

  const dinero = (valor) => {
    const numero =
      Number(valor || 0);

    if (numero < 0) {
      return `-$${Math.abs(
        numero
      ).toFixed(2)}`;
    }

    return `$${numero.toFixed(
      2
    )}`;
  };

  // ==========================================
  // PANTALLA
  // ==========================================

  return (
    <View
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#08752F"
      />

      {/* HEADER */}

      <View
        style={styles.header}
      >
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
            Balance de ganancias
          </Text>

          <Text
            style={
              styles.subtituloHeader
            }
          >
            Ingresos personales del día
          </Text>
        </View>

        <BotonHome
          navigation={navigation}
        />
      </View>

      {/* CONTENIDO */}

      <ScrollView
        contentContainerStyle={[
          styles.contenido,
          {
            paddingBottom:
              35 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* RESUMEN PRINCIPAL */}

        <View
          style={
            styles.resumenPrincipal
          }
        >
          <View
            style={
              styles.fechaFila
            }
          >
            <View
              style={
                styles.iconoFecha
              }
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#08752F"
              />
            </View>

            <Text
              style={
                styles.fechaTexto
              }
            >
              {fechaActual}
            </Text>
          </View>

          <View
            style={
              styles.separadorResumen
            }
          />

          <View
            style={
              styles.gananciaPrincipalFila
            }
          >
            <View
              style={
                styles.iconoGanancia
              }
            >
              <Ionicons
                name="trending-up-outline"
                size={25}
                color="#08752F"
              />
            </View>

            <View
              style={
                styles.gananciaPrincipalInfo
              }
            >
              <Text
                style={
                  styles.gananciaPrincipalLabel
                }
              >
                Ganancia total generada:
              </Text>

              <Text
                style={
                  styles.gananciaPrincipalAyuda
                }
              >
                Suma de las ganancias de
                cada producto
              </Text>
            </View>

            <Text
              style={[
                styles.gananciaPrincipalValor,

                gananciaTotal < 0 &&
                  styles.gananciaNegativa,
              ]}
            >
              {dinero(
                gananciaTotal
              )}
            </Text>
          </View>
        </View>

        {/* TÍTULO PRODUCTOS */}

        <View
          style={
            styles.tituloProductosFila
          }
        >
          <View
            style={
              styles.iconoTituloProductos
            }
          >
            <Ionicons
              name="cube-outline"
              size={20}
              color="#08752F"
            />
          </View>

          <Text
            style={
              styles.tituloProductos
            }
          >
            Productos vendidos
          </Text>
        </View>

        {/* PRODUCTOS */}

        {productosVendidos.length >
        0 ? (
          productosVendidos.map(
            (producto) => (
              <View
                key={producto.id}
                style={
                  styles.tarjetaProducto
                }
              >
                {/* PRODUCTO */}

                <View
                  style={
                    styles.productoEncabezado
                  }
                >
                  <View
                    style={
                      styles.productoIcono
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
                      styles.productoInfo
                    }
                  >
                    <Text
                      style={
                        styles.productoNombre
                      }
                    >
                      {
                        producto.nombre
                      }
                    </Text>

                    <Text
                      style={
                        styles.productoCantidad
                      }
                    >
                      Cantidad vendida:{' '}
                      {producto.cantidad}
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.linea
                  }
                />

                {/* TOTAL VENDIDO */}

                <View
                  style={
                    styles.datoFila
                  }
                >
                  <View
                    style={
                      styles.datoIzquierda
                    }
                  >
                    <View
                      style={
                        styles.datoIcono
                      }
                    >
                      <Ionicons
                        name="cash-outline"
                        size={19}
                        color="#08752F"
                      />
                    </View>

                    <Text
                      style={
                        styles.datoLabel
                      }
                    >
                      Total vendido
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.datoValor
                    }
                  >
                    {dinero(
                      producto.totalVendido
                    )}
                  </Text>
                </View>

                {/* COSTO COMPRA */}

                <View
                  style={
                    styles.datoFila
                  }
                >
                  <View
                    style={
                      styles.datoIzquierda
                    }
                  >
                    <View
                      style={
                        styles.datoIcono
                      }
                    >
                      <Ionicons
                        name="cart-outline"
                        size={19}
                        color="#666666"
                      />
                    </View>

                    <Text
                      style={
                        styles.datoLabel
                      }
                    >
                      Costo de compra
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.costoValor
                    }
                  >
                    {dinero(
                      producto.costoCompra
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.lineaGanancia
                  }
                />

                {/* GANANCIA */}

                <View
                  style={
                    styles.gananciaFila
                  }
                >
                  <View
                    style={
                      styles.gananciaIzquierda
                    }
                  >
                    <View
                      style={
                        styles.gananciaIconoProducto
                      }
                    >
                      <Ionicons
                        name="trending-up-outline"
                        size={21}
                        color={
                          producto.ganancia <
                          0
                            ? '#D71920'
                            : '#08752F'
                        }
                      />
                    </View>

                    <Text
                      style={
                        styles.gananciaLabel
                      }
                    >
                      Ganancia
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.gananciaValor,

                      producto.ganancia <
                        0 &&
                        styles.gananciaNegativa,
                    ]}
                  >
                    {dinero(
                      producto.ganancia
                    )}
                  </Text>
                </View>
              </View>
            )
          )
        ) : (
          /* SIN VENTAS */

          <View
            style={
              styles.sinVentas
            }
          >
            <View
              style={
                styles.sinVentasIcono
              }
            >
              <Ionicons
                name="bar-chart-outline"
                size={45}
                color="#A9A9A9"
              />
            </View>

            <Text
              style={
                styles.sinVentasTitulo
              }
            >
              Sin ventas registradas
            </Text>

            <Text
              style={
                styles.sinVentasTexto
              }
            >
              Las ganancias aparecerán
              cuando se registren productos
              vendidos durante el día.
            </Text>
          </View>
        )}
      </ScrollView>
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
      position: 'absolute',
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
      fontSize: 21,
      fontWeight:
        '700',
      textAlign:
        'center',
    },

    subtituloHeader: {
      color:
        '#DDEEE2',
      fontSize: 11,
      marginTop: 2,
    },

    // ========================================
    // CONTENIDO
    // ========================================

    contenido: {
      paddingHorizontal: 18,
      paddingTop: 17,
    },

    // ========================================
    // RESUMEN PRINCIPAL
    // ========================================

    resumenPrincipal: {
      backgroundColor:
        '#F0F8F2',
      borderWidth: 1,
      borderColor:
        '#BFDCC7',
      borderRadius: 13,
      padding: 15,
    },

    fechaFila: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    iconoFecha: {
      width: 35,
      height: 35,
      borderRadius: 18,
      backgroundColor:
        '#DDF0E2',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    fechaTexto: {
      marginLeft: 9,
      fontSize: 14,
      fontWeight:
        '700',
      color:
        '#08752F',
    },

    separadorResumen: {
      height: 1,
      backgroundColor:
        '#D7E8DC',
      marginVertical: 13,
    },

    gananciaPrincipalFila: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    iconoGanancia: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        '#DDF0E2',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    gananciaPrincipalInfo: {
      flex: 1,
      marginLeft: 10,
      marginRight: 8,
    },

    gananciaPrincipalLabel: {
      fontSize: 12,
      fontWeight:
        '700',
      color:
        '#333333',
    },

    gananciaPrincipalAyuda: {
      fontSize: 9,
      color:
        '#777777',
      marginTop: 3,
      lineHeight: 13,
    },

    gananciaPrincipalValor: {
      fontSize: 22,
      fontWeight:
        '800',
      color:
        '#08752F',
      textAlign:
        'right',
    },

    gananciaNegativa: {
      color:
        '#D71920',
    },

    // ========================================
    // TÍTULO PRODUCTOS
    // ========================================

    tituloProductosFila: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 10,
    },

    iconoTituloProductos: {
      width: 35,
      height: 35,
      borderRadius: 18,
      backgroundColor:
        '#E6F6EB',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    tituloProductos: {
      marginLeft: 9,
      fontSize: 15,
      fontWeight:
        '700',
      color:
        '#292929',
    },

    // ========================================
    // TARJETA PRODUCTO
    // ========================================

    tarjetaProducto: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      borderRadius: 13,
      padding: 14,
      marginBottom: 11,

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

    productoEncabezado: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    productoIcono: {
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor:
        '#E6F6EB',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    productoInfo: {
      flex: 1,
      marginLeft: 11,
    },

    productoNombre: {
      fontSize: 14,
      fontWeight:
        '700',
      color:
        '#292929',
    },

    productoCantidad: {
      fontSize: 10,
      color:
        '#777777',
      marginTop: 3,
    },

    linea: {
      height: 1,
      backgroundColor:
        '#EEEEEE',
      marginVertical: 12,
    },

    // ========================================
    // DATOS
    // ========================================

    datoFila: {
      minHeight: 36,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    datoIzquierda: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    datoIcono: {
      width: 29,
      alignItems:
        'center',
    },

    datoLabel: {
      fontSize: 11,
      color:
        '#555555',
      marginLeft: 4,
    },

    datoValor: {
      fontSize: 13,
      fontWeight:
        '700',
      color:
        '#08752F',
    },

    costoValor: {
      fontSize: 13,
      fontWeight:
        '700',
      color:
        '#555555',
    },

    // ========================================
    // GANANCIA PRODUCTO
    // ========================================

    lineaGanancia: {
      height: 1,
      backgroundColor:
        '#E6E6E6',
      marginTop: 8,
      marginBottom: 10,
    },

    gananciaFila: {
      minHeight: 39,
      backgroundColor:
        '#F5FAF6',
      borderRadius: 8,
      paddingHorizontal: 9,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    gananciaIzquierda: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    gananciaIconoProducto: {
      width: 29,
      alignItems:
        'center',
    },

    gananciaLabel: {
      marginLeft: 4,
      fontSize: 12,
      fontWeight:
        '700',
      color:
        '#333333',
    },

    gananciaValor: {
      fontSize: 17,
      fontWeight:
        '800',
      color:
        '#08752F',
    },

    // ========================================
    // SIN VENTAS
    // ========================================

    sinVentas: {
      minHeight: 230,
      justifyContent:
        'center',
      alignItems:
        'center',
      paddingHorizontal: 30,
    },

    sinVentasIcono: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor:
        '#EFEFEF',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    sinVentasTitulo: {
      marginTop: 15,
      fontSize: 16,
      fontWeight:
        '700',
      color:
        '#555555',
    },

    sinVentasTexto: {
      marginTop: 6,
      fontSize: 11,
      lineHeight: 17,
      textAlign:
        'center',
      color:
        '#888888',
    },
  });