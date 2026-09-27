import React, {useMemo, useState,} from 'react';

import {
  Image,
  FlatList,
  StatusBar,
  StyleSheet,
  Modal,
  TextInput,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import {DateTimePickerAndroid,} from '@react-native-community/datetimepicker';
import { useUsuarios } from '../context/UsuariosContext';

import { useEntregas } from '../context/EntregasContext';
import { useAlert } from '../context/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BotonHome from '../components/BotonHome';

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

const ClienteDetalleScreen = ({
  navigation,
  route,
}) => {

  const insets = useSafeAreaInsets();

  const cliente =
    route.params?.cliente;

  const {
    obtenerEntregasCliente,
    abonos,
    confirmarTransferenciaEntrega,
    confirmarTransferenciaAbono,
  } = useEntregas();

  const { usuarioActual } = useUsuarios();

    // ==========================================
    // CONFIRMACIÓN DE TRANSFERENCIA
    // ==========================================

    const [
      modalTransferenciaVisible,
      setModalTransferenciaVisible,
    ] = useState(false);

    const [
      entregaTransferencia,
      setEntregaTransferencia,
    ] = useState(null);

    const [
      abonoTransferencia,
      setAbonoTransferencia,
    ] = useState(null);

    const [
      valorTransferencia,
      setValorTransferencia,
    ] = useState('');

    const [
      fechaTransferencia,
      setFechaTransferencia,
    ] = useState(null);

    const [
      guardandoTransferencia,
      setGuardandoTransferencia,
    ] = useState(false);

    const historial =
      cliente
        ? obtenerEntregasCliente(
            cliente.id
          )
        : [];
    
    const [
      comprobanteConfirmacion,
      setComprobanteConfirmacion,
    ] = useState(null);

  // ==========================================
  // ABONOS POSTERIORES DE UNA ENTREGA
  // ==========================================

  const obtenerAbonosEntrega = (
    entregaId
  ) => {

    const resultado = [];

    (abonos || []).forEach(
      (abono) => {

        const distribucion =
          Array.isArray(
            abono.distribucion
          )
            ? abono.distribucion
            : [];

        distribucion.forEach(
          (detalle) => {

            if (
              String(
                detalle.entregaId
              ) ===
              String(entregaId)
            ) {

              const montoAplicado =
                Number(
                  detalle.montoAplicado ||
                  0
                );

              if (
                montoAplicado <= 0
              ) {
                return;
              }

              const totalAbono =
                Number(
                  abono.monto || 0
                );

              const efectivo =
                Number(
                  abono.pagoEfectivo ||
                  0
                );

              const transferencia =
                Number(
                  abono.pagoTransferencia ||
                  0
                );

              let efectivoAplicado = 0;
              let transferenciaAplicada = 0;

              if (
                totalAbono > 0
              ) {

                efectivoAplicado =
                  montoAplicado *
                  (
                    efectivo /
                    totalAbono
                  );

                transferenciaAplicada =
                  montoAplicado *
                  (
                    transferencia /
                    totalAbono
                  );
              }

              resultado.push({
                id:
                  `${abono.id}-${detalle.entregaId}`,

                abonoId:
                  abono.id,

                tipo:
                  abono.tipo,

                fecha:
                  abono.fecha || '',

                efectivo:
                  efectivoAplicado,

                transferencia:
                  transferenciaAplicada,

                transferenciaTotal:
                  transferencia,

                transferenciaConfirmada:
                  abono.transferenciaConfirmada,

                transferenciaConDiferencia:
                  abono.transferenciaConDiferencia,

                fechaConfirmacionTransferencia:
                  abono.fechaConfirmacionTransferencia,
              });
            }
          }
        );
      }
    );

    return resultado;
  };

  const tomarFotoConfirmacion = async () => {
    const permiso =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permiso.granted) {
      mostrarToast(
        'Se necesita permiso para usar la cámara.',
        'warning'
      );

      return;
    }

    const resultado =
      await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

    if (
      !resultado.canceled &&
      resultado.assets?.length > 0
    ) {
      setComprobanteConfirmacion(
        resultado.assets[0]
      );
    }
  };


  const elegirFotoConfirmacion = async () => {
    const permiso =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permiso.granted) {
      mostrarToast(
        'Se necesita permiso para acceder a la galería.',
        'warning'
      );

      return;
    }

    const resultado =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

    if (
      !resultado.canceled &&
      resultado.assets?.length > 0
    ) {
      setComprobanteConfirmacion(
        resultado.assets[0]
      );
    }
  };


  const eliminarFotoConfirmacion = () => {
    setComprobanteConfirmacion(null);
  };

  const guardarComprobanteConfirmacion = async (
    comprobante
  ) => {
    try {
      if (!comprobante?.uri) {
        return null;
      }

      const carpeta =
        `${FileSystem.documentDirectory}comprobantes/`;

      const informacionCarpeta =
        await FileSystem.getInfoAsync(carpeta);

      if (!informacionCarpeta.exists) {
        await FileSystem.makeDirectoryAsync(
          carpeta,
          {
            intermediates: true,
          }
        );
      }

      const extension =
        comprobante.uri
          .split('.')
          .pop()
          ?.split('?')[0] || 'jpg';

      const nombre =
        `comprobante_${Date.now()}.${extension}`;

      const destino =
        `${carpeta}${nombre}`;

      await FileSystem.copyAsync({
        from: comprobante.uri,
        to: destino,
      });

      return {
        uri: destino,
        nombre,
      };

    } catch (error) {
      console.log(
        'Error al guardar comprobante:',
        error
      );

      return null;
    }
  };

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
// TRANSFERENCIA AUTOMÁTICA PENDIENTE
// ==========================================

