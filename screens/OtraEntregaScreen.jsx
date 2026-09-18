import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Modal,
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
import { useClientes } from '../context/ClientesContext';
import { useEntregas } from '../context/EntregasContext';
import { useToast } from '../context/ToastContext';
import { useAlert } from '../context/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BotonHome from '../components/BotonHome';

export default function OtraEntregaScreen({
  navigation,
}) {
  const { productos } =
    useProductos();

  const { clientes } =
    useClientes();

  const {
    agregarEntrega,
    obtenerDeudasCliente,
    obtenerSaldoCliente,
    registrarAbono,
  } = useEntregas();

  const { mostrarToast } =
    useToast();

  const { mostrarAlert } =
    useAlert();

  const insets = useSafeAreaInsets();

  // ==========================================
  // CLIENTE OPCIONAL
  // ==========================================

  const [
    clienteSeleccionado,
    setClienteSeleccionado,
  ] = useState(null);

  const [
    busqueda,
    setBusqueda,
  ] = useState('');

  const [
    mostrarResultados,
    setMostrarResultados,
  ] = useState(false);

  const nombreCliente = (cliente) =>
  cliente?.nombre ||
  `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim() ||
  'Cliente';

  const clientesFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return [];
      }

      return clientes.filter(
        (cliente) =>
          `${nombreCliente(
            cliente
          )} ${
            cliente.telefono ||
            ''
          }`
            .toLowerCase()
            .includes(
              texto
            )
      );
    }, [
      clientes,
      busqueda,
    ]);

  // ==========================================
  // ABONO DE SALDOS PENDIENTES
  // ==========================================

  const [modalAbonoVisible, setModalAbonoVisible] =
    useState(false);

  const [deudaSeleccionadaId, setDeudaSeleccionadaId] =
    useState(null);

  const [metodosAbono, setMetodosAbono] =
    useState([]);

  const [abonoEfectivo, setAbonoEfectivo] =
    useState('');

  const [abonoTransferencia, setAbonoTransferencia] =
    useState('');

  const [guardandoAbono, setGuardandoAbono] =
    useState(false);

  const deudasCliente = clienteSeleccionado?.id
    ? obtenerDeudasCliente(clienteSeleccionado.id)
    : [];

  const saldoTotalCliente = clienteSeleccionado?.id
    ? obtenerSaldoCliente(clienteSeleccionado.id)
    : 0;

  const usaEfectivoAbono =
    metodosAbono.includes('Efectivo');

  const usaTransferenciaAbono =
    metodosAbono.includes('Transferencia');

  const efectivoAbonoNumerico =
    usaEfectivoAbono
      ? Number(
          String(abonoEfectivo).replace(',', '.')
        ) || 0
      : 0;

  const transferenciaAbonoNumerico =
    usaTransferenciaAbono
      ? Number(
          String(abonoTransferencia).replace(',', '.')
        ) || 0
      : 0;

  const totalAbonoSaldo =
    efectivoAbonoNumerico +
    transferenciaAbonoNumerico;

  const abrirModalAbono = () => {
    setDeudaSeleccionadaId(null);
    setMetodosAbono([]);
    setAbonoEfectivo('');
    setAbonoTransferencia('');
    setModalAbonoVisible(true);
  };

  const cerrarModalAbono = () => {
    if (guardandoAbono) {
      return;
    }

    setModalAbonoVisible(false);
    setDeudaSeleccionadaId(null);
    setMetodosAbono([]);
    setAbonoEfectivo('');
    setAbonoTransferencia('');
  };

  const seleccionarDeudaAbono = (entregaId) => {
    setDeudaSeleccionadaId((actual) =>
      String(actual) === String(entregaId)
        ? null
        : entregaId
    );
  };

  const seleccionarMetodoAbono = (metodo) => {
    setMetodosAbono((actuales) => {
      if (actuales.includes(metodo)) {
        if (metodo === 'Efectivo') {
          setAbonoEfectivo('');
        }

        if (metodo === 'Transferencia') {
          setAbonoTransferencia('');
        }

        return actuales.filter(
          (item) => item !== metodo
        );
      }

      return [...actuales, metodo];
    });
  };

  const guardarAbonoSaldo = async () => {
    if (metodosAbono.length === 0) {
      mostrarToast(
        'Seleccione al menos un método de pago.',
        'warning'
      );
      return;
    }

    if (totalAbonoSaldo <= 0) {
      mostrarToast(
        'Ingrese un valor para el abono.',
        'warning'
      );
      return;
    }

    const deudaSeleccionada =
      deudaSeleccionadaId
        ? deudasCliente.find(
            (entrega) =>
              String(entrega.id) ===
              String(deudaSeleccionadaId)
          )
        : null;

    if (
      deudaSeleccionada &&
      aCentavos(totalAbonoSaldo) >
        aCentavos(
          deudaSeleccionada.saldoPendiente
        )
    ) {
      mostrarToast(
        'El abono no puede superar el saldo de la deuda seleccionada.',
        'warning'
      );
      return;
    }

    if (
      !deudaSeleccionada &&
      aCentavos(totalAbonoSaldo) >
        aCentavos(saldoTotalCliente)
    ) {
      mostrarToast(
        'El abono no puede superar el saldo pendiente total.',
        'warning'
      );
      return;
    }

    try {
      setGuardandoAbono(true);

      const resultado = await registrarAbono({
        clienteId: clienteSeleccionado.id,
        entregaId: deudaSeleccionadaId,
        pagoEfectivo: efectivoAbonoNumerico,
        pagoTransferencia:
          transferenciaAbonoNumerico,
      });

      if (!resultado?.ok) {
        mostrarToast(
          resultado?.mensaje ||
            'No se pudo registrar el abono.',
          'warning'
        );
        return;
      }

      setModalAbonoVisible(false);
      setDeudaSeleccionadaId(null);
      setMetodosAbono([]);
      setAbonoEfectivo('');
      setAbonoTransferencia('');

      mostrarToast(
        'Abono registrado correctamente.',
        'success'
      );
    } catch (error) {
      mostrarToast(
        'No se pudo registrar el abono.',
        'error'
      );
    } finally {
      setGuardandoAbono(false);
    }
  };

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
// CENTAVOS
// ==========================================

  const aCentavos = (valor) => {
    return Math.round(
      (Number(valor) || 0) * 100
    );
  };

  // ==========================================
  // PAGOS
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
    (
      aCentavos(efectivoNumerico) +
      aCentavos(transferenciaNumerica)
    ) / 100;

  const saldoPendiente =
    (
      aCentavos(total) -
      aCentavos(abonoNumerico)
    ) / 100;

  // ==========================================
  // GUARDAR
  // ==========================================

  const guardarEntrega = async (
    confirmarSinPago = false
  ) => {
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
        metodosPago.length === 0 &&
        !confirmarSinPago
      ) {
        mostrarAlert({
          titulo:
            'Sin método de pago seleccionado',
          mensaje:
            'Esta entrega se registrará como no pagada.',
          tipo:
            'warning',
          textoCancelar:
            'Cancelar',
          textoConfirmar:
            'Aceptar',
          mostrarCancelar:
            true,
          onConfirmar: () => {
            guardarEntrega(true);
          },
        });

        return;
      }

      // ======================================
      // EVITAR ABONO MAYOR AL TOTAL
      // ======================================

      if (
        aCentavos(abonoNumerico) >
        aCentavos(total)
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
          clienteSeleccionado?.id ||
          null,

        tipo:
          clienteSeleccionado
            ? 'CLIENTE'
            : 'OTRA_ENTREGA',

        nombreCliente:
          clienteSeleccionado
            ? nombreCliente(
                clienteSeleccionado
              )
            : 'Cliente no registrado',

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

        const resultado =
          await agregarEntrega(
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
            Otra entrega
          </Text>

          <Text
            style={
              styles.subtituloHeader
            }
          >
            Entrega adicional
          </Text>
        </View>
        <BotonHome navigation={navigation} />

      </View>

      <ScrollView
        contentContainerStyle={[
          styles.contenido,
          {
            paddingBottom: 40 + insets.bottom,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
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
          Cliente opcional
        </Text>

        {clienteSeleccionado ? (
          <View
            style={
              styles.clienteSeleccionado
            }
          >
            <View>
              <Text
                style={
                  styles.clienteNombre
                }
              >
                {nombreCliente(
                  clienteSeleccionado
                )}
              </Text>

              <Text
                style={
                  styles.clienteTelefono
                }
              >
                {clienteSeleccionado.telefono ||
                  'Sin teléfono'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setClienteSeleccionado(
                  null
                );

                setBusqueda(
                  ''
                );
              }}
            >
              <Ionicons
                name="close-circle"
                size={25}
                color="#D71920"
              />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View
              style={
                styles.buscador
              }
            >
              <Ionicons
                name="search-outline"
                size={20}
                color="#777777"
              />

              <TextInput
                style={
                  styles.buscadorInput
                }
                value={
                  busqueda
                }
                onChangeText={(
                  texto
                ) => {
                  setBusqueda(
                    texto
                  );

                  setMostrarResultados(
                    true
                  );
                }}
                placeholder="Buscar cliente..."
                placeholderTextColor="#999999"
                selectTextOnFocus
              />
            </View>

            {mostrarResultados &&
              busqueda.trim() !==
                '' && (
                <View
                  style={
                    styles.resultados
                  }
                >
                  {clientesFiltrados
                    .slice(
                      0,
                      5
                    )
                    .map(
                      (
                        cliente
                      ) => (
                        <TouchableOpacity
                          key={
                            cliente.id
                          }
                          style={
                            styles.resultadoItem
                          }
                          onPress={() => {
                            setClienteSeleccionado(
                              cliente
                            );

                            setBusqueda(
                              ''
                            );

                            setMostrarResultados(
                              false
                            );
                          }}
                        >
                          <Ionicons
                            name="person-outline"
                            size={20}
                            color="#08752F"
                          />

                          <View>
                            <Text
                              style={
                                styles.resultadoNombre
                              }
                            >
                              {nombreCliente(
                                cliente
                              )}
                            </Text>

                            <Text
                              style={
                                styles.resultadoTelefono
                              }
                            >
                              {cliente.telefono ||
                                'Sin teléfono'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )
                    )}
                </View>
              )}
          </>
        )}

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

        {saldoTotalCliente > 0 && (
          <View style={styles.saldoAnteriorContainer}>
            <View style={styles.saldoAnteriorInfo}>
              <View style={styles.saldoAnteriorTituloFila}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color="#D71920"
                />

                <Text style={styles.saldoAnteriorLabel}>
                  Saldo pendiente:
                </Text>
              </View>

              <Text style={styles.saldoAnteriorValor}>
                ${Number(saldoTotalCliente).toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.botonAbonarSaldo}
              onPress={abrirModalAbono}
            >
              <Ionicons
                name="wallet-outline"
                size={18}
                color="#D71920"
              />

              <Text style={styles.botonAbonarSaldoTexto}>
                Abonar
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
          onPress={() =>
            guardarEntrega()
          }
        >
          <Text
            style={
              styles.botonTexto
            }
          >
            Registrar entrega
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <Modal
        visible={modalAbonoVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModalAbono}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalAbono}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitulo}>
                <Ionicons
                  name="wallet-outline"
                  size={23}
                  color="#D71920"
                />

                <Text style={styles.modalTitulo}>
                  Abonar saldo pendiente
                </Text>
              </View>

              <TouchableOpacity
                onPress={cerrarModalAbono}
                disabled={guardandoAbono}
              >
                <Ionicons
                  name="close"
                  size={26}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSaldoTotal}>
              <Text style={styles.modalSaldoLabel}>
                Saldo total:
              </Text>

              <Text style={styles.modalSaldoValor}>
                ${Number(saldoTotalCliente).toFixed(2)}
              </Text>
            </View>

            <Text style={styles.modalAyuda}>
              Seleccione una deuda para abonarla directamente o deje todas sin seleccionar para distribuir el abono desde la más antigua.
            </Text>

            <ScrollView
              style={styles.listaDeudas}
              contentContainerStyle={styles.listaDeudasContenido}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {deudasCliente.map((entrega) => {
                const seleccionada =
                  String(deudaSeleccionadaId) ===
                  String(entrega.id);

                return (
                  <TouchableOpacity
                    key={entrega.id}
                    style={[
                      styles.deudaTarjeta,
                      seleccionada &&
                        styles.deudaTarjetaSeleccionada,
                    ]}
                    onPress={() =>
                      seleccionarDeudaAbono(entrega.id)
                    }
                  >
                    <View style={styles.deudaFechaFila}>
                      <Ionicons
                        name="calendar-outline"
                        size={17}
                        color="#D71920"
                      />

                      <Text style={styles.deudaFecha}>
                        {entrega.fecha || 'Sin fecha'}
                      </Text>
                    </View>

                    <Text style={styles.deudaSaldo}>
                      ${Number(
                        entrega.saldoPendiente || 0
                      ).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <Text style={styles.modalSeccionTitulo}>
                Método de pago
              </Text>

              <TouchableOpacity
                style={[
                  styles.metodoAbono,
                  usaEfectivoAbono &&
                    styles.metodoAbonoActivo,
                ]}
                onPress={() =>
                  seleccionarMetodoAbono('Efectivo')
                }
              >
                <View style={styles.metodoIzquierda}>
                  <Ionicons
                    name="cash-outline"
                    size={22}
                    color="#D71920"
                  />

                  <Text style={styles.metodoAbonoTexto}>
                    Efectivo
                  </Text>
                </View>

                <Ionicons
                  name={
                    usaEfectivoAbono
                      ? 'checkbox'
                      : 'square-outline'
                  }
                  size={24}
                  color="#D71920"
                />
              </TouchableOpacity>

              {usaEfectivoAbono && (
                <View style={styles.pagoAbonoContainer}>
                  <Text style={styles.pagoAbonoLabel}>
                    Monto en efectivo
                  </Text>

                  <TextInput
                    style={styles.pagoAbonoInput}
                    value={abonoEfectivo}
                    onChangeText={setAbonoEfectivo}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#999999"
                    selectTextOnFocus
                  />
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.metodoAbono,
                  usaTransferenciaAbono &&
                    styles.metodoAbonoActivo,
                ]}
                onPress={() =>
                  seleccionarMetodoAbono('Transferencia')
                }
              >
                <View style={styles.metodoIzquierda}>
                  <Ionicons
                    name="card-outline"
                    size={22}
                    color="#D71920"
                  />

                  <Text style={styles.metodoAbonoTexto}>
                    Transferencia
                  </Text>
                </View>

                <Ionicons
                  name={
                    usaTransferenciaAbono
                      ? 'checkbox'
                      : 'square-outline'
                  }
                  size={24}
                  color="#D71920"
                />
              </TouchableOpacity>

              {usaTransferenciaAbono && (
                <View style={styles.pagoAbonoContainer}>
                  <Text style={styles.pagoAbonoLabel}>
                    Monto por transferencia
                  </Text>

                  <TextInput
                    style={styles.pagoAbonoInput}
                    value={abonoTransferencia}
                    onChangeText={setAbonoTransferencia}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#999999"
                    selectTextOnFocus
                  />
                </View>
              )}

              <View style={styles.totalAbonoFila}>
                <Text style={styles.totalAbonoLabel}>
                  Total abonado:
                </Text>

                <Text style={styles.totalAbonoValor}>
                  ${totalAbonoSaldo.toFixed(2)}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={styles.botonCancelarAbono}
                onPress={cerrarModalAbono}
                disabled={guardandoAbono}
              >
                <Text style={styles.botonCancelarAbonoTexto}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.botonConfirmarAbono,
                  guardandoAbono &&
                    styles.botonAbonoDeshabilitado,
                ]}
                onPress={guardarAbonoSaldo}
                disabled={guardandoAbono}
              >
                <Ionicons
                  name="wallet-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text style={styles.botonConfirmarAbonoTexto}>
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

    fechaContainer: {
      height: 50,
      backgroundColor:
        '#F6F8F7',
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      borderRadius: 9,
      paddingHorizontal: 12,
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    fechaDato: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 6,
    },

    fechaTexto: {
      color:
        '#08752F',
      fontWeight:
        '700',
      fontSize: 12,
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

    buscador: {
      height: 48,
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      borderRadius: 9,
      paddingHorizontal: 11,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 7,
    },

    buscadorInput: {
      flex: 1,
    },

    resultados: {
      borderWidth: 1,
      borderColor:
        '#E3E3E3',
      borderRadius: 9,
      marginTop: 4,
      backgroundColor:
        '#FFFFFF',
    },

    resultadoItem: {
      minHeight: 50,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 10,
      paddingHorizontal: 11,
      borderBottomWidth: 1,
      borderBottomColor:
        '#EEEEEE',
    },

    resultadoNombre: {
      fontSize: 12,
      fontWeight:
        '700',
    },

    resultadoTelefono: {
      fontSize: 9,
      color:
        '#888888',
    },

    clienteSeleccionado: {
      minHeight: 57,
      backgroundColor:
        '#EFF8F2',
      borderWidth: 1,
      borderColor:
        '#D6EADC',
      borderRadius: 9,
      paddingHorizontal: 12,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    clienteNombre: {
      fontSize: 13,
      fontWeight:
        '700',
      color:
        '#08752F',
    },

    clienteTelefono: {
      fontSize: 10,
      color:
        '#777777',
      marginTop: 2,
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
      color:
        '#08752F',
      fontWeight:
        '800',
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
      backgroundColor:
        '#08752F',
      borderRadius: 9,
      justifyContent:
        'center',
      alignItems:
        'center',
      marginTop: 14,
    },

    botonTexto: {
      color:
        '#FFFFFF',
      fontSize: 15,
      fontWeight:
        '700',
    },

    saldoAnteriorContainer: {
      minHeight: 72,
      borderWidth: 1,
      borderColor: '#F0CACA',
      borderRadius: 10,
      backgroundColor: '#FFF7F7',
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },

    saldoAnteriorInfo: {
      flex: 1,
    },

    saldoAnteriorTituloFila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    saldoAnteriorLabel: {
      color: '#D71920',
      fontSize: 12,
      fontWeight: '700',
    },

    saldoAnteriorValor: {
      color: '#D71920',
      fontSize: 20,
      fontWeight: '800',
      marginTop: 3,
    },

    botonAbonarSaldo: {
      minWidth: 92,
      height: 40,
      borderWidth: 1,
      borderColor: '#D71920',
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingHorizontal: 10,
    },

    botonAbonarSaldoTexto: {
      color: '#D71920',
      fontSize: 12,
      fontWeight: '700',
    },

    modalFondo: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      paddingHorizontal: 18,
      paddingVertical: 30,
    },

    modalAbono: {
      width: '100%',
      maxHeight: '88%',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
    },

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },

    modalHeaderTitulo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginRight: 10,
    },

    modalTitulo: {
      flex: 1,
      color: '#D71920',
      fontSize: 17,
      fontWeight: '800',
    },

    modalSaldoTotal: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: '#F0CACA',
      borderRadius: 9,
      backgroundColor: '#FFF7F7',
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    modalSaldoLabel: {
      color: '#666666',
      fontSize: 13,
      fontWeight: '700',
    },

    modalSaldoValor: {
      color: '#D71920',
      fontSize: 20,
      fontWeight: '800',
    },

    modalAyuda: {
      color: '#777777',
      fontSize: 10,
      lineHeight: 14,
      marginTop: 8,
      marginBottom: 8,
    },

    listaDeudas: {
      flexGrow: 0,
    },

    listaDeudasContenido: {
      paddingBottom: 4,
    },

    deudaTarjeta: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: '#F0CACA',
      borderRadius: 9,
      backgroundColor: '#FFF9F9',
      paddingHorizontal: 12,
      marginBottom: 7,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    deudaTarjetaSeleccionada: {
      borderColor: '#D71920',
      backgroundColor: '#FFEAEA',
      borderWidth: 2,
    },

    deudaFechaFila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    deudaFecha: {
      color: '#444444',
      fontSize: 12,
      fontWeight: '700',
    },

    deudaSaldo: {
      color: '#D71920',
      fontSize: 16,
      fontWeight: '800',
    },

    modalSeccionTitulo: {
      color: '#D71920',
      fontSize: 14,
      fontWeight: '800',
      marginTop: 7,
      marginBottom: 7,
    },

    metodoAbono: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: '#E7CFCF',
      borderRadius: 9,
      marginBottom: 7,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    metodoAbonoActivo: {
      backgroundColor: '#FFF0F0',
      borderColor: '#D71920',
    },

    metodoAbonoTexto: {
      fontSize: 13,
      fontWeight: '600',
      color: '#333333',
    },

    pagoAbonoContainer: {
      minHeight: 52,
      backgroundColor: '#FFF7F7',
      borderRadius: 8,
      marginBottom: 7,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },

    pagoAbonoLabel: {
      flex: 1,
      fontSize: 11,
      fontWeight: '600',
      color: '#444444',
    },

    pagoAbonoInput: {
      width: 100,
      height: 38,
      borderWidth: 1,
      borderColor: '#E3BDBD',
      borderRadius: 7,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 9,
      textAlign: 'right',
      color: '#222222',
    },

    totalAbonoFila: {
      minHeight: 50,
      borderTopWidth: 1,
      borderTopColor: '#F0CACA',
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    totalAbonoLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: '#333333',
    },

    totalAbonoValor: {
      fontSize: 19,
      fontWeight: '800',
      color: '#D71920',
    },

    modalBotones: {
      flexDirection: 'row',
      gap: 9,
      marginTop: 10,
    },

    botonCancelarAbono: {
      flex: 1,
      height: 46,
      borderWidth: 1,
      borderColor: '#D71920',
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    },

    botonCancelarAbonoTexto: {
      color: '#D71920',
      fontSize: 13,
      fontWeight: '700',
    },

    botonConfirmarAbono: {
      flex: 1,
      height: 46,
      borderRadius: 9,
      backgroundColor: '#D71920',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },

    botonConfirmarAbonoTexto: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },

    botonAbonoDeshabilitado: {
      opacity: 0.6,
    },
  });