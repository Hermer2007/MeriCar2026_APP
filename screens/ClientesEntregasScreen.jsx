import React, {
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  FlatList,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useClientes } from '../context/ClientesContext';
import { useEntregas } from '../context/EntregasContext';
import { useAlert } from '../context/AlertContext';

import BotonHome from '../components/BotonHome';

// ============================================
// TARJETA DESLIZABLE
// ============================================

function TarjetaFacturacion({
  item,
  onFacturar,
  onHistorial,
}) {
  const desplazamiento =
    useRef(new Animated.Value(0)).current;

  const LIMITE_VISUAL = 105;
  const LIMITE_CONFIRMACION = 85;

  const bloqueado =
    useRef(false);

  // ==========================================
  // VOLVER AL CENTRO
  // ==========================================

  const volverAlCentro = () => {
    Animated.spring(
      desplazamiento,
      {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
        tension: 60,
      }
    ).start(() => { });
  };

  // ==========================================
  // CONFIRMAR DESLIZAMIENTO
  // ==========================================

  const confirmarDeslizamiento = (
    direccion
  ) => {
    if (bloqueado.current) {
      return;
    }

    bloqueado.current = true;

    const destino =
      direccion === 'derecha'
        ? LIMITE_VISUAL
        : -LIMITE_VISUAL;

    Animated.spring(
      desplazamiento,
      {
        toValue: destino,
        useNativeDriver: true,
        friction: 8,
        tension: 70,
      }
    ).start(() => {
      onFacturar(
        item,
        () => {
          desplazamiento.setValue(0);
          bloqueado.current = false;
        }
      );
    });
  };

  // ==========================================
  // PAN RESPONDER
  // ==========================================

  const panResponder =
    useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (
          _,
          gesto
        ) => {
          return (
            Math.abs(gesto.dx) > 8 &&
            Math.abs(gesto.dx) >
            Math.abs(gesto.dy)
          );
        },

        onPanResponderMove: (
          _,
          gesto
        ) => {
          if (bloqueado.current) {
            return;
          }

          let movimiento =
            gesto.dx;

          if (
            movimiento >
            LIMITE_VISUAL
          ) {
            movimiento =
              LIMITE_VISUAL;
          }

          if (
            movimiento <
            -LIMITE_VISUAL
          ) {
            movimiento =
              -LIMITE_VISUAL;
          }

          desplazamiento.setValue(
            movimiento
          );
        },

        onPanResponderRelease: (
          _,
          gesto
        ) => {
          if (bloqueado.current) {
            return;
          }

          if (
            gesto.dx >=
            LIMITE_CONFIRMACION
          ) {
            confirmarDeslizamiento(
              'derecha'
            );

            return;
          }

          if (
            gesto.dx <=
            -LIMITE_CONFIRMACION
          ) {
            confirmarDeslizamiento(
              'izquierda'
            );

            return;
          }

          volverAlCentro();
        },

        onPanResponderTerminate: () => {
          if (!bloqueado.current) {
            volverAlCentro();
          }
        },
      })
    ).current;

  // ==========================================
  // EXPRESIÓN DE PRODUCTOS
  // ==========================================

  const productos =
    Array.isArray(item.productos)
      ? item.productos
      : [];

  const formatearNumero = (
    valor
  ) => {
    const numero =
      Number(valor || 0);

    if (
      Number.isInteger(numero)
    ) {
      return String(numero);
    }

    return numero
      .toFixed(2)
      .replace(/0+$/, '')
      .replace(/\.$/, '');
  };

  const expresion =
    productos.length > 0
      ? productos
        .map(
          (producto) =>
            `${formatearNumero(
              producto.cantidad
            )} x ${formatearNumero(
              producto.precio
            )}`
        )
        .join('  +  ')
      : 'Sin detalle de productos';

  const total =
    Number(
      item.total || 0
    );

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <View
      style={
        styles.swipeContainer
      }
    >

      {/* FACTURADO IZQUIERDA */}

      <View style={styles.facturadoIzquierda}>

        <Ionicons
          name="checkmark-circle"
          size={30}
          color="#FFFFFF"
        />

        <Text style={styles.facturadoTexto}>
          Facturado
        </Text>

      </View>


      {/* FACTURADO DERECHA */}

      <View style={styles.facturadoDerecha}>

        <Ionicons
          name="checkmark-circle"
          size={30}
          color="#FFFFFF"
        />

        <Text style={styles.facturadoTexto}>
          Facturado
        </Text>

      </View>

      {/* TARJETA */}

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.tarjetaCliente,

          {
            transform: [
              {
                translateX:
                  desplazamiento,
              },
            ],
          },
        ]}
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
              size={24}
              color="#08752F"
            />
          </View>


          <View
            style={
              styles.infoCliente
            }
          >

            <Text
              style={
                styles.nombreCliente
              }
              numberOfLines={1}
            >
              {
                item.nombreMostrar
              }
            </Text>

            <Text
              style={
                styles.telefono
              }
            >
              {item.telefono ||
                'Sin teléfono'}
            </Text>

          </View>

        </View>


        {/* DETALLE DE LA ENTREGA */}

        <View
          style={
            styles.detalleContainer
          }
        >

          <Text
            style={
              styles.expresionProductos
            }
            numberOfLines={2}
          >
            {expresion}
          </Text>

          <Text
            style={
              styles.signoIgual
            }
          >
            =
          </Text>

          <Text
            style={
              styles.totalEntrega
            }
          >
            ${total.toFixed(2)}
          </Text>

        </View>


        {/* HISTORIAL */}

        <TouchableOpacity
          style={
            styles.historialBoton
          }
          activeOpacity={0.7}
          onPress={() =>
            onHistorial(item)
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

      </Animated.View>

    </View>
  );
}