const abonosAutomaticosPendientes =
  (abonos || [])
    .filter(
      (abono) =>
        String(abono.clienteId) ===
          String(cliente?.id) &&
        abono.tipo ===
          'AUTOMATICO' &&
        Number(
          abono.pagoTransferencia || 0
        ) > 0 &&
        abono.transferenciaConfirmada !==
          true
    )
    .sort(
      (
        abonoA,
        abonoB
      ) => {

        const fechaA =
          abonoA.fechaCreacion
            ?.toMillis
            ? abonoA.fechaCreacion
                .toMillis()
            : 0;

        const fechaB =
          abonoB.fechaCreacion
            ?.toMillis
            ? abonoB.fechaCreacion
                .toMillis()
            : 0;

        return (
          fechaA -
          fechaB
        );
      }
    );

const abonoAutomaticoPendiente =
  abonosAutomaticosPendientes.length >
  0
    ? abonosAutomaticosPendientes[0]
    : null;

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
    // CONFIRMAR TRANSFERENCIA
    // ==========================================

    const abrirConfirmacionTransferencia = (

      entrega
    ) => {
      setComprobanteConfirmacion(null);

      setAbonoTransferencia(
        null
      );

      setEntregaTransferencia(
        entrega
      );

      setValorTransferencia(
        Number(
          entrega.pagoTransferencia || 0
        ).toFixed(2)
      );

      setFechaTransferencia(
        null
      );

      setComprobanteConfirmacion(null);

      setModalTransferenciaVisible(
        true
      );
    };

    const abrirConfirmacionAbono = (
      abono
    ) => {
      setComprobanteConfirmacion(null);

      setEntregaTransferencia(
        null
      );

      setAbonoTransferencia(
        abono
      );

      setValorTransferencia(
        Number(
          abono.transferenciaTotal || 0
        ).toFixed(2)
      );

      setFechaTransferencia(
        null
      );

      setModalTransferenciaVisible(
        true
      );
    };

    const abrirConfirmacionAutomatica =
  () => {
    setComprobanteConfirmacion(null);

    if (
      !abonoAutomaticoPendiente
    ) {
      return;
    }

    setEntregaTransferencia(
      null
    );

    setAbonoTransferencia({
      abonoId:
        abonoAutomaticoPendiente.id,

      transferenciaTotal:
        Number(
          abonoAutomaticoPendiente
            .pagoTransferencia || 0
        ),
    });

    setValorTransferencia(
      Number(
        abonoAutomaticoPendiente
          .pagoTransferencia || 0
      ).toFixed(2)
    );

    setFechaTransferencia(
      null
    );

    setModalTransferenciaVisible(
      true
    );
  };

    const cerrarConfirmacionTransferencia =
      () => {

        if (guardandoTransferencia) {
          return;
        }

        setModalTransferenciaVisible(
          false
        );

        setEntregaTransferencia(
          null
        );

        setAbonoTransferencia(
          null
        );

        setValorTransferencia(
          ''
        );

        setFechaTransferencia(
          null
        );
      };

    const formatearFechaTransferencia = (
      fecha
    ) => {

      if (!fecha) {
        return '';
      }

      const dia =
        String(
          fecha.getDate()
        ).padStart(
          2,
          '0'
        );

      const mes =
        String(
          fecha.getMonth() + 1
        ).padStart(
          2,
          '0'
        );

      const anio =
        fecha.getFullYear();

      return `${dia}/${mes}/${anio}`;
    };

    const abrirCalendarioTransferencia =
      () => {

        const hoy =
          new Date();

        const fechaInicial =
          fechaTransferencia ||
          hoy;

        DateTimePickerAndroid.open({
          value:
            fechaInicial,

          mode:
            'date',

          is24Hour:
            true,

          maximumDate:
            hoy,

          onChange: (
            event,
            fechaSeleccionada
          ) => {

            if (
              event.type ===
                'set' &&
              fechaSeleccionada
            ) {

              setFechaTransferencia(
                fechaSeleccionada
              );
            }
          },
        });
      };

    const confirmarTransferencia =
      async () => {

        if (
          !entregaTransferencia &&
          !abonoTransferencia
        ) {
          return;
        }

        const valor =
          Number(
            String(
              valorTransferencia
            ).replace(
              ',',
              '.'
            )
          );

        if (
          Number.isNaN(valor) ||
          valor < 0
        ) {

          mostrarAlert({
            titulo:
              'Valor inválido',

            mensaje:
              'Ingrese el valor recibido de la transferencia.',

            tipo:
              'warning',

            textoConfirmar:
              'Aceptar',
          });

          return;
        }

        if (!fechaTransferencia) {

          mostrarAlert({
            titulo:
              'Fecha requerida',

            mensaje:
              'Seleccione manualmente la fecha de la transferencia.',

            tipo:
              'warning',

            textoConfirmar:
              'Aceptar',
          });

          return;
        }

        setGuardandoTransferencia(
          true
        );

        let resultado;

        let comprobanteGuardado = null;
          if (
            entregaTransferencia &&
            comprobanteConfirmacion
          ) {
            comprobanteGuardado =
              await guardarComprobanteConfirmacion(
                comprobanteConfirmacion
              );

            if (!comprobanteGuardado?.uri) {
              setGuardandoTransferencia(false);

              mostrarAlert({
                titulo:
                  'No se pudo guardar el comprobante',

                mensaje:
                  'La transferencia no fue confirmada. Intente nuevamente.',

                tipo:
                  'warning',

                textoConfirmar:
                  'Aceptar',
              });

              return;
            }
          }

        if (abonoTransferencia) {

          resultado =
            await confirmarTransferenciaAbono({
              abonoId:
                abonoTransferencia.abonoId,

              montoRecibido:
                valor,

              fechaTransferencia:
                formatearFechaTransferencia(
                  fechaTransferencia
                ),
            });

        } else {

          resultado =
            await confirmarTransferenciaEntrega({
              entregaId:
                entregaTransferencia.id,

              montoRecibido:
                valor,

              fechaTransferencia:
                formatearFechaTransferencia(
                  fechaTransferencia
                ),

              comprobante:
                comprobanteGuardado
                  ? {
                      ...comprobanteGuardado,

                      usuarioId:
                        usuarioActual?.id || null,

                      usuarioNombre:
                        usuarioActual?.nombre ||
                        'Usuario',
                    }
                  : null,
            });
        }

        setGuardandoTransferencia(
          false
        );

        if (!resultado.ok) {

          mostrarAlert({
            titulo:
              'No se pudo confirmar',

            mensaje:
              resultado.mensaje,

            tipo:
              'warning',

            textoConfirmar:
              'Aceptar',
          });

          return;
        }

        cerrarConfirmacionTransferencia();

        mostrarAlert({
          titulo:
            'Transferencia confirmada',

          mensaje:
            resultado.mensaje,

          tipo:
            'success',

          textoConfirmar:
            'Aceptar',
        });
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

    const abonosEntrega =
      obtenerAbonosEntrega(
        item.id
      );

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
      metodos.length === 0 &&
      abonosEntrega.length === 0;

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
              name="eye-outline"
              size={27}
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

            {/* SIN PAGO */}

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

            {/* PAGO ORIGINAL EN EFECTIVO */}

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

                        {/* PAGO ORIGINAL POR TRANSFERENCIA */}

            {metodos.includes(
              'Transferencia'
            ) && (

              <View
                style={
                  styles.transferenciaContainer
                }
              >

                <View
                  style={
                    styles.metodoItem
                  }
                >

                  <Ionicons
                    name="card-outline"
                    size={17}
                    color="#D69E00"
                  />

                  <Text
                    style={
                      styles.transferenciaTexto
                    }
                  >
                    Transferencia
                  </Text>

                  <Text
                    style={
                      styles.transferenciaMonto
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

                  {item.transferenciaConfirmada ===
                    true ? (

                    item.transferenciaConDiferencia ===
                      true ? (

                      <View
                        style={
                          styles.badgeTransferencia
                        }
                      >

                        <Text
                          style={
                            styles.badgeTransferenciaTexto
                          }
                        >
                          {
                            item.fechaConfirmacionTransferencia
                          }
                        </Text>

                      </View>

                    ) : (

                      <View
                        style={
                          styles.badgeTransferencia
                        }
                      >

                        <Ionicons
                          name="checkmark-circle"
                          size={13}
                          color="#A66F00"
                        />

                        <Text
                          style={
                            styles.badgeTransferenciaTexto
                          }
                        >
                          Confirmado
                        </Text>

                      </View>

                    )

                  ) : null}

                </View>

                {item.transferenciaConfirmada !==
                  true && (

                  <TouchableOpacity
                    style={
                      styles.botonConfirmarTransferencia
                    }
                    onPress={() =>
                      abrirConfirmacionTransferencia(
                        item
                      )
                    }
                  >

                    <Ionicons
                      name="checkmark-circle-outline"
                      size={17}
                      color="#7A5700"
                    />

                    <Text
                      style={
                        styles.textoConfirmarTransferencia
                      }
                    >
                      Confirmar transferencia
                    </Text>

                  </TouchableOpacity>

                )}

              </View>

            )}

            {/* ABONOS POSTERIORES */}

            {abonosEntrega.map(
              (
                abono,
                index
              ) => (

                <React.Fragment
                  key={`${abono.id}-${index}`}
                >

                  {abono.efectivo >
                    0 && (

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
                          abono.efectivo
                        ).toFixed(
                          2
                        )}
                      </Text>

                      <View
                        style={
                          styles.badgeAbono
                        }
                      >

                        <Text
                          style={
                            styles.badgeAbonoTexto
                          }
                        >
                          Abono {abono.fecha}
                        </Text>

                      </View>

                    </View>

                  )}

                  {abono.transferencia >
                  0 && (

                  <View
                    style={
                      styles.transferenciaContainer
                    }
                  >

                    <View
                      style={
                        styles.metodoItem
                      }
                    >

                      <Ionicons
                        name="card-outline"
                        size={17}
                        color="#D69E00"
                      />

                      <Text
                        style={
                          styles.transferenciaTexto
                        }
                      >
                        Transferencia
                      </Text>

                      <Text
                        style={
                          styles.transferenciaMonto
                        }
                      >
                        $
                        {Number(
                          abono.transferencia
                        ).toFixed(2)}
                      </Text>

                      <View
                        style={
                          styles.badgeAbono
                        }
                      >
                        <Text
                          style={
                            styles.badgeAbonoTexto
                          }
                        >
                          Abono
                        </Text>
                      </View>

                      {abono.transferenciaConfirmada ===
                        true && (

                        <View
                          style={
                            styles.badgeTransferencia
                          }
                        >

                          {abono.transferenciaConDiferencia !==
                            true && (
                            <Ionicons
                              name="checkmark-circle"
                              size={13}
                              color="#A66F00"
                            />
                          )}

                          <Text
                            style={
                              styles.badgeTransferenciaTexto
                            }
                          >
                            {abono.transferenciaConDiferencia ===
                            true
                              ? abono.fechaConfirmacionTransferencia
                              : 'Confirmado'}
                          </Text>

                        </View>

                      )}

                    </View>

                    {abono.transferenciaConfirmada !==
                      true &&
                      abono.tipo ===
                        'ESPECIFICO' && (

                      <TouchableOpacity
                        style={
                          styles.botonConfirmarTransferencia
                        }
                        onPress={() =>
                          abrirConfirmacionAbono(
                            abono
                          )
                        }
                      >

                        <Ionicons
                          name="checkmark-circle-outline"
                          size={17}
                          color="#7A5700"
                        />

                        <Text
                          style={
                            styles.textoConfirmarTransferencia
                          }
                        >
                          Confirmar transferencia
                        </Text>

                      </TouchableOpacity>

                    )}

                  </View>

                )}
                </React.Fragment>

              )
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

        <BotonHome navigation={navigation} />
      </View>

      {/* TITULO Y SALDO TOTAL */}

      <View
        style={
          styles.historialEncabezado
        }
      >

        <View
          style={
            styles.historialTituloFila
          }
        >

          <Text
            style={
              styles.historialTitulo
            }
          >
            Historial
          </Text>

          {abonoAutomaticoPendiente && (

            <TouchableOpacity
              style={
                styles.botonConfirmarHistorial
              }
              onPress={
                abrirConfirmacionAutomatica
              }
            >

              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color="#7A5700"
              />

              <Text
                style={
                  styles.textoConfirmarHistorial
                }
              >
                Confirmar transferencia
              </Text>

            </TouchableOpacity>

          )}

        </View>

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
        style={[
          styles.botonNuevaContainer,
          {
            paddingBottom: 9 + insets.bottom,
          },
        ]}
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

            {/* MODAL CONFIRMAR TRANSFERENCIA */}

            <Modal
              visible={
                modalTransferenciaVisible
              }
              transparent
              animationType="fade"
              onRequestClose={
                cerrarConfirmacionTransferencia
              }
            >

              <View
                style={
                  styles.modalFondo
                }
              >

                <View
                  style={
                    styles.modalTransferencia
                  }
                >

                  <View
                    style={
                      styles.modalIconoContainer
                    }
                  >

                    <Ionicons
                      name="card-outline"
                      size={28}
                      color="#A66F00"
                    />

                  </View>

                  <Text
                    style={
                      styles.modalTitulo
                    }
                  >
                    Confirmar transferencia
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitulo
                    }
                  >
                    Verifique la transferencia con la información recibida en el banco.
                  </Text>

                  <Text
                    style={
                      styles.modalLabel
                    }
                  >
                    Fecha de transferencia
                  </Text>

                  <TouchableOpacity
                    style={
                      styles.selectorFecha
                    }
                    onPress={
                      abrirCalendarioTransferencia
                    }
                  >

                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#A66F00"
                    />

                    <Text
                      style={[
                        styles.selectorFechaTexto,

                        !fechaTransferencia &&
                          styles.selectorFechaPlaceholder,
                      ]}
                    >
                      {fechaTransferencia
                        ? formatearFechaTransferencia(
                            fechaTransferencia
                          )
                        : 'Seleccionar fecha'}
                    </Text>

                  </TouchableOpacity>

                  <Text
                    style={
                      styles.modalLabel
                    }
                  >
                    Valor recibido
                  </Text>

                  <View
                    style={
                      styles.inputTransferenciaContainer
                    }
                  >

                    <Text
                      style={
                        styles.simboloDolar
                      }
                    >
                      $
                    </Text>

                    <TextInput
                      style={
                        styles.inputTransferencia
                      }
                      value={
                        valorTransferencia
                      }
                      onChangeText={
                        setValorTransferencia
                      }
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      editable={
                        !guardandoTransferencia
                      }
                    />

                  </View>

                  {entregaTransferencia && (
                    <View style={styles.comprobanteConfirmacionContainer}>

                      <Text style={styles.modalLabel}>
                        Comprobante (opcional)
                      </Text>

                      {!comprobanteConfirmacion ? (
                        <View style={styles.comprobanteConfirmacionBotones}>

                          <TouchableOpacity
                            style={styles.botonComprobanteConfirmacion}
                            onPress={tomarFotoConfirmacion}
                            disabled={guardandoTransferencia}
                          >
                            <Ionicons
                              name="camera-outline"
                              size={20}
                              color="#08752F"
                            />

                            <Text style={styles.textoComprobanteConfirmacion}>
                              Tomar foto
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.botonComprobanteConfirmacion}
                            onPress={elegirFotoConfirmacion}
                            disabled={guardandoTransferencia}
                          >
                            <Ionicons
                              name="images-outline"
                              size={20}
                              color="#08752F"
                            />

                            <Text style={styles.textoComprobanteConfirmacion}>
                              Galería
                            </Text>
                          </TouchableOpacity>

                        </View>
                      ) : (
                        <View style={styles.comprobanteConfirmacionSeleccionado}>
                          <Image
                            source={{
                              uri: comprobanteConfirmacion.uri,
                            }}
                            style={styles.comprobanteConfirmacionMiniatura}
                            resizeMode="cover"
                          />

                          <View style={styles.comprobanteConfirmacionInfo}>

                            <View style={styles.comprobanteConfirmacionTituloFila}>
                              <Text style={styles.comprobanteConfirmacionTitulo}>
                                Comprobante agregado
                              </Text>

                              <Ionicons
                                name="checkmark-circle"
                                size={21}
                                color="#08752F"
                              />
                            </View>

                            <Text
                              style={styles.comprobanteConfirmacionArchivo}
                              numberOfLines={1}
                            >
                              {comprobanteConfirmacion.fileName ||
                                comprobanteConfirmacion.uri
                                  ?.split('/')
                                  .pop() ||
                                'imagen.jpg'}
                            </Text>

                          </View>

                          <TouchableOpacity
                            style={styles.botonEliminarComprobanteConfirmacion}
                            onPress={eliminarFotoConfirmacion}
                            disabled={guardandoTransferencia}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={24}
                              color="#D71920"
                            />
                          </TouchableOpacity>

                        </View>
                      )}

                    </View>
                  )}

                  <View
                    style={
                      styles.modalBotones
                    }
                  >

                    <TouchableOpacity
                      style={
                        styles.botonCancelarTransferencia
                      }
                      onPress={
                        cerrarConfirmacionTransferencia
                      }
                      disabled={
                        guardandoTransferencia
                      }
                    >

                      <Text
                        style={
                          styles.textoCancelarTransferencia
                        }
                      >
                        Cancelar
                      </Text>

                    </TouchableOpacity>

                    <TouchableOpacity
                      style={
                        styles.botonGuardarTransferencia
                      }
                      onPress={
                        confirmarTransferencia
                      }
                      disabled={
                        guardandoTransferencia
                      }
                    >

                      <Ionicons
                        name="checkmark"
                        size={19}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.textoGuardarTransferencia
                        }
                      >
                        {guardandoTransferencia
                          ? 'Guardando...'
                          : 'Confirmar'}
                      </Text>

                    </TouchableOpacity>

                  </View>

                </View>

              </View>

            </Modal>

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

    badgeAbono: {
      backgroundColor:
        '#E7F3EA',
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
      marginLeft: 4,
    },

    badgeAbonoTexto: {
      color:
        '#08752F',
      fontSize: 9,
      fontWeight:
        '700',
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

        transferenciaContainer: {
      marginTop: 2,
    },

    transferenciaTexto: {
      fontSize: 12,
      fontWeight: '700',
      color: '#A66F00',
    },

    transferenciaMonto: {
      fontSize: 12,
      fontWeight: '700',
      color: '#A66F00',
    },

    badgeTransferencia: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#FFF4CC',
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
      marginLeft: 4,
    },

    badgeTransferenciaTexto: {
      color: '#A66F00',
      fontSize: 9,
      fontWeight: '700',
    },

    botonConfirmarTransferencia: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 7,
      backgroundColor: '#FFF4CC',
      borderWidth: 1,
      borderColor: '#E2B93B',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },

    textoConfirmarTransferencia: {
      color: '#7A5700',
      fontSize: 11,
      fontWeight: '700',
    },

    modalFondo: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },

    modalTransferencia: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      borderWidth: 2,
      borderColor: '#E2B93B',
    },

    modalIconoContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: '#FFF4CC',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 10,
    },

    modalTitulo: {
      fontSize: 20,
      fontWeight: '800',
      color: '#7A5700',
      textAlign: 'center',
    },

    modalSubtitulo: {
      marginTop: 6,
      marginBottom: 18,
      color: '#777777',
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
    },

    modalLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: '#555555',
      marginBottom: 6,
      marginTop: 7,
    },

    selectorFecha: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: '#E2B93B',
      borderRadius: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      backgroundColor: '#FFFDF5',
    },

    selectorFechaTexto: {
      color: '#333333',
      fontSize: 14,
      fontWeight: '600',
    },

    selectorFechaPlaceholder: {
      color: '#999999',
      fontWeight: '400',
    },

    inputTransferenciaContainer: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: '#E2B93B',
      borderRadius: 9,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFDF5',
      paddingHorizontal: 12,
    },

    simboloDolar: {
      color: '#A66F00',
      fontSize: 16,
      fontWeight: '800',
      marginRight: 5,
    },

    inputTransferencia: {
      flex: 1,
      fontSize: 15,
      color: '#222222',
      paddingVertical: 10,
    },

    modalBotones: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 20,
    },

    botonCancelarTransferencia: {
      flex: 1,
      minHeight: 46,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: '#D5D5D5',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
    },

    textoCancelarTransferencia: {
      color: '#666666',
      fontSize: 14,
      fontWeight: '700',
    },

    botonGuardarTransferencia: {
      flex: 1,
      minHeight: 46,
      borderRadius: 9,
      backgroundColor: '#D69E00',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
    },

    textoGuardarTransferencia: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },

    historialTituloFila: {
  flexDirection:
    'row',
  alignItems:
    'center',
  justifyContent:
    'space-between',
  marginBottom: 8,
  gap: 10,
},

