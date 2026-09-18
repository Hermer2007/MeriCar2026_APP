import React, { useMemo } from 'react';

import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useEntregas } from '../context/EntregasContext';

const ReporteDetalleScreen = ({
  navigation,
  route,
}) => {
  const {
    entregas,
    abonos,
  } = useEntregas();

  const fecha = route.params?.fecha;

  // ==========================================
  // ENTREGAS DEL DÍA
  // ==========================================

  const entregasDia = useMemo(() => {
    return entregas.filter(
      (entrega) =>
        entrega.fecha === fecha
    );
  }, [entregas, fecha]);

  // ==========================================
  // ABONOS REALIZADOS EN EL DÍA
  // ==========================================

  const abonosDia = useMemo(() => {
    return (abonos || []).filter(
      (abono) =>
        abono.fecha === fecha
    );
  }, [abonos, fecha]);

  // ==========================================
  // CÁLCULOS
  // ==========================================

  const reporte = useMemo(() => {
    let efectivoEntregas = 0;
    let transferenciasEntregas = 0;

    let efectivoAbonos = 0;
    let transferenciasAbonos = 0;

    let ventasEfectivo = 0;
    let ventasTransferencia = 0;

    let abonosEfectivo = 0;
    let abonosTransferencia = 0;

    let totalVendido = 0;
    let saldoPendiente = 0;

    const clientes = new Set();

    let ventasOcasionales = 0;

    const productos = {};

    // ========================================
    // ENTREGAS
    // ========================================

    entregasDia.forEach(
      (entrega) => {
        const total =
          Number(
            entrega.total || 0
          );

        const abona =
          Number(
            entrega.abona || 0
          );

        const saldo =
          Number(
            entrega.saldoPendiente ||
              0
          );

        totalVendido += total;
        saldoPendiente += saldo;

        // ====================================
        // MÉTODOS DE PAGO DE LA ENTREGA
        // ====================================

        const metodos =
          Array.isArray(
            entrega.metodosPago
          )
            ? entrega.metodosPago
            : entrega.metodoPago
            ? [entrega.metodoPago]
            : [];

        if (
          metodos.includes(
            'Efectivo'
          )
        ) {
          efectivoEntregas +=
            Number(
              entrega.pagoEfectivo ??
                (
                  entrega.metodoPago ===
                  'Efectivo'
                    ? abona
                    : 0
                )
            );

          ventasEfectivo++;
        }

        if (
          metodos.includes(
            'Transferencia'
          )
        ) {
          transferenciasEntregas +=
            Number(
              entrega.pagoTransferencia ??
                (
                  entrega.metodoPago ===
                  'Transferencia'
                    ? abona
                    : 0
                )
            );

          ventasTransferencia++;
        }

        // ====================================
        // CLIENTES
        // ====================================

        if (
          entrega.clienteId !==
            null &&
          entrega.clienteId !==
            undefined
        ) {
          clientes.add(
            String(
              entrega.clienteId
            )
          );
        } else {
          ventasOcasionales++;
        }

        // ====================================
        // PRODUCTOS
        // ====================================

        entrega.productos?.forEach(
          (producto) => {
            const nombre =
              producto.nombre ||
              'Producto';

            if (
              !productos[nombre]
            ) {
              productos[nombre] =
                0;
            }

            productos[nombre] +=
              Number(
                producto.cantidad ||
                  0
              );
          }
        );
      }
    );

    // ========================================
    // ABONOS DE DEUDAS COBRADOS EN EL DÍA
    // ========================================

    abonosDia.forEach(
      (abono) => {
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

        efectivoAbonos +=
          efectivo;

        transferenciasAbonos +=
          transferencia;

        if (efectivo > 0) {
          abonosEfectivo++;
        }

        if (
          transferencia > 0
        ) {
          abonosTransferencia++;
        }
      }
    );

    // ========================================
    // DINERO REALMENTE RECIBIDO
    // ========================================

    const efectivo =
      efectivoEntregas +
      efectivoAbonos;

    const transferencias =
      transferenciasEntregas +
      transferenciasAbonos;

    const totalRecibido =
      efectivo +
      transferencias;

    return {
      efectivo,
      transferencias,

      efectivoEntregas,
      transferenciasEntregas,

      efectivoAbonos,
      transferenciasAbonos,

      ventasEfectivo,
      ventasTransferencia,

      abonosEfectivo,
      abonosTransferencia,

      totalVendido,
      totalRecibido,
      saldoPendiente,

      clientes:
        clientes.size,

      ventasOcasionales,

      entregasRealizadas:
        entregasDia.length,

      productos:
        Object.entries(
          productos
        ).map(
          ([
            nombre,
            cantidad,
          ]) => ({
            nombre,
            cantidad,
          })
        ),
    };
  }, [
    entregasDia,
    abonosDia,
  ]);

  // ==========================================
  // DINERO
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
            Reporte del día
          </Text>

          <Text
            style={
              styles.fechaHeader
            }
          >
            {fecha}
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
      >
        {/* INFORMACIÓN */}

        <View
          style={styles.infoBox}
        >
          <Ionicons
            name="calendar-outline"
            size={23}
            color="#08752F"
          />

          <Text
            style={
              styles.infoTexto
            }
          >
            Reporte generado
            automáticamente con base
            en las entregas y pagos
            registrados durante el día.
          </Text>
        </View>

        {/* RESUMEN GENERAL */}

        <View
          style={styles.seccion}
        >
          <View
            style={
              styles.tituloSeccion
            }
          >
            <Ionicons
              name="bar-chart"
              size={20}
              color="#08752F"
            />

            <Text
              style={
                styles.tituloSeccionTexto
              }
            >
              Resumen general
            </Text>
          </View>

          <View
            style={
              styles.gridResumen
            }
          >
            <ResumenCard
              icono="cash-outline"
              titulo="Efectivo"
              valor={dinero(
                reporte.efectivo
              )}
            />

            <ResumenCard
              icono="business-outline"
              titulo="Transferencias"
              valor={dinero(
                reporte.transferencias
              )}
            />

            <ResumenCard
              icono="wallet-outline"
              titulo="Total recibido"
              valor={dinero(
                reporte.totalRecibido
              )}
            />

            <TotalVendidoCard
              valor={dinero(
                reporte.totalVendido
              )}
            />
          </View>

          <View style={styles.saldoCard}>
            <View style={styles.saldoIcono}>
              <Ionicons
                name="alert-circle-outline"
                size={25}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.saldoContenido}>
              <Text style={styles.saldoTitulo}>
                Saldo pendiente
              </Text>

              <Text style={styles.saldoValor}>
                {dinero(
                  reporte.saldoPendiente
                )}
              </Text>

              <Text style={styles.saldoDescripcion}>
                Valor pendiente por cobrar de las ventas
                realizadas durante el día.
              </Text>
            </View>
          </View>
        </View>

        {/* ACTIVIDAD */}

        <View
          style={styles.seccion}
        >
          <View
            style={
              styles.tituloSeccion
            }
          >
            <Ionicons
              name="people"
              size={20}
              color="#08752F"
            />

            <Text
              style={
                styles.tituloSeccionTexto
              }
            >
              Actividad del día
            </Text>
          </View>

          <View
            style={
              styles.actividad
            }
          >
            <Actividad
              titulo="Clientes atendidos"
              valor={
                reporte.clientes
              }
              descripcion="(registrados)"
            />

            <View
              style={
                styles.separador
              }
            />

            <Actividad
              titulo="Ventas ocasionales"
              valor={
                reporte.ventasOcasionales
              }
              descripcion="(sin registro)"
            />

            <View
              style={
                styles.separador
              }
            />

            <Actividad
              titulo="Entregas realizadas"
              valor={
                reporte.entregasRealizadas
              }
              descripcion="(totales)"
            />
          </View>
        </View>

        {/* PRODUCTOS */}

        <View
          style={styles.seccion}
        >
          <View
            style={
              styles.tituloSeccion
            }
          >
            <Ionicons
              name="cube-outline"
              size={20}
              color="#08752F"
            />

            <Text
              style={
                styles.tituloSeccionTexto
              }
            >
              Productos vendidos
            </Text>
          </View>

          {reporte.productos
            .length === 0 ? (
            <Text
              style={
                styles.sinDatos
              }
            >
              No hay productos
              registrados.
            </Text>
          ) : (
            reporte.productos.map(
              (producto) => (
                <View
                  key={
                    producto.nombre
                  }
                  style={
                    styles.productoFila
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
                    {
                      producto.cantidad
                    }{' '}
                    {producto.cantidad ===
                    1
                      ? 'unidad'
                      : 'unidades'}
                  </Text>
                </View>
              )
            )
          )}
        </View>

        {/* MÉTODOS DE PAGO */}

        <View
          style={styles.seccion}
        >
          <View
            style={
              styles.tituloSeccion
            }
          >
            <Ionicons
              name="card-outline"
              size={20}
              color="#08752F"
            />

            <Text
              style={
                styles.tituloSeccionTexto
              }
            >
              Métodos de pago
            </Text>
          </View>

          <MetodoPago
            nombre="Efectivo"
            ventas={
              reporte.ventasEfectivo
            }
            abonos={
              reporte.abonosEfectivo
            }
            total={dinero(
              reporte.efectivo
            )}
          />

          <MetodoPago
            nombre="Transferencia"
            ventas={
              reporte.ventasTransferencia
            }
            abonos={
              reporte.abonosTransferencia
            }
            total={dinero(
              reporte.transferencias
            )}
          />
        </View>

        {/* NOTA */}

        <View
          style={styles.nota}
        >
          <Ionicons
            name="information-circle"
            size={22}
            color="#08752F"
          />

          <Text
            style={
              styles.notaTexto
            }
          >
            Los valores se actualizan
            automáticamente cada vez
            que se registra o edita una
            entrega, o se realiza un
            abono de saldo pendiente.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ============================================
// COMPONENTES PEQUEÑOS
// ============================================

const ResumenCard = ({
  icono,
  titulo,
  valor,
}) => (
  <View
    style={styles.resumenCard}
  >
    <View
      style={
        styles.resumenIcono
      }
    >
      <Ionicons
        name={icono}
        size={23}
        color="#08752F"
      />
    </View>

    <View>
      <Text
        style={styles.cardTitulo}
      >
        {titulo}
      </Text>

      <Text
        style={styles.cardValor}
      >
        {valor}
      </Text>
    </View>
  </View>
);

const TotalVendidoCard = ({
  valor,
}) => (
  <View
    style={
      styles.totalVendidoCard
    }
  >
    <View
      style={
        styles.totalVendidoIcono
      }
    >
      <Ionicons
        name="pricetag-outline"
        size={23}
        color="#FFFFFF"
      />
    </View>

    <View
      style={
        styles.totalVendidoContenido
      }
    >
      <Text
        style={
          styles.totalVendidoTitulo
        }
      >
        Total vendido
      </Text>

      <Text
        style={
          styles.totalVendidoValor
        }
      >
        {valor}
      </Text>

      <Text
        style={
          styles.totalVendidoDescripcion
        }
      >
        Suma total de las ventas
        realizadas durante el día.
      </Text>
    </View>
  </View>
);

const Actividad = ({
  titulo,
  valor,
  descripcion,
}) => (
  <View
    style={
      styles.actividadItem
    }
  >
    <Text
      style={
        styles.actividadTitulo
      }
    >
      {titulo}
    </Text>

    <Text
      style={
        styles.actividadValor
      }
    >
      {valor}
    </Text>

    <Text
      style={
        styles.actividadDescripcion
      }
    >
      {descripcion}
    </Text>
  </View>
);

const MetodoPago = ({
  nombre,
  ventas,
  abonos,
  total,
}) => (
  <View
    style={styles.metodoFila}
  >
    <Text
      style={
        styles.metodoNombre
      }
    >
      {nombre}
    </Text>

    <View
      style={
        styles.metodoDetalle
      }
    >
      <Text
        style={
          styles.metodoVentas
        }
      >
        {ventas}{' '}
        {ventas === 1
          ? 'venta'
          : 'ventas'}
      </Text>

      {abonos > 0 && (
        <Text
          style={
            styles.metodoAbonos
          }
        >
          + {abonos}{' '}
          {abonos === 1
            ? 'abono'
            : 'abonos'}
        </Text>
      )}
    </View>

    <Text
      style={
        styles.metodoTotal
      }
    >
      {total}
    </Text>
  </View>
);

export default ReporteDetalleScreen;

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F7F8F7',
    },

    header: {
      height: 110,
      backgroundColor:
        '#08752F',
      justifyContent:
        'flex-end',
      alignItems:
        'center',
      paddingBottom: 13,
    },

    regresar: {
      position: 'absolute',
      left: 15,
      bottom: 14,
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
      fontSize: 21,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    fechaHeader: {
      fontSize: 12,
      color: '#DCEDE1',
      marginTop: 3,
    },

    contenido: {
      padding: 15,
      paddingBottom: 35,
    },

    infoBox: {
      minHeight: 55,
      borderRadius: 8,
      backgroundColor:
        '#F1F7F3',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      marginBottom: 9,
    },

    infoTexto: {
      flex: 1,
      marginLeft: 9,
      fontSize: 10,
      color: '#444444',
    },

    seccion: {
      borderWidth: 1,
      borderColor: '#E7E7E7',
      borderRadius: 11,
      padding: 11,
      marginBottom: 10,
      backgroundColor: '#FCFCFC',
    },

    tituloSeccion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginBottom: 9,
    },

    tituloSeccionTexto: {
      fontSize: 13,
      fontWeight: '700',
    },

    gridResumen: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent:
        'space-between',
    },

    resumenCard: {
      width: '49%',
      minHeight: 64,
      borderWidth: 1,
      borderColor: '#E7E7E7',
      borderRadius: 7,
      marginBottom: 7,
      padding: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },

    resumenIcono: {
      marginRight: 8,
    },

    cardTitulo: {
      fontSize: 9,
      color: '#555555',
    },

    cardValor: {
      fontSize: 16,
      fontWeight: '700',
      color: '#08752F',
      marginTop: 2,
    },

    // ========================================
    // TOTAL VENDIDO DESTACADO
    // ========================================

    totalVendidoCard: {
      width: '49%',
      minHeight: 88,
      borderRadius: 7,
      marginBottom: 7,
      padding: 8,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        '#08752F',
    },

    totalVendidoIcono: {
      marginRight: 8,
    },

    totalVendidoContenido: {
      flex: 1,
    },

    totalVendidoTitulo: {
      fontSize: 9,
      color: '#FFFFFF',
      fontWeight: '700',
    },

    totalVendidoValor: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
      marginTop: 2,
    },

    totalVendidoDescripcion: {
      fontSize: 7,
      lineHeight: 9,
      color: '#E4F2E8',
      marginTop: 4,
    },

    saldoCard: {
      minHeight: 88,
      borderRadius: 7,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#D71920',
      marginTop: 2,
    },

    saldoIcono: {
      marginRight: 10,
    },

    saldoContenido: {
      flex: 1,
    },

    saldoTitulo: {
      fontSize: 9,
      color: '#FFFFFF',
      fontWeight: '700',
    },

    saldoValor: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
      marginTop: 2,
    },

    saldoDescripcion: {
      fontSize: 7,
      lineHeight: 9,
      color: '#FFE5E5',
      marginTop: 4,
    },

    actividad: {
      flexDirection: 'row',
    },

    actividadItem: {
      flex: 1,
      alignItems: 'center',
    },

    actividadTitulo: {
      fontSize: 9,
      textAlign: 'center',
    },

    actividadValor: {
      fontSize: 16,
      color: '#08752F',
      fontWeight: '700',
      marginVertical: 3,
    },

    actividadDescripcion: {
      fontSize: 8,
      color: '#555555',
    },

    separador: {
      width: 1,
      backgroundColor:
        '#E5E5E5',
    },

    productoFila: {
      minHeight: 31,
      borderTopWidth: 1,
      borderTopColor:
        '#EEEEEE',
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    productoNombre: {
      fontSize: 10,
    },

    productoCantidad: {
      fontSize: 10,
      fontWeight: '600',
    },

    metodoFila: {
      minHeight: 40,
      borderTopWidth: 1,
      borderTopColor:
        '#EEEEEE',
      flexDirection: 'row',
      alignItems: 'center',
    },

    metodoNombre: {
      flex: 1,
      fontSize: 10,
    },

    metodoDetalle: {
      flex: 1,
    },

    metodoVentas: {
      fontSize: 10,
    },

    metodoAbonos: {
      fontSize: 8,
      color: '#08752F',
      marginTop: 1,
    },

    metodoTotal: {
      fontSize: 11,
      color: '#08752F',
      fontWeight: '700',
    },

    sinDatos: {
      fontSize: 10,
      color: '#777777',
      textAlign: 'center',
      paddingVertical: 10,
    },

    nota: {
      minHeight: 58,
      backgroundColor:
        '#F1F7F3',
      borderRadius: 8,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },

    notaTexto: {
      flex: 1,
      marginLeft: 9,
      fontSize: 9,
      color: '#555555',
    },
  });