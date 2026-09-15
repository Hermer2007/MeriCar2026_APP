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
  const { entregas } = useEntregas();

  const fecha = route.params?.fecha;

  // ==========================================
  // ENTREGAS DEL DÍA
  // ==========================================

  const entregasDia = useMemo(() => {
    return entregas.filter(
      (entrega) => entrega.fecha === fecha
    );
  }, [entregas, fecha]);

  // ==========================================
  // CÁLCULOS
  // ==========================================

  const reporte = useMemo(() => {
    let efectivo = 0;
    let transferencias = 0;

    let ventasEfectivo = 0;
    let ventasTransferencia = 0;

    let totalVendido = 0;
    let totalRecibido = 0;
    let saldoPendiente = 0;

    const clientes = new Set();

    let ventasOcasionales = 0;

    const productos = {};

    entregasDia.forEach((entrega) => {
      const total = Number(
        entrega.total || 0
      );

      const abona = Number(
        entrega.abona || 0
      );

      const saldo = Number(
        entrega.saldoPendiente || 0
      );

      totalVendido += total;
      totalRecibido += abona;
      saldoPendiente += saldo;

      // ======================================
      // MÉTODO DE PAGO
      // ======================================

      const metodos =
        Array.isArray(entrega.metodosPago)
          ? entrega.metodosPago
          : entrega.metodoPago
          ? [entrega.metodoPago]
          : [];

      if (metodos.includes('Efectivo')) {
        efectivo += Number(
          entrega.pagoEfectivo ??
            (
              entrega.metodoPago === 'Efectivo'
                ? abona
                : 0
            )
        );

        ventasEfectivo++;
      }

      if (metodos.includes('Transferencia')) {
        transferencias += Number(
          entrega.pagoTransferencia ??
            (
              entrega.metodoPago === 'Transferencia'
                ? abona
                : 0
            )
        );

        ventasTransferencia++;
      }

      // ======================================
      // CLIENTES
      // ======================================

      if (
        entrega.clienteId !== null &&
        entrega.clienteId !== undefined
      ) {
        clientes.add(
          String(entrega.clienteId)
        );
      } else {
        ventasOcasionales++;
      }

      // ======================================
      // PRODUCTOS
      // ======================================

      entrega.productos?.forEach(
        (producto) => {
          const nombre =
            producto.nombre ||
            'Producto';

          if (!productos[nombre]) {
            productos[nombre] = 0;
          }

          productos[nombre] += Number(
            producto.cantidad || 0
          );
        }
      );
    });

    return {
      efectivo,
      transferencias,

      ventasEfectivo,
      ventasTransferencia,

      totalVendido,
      totalRecibido,
      saldoPendiente,

      clientes: clientes.size,

      ventasOcasionales,

      entregasRealizadas:
        entregasDia.length,

      productos: Object.entries(
        productos
      ).map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
      })),
    };
  }, [entregasDia]);

  // ==========================================
  // DINERO
  // ==========================================

  const dinero = (valor) => {
    const numero = Number(valor || 0);

    if (numero < 0) {
      return `-$${Math.abs(numero).toFixed(2)}`;
    }

    return `$${numero.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#08752F"
      />

      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.regresar}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={29}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={styles.headerCentro}>
          <Text style={styles.tituloHeader}>
            Reporte del día
          </Text>

          <Text style={styles.fechaHeader}>
            {fecha}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* INFORMACIÓN */}

        <View style={styles.infoBox}>
          <Ionicons
            name="calendar-outline"
            size={23}
            color="#08752F"
          />

          <Text style={styles.infoTexto}>
            Reporte generado automáticamente
            con base en las entregas del día.
          </Text>
        </View>

        {/* RESUMEN GENERAL */}

        <View style={styles.seccion}>
          <View style={styles.tituloSeccion}>
            <Ionicons
              name="bar-chart"
              size={20}
              color="#08752F"
            />

            <Text style={styles.tituloSeccionTexto}>
              Resumen general
            </Text>
          </View>

          <View style={styles.gridResumen}>
            <ResumenCard
              icono="cash-outline"
              titulo="Efectivo"
              valor={dinero(reporte.efectivo)}
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

            <ResumenCard
              icono="pricetag-outline"
              titulo="Total vendido"
              valor={dinero(
                reporte.totalVendido
              )}
            />
          </View>

          <View style={styles.saldoCard}>
            <View style={styles.saldoIcono}>
              <Ionicons
                name="cash-outline"
                size={24}
                color={
                  reporte.saldoPendiente > 0
                    ? '#D71920'
                    : '#08752F'
                }
              />
            </View>

            <View>
              <Text style={styles.cardTitulo}>
                Saldo pendiente
              </Text>

              <Text
                style={[
                  styles.saldoValor,

                  reporte.saldoPendiente <= 0 &&
                    styles.saldoVerde,
                ]}
              >
                {dinero(
                  reporte.saldoPendiente
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* ACTIVIDAD */}

        <View style={styles.seccion}>
          <View style={styles.tituloSeccion}>
            <Ionicons
              name="people"
              size={20}
              color="#08752F"
            />

            <Text style={styles.tituloSeccionTexto}>
              Actividad del día
            </Text>
          </View>

          <View style={styles.actividad}>
            <Actividad
              titulo="Clientes atendidos"
              valor={reporte.clientes}
              descripcion="(registrados)"
            />

            <View style={styles.separador} />

            <Actividad
              titulo="Ventas ocasionales"
              valor={
                reporte.ventasOcasionales
              }
              descripcion="(sin registro)"
            />

            <View style={styles.separador} />

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

        <View style={styles.seccion}>
          <View style={styles.tituloSeccion}>
            <Ionicons
              name="cube-outline"
              size={20}
              color="#08752F"
            />

            <Text style={styles.tituloSeccionTexto}>
              Productos vendidos
            </Text>
          </View>

          {reporte.productos.length === 0 ? (
            <Text style={styles.sinDatos}>
              No hay productos registrados.
            </Text>
          ) : (
            reporte.productos.map(
              (producto) => (
                <View
                  key={producto.nombre}
                  style={styles.productoFila}
                >
                  <Text
                    style={styles.productoNombre}
                  >
                    {producto.nombre}
                  </Text>

                  <Text
                    style={
                      styles.productoCantidad
                    }
                  >
                    {producto.cantidad}{' '}
                    {producto.cantidad === 1
                      ? 'unidad'
                      : 'unidades'}
                  </Text>
                </View>
              )
            )
          )}
        </View>

        {/* MÉTODOS DE PAGO */}

        <View style={styles.seccion}>
          <View style={styles.tituloSeccion}>
            <Ionicons
              name="card-outline"
              size={20}
              color="#08752F"
            />

            <Text style={styles.tituloSeccionTexto}>
              Métodos de pago
            </Text>
          </View>

          <MetodoPago
            nombre="Efectivo"
            ventas={reporte.ventasEfectivo}
            total={dinero(reporte.efectivo)}
          />

          <MetodoPago
            nombre="Transferencia"
            ventas={
              reporte.ventasTransferencia
            }
            total={dinero(
              reporte.transferencias
            )}
          />
        </View>

        {/* NOTA */}

        <View style={styles.nota}>
          <Ionicons
            name="information-circle"
            size={22}
            color="#08752F"
          />

          <Text style={styles.notaTexto}>
            Los valores se actualizan
            automáticamente cada vez que se
            agrega o edita una entrega de este día.
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
  <View style={styles.resumenCard}>
    <View style={styles.resumenIcono}>
      <Ionicons
        name={icono}
        size={23}
        color="#08752F"
      />
    </View>

    <View>
      <Text style={styles.cardTitulo}>
        {titulo}
      </Text>

      <Text style={styles.cardValor}>
        {valor}
      </Text>
    </View>
  </View>
);

const Actividad = ({
  titulo,
  valor,
  descripcion,
}) => (
  <View style={styles.actividadItem}>
    <Text style={styles.actividadTitulo}>
      {titulo}
    </Text>

    <Text style={styles.actividadValor}>
      {valor}
    </Text>

    <Text
      style={styles.actividadDescripcion}
    >
      {descripcion}
    </Text>
  </View>
);

const MetodoPago = ({
  nombre,
  ventas,
  total,
}) => (
  <View style={styles.metodoFila}>
    <Text style={styles.metodoNombre}>
      {nombre}
    </Text>

    <Text style={styles.metodoVentas}>
      {ventas}{' '}
      {ventas === 1 ? 'venta' : 'ventas'}
    </Text>

    <Text style={styles.metodoTotal}>
      {total}
    </Text>
  </View>
);

export default ReporteDetalleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 110,
    backgroundColor: '#08752F',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 13,
  },

  regresar: {
    position: 'absolute',
    left: 15,
    bottom: 14,
    width: 45,
    height: 45,
    justifyContent: 'center',
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
    backgroundColor: '#F1F7F3',
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
    borderColor: '#E3E3E3',
    borderRadius: 9,
    padding: 10,
    marginBottom: 9,
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
    justifyContent: 'space-between',
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

  saldoCard: {
    minHeight: 62,
    borderWidth: 1,
    borderColor: '#E7E7E7',
    borderRadius: 7,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  saldoIcono: {
    marginRight: 10,
  },

  saldoValor: {
    color: '#D71920',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },

  saldoVerde: {
    color: '#08752F',
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
    backgroundColor: '#E5E5E5',
  },

  productoFila: {
    minHeight: 31,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    minHeight: 32,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
  },

  metodoNombre: {
    flex: 1,
    fontSize: 10,
  },

  metodoVentas: {
    flex: 1,
    fontSize: 10,
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
    backgroundColor: '#F1F7F3',
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