botonConfirmarHistorial: {
  flexDirection:
    'row',
  alignItems:
    'center',
  justifyContent:
    'center',
  gap: 5,
  backgroundColor:
    '#FFF4CC',
  borderWidth: 1,
  borderColor:
    '#E2B93B',
  borderRadius: 8,
  paddingHorizontal: 9,
  paddingVertical: 6,
},

textoConfirmarHistorial: {
  color:
    '#7A5700',
  fontSize: 10,
  fontWeight:
    '700',
},

comprobanteConfirmacionContainer: {
  width: '100%',
  marginTop: 14,
},

comprobanteConfirmacionBotones: {
  flexDirection: 'row',
  gap: 10,
},

botonComprobanteConfirmacion: {
  flex: 1,
  minHeight: 45,
  borderWidth: 1,
  borderColor: '#B8D9C1',
  backgroundColor: '#F3FAF5',
  borderRadius: 9,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  paddingHorizontal: 8,
},

textoComprobanteConfirmacion: {
  color: '#08752F',
  fontSize: 11,
  fontWeight: '700',
},

comprobanteSeleccionado: {
  width: '100%',
  minHeight: 55,
  borderWidth: 1,
  borderColor: '#B8D9C1',
  backgroundColor: '#F3FAF5',
  borderRadius: 9,
  paddingHorizontal: 11,
  paddingVertical: 9,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},

