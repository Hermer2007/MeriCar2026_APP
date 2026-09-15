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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useProductos } from '../context/ProductosContext';
import { useEntregas } from '../context/EntregasContext';
import { useToast } from '../context/ToastContext';

export default function NuevaEntregaScreen({
  navigation,
  route,
}) {
  const { productos } =
    useProductos();

  const { agregarEntrega } =
    useEntregas();

  const { mostrarToast } =
    useToast();

  const cliente =
    route.params?.cliente;

  // ==========================================
  // CLIENTE
  // ==========================================

  const nombreCliente =
    cliente?.nombre ||
    `${cliente?.nombres || ''} ${
      cliente?.apellidos || ''
    }`.trim() ||
    'Cliente';

  // ==========================================
  // FECHA Y HORA
  // ==========================================

  const obtenerFechaHora = () => {
    const ahora = new Date();

    const dia = String(
      ahora.getDate()
    ).padStart(2, '0');

    const mes = String(
      ahora.getMonth() + 1
    ).padStart(2, '0');

    const anio =
      ahora.getFullYear();

    const hora = String(
      ahora.getHours()
    ).padStart(2, '0');

    const minutos = String(
      ahora.getMinutes()
    ).padStart(2, '0');

    const segundos = String(
      ahora.getSeconds()
    ).padStart(2, '0');

    return {
      fecha:
        `${dia}/${mes}/${anio}`,

      hora:
        `${hora}:${minutos}:${segundos}`,
    };
  };

  const [
    fechaHoraActual,
    setFechaHoraActual,
  ] = useState(
    obtenerFechaHora()
  );

  useEffect(() => {
    const intervalo =
      setInterval(() => {
        setFechaHoraActual(
          obtenerFechaHora()
        );
      }, 1000);

    return () =>
      clearInterval(
        intervalo
      );
  }, []);

  // ==========================================
  // PRODUCTOS
  // ==========================================

  const productosIniciales =
    useMemo(() => {
      return productos.map(
        (producto) => ({
          id:
            producto.id,

          nombre:
            producto.nombre,

          precioGeneral:
            Number(
              producto.precio
            ) || 0,

          precio:
            String(
              Number(
                producto.precio
              ).toFixed(2)
            ),

          cantidad: 0,
        })
      );
    }, [
      productos,
    ]);

  const [
    productosEntrega,
    setProductosEntrega,
  ] = useState(
    productosIniciales
  );

  // ==========================================
  // MÉTODOS DE PAGO
  // ==========================================

  const [
    metodosPago,
    setMetodosPago,
  ] = useState([]);

  const [
    pagoEfectivo,
    setPagoEfectivo,
  ] = useState('');

  const [
    pagoTransferencia,
    setPagoTransferencia,
  ] = useState('');

  const usaEfectivo =
    metodosPago.includes(
      'Efectivo'
    );

  const usaTransferencia =
    metodosPago.includes(
      'Transferencia'
    );

  const seleccionarMetodoPago = (
    metodo
  ) => {
    setMetodosPago(
      (actuales) => {
        if (
          actuales.includes(
            metodo
          )
        ) {
          if (
            metodo ===
            'Efectivo'
          ) {
            setPagoEfectivo(
              ''
            );
          }

          if (
            metodo ===
            'Transferencia'
          ) {
            setPagoTransferencia(
              ''
            );
          }

          return actuales.filter(
            (item) =>
              item !== metodo
          );
        }

        return [
          ...actuales,
          metodo,
        ];
      }
    );
  };

  // ==========================================
  // CANTIDAD
  // ==========================================

  const cambiarCantidad = (
    id,
    cambio
  ) => {
    setProductosEntrega(
      (actuales) =>
        actuales.map(
          (producto) => {
            if (
              producto.id !==
              id
            ) {
              return producto;
            }

            const cantidad =
              Number(
                producto.cantidad
              ) || 0;

            const nuevaCantidad =
              cantidad +
              cambio;

            return {
              ...producto,

              cantidad:
                nuevaCantidad < 0
                  ? 0
                  : nuevaCantidad,
            };
          }
        )
    );
  };

  const escribirCantidad = (
    id,
    texto
  ) => {
    const numeros =
      texto.replace(
        /[^0-9]/g,
        ''
      );

    setProductosEntrega(
      (actuales) =>
        actuales.map(
          (producto) =>
            producto.id === id
              ? {
                  ...producto,

                  cantidad:
                    numeros === ''
                      ? ''
                      : Number(
                          numeros
                        ),
                }
              : producto
        )
    );
  };

  // ==========================================
  // PRECIO
  // ==========================================

  const cambiarPrecio = (
    id,
    texto
  ) => {
    setProductosEntrega(
      (actuales) =>
        actuales.map(
          (producto) =>
            producto.id === id
              ? {
                  ...producto,
                  precio:
                    texto,
                }
              : producto
        )
    );
  };

  // ==========================================
  // TOTAL
  // ==========================================

  const total =
    productosEntrega.reduce(
      (
        acumulado,
        producto
      ) => {
        const cantidad =
          Number(
            producto.cantidad
          ) || 0;

        const precio =
          Number(
            String(
              producto.precio
            ).replace(
              ',',
              '.'
            )
          ) || 0;

        return (
          acumulado +
          cantidad *
            precio
        );
      },
      0
    );

  // ==========================================
  // PAGOS
  // ==========================================

  const efectivoNumerico =
    usaEfectivo
      ? Number(
          String(
            pagoEfectivo
          ).replace(
            ',',
            '.'
          )
        ) || 0
      : 0;

  const transferenciaNumerica =
    usaTransferencia
      ? Number(
          String(
            pagoTransferencia
          ).replace(
            ',',
            '.'
          )
        ) || 0
      : 0;

  const abonoNumerico =
    efectivoNumerico +
    transferenciaNumerica;

  const saldoPendiente =
    total -
    abonoNumerico;

  // ==========================================
  // GUARDAR
  // ==========================================

  const guardarEntrega = async () => {
      const productosSeleccionados =
        productosEntrega.filter(
          (producto) =>
            Number(
              producto.cantidad
            ) > 0
        );

      if (
        productosSeleccionados.length ===
        0
      ) {
        mostrarToast(
          'Seleccione al menos un producto.',
          'warning'
        );

        return;
      }

      const precioInvalido =
        productosSeleccionados.some(
          (producto) => {
            const precio =
              Number(
                String(
                  producto.precio
                ).replace(
                  ',',
                  '.'
                )
              );

            return (
              Number.isNaN(
                precio
              ) ||
              precio <= 0
            );
          }
        );

      if (
        precioInvalido
      ) {
        mostrarToast(
          'Revise el precio de los productos seleccionados.',
          'warning'
        );

        return;
      }

      if (
        metodosPago.length ===
        0
      ) {
        mostrarToast(
          'Seleccione al menos un método de pago.',
          'warning'
        );

        return;
      }

      // ======================================
      // NUEVA VALIDACIÓN
      // ======================================

      if (
        abonoNumerico >
        total
      ) {
        mostrarToast(
          'El abono no puede superar el total de la entrega.',
          'warning'
        );

        return;
      }

      const momentoRegistro =
        obtenerFechaHora();

      const nuevaEntrega = {
        clienteId:
          cliente?.id,

        tipo:
          'CLIENTE',

        fecha:
          momentoRegistro.fecha,

        hora:
          momentoRegistro.hora,

        productos:
          productosSeleccionados.map(
            (producto) => ({
              id:
                producto.id,

              nombre:
                producto.nombre,

              cantidad:
                Number(
                  producto.cantidad
                ),

              precio:
                Number(
                  String(
                    producto.precio
                  ).replace(
                    ',',
                    '.'
                  )
                ),
            })
          ),

        total:
          Number(
            total.toFixed(
              2
            )
          ),

        abona:
          Number(
            abonoNumerico.toFixed(
              2
            )
          ),

        saldoPendiente:
          Number(
            saldoPendiente.toFixed(
              2
            )
          ),

        metodosPago,

        pagoEfectivo:
          Number(
            efectivoNumerico.toFixed(
              2
            )
          ),

        pagoTransferencia:
          Number(
            transferenciaNumerica.toFixed(
              2
            )
          ),

        numeroEdiciones: 0,
      };

      try {
        const resultado = await agregarEntrega(
          nuevaEntrega
        );

        if (!resultado) {
          mostrarToast(
            'No se pudo registrar la entrega.',
            'error'
          );

          return;
        }

        mostrarToast(
          'Entrega registrada correctamente.',
          'success'
        );

        navigation.goBack();

      } catch (error) {

        mostrarToast(
          'No se pudo registrar la entrega.',
          'error'
        );
      }
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
            Nueva entrega
          </Text>

          <Text
            style={
              styles.subtituloHeader
            }
          >
            Cliente: {nombreCliente}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.contenido
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={
            styles.fechaContainer
          }
        >
          <View
            style={
              styles.fechaDato
            }
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color="#08752F"
            />

            <Text
              style={
                styles.fechaTexto
              }
            >
              {
                fechaHoraActual.fecha
              }
            </Text>
          </View>

          <View
            style={
              styles.fechaDato
            }
          >
            <Ionicons
              name="time-outline"
              size={20}
              color="#08752F"
            />

            <Text
              style={
                styles.fechaTexto
              }
            >
              {
                fechaHoraActual.hora
              }
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.tituloSeccion
          }
        >
          Productos
        </Text>

        <View
          style={
            styles.productosContainer
          }
        >
          {productosEntrega.map(
            (
              producto,
              index
            ) => (
              <View
                key={
                  producto.id
                }
                style={[
                  styles.productoFila,

                  index ===
                    productosEntrega.length -
                      1 &&
                    styles.ultimaFila,
                ]}
              >
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
                      styles.precioGeneral
                    }
                  >
                    Precio general: $
                    {Number(
                      producto.precioGeneral
                    ).toFixed(
                      2
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.precioContainer
                  }
                >
                  <TextInput
                    style={
                      styles.precioInput
                    }
                    value={String(
                      producto.precio
                    )}
                    onChangeText={(
                      texto
                    ) =>
                      cambiarPrecio(
                        producto.id,
                        texto
                      )
                    }
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                  />

                  <Ionicons
                    name="pencil"
                    size={15}
                    color="#08752F"
                  />
                </View>

                <View
                  style={
                    styles.cantidadContainer
                  }
                >
                  <TouchableOpacity
                    style={
                      styles.botonCantidad
                    }
                    onPress={() =>
                      cambiarCantidad(
                        producto.id,
                        -1
                      )
                    }
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color="#08752F"
                    />
                  </TouchableOpacity>

                  <TextInput
                    style={
                      styles.cantidadInput
                    }
                    value={String(
                      producto.cantidad
                    )}
                    onChangeText={(
                      texto
                    ) =>
                      escribirCantidad(
                        producto.id,
                        texto
                      )
                    }
                    keyboardType="numeric"
                    selectTextOnFocus
                  />

                  <TouchableOpacity
                    style={
                      styles.botonCantidad
                    }
                    onPress={() =>
                      cambiarCantidad(
                        producto.id,
                        1
                      )
                    }
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color="#08752F"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )
          )}
        </View>

        <View
          style={
            styles.resumenFila
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
            {total.toFixed(
              2
            )}
          </Text>
        </View>

        <Text
          style={
            styles.tituloSeccion
          }
        >
          Método de pago
        </Text>

        <TouchableOpacity
          style={[
            styles.metodo,

            usaEfectivo &&
              styles.metodoActivo,
          ]}
          onPress={() =>
            seleccionarMetodoPago(
              'Efectivo'
            )
          }
        >
          <View
            style={
              styles.metodoIzquierda
            }
          >
            <Ionicons
              name="cash-outline"
              size={22}
              color="#08752F"
            />

            <Text
              style={
                styles.metodoTexto
              }
            >
              Efectivo
            </Text>
          </View>

          <Ionicons
            name={
              usaEfectivo
                ? 'checkbox'
                : 'square-outline'
            }
            size={24}
            color="#08752F"
          />
        </TouchableOpacity>

        {usaEfectivo && (
          <View
            style={
              styles.pagoContainer
            }
          >
            <Text
              style={
                styles.pagoLabel
              }
            >
              Monto en efectivo
            </Text>

            <TextInput
              style={
                styles.pagoInput
              }
              value={
                pagoEfectivo
              }
              onChangeText={
                setPagoEfectivo
              }
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#999999"
              selectTextOnFocus
            />
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.metodo,

            usaTransferencia &&
              styles.metodoActivo,
          ]}
          onPress={() =>
            seleccionarMetodoPago(
              'Transferencia'
            )
          }
        >
          <View
            style={
              styles.metodoIzquierda
            }
          >
            <Ionicons
              name="card-outline"
              size={22}
              color="#08752F"
            />

            <Text
              style={
                styles.metodoTexto
              }
            >
              Transferencia
            </Text>
          </View>

          <Ionicons
            name={
              usaTransferencia
                ? 'checkbox'
                : 'square-outline'
            }
            size={24}
            color="#08752F"
          />
        </TouchableOpacity>

        {usaTransferencia && (
          <View
            style={
              styles.pagoContainer
            }
          >
            <Text
              style={
                styles.pagoLabel
              }
            >
              Monto por transferencia
            </Text>

            <TextInput
              style={
                styles.pagoInput
              }
              value={
                pagoTransferencia
              }
              onChangeText={
                setPagoTransferencia
              }
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#999999"
              selectTextOnFocus
            />
          </View>
        )}

        <View
          style={
            styles.resumenFila
          }
        >
          <Text
            style={
              styles.resumenLabel
            }
          >
            Total abonado:
          </Text>

          <Text
            style={
              styles.abonado
            }
          >
            $
            {abonoNumerico.toFixed(
              2
            )}
          </Text>
        </View>

        <View
          style={
            styles.resumenFila
          }
        >
          <Text
            style={
              styles.resumenLabel
            }
          >
            Saldo pendiente:
          </Text>

          <Text
            style={[
              styles.saldo,

              saldoPendiente <=
                0 &&
                styles.saldoCero,
            ]}
          >
            $
            {saldoPendiente.toFixed(
              2
            )}
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.botonGuardar
          }
          onPress={
            guardarEntrega
          }
        >
          <Ionicons
            name="save-outline"
            size={22}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.botonTexto
            }
          >
            Registrar entrega
          </Text>
        </TouchableOpacity>
      </ScrollView>
      {/* NAVEGACIÓN A INICIO */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            })
          }
        >
          <Ionicons
            name="home"
            size={28}
            color="#08752F"
          />

          <Text style={styles.navActivo}>
            Inicio
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#FFFFFF',
    },

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
    },

    subtituloHeader: {
      color:
        '#DDEEE2',
      fontSize: 11,
      marginTop: 2,
    },

    contenido: {
      padding: 18,
      paddingBottom: 40,
    },

    fechaContainer: {
      height: 50,
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      borderRadius: 9,
      backgroundColor:
        '#F6F8F7',
      paddingHorizontal: 12,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    fechaDato: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 6,
    },

    fechaTexto: {
      fontSize: 12,
      color:
        '#08752F',
      fontWeight:
        '700',
    },

    tituloSeccion: {
      fontSize: 15,
      fontWeight:
        '700',
      color:
        '#08752F',
      marginTop: 16,
      marginBottom: 7,
    },

    productosContainer: {
      borderWidth: 1,
      borderColor:
        '#E3E3E3',
      borderRadius: 10,
      overflow:
        'hidden',
    },

    productoFila: {
      minHeight: 73,
      borderBottomWidth: 1,
      borderBottomColor:
        '#EEEEEE',
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 9,
      gap: 6,
    },

    ultimaFila: {
      borderBottomWidth: 0,
    },

    productoInfo: {
      flex: 1,
    },

    productoNombre: {
      fontSize: 12,
      fontWeight:
        '700',
    },

    precioGeneral: {
      fontSize: 9,
      color:
        '#777777',
      marginTop: 3,
    },

    precioContainer: {
      width: 75,
      height: 38,
      borderWidth: 1,
      borderColor:
        '#DDDDDD',
      borderRadius: 7,
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 5,
    },

    precioInput: {
      flex: 1,
      fontSize: 11,
      padding: 0,
    },

    cantidadContainer: {
      height: 38,
      borderWidth: 1,
      borderColor:
        '#DDDDDD',
      borderRadius: 7,
      flexDirection:
        'row',
      overflow:
        'hidden',
    },

    botonCantidad: {
      width: 29,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    cantidadInput: {
      width: 42,
      textAlign:
        'center',
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor:
        '#DDDDDD',
      padding: 0,
      fontWeight:
        '700',
    },

    resumenFila: {
      minHeight: 56,
      borderTopWidth: 1,
      borderTopColor:
        '#EEEEEE',
      marginTop: 10,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    resumenLabel: {
      fontSize: 13,
      fontWeight:
        '700',
    },

    total: {
      fontSize: 20,
      fontWeight:
        '800',
      color:
        '#08752F',
    },

    metodo: {
      minHeight: 48,
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      borderRadius: 9,
      marginBottom: 7,
      paddingHorizontal: 12,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    metodoActivo: {
      backgroundColor:
        '#F0F8F2',
      borderColor:
        '#87C99A',
    },

    metodoIzquierda: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 8,
    },

    metodoTexto: {
      fontSize: 13,
      fontWeight:
        '600',
    },

    pagoContainer: {
      minHeight: 52,
      backgroundColor:
        '#F5FAF6',
      borderRadius: 8,
      marginBottom: 7,
      paddingHorizontal: 12,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    pagoLabel: {
      fontSize: 11,
      fontWeight:
        '600',
    },

    pagoInput: {
      width: 100,
      height: 38,
      borderWidth: 1,
      borderColor:
        '#DADADA',
      borderRadius: 7,
      backgroundColor:
        '#FFFFFF',
      paddingHorizontal: 9,
      textAlign:
        'right',
    },

    abonado: {
      fontSize: 19,
      fontWeight:
        '800',
      color:
        '#08752F',
    },

    saldo: {
      fontSize: 19,
      fontWeight:
        '800',
      color:
        '#D71920',
    },

    saldoCero: {
      color:
        '#08752F',
    },

    botonGuardar: {
      height: 54,
      borderRadius: 9,
      backgroundColor:
        '#08752F',
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 8,
      marginTop: 14,
    },

    botonTexto: {
      color:
        '#FFFFFF',
      fontSize: 15,
      fontWeight:
        '700',
    },

        bottomNavigation: {
      height: 70,
      borderTopWidth: 1,
      borderTopColor: '#E5E5E5',
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    navItem: {
      width: 100,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },

    navActivo: {
      color: '#08752F',
      fontSize: 12,
      fontWeight: '700',
      marginTop: 3,
    },
  });