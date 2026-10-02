import React, {
  useMemo,
  useState,
} from 'react';

import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { useClientes } from '../context/ClientesContext';
import { useEntregas } from '../context/EntregasContext';

import BotonHome from '../components/BotonHome';
import { useToast } from '../context/ToastContext';
import { useUsuarios } from '../context/UsuariosContext';
import QRTransferencia from '../components/QRTransferencia';

export default function CuentasCobrarScreen({
  navigation,
}) {

  const { usuarioActual } = useUsuarios();

  const { clientes } =
    useClientes();

  const {
    entregas,
    registrarAbono,
  } = useEntregas();

  const { mostrarToast } =
    useToast();

  const [
    busqueda,
    setBusqueda,
  ] = useState('');

  const [
    clienteAbierto,
    setClienteAbierto,
  ] = useState(null);

    // ==========================================
    // ABONO DE DEUDA
    // ==========================================

    const [
      modalAbonoVisible,
      setModalAbonoVisible,
    ] = useState(false);

    const [
      clienteSeleccionado,
      setClienteSeleccionado,
    ] = useState(null);

    const [
      deudaSeleccionada,
      setDeudaSeleccionada,
    ] = useState(null);

    const [
      metodosAbono,
      setMetodosAbono,
    ] = useState([]);

    const [
      abonoEfectivo,
      setAbonoEfectivo,
    ] = useState('');

    const [
      abonoTransferencia,
      setAbonoTransferencia,
    ] = useState('');

    const [
      comprobanteAbono,
      setComprobanteAbono,
    ] = useState(null);

    const [
      guardandoAbono,
      setGuardandoAbono,
    ] = useState(false);

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

    const usaEfectivoAbono =
    metodosAbono.includes(
      'Efectivo'
    );

  const usaTransferenciaAbono =
    metodosAbono.includes(
      'Transferencia'
    );

  const efectivoAbonoNumerico =
    usaEfectivoAbono
      ? Number(
          String(
            abonoEfectivo
          ).replace(',', '.')
        ) || 0
      : 0;

  const transferenciaAbonoNumerico =
    usaTransferenciaAbono
      ? Number(
          String(
            abonoTransferencia
          ).replace(',', '.')
        ) || 0
      : 0;

  const totalAbono =
    efectivoAbonoNumerico +
    transferenciaAbonoNumerico;

  const abrirModalAbono = (
    cliente,
    deuda
  ) => {
    setClienteSeleccionado(
      cliente
    );

    setDeudaSeleccionada(
      deuda
    );

    setMetodosAbono([]);
    setAbonoEfectivo('');
    setAbonoTransferencia('');
    setComprobanteAbono(null);

    setModalAbonoVisible(
      true
    );
  };

  const cerrarModalAbono = () => {
    if (guardandoAbono) {
      return;
    }

    setModalAbonoVisible(
      false
    );

    setClienteSeleccionado(
      null
    );

    setDeudaSeleccionada(
      null
    );

    setMetodosAbono([]);
    setAbonoEfectivo('');
    setAbonoTransferencia('');
    setComprobanteAbono(null);
  };

  const seleccionarMetodoAbono = (
    metodo
  ) => {
    setMetodosAbono(
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
            setAbonoEfectivo('');
          }

          if (
            metodo ===
            'Transferencia'
          ) {
            setAbonoTransferencia('');
            setComprobanteAbono(null);
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

  const guardarComprobanteLocal = async (imagen) => {
    if (!imagen?.uri) {
      return null;
    }
  
    const carpetaComprobantes =
      `${FileSystem.documentDirectory}comprobantes/`;
  
    const informacionCarpeta =
      await FileSystem.getInfoAsync(
        carpetaComprobantes
      );
  
    if (!informacionCarpeta.exists) {
      await FileSystem.makeDirectoryAsync(
        carpetaComprobantes,
        {
          intermediates: true,
        }
      );
    }
  
    const extension =
      imagen.fileName
        ?.split('.')
        .pop()
        ?.toLowerCase() || 'jpg';
  
    const nombreArchivo =
      `comprobante_${cliente?.id || 'cliente'}_${Date.now()}.${extension}`;
  
    const uriDestino =
      `${carpetaComprobantes}${nombreArchivo}`;
  
    await FileSystem.copyAsync({
      from: imagen.uri,
      to: uriDestino,
    });
  
    return {
      uri: uriDestino,
      nombre: nombreArchivo,
    };
  };

  const tomarFotoComprobanteAbono = async () => {
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
      setComprobanteAbono(resultado.assets[0]);
    }
  };

  const elegirComprobanteGaleriaAbono = async () => {
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
      setComprobanteAbono(resultado.assets[0]);
    }
  };

  const eliminarComprobanteAbono = () => {
    setComprobanteAbono(null);
  };

  const guardarAbono = async () => {

    if (
      metodosAbono.length === 0
    ) {
      mostrarToast(
        'Seleccione al menos un método de pago.',
        'warning'
      );

      return;
    }

    if (totalAbono <= 0) {
      mostrarToast(
        'Ingrese un valor para el abono.',
        'warning'
      );

      return;
    }

    const saldoDeuda =
      Number(
        deudaSeleccionada
          ?.saldoPendiente || 0
      );

    if (
      Math.round(
        totalAbono * 100
      ) >
      Math.round(
        saldoDeuda * 100
      )
    ) {
      mostrarToast(
        'El abono no puede superar el saldo pendiente.',
        'warning'
      );

      return;
    }

    try {
      setGuardandoAbono(true);

      let comprobanteGuardado = null;
        if (
          transferenciaAbonoNumerico > 0 &&
          comprobanteAbono
        ) {
          comprobanteGuardado =
            await guardarComprobanteLocal(
              comprobanteAbono
            );

          if (!comprobanteGuardado?.uri) {
            mostrarToast(
              'No se pudo guardar el comprobante.',
              'warning'
            );
            return;
          }
        }

      const resultado = await registrarAbono({
        clienteId: clienteSeleccionado.id,
        entregaId: deudaSeleccionada.id,
        pagoEfectivo: efectivoAbonoNumerico,
        pagoTransferencia: transferenciaAbonoNumerico,
        fechaTrabajo: new Date(),

        comprobante:
          comprobanteGuardado
            ? {
                uri: comprobanteGuardado.uri,
                nombre: comprobanteGuardado.nombre,

                usuarioId:
                  usuarioActual?.id || null,

                usuarioNombre:
                  usuarioActual?.nombre ||
                  'Usuario',
              }
            : null,
      });

      if (!resultado?.ok) {
        mostrarToast(
          resultado?.mensaje ||
            'No se pudo registrar el abono.',
          'warning'
        );

        return;
      }

      cerrarModalAbono();

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
      setGuardandoAbono(
        false
      );
    }
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
  abrirModalAbono(
    item,
    saldo
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
        <BotonHome navigation={navigation} />
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

            <Modal
        visible={
          modalAbonoVisible
        }
        transparent
        animationType="fade"
        onRequestClose={
          cerrarModalAbono
        }
      >
        <View
          style={
            styles.modalFondo
          }
        >
          <View
            style={
              styles.modalAbono
            }
          >

            <View
              style={
                styles.modalHeader
              }
            >
              <View
                style={
                  styles.modalHeaderTitulo
                }
              >
                <Ionicons
                  name="wallet-outline"
                  size={23}
                  color="#D71920"
                />

                <Text
                  style={
                    styles.modalTitulo
                  }
                >
                  Abonar saldo pendiente
                </Text>
              </View>

              <TouchableOpacity
                onPress={
                  cerrarModalAbono
                }
                disabled={
                  guardandoAbono
                }
              >
                <Ionicons
                  name="close"
                  size={26}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.infoDeudaModal
              }
            >
              <Text
                style={
                  styles.clienteModal
                }
              >
                {clienteSeleccionado
                  ?.nombreMostrar ||
                  'Cliente'}
              </Text>

              <Text
                style={
                  styles.fechaModal
                }
              >
                Deuda del{' '}
                {deudaSeleccionada
                  ?.fecha ||
                  'Sin fecha'}
              </Text>
            </View>

            <View
              style={
                styles.saldoModal
              }
            >
              <Text
                style={
                  styles.saldoModalLabel
                }
              >
                Saldo pendiente
              </Text>

              <Text
                style={
                  styles.saldoModalValor
                }
              >
                {dinero(
                  deudaSeleccionada
                    ?.saldoPendiente
                )}
              </Text>
            </View>

            <Text
              style={
                styles.modalSeccionTitulo
              }
            >
              Método de pago
            </Text>

            <TouchableOpacity
              style={[
                styles.metodoAbono,

                usaEfectivoAbono &&
                  styles.metodoAbonoActivo,
              ]}
              onPress={() =>
                seleccionarMetodoAbono(
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
                  color="#D71920"
                />

                <Text
                  style={
                    styles.metodoAbonoTexto
                  }
                >
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
              <View
                style={
                  styles.pagoAbonoContainer
                }
              >
                <Text
                  style={
                    styles.pagoAbonoLabel
                  }
                >
                  Monto en efectivo
                </Text>

                <TextInput
                  style={
                    styles.pagoAbonoInput
                  }
                  value={
                    abonoEfectivo
                  }
                  onChangeText={
                    setAbonoEfectivo
                  }
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#999999"
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
                seleccionarMetodoAbono(
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
                  color="#D71920"
                />

                <Text
                  style={
                    styles.metodoAbonoTexto
                  }
                >
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
              <View style={styles.transferenciaAbonoContainer}>

                <View style={styles.pagoAbonoContainer}>
                  <View style={styles.tituloTransferenciaAbonoFila}>
                    <QRTransferencia />

                    <Text style={styles.pagoAbonoLabel}>
                      Monto por transferencia
                    </Text>
                  </View>

                  <TextInput
                    style={styles.pagoAbonoInput}
                    value={abonoTransferencia}
                    onChangeText={setAbonoTransferencia}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#999999"
                  />
                </View>

                {usaTransferenciaAbono &&
                    transferenciaAbonoNumerico > 0 &&
                    !comprobanteAbono && (
                      <View style={styles.avisoTransferenciaPendiente}>
                        <Text style={styles.avisoTransferenciaIcono}>
                          ⚠️
                        </Text>

                        <Text style={styles.avisoTransferenciaPendienteTexto}>
                          Transferencia pendiente de confirmación. Este valor no se incluirá
                          en el total diario hasta ser confirmado.
                        </Text>
                      </View>
                    )}

                <View style={styles.comprobanteAbonoContainer}>
                  <Text style={styles.comprobanteAbonoTitulo}>
                    Comprobante de transferencia
                  </Text>

                  <View style={styles.botonesComprobanteAbono}>
                    <TouchableOpacity
                      style={styles.botonComprobanteAbono}
                      onPress={tomarFotoComprobanteAbono}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={20}
                        color="#08752F"
                      />

                      <Text style={styles.botonComprobanteAbonoTexto}>
                        Tomar foto
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.botonComprobanteAbono}
                      onPress={elegirComprobanteGaleriaAbono}
                    >
                      <Ionicons
                        name="images-outline"
                        size={20}
                        color="#08752F"
                      />

                      <Text style={styles.botonComprobanteAbonoTexto}>
                        Galería
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {comprobanteAbono && (
                    <View style={styles.comprobanteAbonoAgregado}>
                      <Image
                        source={{
                          uri: comprobanteAbono.uri,
                        }}
                        style={styles.comprobanteAbonoMiniatura}
                      />

                      <View style={styles.comprobanteAbonoInfo}>
                        <View style={styles.comprobanteAbonoNombreFila}>
                          <Text style={styles.comprobanteAbonoNombre}>
                            Comprobante agregado
                          </Text>

                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color="#08752F"
                          />
                        </View>

                        <Text
                          style={styles.comprobanteAbonoArchivo}
                          numberOfLines={1}
                        >
                          {comprobanteAbono.fileName ||
                            'Imagen del comprobante'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.botonEliminarComprobanteAbono}
                        onPress={eliminarComprobanteAbono}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#D71920"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

              </View>
            )}

            <View
              style={
                styles.totalAbonoFila
              }
            >
              <Text
                style={
                  styles.totalAbonoLabel
                }
              >
                Total abonado:
              </Text>

              <Text
                style={
                  styles.totalAbonoValor
                }
              >
                ${totalAbono.toFixed(2)}
              </Text>
            </View>

            <View
              style={
                styles.modalBotones
              }
            >
              <TouchableOpacity
                style={
                  styles.botonCancelarAbono
                }
                onPress={
                  cerrarModalAbono
                }
                disabled={
                  guardandoAbono
                }
              >
                <Text
                  style={
                    styles.botonCancelarAbonoTexto
                  }
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.botonConfirmarAbono,

                  guardandoAbono &&
                    styles.botonAbonoDeshabilitado,
                ]}
                onPress={
                  guardarAbono
                }
                disabled={
                  guardandoAbono
                }
              >
                <Ionicons
                  name="wallet-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.botonConfirmarAbonoTexto
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

        // ========================================
    // MODAL ABONO
    // ========================================

    modalFondo: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.45)',
      justifyContent:
        'center',
      paddingHorizontal: 18,
    },

    modalAbono: {
      width: '100%',
      backgroundColor:
        '#FFFFFF',
      borderRadius: 16,
      padding: 16,
    },

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
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

    infoDeudaModal: {
      marginBottom: 10,
    },

    clienteModal: {
      color: '#333333',
      fontSize: 14,
      fontWeight: '700',
    },

    fechaModal: {
      color: '#777777',
      fontSize: 11,
      marginTop: 3,
    },

    saldoModal: {
      minHeight: 55,
      borderWidth: 1,
      borderColor: '#F0CACA',
      borderRadius: 9,
      backgroundColor: '#FFF7F7',
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 12,
    },

    saldoModalLabel: {
      color: '#666666',
      fontSize: 12,
      fontWeight: '700',
    },

    saldoModalValor: {
      color: '#D71920',
      fontSize: 20,
      fontWeight: '800',
    },

    modalSeccionTitulo: {
      color: '#D71920',
      fontSize: 14,
      fontWeight: '800',
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
      justifyContent:
        'space-between',
    },

    metodoAbonoActivo: {
      backgroundColor: '#FFF0F0',
      borderColor: '#D71920',
    },

    metodoIzquierda: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
      justifyContent:
        'space-between',
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
      justifyContent:
        'space-between',
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

    transferenciaAbonoContainer: {
      width: '100%',
    },

    comprobanteAbonoContainer: {
      marginTop: 15,
      width: '100%',
    },

    comprobanteAbonoTitulo: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
      marginBottom: 10,
    },

    botonesComprobanteAbono: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
    },

    botonComprobanteAbono: {
      flex: 1,
      minHeight: 45,
      borderWidth: 1,
      borderColor: '#08752F',
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 8,
    },

    botonComprobanteAbonoTexto: {
      color: '#08752F',
      fontSize: 13,
      fontWeight: '600',
    },

    comprobanteAbonoAgregado: {
      width: '100%',
      minHeight: 70,
      marginTop: 12,
      padding: 8,
      borderRadius: 10,
      backgroundColor: '#F0F8F2',
      flexDirection: 'row',
      alignItems: 'center',
    },

    comprobanteAbonoMiniatura: {
      width: 54,
      height: 54,
      borderRadius: 8,
      resizeMode: 'cover',
    },

    comprobanteAbonoInfo: {
      flex: 1,
      marginLeft: 10,
      marginRight: 6,
    },

    comprobanteAbonoNombreFila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    comprobanteAbonoNombre: {
      fontSize: 13,
      fontWeight: '600',
      color: '#333',
      flexShrink: 1,
    },

    comprobanteAbonoArchivo: {
      fontSize: 11,
      color: '#777',
      marginTop: 4,
    },

    botonEliminarComprobanteAbono: {
      width: 38,
      height: 38,
      borderRadius: 8,
      backgroundColor: '#FDECEC',
      alignItems: 'center',
      justifyContent: 'center',
    },

    avisoTransferenciaPendiente: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 7,
      marginTop: 8,
      marginBottom: 5,
      paddingHorizontal: 10,
      paddingVertical: 9,
      backgroundColor: '#FFF7ED',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#FED7AA',
    },

    avisoTransferenciaIcono: {
      fontSize: 16,
      lineHeight: 18,
    },

    avisoTransferenciaPendienteTexto: {
      flex: 1,
      fontSize: 12,
      lineHeight: 17,
      color: '#9A5B13',
    },

    tituloTransferenciaAbonoFila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flex: 1,
    },
  });