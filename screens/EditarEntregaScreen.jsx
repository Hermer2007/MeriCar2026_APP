import React, {useEffect, useMemo, useState,} from 'react';

import {
  Image,
  Modal,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {Ionicons,} from '@expo/vector-icons';
import {useSafeAreaInsets,} from 'react-native-safe-area-context';
import {useEntregas,} from '../context/EntregasContext';

import BotonHome from '../components/BotonHome';
import * as FileSystem from 'expo-file-system/legacy';

export default function EditarEntregaScreen({
  navigation,
  route,
}) {

  const insets =
    useSafeAreaInsets();
  
  const [
    comprobanteDisponible,
    setComprobanteDisponible,
  ] = useState(false);

  const [
    modalComprobante,
    setModalComprobante,
  ] = useState(false);

  const cliente =
    route.params?.cliente;

  const entregaRecibida =
    route.params?.entrega;

  const {
    entregas,
    obtenerAbonosEntrega,
  } = useEntregas();

  // ==========================================
  // ENTREGA ACTUAL
  // ==========================================

  const entrega =
    useMemo(() => {

      if (
        !entregaRecibida?.id
      ) {
        return entregaRecibida;
      }

      const actual =
        entregas.find(
          (item) =>
            String(item.id) ===
            String(
              entregaRecibida.id
            )
        );

      return (
        actual ||
        entregaRecibida
      );

    }, [
      entregas,
      entregaRecibida,
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
  // FORMATO DINERO
  // ==========================================

  const dinero = (
    valor
  ) => {

    return `$${(
      Number(valor) || 0
    ).toFixed(2)}`;
  };

  // ==========================================
  // CONVERTIR TIMESTAMP A DATE
  // ==========================================

  const convertirFecha = (
    valor
  ) => {

    if (!valor) {
      return null;
    }

    if (
      typeof valor.toDate ===
      'function'
    ) {
      return valor.toDate();
    }

    if (
      valor instanceof Date
    ) {
      return valor;
    }

    if (
      typeof valor ===
        'object' &&
      valor.seconds !==
        undefined
    ) {
      return new Date(
        valor.seconds * 1000
      );
    }

    return null;
  };

  // ==========================================
  // FORMATEAR FECHA
  // ==========================================

  const formatearFecha = (
    valor
  ) => {

    const fecha =
      convertirFecha(
        valor
      );

    if (!fecha) {
      return 'Sin fecha';
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

    return (
      `${dia}/${mes}/${anio}`
    );
  };

  // ==========================================
  // FORMATEAR HORA
  // ==========================================

  const formatearHora = (
    valor
  ) => {

    const fecha =
      convertirFecha(
        valor
      );

    if (!fecha) {
      return 'Sin hora';
    }

    const horas =
      String(
        fecha.getHours()
      ).padStart(
        2,
        '0'
      );

    const minutos =
      String(
        fecha.getMinutes()
      ).padStart(
        2,
        '0'
      );

    const segundos =
      String(
        fecha.getSeconds()
      ).padStart(
        2,
        '0'
      );

    return (
      `${horas}:${minutos}:${segundos}`
    );
  };

  // ==========================================
  // REGISTRO ORIGINAL
  // ==========================================

  const fechaRegistroOriginal =
    entrega?.fechaCreacion
      ? formatearFecha(
          entrega.fechaCreacion
        )
      : entrega?.fecha ||
        'Sin fecha';

  const horaRegistroOriginal =
    entrega?.fechaCreacion
      ? formatearHora(
          entrega.fechaCreacion
        )
      : entrega?.hora ||
        'Sin hora';

  // ==========================================
  // FECHA DE LA ENTREGA
  // ==========================================

  const fechaEntrega =
    entrega?.fecha ||
    'Sin fecha';

  const horaEntrega =
    entrega?.hora ||
    'Sin hora';

  // ==========================================
  // PRODUCTOS
  // ==========================================

  const productosEntrega =
    Array.isArray(
      entrega?.productos
    )
      ? entrega.productos
      : [];

  // ==========================================
  // VALORES
  // ==========================================

  const total =
    Number(
      entrega?.total
    ) || 0;

  const abonoRegistrado =
    Number(
      entrega?.abona
    ) || 0;

  const saldoPendiente =
    Number(
      entrega?.saldoPendiente
    ) || 0;

  const pagoEfectivo =
    Number(
      entrega?.pagoEfectivo
    ) || 0;

  const pagoTransferencia =
    Number(
      entrega?.pagoTransferencia
    ) || 0;

  // ==========================================
  // MÉTODOS DE PAGO
  // ==========================================

  const metodosPago =
    useMemo(() => {

      const metodos = [];

      if (
        pagoEfectivo > 0
      ) {
        metodos.push(
          'Efectivo'
        );
      }

      if (
        pagoTransferencia > 0
      ) {
        metodos.push(
          'Transferencia'
        );
      }

      if (
        metodos.length === 0 &&
        Array.isArray(
          entrega?.metodosPago
        )
      ) {
        return entrega.metodosPago;
      }

      return metodos;

    }, [
      pagoEfectivo,
      pagoTransferencia,
      entrega,
    ]);

  const textoMetodosPago =
    metodosPago.length > 0
      ? metodosPago.join(
          ' + '
        )
      : 'Sin método de pago';

  // ==========================================
  // TRANSFERENCIA
  // ==========================================

  const tieneTransferencia =
    pagoTransferencia > 0;

  const transferenciaConfirmada =
    entrega
      ?.transferenciaConfirmada ===
    true;

  const transferenciaConDiferencia =
    entrega
      ?.transferenciaConDiferencia ===
    true;

  const fechaConfirmacionTransferencia =
    entrega
      ?.fechaConfirmacionTransferencia ||
    null;
  
  // ==========================================
  // COMPROBANTE LOCAL
  // ==========================================

  useEffect(() => {

    const verificarComprobante = async () => {

      try {

        if (
          !entrega?.tieneComprobanteTransferencia ||
          !entrega?.comprobanteTransferencia
        ) {
          setComprobanteDisponible(false);
          return;
        }

        const informacion =
          await FileSystem.getInfoAsync(
            entrega.comprobanteTransferencia
          );

        setComprobanteDisponible(
          informacion.exists
        );

      } catch (error) {

        setComprobanteDisponible(false);

      }

    };

    verificarComprobante();

  }, [
    entrega?.id,
    entrega?.comprobanteTransferencia,
    entrega?.tieneComprobanteTransferencia,
  ]);

  // ==========================================
  // ABONOS POSTERIORES
  // ==========================================

  const abonosPosteriores =
    useMemo(() => {

      if (
        !entrega?.id ||
        !obtenerAbonosEntrega
      ) {
        return [];
      }

      return (
        obtenerAbonosEntrega(
          entrega.id
        ) || []
      );

    }, [
      entrega,
      obtenerAbonosEntrega,
    ]);

  // ==========================================
  // HISTORIAL DE REEMPLAZOS
  // ==========================================

  const historialReemplazos =
    useMemo(() => {

      if (
        !Array.isArray(
          entrega
            ?.historialReemplazos
        )
      ) {
        return [];
      }

      return (
        entrega
          .historialReemplazos
          .map(
            (
              reemplazo,
              index
            ) => ({
              id:
                `reemplazo-${index}`,

              fecha:
                formatearFecha(
                  reemplazo
                ),

              hora:
                formatearHora(
                  reemplazo
                ),
            })
          )
      );

    }, [
      entrega,
    ]);

  // ==========================================
  // TOTAL DE REEMPLAZOS
  // ==========================================

  const numeroReemplazos =
    historialReemplazos.length >
    0
      ? historialReemplazos.length
      : Number(
          entrega
            ?.numeroEdiciones
        ) || 0;

  // ==========================================
  // RENDER
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
            Detalle de entrega
          </Text>

          <Text
            style={
              styles.subtituloHeader
            }
          >
            Cliente: {nombreCliente}
          </Text>

        </View>

        <BotonHome
          navigation={
            navigation
          }
        />

      </View>

      <ScrollView
        contentContainerStyle={[
          styles.contenido,
          {
            paddingBottom:
              35 +
              insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* SOLO LECTURA */}

        <View
          style={
            styles.aviso
          }
        >

          <Ionicons
            name="eye-outline"
            size={25}
            color="#08752F"
          />

          <View
            style={
              styles.avisoContenido
            }
          >

            <Text
              style={
                styles.avisoTitulo
              }
            >
              Información de la entrega
            </Text>

            <Text
              style={
                styles.avisoTexto
              }
            >
              Este registro es solo de consulta.
            </Text>

          </View>

          <Ionicons
            name="lock-closed-outline"
            size={19}
            color="#777777"
          />

        </View>

        {/* FECHA DE ENTREGA */}

        <Text
          style={
            styles.tituloSeccion
          }
        >
          Fecha de entrega
        </Text>

        <View
          style={
            styles.fechaEntregaCard
          }
        >

          <View
            style={
              styles.fechaDato
            }
          >

            <Ionicons
              name="calendar-outline"
              size={21}
              color="#08752F"
            />

            <View>

              <Text
                style={
                  styles.datoLabel
                }
              >
                Fecha
              </Text>

              <Text
                style={
                  styles.datoValor
                }
              >
                {fechaEntrega}
              </Text>

            </View>

          </View>

          <View
            style={
              styles.fechaDato
            }
          >

            <Ionicons
              name="time-outline"
              size={21}
              color="#08752F"
            />

            <View>

              <Text
                style={
                  styles.datoLabel
                }
              >
                Hora
              </Text>

              <Text
                style={
                  styles.datoValor
                }
              >
                {horaEntrega}
              </Text>

            </View>

          </View>

        </View>

        {/* PRODUCTOS */}

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

          {productosEntrega.length ===
          0 ? (

            <View
              style={
                styles.sinDatos
              }
            >

              <Text
                style={
                  styles.sinDatosTexto
                }
              >
                No hay productos registrados.
              </Text>

            </View>

          ) : (

            productosEntrega.map(
              (
                producto,
                index
              ) => {

                const cantidad =
                  Number(
                    producto.cantidad
                  ) || 0;

                const precio =
                  Number(
                    producto.precio
                  ) || 0;

                const subtotal =
                  cantidad *
                  precio;

                return (

                  <View
                    key={
                      producto.id ||
                      producto.productoId ||
                      `${producto.nombre}-${index}`
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
                        {producto.nombre}
                      </Text>

                      <Text
                        style={
                          styles.productoDetalle
                        }
                      >
                        {cantidad}{' '}
                        {cantidad === 1
                          ? 'unidad'
                          : 'unidades'}
                        {'  ×  '}
                        {dinero(
                          precio
                        )}
                      </Text>

                    </View>

                    <Text
                      style={
                        styles.productoSubtotal
                      }
                    >
                      {dinero(
                        subtotal
                      )}
                    </Text>

                  </View>

                );
              }
            )

          )}

        </View>

        {/* TOTAL */}

        <View
          style={
            styles.totalCard
          }
        >

          <Text
            style={
              styles.totalLabel
            }
          >
            Total
          </Text>

          <Text
            style={
              styles.totalValor
            }
          >
            {dinero(
              total
            )}
          </Text>

        </View>

        {/* ABONO REGISTRADO */}

        <Text
          style={
            styles.tituloSeccion
          }
        >
          Pago de la entrega
        </Text>

        <View
          style={
            styles.abonoCard
          }
        >

          <View
            style={
              styles.abonoIzquierda
            }
          >

            <View
              style={
                styles.abonoTituloFila
              }
            >

              <Ionicons
                name="wallet-outline"
                size={21}
                color="#08752F"
              />

              <Text
                style={
                  styles.abonoTitulo
                }
              >
                Abono registrado
              </Text>

            </View>

            <Text
              style={
                styles.abonoMetodo
              }
            >
              {textoMetodosPago}
            </Text>

          </View>

          <Text
            style={
              styles.abonoValor
            }
          >
            {dinero(
              abonoRegistrado
            )}
          </Text>

        </View>

        {/* DESGLOSE DE PAGO */}

        {(pagoEfectivo > 0 ||
          pagoTransferencia >
            0) && (

          <View
            style={
              styles.metodosContainer
            }
          >

            {pagoEfectivo >
              0 && (

              <View
                style={
                  styles.metodoFila
                }
              >

                <View
                  style={
                    styles.metodoNombre
                  }
                >

                  <Ionicons
                    name="cash-outline"
                    size={20}
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

                <Text
                  style={
                    styles.metodoValor
                  }
                >
                  {dinero(
                    pagoEfectivo
                  )}
                </Text>

              </View>

            )}

            {pagoTransferencia >
              0 && (

              <View
                style={
                  styles.metodoFila
                }
              >

                <View
                  style={
                    styles.metodoNombre
                  }
                >

                  <Ionicons
                    name="swap-horizontal-outline"
                    size={20}
                    color="#08752F"
                  />

                  <View>

                    <Text
                      style={
                        styles.metodoTexto
                      }
                    >
                      Transferencia
                    </Text>

                    <Text
                      style={[
                        styles.estadoTransferencia,

                        transferenciaConfirmada
                          ? styles.estadoConfirmado
                          : styles.estadoPendiente,
                      ]}
                    >

                      {transferenciaConfirmada
                        ? transferenciaConDiferencia &&
                          fechaConfirmacionTransferencia
                          ? `Confirmada - ${fechaConfirmacionTransferencia}`
                          : 'Confirmada'
                        : 'Pendiente de confirmación'}

                    </Text>

                  </View>

                </View>

                <Text
                  style={
                    styles.metodoValor
                  }
                >
                  {dinero(
                    pagoTransferencia
                  )}
                </Text>

              </View>

            )}

          </View>

        )}

        {/* SALDO */}

        <View
          style={
            styles.resumenContainer
          }
        >

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
              Total
            </Text>

            <Text
              style={
                styles.resumenValor
              }
            >
              {dinero(
                total
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
              Abonado
            </Text>

            <Text
              style={
                styles.abonadoValor
              }
            >
              {dinero(
                abonoRegistrado
              )}
            </Text>

          </View>

          <View
            style={[
              styles.resumenFila,
              styles.resumenUltimaFila,
            ]}
          >

            <Text
              style={
                styles.resumenLabel
              }
            >
              Saldo pendiente
            </Text>

            <Text
              style={[
                styles.saldoValor,

                saldoPendiente <=
                  0 &&
                  styles.saldoCero,
              ]}
            >
              {dinero(
                saldoPendiente
              )}
            </Text>

          </View>

        </View>

        {/* COMPROBANTE DE TRANSFERENCIA */}

          {entrega?.tieneComprobanteTransferencia &&
            tieneTransferencia && (
            <>
              <Text style={styles.tituloSeccion}>
                Comprobante de transferencia
              </Text>

              <View style={styles.comprobanteCard}>

                {/* ENCABEZADO */}

                <View style={styles.comprobanteHeader}>

                  <View style={styles.comprobanteHeaderIzquierda}>

                    <View style={styles.comprobanteIcono}>
                      <Ionicons
                        name="image-outline"
                        size={25}
                        color="#08752F"
                      />
                    </View>

                    <View>
                      <Text style={styles.comprobanteRegistrado}>
                        Comprobante registrado
                      </Text>

                      <Text style={styles.comprobanteFecha}>
                        {entrega?.fecha || 'Sin fecha'}
                        {'  •  '}
                        {entrega?.hora || ''}
                      </Text>
                    </View>

                  </View>

                  <TouchableOpacity
                    style={[
                      styles.botonVerComprobante,
                      !comprobanteDisponible &&
                        styles.botonVerComprobanteDeshabilitado,
                    ]}
                    disabled={!comprobanteDisponible}
                    onPress={() =>
                      setModalComprobante(true)
                    }
                  >
                    <Ionicons
                      name={
                        comprobanteDisponible
                          ? 'eye'
                          : 'eye-off'
                      }
                      size={18}
                      color={
                        comprobanteDisponible
                          ? '#08752F'
                          : '#999999'
                      }
                    />

                    <Text
                      style={[
                        styles.textoVerComprobante,
                        !comprobanteDisponible &&
                          styles.textoVerComprobanteDeshabilitado,
                      ]}
                    >
                      Ver comprobante
                    </Text>
                  </TouchableOpacity>

                </View>


                {/* CONTENIDO */}

                <View style={styles.comprobanteContenido}>

                  {/* FOTO */}

                  {comprobanteDisponible ? (

                    <Image
                      source={{
                        uri: entrega.comprobanteTransferencia,
                      }}
                      style={styles.comprobanteImagen}
                      resizeMode="cover"
                    />

                  ) : (

                    <View style={styles.comprobanteNoDisponible}>

                      <Ionicons
                        name="image-outline"
                        size={35}
                        color="#888888"
                      />

                      <Text
                        style={
                          styles.comprobanteNoDisponibleTitulo
                        }
                      >
                        Comprobante no disponible
                        {'\n'}
                        en este dispositivo
                      </Text>

                      <Text
                        style={
                          styles.comprobanteNoDisponibleTexto
                        }
                      >
                        Foto del comprobante tomada por{' '}
                        {entrega?.comprobanteTomadoPorNombre ||
                          'otro usuario'}
                      </Text>

                    </View>

                  )}


                  {/* INFORMACIÓN */}

                  <View style={styles.comprobanteDatos}>

                    <Text style={styles.comprobanteMontoLabel}>
                      Monto por transferencia
                    </Text>

                    <Text style={styles.comprobanteMontoValor}>
                      {dinero(pagoTransferencia)}
                    </Text>


                    <View style={styles.comprobanteConfirmacion}>

                      <View style={styles.comprobanteCheck}>
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color="#FFFFFF"
                        />
                      </View>

                      <View style={styles.comprobanteConfirmacionInfo}>

                        <Text
                          style={
                            styles.comprobanteConfirmacionTitulo
                          }
                        >
                          Transferencia confirmada
                        </Text>

                        <Text
                          style={
                            styles.comprobanteConfirmacionTexto
                          }
                        >
                          Comprobante registrado como respaldo.
                        </Text>

                      </View>

                    </View>

                  </View>

                </View>

              </View>
            </>
          )}

        {/* ABONOS POSTERIORES */}

        {abonosPosteriores.length >
          0 && (

          <>

            <Text
              style={
                styles.tituloSeccion
              }
            >
              Abonos posteriores
            </Text>

            <View
              style={
                styles.abonosPosterioresCard
              }
            >

              {abonosPosteriores.map(
                (
                  abono,
                  index
                ) => {

                  const monto =
                    Number(
                      abono.monto
                    ) || 0;

                  const efectivo =
                    Number(
                      abono.pagoEfectivo
                    ) || 0;

                  const transferencia =
                    Number(
                      abono.pagoTransferencia
                    ) || 0;

                  const metodo =

                    efectivo > 0 &&
                    transferencia > 0
                      ? 'Efectivo + Transferencia'

                      : efectivo > 0
                        ? 'Efectivo'

                        : transferencia > 0
                          ? 'Transferencia'

                          : 'Abono';

                  return (

                    <View
                      key={
                        abono.id ||
                        `abono-${index}`
                      }
                      style={[
                        styles.abonoPosteriorFila,

                        index ===
                          abonosPosteriores.length -
                            1 &&
                          styles.ultimaFila,
                      ]}
                    >

                      <View
                        style={
                          styles.abonoPosteriorInfo
                        }
                      >

                        <Text
                          style={
                            styles.abonoPosteriorFecha
                          }
                        >
                          {abono.fecha ||
                            'Sin fecha'}
                        </Text>

                        <Text
                          style={
                            styles.abonoPosteriorMetodo
                          }
                        >
                          {metodo}
                        </Text>

                      </View>

                      <Text
                        style={
                          styles.abonoPosteriorValor
                        }
                      >
                        {dinero(
                          monto
                        )}
                      </Text>

                    </View>

                  );
                }
              )}

            </View>

          </>

        )}

        {/* HISTORIAL DEL REGISTRO */}

        <Text
          style={
            styles.tituloSeccion
          }
        >
          Historial del registro
        </Text>

        {/* REGISTRO ORIGINAL */}

        <View
          style={
            styles.historialCard
          }
        >

          <View
            style={
              styles.historialIcono
            }
          >

            <Ionicons
              name="document-text-outline"
              size={23}
              color="#08752F"
            />

          </View>

          <View
            style={
              styles.historialInfo
            }
          >

            <Text
              style={
                styles.historialTitulo
              }
            >
              Registro original
            </Text>

            <Text
              style={
                styles.historialDescripcion
              }
            >
              Momento en que se registró esta entrega.
            </Text>

            <View
              style={
                styles.historialFechaFila
              }
            >

              <View
                style={
                  styles.historialDato
                }
              >

                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color="#666666"
                />

                <Text
                  style={
                    styles.historialFecha
                  }
                >
                  {fechaRegistroOriginal}
                </Text>

              </View>

              <View
                style={
                  styles.historialDato
                }
              >

                <Ionicons
                  name="time-outline"
                  size={16}
                  color="#666666"
                />

                <Text
                  style={
                    styles.historialFecha
                  }
                >
                  {horaRegistroOriginal}
                </Text>

              </View>

            </View>

          </View>

        </View>

        {/* REEMPLAZOS */}

        {historialReemplazos.length >
          0 ? (

          <>

            <View
              style={
                styles.reemplazosEncabezado
              }
            >

              <Text
                style={
                  styles.reemplazosTitulo
                }
              >
                Reemplazos
              </Text>

              <View
                style={
                  styles.contadorReemplazos
                }
              >

                <Text
                  style={
                    styles.contadorReemplazosTexto
                  }
                >
                  {numeroReemplazos}
                </Text>

              </View>

            </View>

            {historialReemplazos.map(
              (
                reemplazo,
                index
              ) => (

                <View
                  key={
                    reemplazo.id
                  }
                  style={
                    styles.reemplazoCard
                  }
                >

                  <View
                    style={
                      styles.reemplazoNumero
                    }
                  >

                    <Text
                      style={
                        styles.reemplazoNumeroTexto
                      }
                    >
                      {index + 1}
                    </Text>

                  </View>

                  <View
                    style={
                      styles.reemplazoInfo
                    }
                  >

                    <Text
                      style={
                        styles.reemplazoTitulo
                      }
                    >
                      Reemplazo de entrega
                    </Text>

                    <View
                      style={
                        styles.historialFechaFila
                      }
                    >

                      <View
                        style={
                          styles.historialDato
                        }
                      >

                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color="#B76E00"
                        />

                        <Text
                          style={
                            styles.reemplazoFecha
                          }
                        >
                          {reemplazo.fecha}
                        </Text>

                      </View>

                      <View
                        style={
                          styles.historialDato
                        }
                      >

                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#B76E00"
                        />

                        <Text
                          style={
                            styles.reemplazoFecha
                          }
                        >
                          {reemplazo.hora}
                        </Text>

                      </View>

                    </View>

                  </View>

                </View>

              )
            )}

          </>

        ) : (

          <View
            style={
              styles.sinReemplazos
            }
          >

            <Ionicons
              name="checkmark-circle-outline"
              size={21}
              color="#08752F"
            />

            <Text
              style={
                styles.sinReemplazosTexto
              }
            >
              Esta entrega no ha sido reemplazada.
            </Text>

          </View>

        )}

        {/* MENSAJE FINAL */}

        <View
          style={
            styles.notaFinal
          }
        >

          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#08752F"
          />

          <Text
            style={
              styles.notaFinalTexto
            }
          >
            Para corregir una entrega,
            registre nuevamente al mismo
            cliente en la misma fecha y
            utilice la opción Reemplazar
            entrega.
          </Text>

        </View>

      </ScrollView>

      {/* MODAL COMPROBANTE */}

        <Modal
          visible={modalComprobante}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() =>
            setModalComprobante(false)
          }
        >
          <View style={styles.modalComprobanteFondo}>

            <View style={styles.modalComprobanteContenido}>

              <View style={styles.modalComprobanteHeader}>

                <Text style={styles.modalComprobanteTitulo}>
                  Comprobante de transferencia
                </Text>

                <TouchableOpacity
                  style={styles.modalComprobanteCerrar}
                  onPress={() =>
                    setModalComprobante(false)
                  }
                >
                  <Ionicons
                    name="close"
                    size={27}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

              </View>

              {comprobanteDisponible &&
                entrega?.comprobanteTransferencia && (

                  <Image
                    source={{
                      uri: entrega.comprobanteTransferencia,
                    }}
                    style={styles.modalComprobanteImagen}
                    resizeMode="contain"
                  />

                )}

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

    // ==========================================
    // HEADER
    // ==========================================

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
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
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
    },

    // ==========================================
    // AVISO
    // ==========================================

    aviso: {
      minHeight: 66,
      backgroundColor:
        '#EDF7F0',
      borderWidth: 1,
      borderColor:
        '#D7EBDD',
      borderRadius: 10,
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 13,
      gap: 10,
      marginBottom: 5,
    },

    avisoContenido: {
      flex: 1,
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

    // ==========================================
    // SECCIONES
    // ==========================================

    tituloSeccion: {
      fontSize: 15,
      fontWeight:
        '700',
      color:
        '#08752F',
      marginTop: 18,
      marginBottom: 8,
    },

    // ==========================================
    // FECHA
    // ==========================================

    fechaEntregaCard: {
      minHeight: 65,
      backgroundColor:
        '#F8F8F8',
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      borderRadius: 10,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      paddingHorizontal: 15,
    },

    fechaDato: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 8,
    },

    datoLabel: {
      color:
        '#777777',
      fontSize: 9,
    },

    datoValor: {
      color:
        '#222222',
      fontSize: 12,
      fontWeight:
        '700',
      marginTop: 1,
    },

    // ==========================================
    // PRODUCTOS
    // ==========================================

    productosContainer: {
      borderWidth: 1,
      borderColor:
        '#E3E3E3',
      borderRadius: 10,
      overflow:
        'hidden',
    },

    productoFila: {
      minHeight: 66,
      borderBottomWidth: 1,
      borderBottomColor:
        '#EEEEEE',
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 13,
    },

    ultimaFila: {
      borderBottomWidth: 0,
    },

    productoInfo: {
      flex: 1,
    },

    productoNombre: {
      fontSize: 13,
      fontWeight:
        '700',
      color:
        '#222222',
    },

    productoDetalle: {
      fontSize: 10,
      color:
        '#777777',
      marginTop: 4,
    },

    productoSubtotal: {
      fontSize: 14,
      fontWeight:
        '700',
      color:
        '#08752F',
    },

    sinDatos: {
      padding: 18,
      alignItems:
        'center',
    },

    sinDatosTexto: {
      color:
        '#777777',
      fontSize: 12,
    },

    // ==========================================
    // TOTAL
    // ==========================================

    totalCard: {
      minHeight: 61,
      marginTop: 10,
      backgroundColor:
        '#F6FAF7',
      borderRadius: 10,
      paddingHorizontal: 14,
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    totalLabel: {
      fontSize: 14,
      fontWeight:
        '700',
    },

    totalValor: {
      fontSize: 21,
      fontWeight:
        '800',
      color:
        '#08752F',
    },

    // ==========================================
    // ABONO
    // ==========================================

    abonoCard: {
      minHeight: 70,
      backgroundColor:
        '#F6FAF7',
      borderWidth: 1,
      borderColor:
        '#DCE9DF',
      borderRadius: 10,
      paddingHorizontal: 13,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    abonoIzquierda: {
      flex: 1,
    },

    abonoTituloFila: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 7,
    },

    abonoTitulo: {
      fontSize: 13,
      fontWeight:
        '700',
    },

    abonoMetodo: {
      color:
        '#777777',
      fontSize: 10,
      marginTop: 5,
      marginLeft: 28,
    },

    abonoValor: {
      fontSize: 20,
      fontWeight:
        '800',
      color:
        '#08752F',
    },

    // ==========================================
    // MÉTODOS
    // ==========================================

    metodosContainer: {
      marginTop: 8,
      borderWidth: 1,
      borderColor:
        '#E5E5E5',
      borderRadius: 10,
      overflow:
        'hidden',
    },

    metodoFila: {
      minHeight: 58,
      paddingHorizontal: 13,
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      borderBottomWidth: 1,
      borderBottomColor:
        '#EEEEEE',
    },

    metodoNombre: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 9,
    },

    metodoTexto: {
      fontSize: 12,
      fontWeight:
        '600',
    },

    metodoValor: {
      fontSize: 14,
      fontWeight:
        '700',
      color:
        '#08752F',
    },

    estadoTransferencia: {
      fontSize: 9,
      marginTop: 2,
    },

    estadoConfirmado: {
      color:
        '#08752F',
    },

    estadoPendiente: {
      color:
        '#B76E00',
    },

    // ==========================================
    // RESUMEN
    // ==========================================

    resumenContainer: {
      marginTop: 15,
      borderWidth: 1,
      borderColor:
        '#E4E4E4',
      borderRadius: 10,
      overflow:
        'hidden',
    },

    resumenFila: {
      minHeight: 52,
      paddingHorizontal: 13,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      borderBottomWidth: 1,
      borderBottomColor:
        '#EEEEEE',
    },

    resumenUltimaFila: {
      borderBottomWidth: 0,
    },

    resumenLabel: {
      fontSize: 12,
      fontWeight:
        '600',
      color:
        '#444444',
    },

    resumenValor: {
      fontSize: 15,
      fontWeight:
        '700',
    },

    abonadoValor: {
      fontSize: 15,
      fontWeight:
        '700',
      color:
        '#08752F',
    },

    saldoValor: {
      fontSize: 17,
      fontWeight:
        '800',
      color:
        '#D71920',
    },

    saldoCero: {
      color:
        '#08752F',
    },

    // ==========================================
    // ABONOS POSTERIORES
    // ==========================================

    abonosPosterioresCard: {
      borderWidth: 1,
      borderColor:
        '#E4E4E4',
      borderRadius: 10,
      overflow:
        'hidden',
    },

    abonoPosteriorFila: {
      minHeight: 58,
      paddingHorizontal: 13,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      borderBottomWidth: 1,
      borderBottomColor:
        '#EEEEEE',
    },

    abonoPosteriorInfo: {
      flex: 1,
    },

    abonoPosteriorFecha: {
      fontSize: 12,
      fontWeight:
        '700',
    },

    abonoPosteriorMetodo: {
      fontSize: 9,
      color:
        '#777777',
      marginTop: 3,
    },

    abonoPosteriorValor: {
      fontSize: 15,
      fontWeight:
        '800',
      color:
        '#08752F',
    },

    // ==========================================
    // HISTORIAL
    // ==========================================

    historialCard: {
      minHeight: 95,
      borderWidth: 1,
      borderColor:
        '#DCE9DF',
      backgroundColor:
        '#F6FAF7',
      borderRadius: 10,
      flexDirection:
        'row',
      padding: 13,
    },

    historialIcono: {
      width: 39,
      height: 39,
      borderRadius: 20,
      backgroundColor:
        '#E3F2E7',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginRight: 10,
    },

    historialInfo: {
      flex: 1,
    },

    historialTitulo: {
      fontSize: 13,
      fontWeight:
        '700',
      color:
        '#08752F',
    },

    historialDescripcion: {
      fontSize: 9,
      color:
        '#777777',
      marginTop: 2,
      marginBottom: 8,
    },

    historialFechaFila: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 14,
    },

    historialDato: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 5,
    },

    historialFecha: {
      fontSize: 10,
      color:
        '#555555',
      fontWeight:
        '600',
    },

    // ==========================================
    // REEMPLAZOS
    // ==========================================

    reemplazosEncabezado: {
      marginTop: 13,
      marginBottom: 7,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    reemplazosTitulo: {
      fontSize: 12,
      fontWeight:
        '700',
      color:
        '#555555',
    },

    contadorReemplazos: {
      minWidth: 27,
      height: 23,
      borderRadius: 12,
      backgroundColor:
        '#FFF3DD',
      alignItems:
        'center',
      justifyContent:
        'center',
      paddingHorizontal: 7,
    },

    contadorReemplazosTexto: {
      color:
        '#B76E00',
      fontSize: 11,
      fontWeight:
        '800',
    },

    reemplazoCard: {
      minHeight: 72,
      backgroundColor:
        '#FFFAF2',
      borderWidth: 1,
      borderColor:
        '#F1D6A7',
      borderRadius: 10,
      marginBottom: 7,
      padding: 11,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    reemplazoNumero: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor:
        '#FFF0D4',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 10,
    },

    reemplazoNumeroTexto: {
      color:
        '#B76E00',
      fontWeight:
        '800',
      fontSize: 12,
    },

    reemplazoInfo: {
      flex: 1,
    },

    reemplazoTitulo: {
      color:
        '#9A5B00',
      fontSize: 12,
      fontWeight:
        '700',
      marginBottom: 7,
    },

    reemplazoFecha: {
      fontSize: 10,
      color:
        '#8B5C17',
      fontWeight:
        '600',
    },

    sinReemplazos: {
      minHeight: 52,
      borderWidth: 1,
      borderColor:
        '#DCE9DF',
      backgroundColor:
        '#F6FAF7',
      borderRadius: 9,
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 12,
      gap: 8,
      marginTop: 8,
    },

    sinReemplazosTexto: {
      fontSize: 10,
      color:
        '#666666',
      flex: 1,
    },

    // ==========================================
    // NOTA
    // ==========================================

    notaFinal: {
      marginTop: 18,
      minHeight: 62,
      backgroundColor:
        '#F5F7F5',
      borderRadius: 9,
      padding: 12,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 9,
    },

    notaFinalTexto: {
      flex: 1,
      fontSize: 10,
      color:
        '#666666',
      lineHeight: 15,
    },

    // ==========================================
    // COMPROBANTE DE TRANSFERENCIA
    // ==========================================

    comprobanteCard: {
      borderWidth: 1,
      borderColor: '#D6EBDD',
      backgroundColor: '#F4FAF6',
      borderRadius: 12,
      padding: 14,
    },

    comprobanteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      gap: 10,
    },

    comprobanteHeaderIzquierda: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    comprobanteIcono: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#E1F3E6',
      alignItems: 'center',
      justifyContent: 'center',
    },

    comprobanteRegistrado: {
      color: '#222222',
      fontSize: 11,
      fontWeight: '700',
      flexShrink: 1,
    },

    comprobanteFecha: {
      marginTop: 3,
      color: '#666666',
      fontSize: 9,
    },

    botonVerComprobante: {
      minHeight: 40,
      borderWidth: 1.5,
      borderColor: '#08752F',
      borderRadius: 8,
      paddingHorizontal: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      flexShrink: 0,
    },

    botonVerComprobanteDeshabilitado: {
      borderColor: '#C5C5C5',
      backgroundColor: '#EFEFEF',
    },

    textoVerComprobante: {
      color: '#08752F',
      fontSize: 10,
      fontWeight: '700',
    },

    textoVerComprobanteDeshabilitado: {
      color: '#999999',
    },

    comprobanteContenido: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 10,
    },

    comprobanteImagen: {
      width: '43%',
      height: 205,
      borderRadius: 10,
      backgroundColor: '#E5E5E5',
    },

    comprobanteNoDisponible: {
      width: '43%',
      height: 205,
      borderRadius: 10,
      backgroundColor: '#E4E7E5',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },

    comprobanteNoDisponibleTitulo: {
      marginTop: 8,
      color: '#555555',
      fontSize: 10,
      fontWeight: '700',
      textAlign: 'center',
    },

    comprobanteNoDisponibleTexto: {
      marginTop: 7,
      color: '#777777',
      fontSize: 8,
      lineHeight: 12,
      textAlign: 'center',
    },

    comprobanteDatos: {
      flex: 1,
      justifyContent: 'center',
    },

    comprobanteMontoLabel: {
      color: '#666666',
      fontSize: 11,
      marginBottom: 3,
    },

    comprobanteMontoValor: {
      color: '#08752F',
      fontSize: 20,
      fontWeight: '800',
      marginTop: 2,
      marginBottom: 14,
    },

    comprobanteConfirmacion: {
      width: '100%',
      backgroundColor: '#DDF3E3',
      borderRadius: 9,
      paddingVertical: 10,
      paddingHorizontal: 9,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 7,
    },

    comprobanteCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#08752F',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },

    comprobanteConfirmacionInfo: {
      flex: 1,
      minWidth: 0,
    },

    comprobanteConfirmacionTitulo: {
      color: '#08752F',
      fontSize: 9,
      fontWeight: '800',
      flexShrink: 1,
    },

    comprobanteConfirmacionTexto: {
      color: '#4D7359',
      fontSize: 7.5,
      lineHeight: 10,
      marginTop: 3,
      flexShrink: 1,
    },

    // ==========================================
    // MODAL COMPROBANTE
    // ==========================================

    modalComprobanteFondo: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.88)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 35,
    },

    modalComprobanteContenido: {
      width: '100%',
      height: '85%',
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalComprobanteHeader: {
      width: '100%',
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },

    modalComprobanteTitulo: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },

    modalComprobanteCerrar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    modalComprobanteImagen: {
      width: '100%',
      flex: 1,
      borderRadius: 10,
    },
  });