comprobanteSeleccionadoInfo: {
  flex: 1,
  minWidth: 0,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

comprobanteSeleccionadoTexto: {
  flex: 1,
  minWidth: 0,
},

comprobanteSeleccionadoTitulo: {
  color: '#08752F',
  fontSize: 11,
  fontWeight: '700',
},

comprobanteSeleccionadoSubtitulo: {
  color: '#666666',
  fontSize: 9,
  marginTop: 2,
},

botonEliminarComprobante: {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: 8,
},

comprobanteConfirmacionSeleccionado: {
  minHeight: 78,
  borderWidth: 1,
  borderColor: '#D7ECDD',
  backgroundColor: '#F7FBF8',
  borderRadius: 12,
  padding: 9,
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 8,
},

comprobanteConfirmacionMiniatura: {
  width: 58,
  height: 58,
  borderRadius: 10,
  backgroundColor: '#E5E7EB',
},

comprobanteConfirmacionInfo: {
  flex: 1,
  marginLeft: 12,
  marginRight: 10,
  justifyContent: 'center',
},

comprobanteConfirmacionTituloFila: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 7,
  paddingRight: 45,
},

comprobanteConfirmacionTitulo: {
  fontSize: 14,
  fontWeight: '700',
  color: '#333333',
},

comprobanteConfirmacionArchivo: {
  fontSize: 11,
  color: '#777777',
  marginTop: 3,
},

botonEliminarComprobanteConfirmacion: {
  width: 48,
  height: 48,
  borderRadius: 10,
  backgroundColor: '#FFF0F0',
  justifyContent: 'center',
  alignItems: 'center',
},
  });