import React, {
  useEffect,
  useMemo,
  useRef,
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
import { useAlert } from '../context/AlertContext';

export default function EditarEntregaScreen({
  navigation,
  route,
}) {
  const { productos } =
    useProductos();

  const {
    actualizarEntrega:
      actualizarEntregaContext,
  } = useEntregas();

  const { mostrarToast } =
    useToast();

  const { mostrarAlert } =
    useAlert();

  const cliente =
    route.params?.cliente;

  const entrega =
    route.params?.entrega;

  const alertaMostrada =
    useRef(false);

  // ==========================================
  // ALERTA SALDO 0
  // ==========================================

  useEffect(() => {
    if (
      alertaMostrada.current
    ) {
      return;
    }

    const saldo =
      Number(
        entrega?.saldoPendiente ||
          0
      );

    if (
      saldo === 0
    ) {
      alertaMostrada.current =
        true;

      mostrarAlert({
        titulo: 'Entrega pagada',
        mensaje:
          'Esta entrega ya tiene un saldo pendiente de $0.00. ¿Desea editar esta entrega?',
        tipo: 'warning',
        mostrarCancelar: true,
        textoCancelar: 'Cancelar',
        textoConfirmar: 'Sí, editar',
        onCancelar: () => {
          navigation.goBack();
        },
      });
    }
  }, [
    entrega,
    navigation,
    mostrarAlert,
  ]);

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
  // REGISTRO ORIGINAL
  // ==========================================

  const fechaOriginal =
    entrega?.fecha ||
    null;

  const horaOriginal =
    entrega?.hora ||
    null;

  const fechaEntrega =
    fechaOriginal ||
    'Sin fecha';

  const horaEntrega =
    horaOriginal ||
    'Sin hora';

  // ==========================================
  // EDICIONES
  // ==========================================

  const numeroEdiciones =
    Number(
      entrega?.numeroEdiciones
    ) || 0;

  const fechaUltimaEdicion =
    entrega?.fechaEdicion ||
    null;

  const horaUltimaEdicion =
    entrega?.horaEdicion ||
    null;

  const mostrarUltimaEdicion =
    numeroEdiciones > 0 &&
    fechaUltimaEdicion &&
    horaUltimaEdicion;

  // ==========================================
  // FECHA Y HORA ACTUAL
  // ==========================================

  const obtenerFechaHoraActual =
    () => {
      const ahora =
        new Date();

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
    obtenerFechaHoraActual()
  );

  useEffect(() => {
    const intervalo =
      setInterval(() => {
        setFechaHoraActual(
          obtenerFechaHoraActual()
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
        (producto) => {
          const productoEntrega =
            entrega?.productos?.find(
              (item) =>
                String(
                  item.id
                ) ===
                  String(
                    producto.id
                  ) ||
                String(
                  item.productoId
                ) ===
                  String(
                    producto.id
                  ) ||
                item.nombre ===
                  producto.nombre
            );

          return {
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
                productoEntrega?.precio !==
                  undefined
                  ? productoEntrega.precio
                  : Number(
                      producto.precio
                    ).toFixed(
                      2
                    )
              ),

            cantidad:
              productoEntrega?.cantidad !==
              undefined
                ? Number(
                    productoEntrega.cantidad
                  )
                : 0,
          };
        }
      );
    }, [
      productos,
      entrega,
    ]);

  const [
    productosEntrega,
    setProductosEntrega,
  ] = useState(
    productosIniciales
  );

  // ==========================================
  // ABONO ANTERIOR
  // ==========================================

  const abonoAnterior =
    Number(
      entrega?.abona
    ) || 0;

  const pagoEfectivoAnterior =
    Number(
      entrega?.pagoEfectivo
    ) || 0;

  const pagoTransferenciaAnterior =
    Number(
      entrega?.pagoTransferencia
    ) || 0;

  // ==========================================
  // MÉTODOS ANTERIORES
  // ==========================================

  const metodosPagoAnteriores =
    useMemo(() => {
      if (
        Array.isArray(
          entrega?.metodosPago
        )
      ) {
        return entrega.metodosPago;
      }

      if (
        entrega?.metodoPago
      ) {
        return [
          entrega.metodoPago,
        ];
      }

      return [];
    }, [
      entrega,
    ]);

  // ==========================================
  // NUEVO PAGO
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
  // PRODUCTOS
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

            const actual =
              Number(
                producto.cantidad
              ) || 0;

            const nueva =
              actual +
              cambio;

            return {
              ...producto,

              cantidad:
                nueva < 0
                  ? 0
                  : nueva,
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
  // NUEVOS ABONOS
  // ==========================================

  const efectivoNuevo =
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

  const transferenciaNueva =
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

  const nuevoAbono =
    efectivoNuevo +
    transferenciaNueva;

  const abonoAcumulado =
    abonoAnterior +
    nuevoAbono;

  const saldoPendiente =
    total -
    abonoAcumulado;

  // ==========================================
  // ACTUALIZAR
  // ==========================================

  const actualizarEntrega = async () => {
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
          'Revise los precios de los productos.',
          'warning'
        );

        return;
      }

      if (
        usaEfectivo &&
        efectivoNuevo <= 0
      ) {
        mostrarToast(
          'Ingrese el valor del nuevo pago en efectivo.',
          'warning'
        );

        return;
      }

      if (
        usaTransferencia &&
        transferenciaNueva <=
          0
      ) {
        mostrarToast(
          'Ingrese el valor de la nueva transferencia.',
          'warning'
        );

        return;
      }

      // ======================================
      // EVITAR SOBREPAGO
      // ======================================

      if (
        abonoAcumulado >
        total
      ) {
        mostrarToast(
          'El total abonado no puede superar el total de la entrega.',
          'warning'
        );

        return;
      }

      const momentoEdicion =
        obtenerFechaHoraActual();

      const nuevoNumeroEdiciones =
        numeroEdiciones + 1;

      const metodosActualizados =
        Array.from(
          new Set([
            ...metodosPagoAnteriores,
            ...metodosPago,
          ])
        );

      const entregaActualizada = {
        ...entrega,

        fecha:
          fechaOriginal,

        hora:
          horaOriginal,

        numeroEdiciones:
          nuevoNumeroEdiciones,

        fechaEdicion:
          momentoEdicion.fecha,

        horaEdicion:
          momentoEdicion.hora,

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
            abonoAcumulado.toFixed(
              2
            )
          ),

        saldoPendiente:
          Number(
            saldoPendiente.toFixed(
              2
            )
          ),

        metodosPago:
          metodosActualizados,

        pagoEfectivo:
          Number(
            (
              pagoEfectivoAnterior +
              efectivoNuevo
            ).toFixed(
              2
            )
          ),

        pagoTransferencia:
          Number(
            (
              pagoTransferenciaAnterior +
              transferenciaNueva
            ).toFixed(
              2
            )
          ),
      };

      try {

        const resultado =
          await actualizarEntregaContext(
            entregaActualizada
          );

        if (!resultado) {
          mostrarToast(
            'No se pudo actualizar la entrega.',
            'error'
          );

          return;
        }

        mostrarToast(
          'Entrega actualizada correctamente.',
          'success'
        );

        navigation.goBack();

      } catch (error) {

        mostrarToast(
          'No se pudo actualizar la entrega.',
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
            Editar entrega
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.aviso
          }
        >
          <Ionicons
            name="lock-closed-outline"
            size={24}
            color="#08752F"
          />

          <View>
            <Text
              style={
                styles.avisoTitulo
              }
            >
              Registro original
            </Text>

            <Text
              style={
                styles.avisoTexto
              }
            >
              La fecha, hora y abonos anteriores se conservan.
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.label
          }
        >
          Fecha y hora de registro
        </Text>

        <View
          style={
            styles.fechaOriginal
          }
        >
          <View
            style={
              styles.fechaDato
            }
          >
            <Ionicons
              name="calendar-outline"
              size={19}
              color="#777777"
            />

            <Text>
              {fechaEntrega}
            </Text>
          </View>

          <View
            style={
              styles.fechaDato
            }
          >
            <Ionicons
              name="time-outline"
              size={19}
              color="#08752F"
            />

            <Text
              style={
                styles.horaOriginal
              }
            >
              {horaEntrega}
            </Text>
          </View>
        </View>

        {mostrarUltimaEdicion && (
          <>
            <Text
              style={
                styles.labelUltima
              }
            >
              Última edición registrada
            </Text>

            <View
              style={
                styles.ultimaEdicion
              }
            >
              <Text
                style={
                  styles.numeroEdiciones
                }
              >
                (
                {
                  numeroEdiciones
                }
                )
              </Text>

              <View
                style={
                  styles.fechaDato
                }
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color="#B71C1C"
                />

                <Text
                  style={
                    styles.textoRojo
                  }
                >
                  {
                    fechaUltimaEdicion
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
                  size={18}
                  color="#B71C1C"
                />

                <Text
                  style={
                    styles.textoRojo
                  }
                >
                  {
                    horaUltimaEdicion
                  }
                </Text>
              </View>
            </View>
          </>
        )}

        <Text
          style={
            styles.labelActual
          }
        >
          Edición actual
        </Text>

        <View
          style={
            styles.edicionActual
          }
        >
          <View
            style={
              styles.fechaDato
            }
          >
            <Ionicons
              name="calendar-outline"
              size={19}
              color="#D32F2F"
            />

            <Text
              style={
                styles.textoRojo
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
              size={19}
              color="#D32F2F"
            />

            <Text
              style={
                styles.textoRojo
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
            styles.ayuda
          }
        >
          Solo se registrará si presiona Actualizar entrega.
        </Text>

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

        <View
          style={
            styles.abonoAnterior
          }
        >
          <View>
            <Text
              style={
                styles.resumenLabel
              }
            >
              Abono registrado
            </Text>

            <Text
              style={
                styles.descripcion
              }
            >
              Total pagado anteriormente
            </Text>
          </View>

          <Text
            style={
              styles.valorAbonoAnterior
            }
          >
            $
            {abonoAnterior.toFixed(
              2
            )}
          </Text>
        </View>

        <Text
          style={
            styles.tituloSeccion
          }
        >
          Registrar nuevo abono
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
          <Text
            style={
              styles.metodoTexto
            }
          >
            Efectivo
          </Text>

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
            <Text>
              Nuevo pago en efectivo
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
          <Text
            style={
              styles.metodoTexto
            }
          >
            Transferencia
          </Text>

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
            <Text>
              Nueva transferencia
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
            Nuevo abono:
          </Text>

          <Text
            style={
              styles.nuevoAbono
            }
          >
            $
            {nuevoAbono.toFixed(
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
            Total abonado:
          </Text>

          <Text
            style={
              styles.abonado
            }
          >
            $
            {abonoAcumulado.toFixed(
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
            styles.botonActualizar
          }
          onPress={
            actualizarEntrega
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
            Actualizar entrega
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
    },

    contenido: {
      padding: 18,
      paddingBottom: 40,
    },

    aviso: {
      minHeight: 62,
      backgroundColor:
        '#EDF7F0',
      borderWidth: 1,
      borderColor:
        '#D7EBDD',
      borderRadius: 9,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 10,
      paddingHorizontal: 13,
      marginBottom: 13,
    },

    avisoTitulo: {
      color:
        '#08752F',
      fontWeight:
        '700',
      fontSize: 13,
    },

    avisoTexto: {
      color:
        '#666666',
      fontSize: 10,
      marginTop: 2,
    },

    label: {
      fontSize: 13,
      fontWeight:
        '700',
      marginBottom: 6,
    },

    fechaOriginal: {
      minHeight: 49,
      backgroundColor:
        '#F3F3F5',
      borderWidth: 1,
      borderColor:
        '#E0E0E0',
      borderRadius: 8,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      paddingHorizontal: 12,
    },

    fechaDato: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 6,
    },

    horaOriginal: {
      color:
        '#08752F',
      fontWeight:
        '700',
    },

    labelUltima: {
      fontSize: 12,
      fontWeight:
        '700',
      color:
        '#B71C1C',
      marginTop: 12,
      marginBottom: 6,
    },

    ultimaEdicion: {
      minHeight: 48,
      backgroundColor:
        '#FFF9F9',
      borderWidth: 1,
      borderColor:
        '#E4B6B6',
      borderRadius: 8,
      paddingHorizontal: 11,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    numeroEdiciones: {
      color:
        '#B71C1C',
      fontSize: 14,
      fontWeight:
        '800',
    },

    labelActual: {
      color:
        '#D32F2F',
      fontSize: 13,
      fontWeight:
        '700',
      marginTop: 12,
      marginBottom: 6,
    },

    edicionActual: {
      minHeight: 49,
      backgroundColor:
        '#FFF5F5',
      borderWidth: 1,
      borderColor:
        '#F0B7B7',
      borderRadius: 8,
      paddingHorizontal: 12,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    textoRojo: {
      color:
        '#D32F2F',
      fontSize: 12,
      fontWeight:
        '700',
    },

    ayuda: {
      fontSize: 9,
      color:
        '#888888',
      marginTop: 4,
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
      padding: 0,
      fontSize: 11,
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
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    cantidadInput: {
      width: 42,
      textAlign:
        'center',
      padding: 0,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor:
        '#DDDDDD',
    },

    resumenFila: {
      minHeight: 56,
      borderTopWidth: 1,
      borderTopColor:
        '#EEEEEE',
      marginTop: 10,
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    resumenLabel: {
      fontSize: 13,
      fontWeight:
        '700',
    },

    descripcion: {
      fontSize: 9,
      color:
        '#777777',
      marginTop: 2,
    },

    total: {
      fontSize: 20,
      fontWeight:
        '800',
      color:
        '#08752F',
    },

    abonoAnterior: {
      minHeight: 61,
      backgroundColor:
        '#F6FAF7',
      borderWidth: 1,
      borderColor:
        '#DCE9DF',
      borderRadius: 9,
      paddingHorizontal: 12,
      marginTop: 8,
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    valorAbonoAnterior: {
      fontSize: 19,
      fontWeight:
        '800',
      color:
        '#08752F',
    },

    metodo: {
      height: 48,
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      borderRadius: 9,
      marginBottom: 7,
      paddingHorizontal: 12,
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    metodoActivo: {
      backgroundColor:
        '#F0F8F2',
      borderColor:
        '#87C99A',
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
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    pagoInput: {
      width: 100,
      height: 38,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DADADA',
      borderRadius: 7,
      textAlign:
        'right',
      paddingHorizontal: 9,
    },

    nuevoAbono: {
      fontSize: 18,
      fontWeight:
        '800',
      color:
        '#3E7D50',
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

    botonActualizar: {
      height: 54,
      borderRadius: 9,
      backgroundColor:
        '#08752F',
      marginTop: 14,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 8,
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