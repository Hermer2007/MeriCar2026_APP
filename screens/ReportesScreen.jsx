import React, { useMemo } from 'react';

import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useEntregas } from '../context/EntregasContext';
import BotonHome from '../components/BotonHome';

const ReportesScreen = ({ navigation }) => {
  const {
    entregas,
    abonos,
  } = useEntregas();

  // ==========================================
  // CONVERTIR FECHA PARA ORDENAR
  // ==========================================

  const convertirFecha = (fecha) => {
    const [dia, mes, anio] =
      fecha.split('/');

    return new Date(
      Number(anio),
      Number(mes) - 1,
      Number(dia)
    );
  };

  // ==========================================
  // OBTENER DÍA DE LA SEMANA
  // ==========================================

  const obtenerDiaSemana = (fecha) => {
    const fechaConvertida =
      convertirFecha(fecha);

    const dias = [
      'domingo',
      'lunes',
      'martes',
      'miércoles',
      'jueves',
      'viernes',
      'sábado',
    ];

    return dias[
      fechaConvertida.getDay()
    ];
  };

  // ==========================================
  // GENERAR REPORTES AUTOMÁTICAMENTE
  // ==========================================

  const reportes = useMemo(() => {
    const agrupados = {};

    const ahora = new Date();

    const diaActual = String(
      ahora.getDate()
    ).padStart(2, '0');

    const mesActual = String(
      ahora.getMonth() + 1
    ).padStart(2, '0');

    const anioActual =
      ahora.getFullYear();

    const fechaActual =
      `${diaActual}/${mesActual}/${anioActual}`;

    // ========================================
    // AGRUPAR ENTREGAS POR FECHA
    // ========================================

    entregas.forEach((entrega) => {
      if (!entrega.fecha) {
        return;
      }

      // El reporte de hoy se muestra
      // únicamente en "Reporte del día".

      if (
        entrega.fecha ===
        fechaActual
      ) {
        return;
      }

      if (
        !agrupados[
          entrega.fecha
        ]
      ) {
        agrupados[
          entrega.fecha
        ] = [];
      }

      agrupados[
        entrega.fecha
      ].push(entrega);
    });

    // ========================================
    // CREAR REPORTES
    // ========================================

    return Object.entries(
      agrupados
    )
      .map(
        ([
          fecha,
          entregasDia,
        ]) => {
          // ==================================
          // TOTAL VENDIDO
          // ==================================

          const totalVendido =
            entregasDia.reduce(
              (
                total,
                entrega
              ) =>
                total +
                Number(
                  entrega.total ||
                    0
                ),
              0
            );

          // ==================================
          // DINERO RECIBIDO AL CREAR ENTREGAS
          // ==================================

          const recibidoEntregas =
            entregasDia.reduce(
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

          // ==================================
          // ABONOS COBRADOS EN ESTA FECHA
          // ==================================

          const abonosDia =
            (abonos || []).filter(
              (abono) =>
                abono.fecha ===
                fecha
            );

          const recibidoAbonos =
            abonosDia.reduce(
              (
                total,
                abono
              ) =>
                total +
                Number(
                  abono.monto ||
                    0
                ),
              0
            );

          // ==================================
          // TOTAL REALMENTE RECIBIDO ESE DÍA
          // ==================================

          const totalRecibido =
            recibidoEntregas +
            recibidoAbonos;

          // ==================================
          // SALDO PENDIENTE ACTUAL
          // ==================================

          const saldoPendiente =
            entregasDia.reduce(
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

          // ==================================
          // CLIENTES ÚNICOS REGISTRADOS
          // ==================================

          const clientesIds =
            new Set(
              entregasDia
                .filter(
                  (entrega) =>
                    entrega.clienteId !==
                      null &&
                    entrega.clienteId !==
                      undefined
                )
                .map(
                  (entrega) =>
                    String(
                      entrega.clienteId
                    )
                )
            );

          // ==================================
          // CANTIDAD TOTAL DE PRODUCTOS
          // ==================================

          const productosVendidos =
            entregasDia.reduce(
              (
                total,
                entrega
              ) => {
                const cantidadEntrega =
                  entrega.productos?.reduce(
                    (
                      subtotal,
                      producto
                    ) =>
                      subtotal +
                      Number(
                        producto.cantidad ||
                          0
                      ),
                    0
                  ) || 0;

                return (
                  total +
                  cantidadEntrega
                );
              },
              0
            );

          return {
            fecha,

            dia:
              obtenerDiaSemana(
                fecha
              ),

            totalVendido,

            totalRecibido,

            saldoPendiente,

            clientes:
              clientesIds.size,

            entregas:
              entregasDia.length,

            productosVendidos,

            entregasDia,
          };
        }
      )
      .sort(
        (a, b) =>
          convertirFecha(
            b.fecha
          ) -
          convertirFecha(
            a.fecha
          )
      );
  }, [entregas, abonos]);

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
  // TARJETA REPORTE
  // ==========================================

  const renderReporte = ({
    item,
  }) => (
    <TouchableOpacity
      style={styles.tarjeta}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate(
          'ReporteDetalle',
          {
            fecha: item.fecha,
          }
        )
      }
    >
      {/* ENCABEZADO */}

      <View
        style={
          styles.encabezadoTarjeta
        }
      >
        <View
          style={
            styles.iconoFecha
          }
        >
          <Ionicons
            name="calendar-outline"
            size={25}
            color="#08752F"
          />
        </View>

        <View
          style={
            styles.infoFecha
          }
        >
          <Text
            style={styles.fecha}
          >
            {item.fecha}
          </Text>

          <Text
            style={styles.dia}
          >
            {item.dia}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
          color="#222222"
        />
      </View>

      {/* DINERO */}

      <View
        style={
          styles.resumenDinero
        }
      >
        <View
          style={
            styles.columnaDinero
          }
        >
          <Text
            style={
              styles.labelPequeno
            }
          >
            Total vendido
          </Text>

          <Text
            style={
              styles.valorVerde
            }
          >
            {dinero(
              item.totalVendido
            )}
          </Text>
        </View>

        <View
          style={
            styles.separadorVertical
          }
        />

        <View
          style={
            styles.columnaDinero
          }
        >
          <Text
            style={
              styles.labelPequeno
            }
          >
            Total recibido
          </Text>

          <Text
            style={
              styles.valorVerde
            }
          >
            {dinero(
              item.totalRecibido
            )}
          </Text>
        </View>

        <View
          style={
            styles.separadorVertical
          }
        />

        <View
          style={
            styles.columnaDinero
          }
        >
          <Text
            style={
              styles.labelPequeno
            }
          >
            Pendiente
          </Text>

          <Text
            style={[
              styles.valorPendiente,

              item.saldoPendiente <=
                0 &&
                styles.valorSaldoCorrecto,
            ]}
          >
            {dinero(
              item.saldoPendiente
            )}
          </Text>
        </View>
      </View>

      {/* ESTADÍSTICAS */}

      <View
        style={
          styles.estadisticas
        }
      >
        <View
          style={
            styles.estadistica
          }
        >
          <Ionicons
            name="people-outline"
            size={21}
            color="#08752F"
          />

          <View>
            <Text
              style={
                styles.numeroEstadistica
              }
            >
              {item.clientes}
            </Text>

            <Text
              style={
                styles.textoEstadistica
              }
            >
              Clientes
            </Text>
          </View>
        </View>

        <View
          style={
            styles.estadistica
          }
        >
          <Ionicons
            name="clipboard-outline"
            size={21}
            color="#08752F"
          />

          <View>
            <Text
              style={
                styles.numeroEstadistica
              }
            >
              {item.entregas}
            </Text>

            <Text
              style={
                styles.textoEstadistica
              }
            >
              Entregas
            </Text>
          </View>
        </View>

        <View
          style={
            styles.estadistica
          }
        >
          <Ionicons
            name="cube-outline"
            size={21}
            color="#08752F"
          />

          <View>
            <Text
              style={
                styles.numeroEstadistica
              }
            >
              {
                item.productosVendidos
              }
            </Text>

            <Text
              style={
                styles.textoEstadistica
              }
            >
              Productos vendidos
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
            Reportes generales
          </Text>

          <Text
            style={
              styles.subtituloHeader
            }
          >
            Ventas y entregas
            registradas
          </Text>
        </View>
        <BotonHome navigation={navigation} />
      </View>

      {/* INFORMACIÓN */}

      <View
        style={styles.infoBox}
      >
        <Ionicons
          name="information-circle"
          size={23}
          color="#08752F"
        />

        <Text
          style={
            styles.infoTexto
          }
        >
          Los reportes se generan
          automáticamente con base en
          las entregas y pagos
          registrados cada día.
        </Text>
      </View>

      {/* TÍTULO */}

      {reportes.length > 0 && (
        <View
          style={
            styles.tituloHistorial
          }
        >
          <Ionicons
            name="options-outline"
            size={21}
            color="#08752F"
          />

          <Text
            style={
              styles.historialTexto
            }
          >
            Historial de reportes
          </Text>
        </View>
      )}

      {/* REPORTES */}

      <FlatList
        data={reportes}
        keyExtractor={(item) =>
          item.fecha
        }
        renderItem={
          renderReporte
        }
        contentContainerStyle={[
          styles.lista,

          reportes.length ===
            0 &&
            styles.listaVacia,
        ]}
        showsVerticalScrollIndicator={
          false
        }
        ListEmptyComponent={
          <View
            style={styles.vacio}
          >
            <View
              style={
                styles.vacioIcono
              }
            >
              <Ionicons
                name="bar-chart-outline"
                size={50}
                color="#A9A9A9"
              />
            </View>

            <Text
              style={
                styles.vacioTitulo
              }
            >
              No hay reportes
              registrados
            </Text>

            <Text
              style={
                styles.vacioTexto
              }
            >
              Los reportes aparecerán
              automáticamente cuando se
              registren entregas.
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default ReportesScreen;

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#FFFFFF',
    },

    header: {
      height: 110,
      backgroundColor:
        '#08752F',
      justifyContent:
        'flex-end',
      alignItems: 'center',
      paddingBottom: 15,
    },

    regresar: {
      position: 'absolute',
      left: 16,
      bottom: 15,
      width: 45,
      height: 45,
      justifyContent:
        'center',
      alignItems: 'center',
    },

    headerCentro: {
      alignItems: 'center',
    },

    tituloHeader: {
      fontSize: 22,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    subtituloHeader: {
      fontSize: 11,
      color: '#DDEDE2',
      marginTop: 3,
    },

    infoBox: {
      minHeight: 58,
      marginHorizontal: 20,
      marginTop: 13,
      backgroundColor:
        '#F1F7F3',
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 13,
    },

    infoTexto: {
      flex: 1,
      fontSize: 10,
      color: '#444444',
      marginLeft: 10,
    },

    tituloHistorial: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      marginTop: 14,
      marginBottom: 8,
      gap: 8,
    },

    historialTexto: {
      fontSize: 14,
      fontWeight: '700',
    },

    lista: {
      paddingHorizontal: 20,
      paddingBottom: 25,
    },

    listaVacia: {
      flexGrow: 1,
    },

    tarjeta: {
      borderWidth: 1,
      borderColor: '#DCDCDC',
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      backgroundColor:
        '#FFFFFF',
    },

    encabezadoTarjeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    iconoFecha: {
      width: 42,
      height: 42,
      borderRadius: 8,
      backgroundColor:
        '#E5F3E9',
      justifyContent:
        'center',
      alignItems: 'center',
    },

    infoFecha: {
      flex: 1,
      marginLeft: 10,
    },

    fecha: {
      fontSize: 14,
      fontWeight: '700',
    },

    dia: {
      fontSize: 10,
      color: '#08752F',
      marginTop: 2,
    },

    resumenDinero: {
      flexDirection: 'row',
      marginTop: 13,
    },

    columnaDinero: {
      flex: 1,
    },

    separadorVertical: {
      width: 1,
      backgroundColor:
        '#E5E5E5',
      marginHorizontal: 7,
    },

    labelPequeno: {
      fontSize: 9,
      color: '#555555',
    },

    valorVerde: {
      fontSize: 13,
      color: '#08752F',
      fontWeight: '700',
      marginTop: 3,
    },

    valorPendiente: {
      fontSize: 13,
      color: '#D71920',
      fontWeight: '700',
      marginTop: 3,
    },

    valorSaldoCorrecto: {
      color: '#08752F',
    },

    estadisticas: {
      borderTopWidth: 1,
      borderTopColor:
        '#EEEEEE',
      marginTop: 11,
      paddingTop: 10,
      flexDirection: 'row',
      justifyContent:
        'space-between',
    },

    estadistica: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    numeroEstadistica: {
      fontSize: 12,
      fontWeight: '700',
    },

    textoEstadistica: {
      fontSize: 8,
      color: '#555555',
    },

    vacio: {
      flex: 1,
      justifyContent:
        'center',
      alignItems: 'center',
      paddingHorizontal: 35,
      paddingBottom: 80,
    },

    vacioIcono: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor:
        '#F1F1F1',
      justifyContent:
        'center',
      alignItems: 'center',
    },

    vacioTitulo: {
      marginTop: 17,
      fontSize: 17,
      fontWeight: '700',
      color: '#555555',
    },

    vacioTexto: {
      marginTop: 7,
      fontSize: 12,
      color: '#888888',
      textAlign: 'center',
      lineHeight: 18,
    },
  });