// ============================================
// PANTALLA
// ============================================

export default function ClientesEntregasScreen({
  navigation,
}) {

  // ==========================================
  // CONTEXTOS
  // ==========================================

  const { clientes } =
    useClientes();

  const {
    entregas,
    actualizarEntrega,
  } = useEntregas();

  const { mostrarAlert } =
    useAlert();

  // ==========================================
  // RESUMEN GENERAL DE FACTURACIÓN
  // ==========================================

  const clientesFacturacionActiva =
    useMemo(() => {

      return clientes.filter(
        (cliente) =>
          cliente.facturacion === true
      ).length;

    }, [clientes]);


  const totalFacturadoHistorico =
    useMemo(() => {

      return entregas
        .filter(
          (entrega) =>
            entrega.facturada === true
        )
        .reduce(
          (acumulado, entrega) =>
            acumulado +
            Number(entrega.total || 0),
          0
        );

    }, [entregas]);


  // ==========================================
  // ESTADOS
  // ==========================================

  const [
    procesando,
    setProcesando,
  ] = useState(false);


  // ==========================================
  // FECHA ACTUAL
  // ==========================================

  const obtenerFechaActual =
    () => {

      const ahora =
        new Date();

      const dia =
        String(
          ahora.getDate()
        ).padStart(
          2,
          '0'
        );

      const mes =
        String(
          ahora.getMonth() + 1
        ).padStart(
          2,
          '0'
        );

      const anio =
        ahora.getFullYear();

      return `${dia}/${mes}/${anio}`;
    };


  const fechaActual =
    obtenerFechaActual();


  // ==========================================
  // OBTENER TIEMPO DE REGISTRO
  // ==========================================

  const obtenerTiempoRegistro = (
    entrega
  ) => {

    if (
      entrega.fechaCreacion
        ?.toMillis
    ) {
      return entrega
        .fechaCreacion
        .toMillis();
    }

    if (
      entrega.fechaCreacion
        ?.toDate
    ) {
      return entrega
        .fechaCreacion
        .toDate()
        .getTime();
    }

    // ----------------------------------------
    // RESPALDO CON FECHA + HORA
    // ----------------------------------------

    if (
      entrega.fecha &&
      entrega.hora
    ) {

      const partesFecha =
        String(
          entrega.fecha
        ).split('/');

      const partesHora =
        String(
          entrega.hora
        ).split(':');

      if (
        partesFecha.length === 3
      ) {

        const dia =
          Number(
            partesFecha[0]
          );

        const mes =
          Number(
            partesFecha[1]
          ) - 1;

        const anio =
          Number(
            partesFecha[2]
          );

        const hora =
          Number(
            partesHora[0] || 0
          );

        const minuto =
          Number(
            partesHora[1] || 0
          );

        const segundo =
          Number(
            partesHora[2] || 0
          );

        return new Date(
          anio,
          mes,
          dia,
          hora,
          minuto,
          segundo
        ).getTime();
      }
    }

    return 0;
  };


  // ==========================================
  // ENTREGAS DEL DÍA PARA FACTURACIÓN
  // ==========================================

  const entregasFacturacion =
    useMemo(() => {

      return entregas

        .filter(
          (entrega) => {

            // Debe pertenecer
            // a un cliente registrado.

            if (
              !entrega.clienteId
            ) {
              return false;
            }


            // Debe ser una entrega
            // de hoy.

            if (
              entrega.fecha !==
              fechaActual
            ) {
              return false;
            }


            // Buscar cliente.

            const cliente =
              clientes.find(
                (item) =>
                  String(
                    item.id
                  ) ===
                  String(
                    entrega.clienteId
                  )
              );


            // Cliente debe existir.

            if (!cliente) {
              return false;
            }


            // Debe tener facturación
            // activada.

            if (
              cliente.facturacion !==
              true
            ) {
              return false;
            }


            return true;
          }
        )

        .map(
          (entrega) => {

            const cliente =
              clientes.find(
                (item) =>
                  String(
                    item.id
                  ) ===
                  String(
                    entrega.clienteId
                  )
              );

            const alias =
              cliente?.aliasFacturacion?.trim();

            const nombre =
              alias ||
              cliente?.nombre ||
              `${cliente?.nombres || ''} ${cliente?.apellidos || ''
                }`.trim() ||
              entrega.nombreCliente ||
              'Cliente';

            return {
              ...entrega,

              cliente,

              nombreMostrar:
                nombre,

              telefono:
                cliente?.telefono ||
                '',
            };
          }
        )

        // Primera entrega registrada
        // aparece primero.

        .sort(
          (a, b) =>
            obtenerTiempoRegistro(
              a
            ) -
            obtenerTiempoRegistro(
              b
            )
        );

    }, [
      clientes,
      entregas,
      fechaActual,
    ]);


  // ==========================================
  // TOTAL DEL DÍA
  // ==========================================

  const totalFacturacion =
    entregasFacturacion.length;


  // ==========================================
  // YA FACTURADAS
  // ==========================================

  const cantidadFacturadas =
    useMemo(() => {

      return entregasFacturacion.filter(
        (entrega) =>
          entrega.facturada ===
          true
      ).length;

    }, [
      entregasFacturacion,
    ]);


  // ==========================================
  // PENDIENTES QUE SE MUESTRAN
  // ==========================================

  const entregasPendientes =
    useMemo(() => {

      return entregasFacturacion.filter(
        (entrega) =>
          entrega.facturada !==
          true
      );

    }, [
      entregasFacturacion,
    ]);


  // ==========================================
  // VER HISTORIAL
  // ==========================================

  const verHistorial = (
    entrega
  ) => {

    if (
      !entrega.cliente
    ) {
      return;
    }

    navigation.navigate(
      'ClienteDetalle',
      {
        cliente:
          entrega.cliente,
      }
    );
  };


  // ==========================================
  // MARCAR COMO FACTURADA
  // ==========================================

  const marcarComoFacturada =
    async (
      entrega,
      restaurarTarjeta
    ) => {

      if (procesando) {
        restaurarTarjeta?.();
        return;
      }


      mostrarAlert({

        titulo:
          'Entrega facturada correctamente',

        mensaje:
          `La entrega de ${entrega.nombreMostrar} ha sido marcada como facturada y se eliminará de la lista.`,

        tipo:
          'success',

        textoConfirmar:
          'Aceptar',

        mostrarCancelar:
          false,

        onConfirmar:
          async () => {

            try {

              setProcesando(
                true
              );


              const resultado =
                await actualizarEntrega({
                  ...entrega,

                  facturada:
                    true,

                  fechaFacturacion:
                    new Date(),
                });


              if (!resultado) {

                setProcesando(
                  false
                );

                restaurarTarjeta?.();

                mostrarAlert({
                  titulo:
                    'No se pudo facturar',
                  mensaje:
                    'Ocurrió un problema al actualizar la entrega. Intente nuevamente.',
                  tipo:
                    'error',
                  textoConfirmar:
                    'Aceptar',
                });

                return;
              }


              // onSnapshot actualizará
              // automáticamente la lista.

              setProcesando(
                false
              );

            } catch (error) {

              console.log(
                'Error al facturar entrega:',
                error
              );

              setProcesando(
                false
              );

              restaurarTarjeta?.();

              mostrarAlert({
                titulo:
                  'No se pudo facturar',
                mensaje:
                  'Ocurrió un problema al actualizar la entrega.',
                tipo:
                  'error',
                textoConfirmar:
                  'Aceptar',
              });
            }
          },

      });
    };


  // ==========================================
  // RENDER
  // ==========================================

  const renderEntrega = ({
    item,
  }) => {

    return (
      <TarjetaFacturacion
        item={item}
        onFacturar={
          marcarComoFacturada
        }
        onHistorial={
          verHistorial
        }
      />
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
            Facturación del día
          </Text>
        </View>


        <BotonHome
          navigation={
            navigation
          }
        />

      </View>


      {/* LISTA */}

      <FlatList

        ListHeaderComponent={

          <>

            {/* RESUMEN DE FACTURACIÓN */}

            <View style={styles.resumenCard}>

              {/* PARTE SUPERIOR */}

              <View style={styles.resumenSuperior}>

                {/* CLIENTES ACTIVOS */}

                <View style={styles.resumenItem}>

                  <View style={styles.resumenIcono}>
                    <Ionicons
                      name="people-outline"
                      size={25}
                      color="#08752F"
                    />
                  </View>

                  <View style={styles.resumenInfo}>

                    <Text style={styles.resumenLabel}>
                      Clientes con
                    </Text>

                    <Text style={styles.resumenLabel}>
                      facturación activada
                    </Text>

                    <Text style={styles.resumenValor}>
                      {clientesFacturacionActiva}
                    </Text>

                  </View>

                </View>


                {/* DIVISOR */}

                <View style={styles.divisorVertical} />


                {/* FACTURADOS HOY */}

                <View style={styles.resumenItem}>

                  <View style={styles.resumenIcono}>
                    <Ionicons
                      name="receipt-outline"
                      size={25}
                      color="#08752F"
                    />
                  </View>

                  <View style={styles.resumenInfo}>

                    <Text style={styles.resumenLabel}>
                      Facturados
                    </Text>

                    <Text style={styles.resumenLabel}>
                      hoy
                    </Text>

                    <Text style={styles.resumenValor}>
                      {cantidadFacturadas}/{totalFacturacion}
                    </Text>

                  </View>

                </View>

              </View>


              {/* DIVISOR */}

              <View style={styles.divisorHorizontal} />


              {/* TOTAL HISTÓRICO */}

              <View style={styles.totalFacturadoContainer}>

                <View style={styles.resumenIconoGrande}>
                  <Ionicons
                    name="cash-outline"
                    size={28}
                    color="#08752F"
                  />
                </View>

                <View style={styles.totalFacturadoInfo}>

                  <Text style={styles.totalFacturadoLabel}>
                    Total facturado
                  </Text>

                  <Text
                    style={styles.totalFacturadoValor}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    ${totalFacturadoHistorico.toFixed(2)}
                  </Text>

                </View>

              </View>

            </View>


            {/* CLIENTES DE HOY */}

            <View style={styles.clientesHoyTitulo}>

              <Ionicons
                name="people-outline"
                size={26}
                color="#08752F"
              />

              <View style={styles.clientesHoyInfo}>

                <Text style={styles.clientesHoyTexto}>
                  Clientes de hoy
                </Text>

                <Text style={styles.clientesHoySubtitulo}>
                  Entregas del día de clientes con facturación activada
                </Text>

              </View>

            </View>

          </>

        }

        data={
          entregasPendientes
        }

        keyExtractor={(
          item
        ) =>
          String(
            item.id
          )
        }

        renderItem={
          renderEntrega
        }

        showsVerticalScrollIndicator={
          false
        }

        contentContainerStyle={
          styles.lista
        }

        ListEmptyComponent={

          <View
            style={
              styles.vacio
            }
          >

            <View
              style={
                styles.vacioIcono
              }
            >

              <Ionicons
                name="receipt-outline"
                size={42}
                color="#08752F"
              />

            </View>

            <Text
              style={
                styles.vacioTitulo
              }
            >
              Sin entregas por facturar
            </Text>

            <Text
              style={
                styles.vacioTexto
              }
            >
              Las entregas de hoy de los clientes con facturación activada aparecerán aquí.
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

    // ========================================
    // LISTA
    // ========================================

    lista: {
      paddingHorizontal: 10,
      paddingTop: 13,
      paddingBottom: 35,
      flexGrow: 1,
    },


    // ========================================
    // SWIPE
    // ========================================

    swipeContainer: {
      position: 'relative',

      marginBottom: 12,

      borderRadius: 13,

      overflow: 'hidden',

      backgroundColor: '#0A9A48',
    },

    facturadoIzquierda: {
      position: 'absolute',

      left: 0,
      top: 0,
      bottom: 0,

      width: 105,

      backgroundColor: '#0A9A48',

      justifyContent: 'center',
      alignItems: 'center',
    },

    facturadoDerecha: {
      position: 'absolute',

      right: 0,
      top: 0,
      bottom: 0,

      width: 105,

      backgroundColor: '#0A9A48',

      justifyContent: 'center',
      alignItems: 'center',
    },

    facturadoTexto: {
      marginTop: 4,

      color: '#FFFFFF',

      fontSize: 12,

      fontWeight: '700',
    },

    // ========================================
    // TARJETA
    // ========================================

    tarjetaCliente: {
      backgroundColor: '#FFFFFF',

      borderRadius: 12,

      borderWidth: 1,

      borderColor: '#E1E1E1',

      paddingHorizontal: 11,

      paddingTop: 12,

      shadowColor: '#000000',

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.05,

      shadowRadius: 3,

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


    nombreCliente: {
      fontSize: 14,

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


    // ========================================
    // DETALLE DE ENTREGA
    // ========================================

    detalleContainer: {
      minHeight: 47,

      flexDirection:
        'row',

      alignItems:
        'center',

      marginTop: 6,

      paddingVertical: 7,
    },


    expresionProductos: {
      flexShrink: 1,

      fontSize: 12,

      fontWeight:
        '600',

      color:
        '#292929',

      lineHeight: 18,
    },


    signoIgual: {
      marginHorizontal: 8,

      fontSize: 13,

      fontWeight:
        '700',

      color:
        '#333333',
    },


    totalEntrega: {
      fontSize: 13,

      fontWeight:
        '800',

      color:
        '#08752F',
    },


    // ========================================
    // HISTORIAL
    // ========================================

    historialBoton: {
      minHeight: 38,

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
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal: 35,

      paddingBottom: 80,
    },


    vacioIcono: {
      width: 78,

      height: 78,

      borderRadius: 39,

      backgroundColor:
        '#E7F5EB',

      justifyContent:
        'center',

      alignItems:
        'center',
    },


    vacioTitulo: {
      fontSize: 16,

      fontWeight:
        '700',

      color:
        '#444444',

      marginTop: 15,
    },


    vacioTexto: {
      fontSize: 11,

      color:
        '#888888',

      marginTop: 6,

      textAlign:
        'center',

      lineHeight: 17,
    },

    resumenCard: {
      backgroundColor: '#FFFFFF',

      borderRadius: 14,

      borderWidth: 1,
      borderColor: '#E1E1E1',

      paddingHorizontal: 14,
      paddingVertical: 14,

      marginBottom: 18,

      elevation: 2,

      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },

    resumenSuperior: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },

    resumenItem: {
      flex: 1,

      flexDirection: 'row',
      alignItems: 'center',

      paddingHorizontal: 4,
    },

    resumenIcono: {
      width: 45,
      height: 45,

      borderRadius: 23,

      backgroundColor: '#E7F5EB',

      justifyContent: 'center',
      alignItems: 'center',

      marginRight: 9,
    },

    resumenInfo: {
      flex: 1,
    },

    resumenLabel: {
      fontSize: 10,
      color: '#777777',
      lineHeight: 14,
    },

    resumenValor: {
      fontSize: 20,
      fontWeight: '800',
      color: '#08752F',

      marginTop: 3,
    },

    divisorVertical: {
      width: 1,

      backgroundColor: '#E5E5E5',

      marginHorizontal: 7,
    },

    divisorHorizontal: {
      height: 1,

      backgroundColor: '#E5E5E5',

      marginVertical: 13,
    },

    totalFacturadoContainer: {
      width: '100%',

      flexDirection: 'row',
      alignItems: 'center',

      paddingHorizontal: 4,
    },

    resumenIconoGrande: {
      width: 50,
      height: 50,

      borderRadius: 25,

      backgroundColor: '#E7F5EB',

      justifyContent: 'center',
      alignItems: 'center',

      marginRight: 12,
    },

    totalFacturadoInfo: {
      flex: 1,
    },

    totalFacturadoLabel: {
      fontSize: 11,
      color: '#777777',
    },

    totalFacturadoValor: {
      width: '100%',

      fontSize: 25,
      fontWeight: '800',

      color: '#08752F',

      marginTop: 2,
    },

    clientesHoyTitulo: {
      flexDirection: 'row',
      alignItems: 'center',

      marginBottom: 12,
      paddingHorizontal: 3,
    },

    clientesHoyInfo: {
      flex: 1,
      marginLeft: 8,
    },

    clientesHoyTexto: {
      fontSize: 17,
      fontWeight: '700',
      color: '#292929',
    },

    clientesHoySubtitulo: {
      fontSize: 10,
      color: '#777777',

      marginTop: 2,
    },
  });