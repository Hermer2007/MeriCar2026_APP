import React, {
  useEffect,
  useState,
} from 'react';

import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

export default function ReportesMenuScreen({
  navigation,
}) {
  // ==========================================
  // FECHA ACTUAL
  // ==========================================

  const obtenerFechaActual = () => {
    const ahora = new Date();

    const dia = String(
      ahora.getDate()
    ).padStart(2, '0');

    const mes = String(
      ahora.getMonth() + 1
    ).padStart(2, '0');

    const anio =
      ahora.getFullYear();

    return `${dia}/${mes}/${anio}`;
  };

  const [
    fechaActual,
    setFechaActual,
  ] = useState(
    obtenerFechaActual()
  );

  // ==========================================
  // ACTUALIZAR FECHA
  // ==========================================

  useEffect(() => {
    const intervalo =
      setInterval(() => {
        setFechaActual(
          obtenerFechaActual()
        );
      }, 60000);

    return () =>
      clearInterval(
        intervalo
      );
  }, []);

  // ==========================================
  // OPCIONES
  // ==========================================

  const opciones = [
    {
      id: '1',
      titulo: 'Reporte del día',
      descripcion: fechaActual,
      icono: 'calendar-outline',
      accion: () =>
        navigation.navigate(
          'ReporteDetalle',
          {
            fecha:
              fechaActual,
          }
        ),
    },

    {
      id: '2',
      titulo:
        'Ventas y entregas generales',
      descripcion:
        'Historial de todos los reportes',
      icono:
        'receipt-outline',
      accion: () =>
        navigation.navigate(
          'ReportesGenerales'
        ),
    },

    {
    id: '3',
    titulo: 'Clientes y Entregas',
    descripcion: 'Resumen y ranking de clientes',
    icono: 'people-outline',
    accion: () =>
        navigation.navigate(
        'ClientesEntregas'
        ),
    },

    {
      id: '4',
      titulo: 'Cuentas por cobrar',
      descripcion: 'Entregas con saldos pendientes',
      icono: 'wallet-outline',
      accion: () =>
        navigation.navigate(
          'CuentasCobrar'
        ),
    },

    {
      id: '5',
      titulo: 'Productos vendidos',
      descripcion: 'Ranking de productos por ventas',
      icono: 'cube-outline',
      accion: () =>
        navigation.navigate(
          'ProductosVendidos'
        ),
    },
  ];

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
            Reportes
          </Text>

          <Text
            style={
              styles.subtituloHeader
            }
          >
            Información del negocio
          </Text>
        </View>
      </View>

      {/* CONTENIDO */}

      <ScrollView
        contentContainerStyle={
          styles.contenido
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text
          style={
            styles.tituloSeccion
          }
        >
          Seleccione un reporte
        </Text>

        <Text
          style={
            styles.descripcionSeccion
          }
        >
          Consulte la información registrada en el sistema.
        </Text>

        {/* OPCIONES */}

        <View
          style={
            styles.lista
          }
        >
          {opciones.map(
            (opcion) => (
              <TouchableOpacity
                key={
                  opcion.id
                }
                style={
                  styles.tarjeta
                }
                activeOpacity={
                  opcion.accion
                    ? 0.75
                    : 1
                }
                onPress={() => {
                  if (
                    opcion.accion
                  ) {
                    opcion.accion();
                  }
                }}
              >
                {/* ICONO */}

                <View
                  style={
                    styles.iconoContainer
                  }
                >
                  <Ionicons
                    name={
                      opcion.icono
                    }
                    size={27}
                    color="#08752F"
                  />
                </View>

                {/* TEXTO */}

                <View
                  style={
                    styles.info
                  }
                >
                  <Text
                    style={
                      styles.tituloTarjeta
                    }
                  >
                    {
                      opcion.titulo
                    }
                  </Text>

                  <Text
                    style={[
                      styles.descripcionTarjeta,

                      opcion.id ===
                        '1' &&
                        styles.fechaTexto,
                    ]}
                  >
                    {
                      opcion.descripcion
                    }
                  </Text>
                </View>

                {/* FLECHA */}

                <View
                  style={
                    styles.flechaContainer
                  }
                >
                  <Ionicons
                    name="chevron-forward"
                    size={26}
                    color="#08752F"
                  />
                </View>
              </TouchableOpacity>
            )
          )}
        </View>
      </ScrollView>
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
      fontSize: 22,
      fontWeight:
        '700',
    },

    subtituloHeader: {
      color:
        '#DDEEE2',
      fontSize: 12,
      marginTop: 2,
    },

    // ========================================
    // CONTENIDO
    // ========================================

    contenido: {
      paddingHorizontal: 18,
      paddingTop: 23,
      paddingBottom: 40,
    },

    tituloSeccion: {
      fontSize: 17,
      fontWeight:
        '700',
      color:
        '#282828',
    },

    descripcionSeccion: {
      fontSize: 12,
      color:
        '#858585',
      marginTop: 3,
      marginBottom: 16,
    },

    lista: {
      gap: 12,
    },

    // ========================================
    // TARJETA
    // ========================================

    tarjeta: {
      minHeight: 86,
      backgroundColor:
        '#FFFFFF',
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        '#E1E1E1',
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 14,

      shadowColor:
        '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 3,

      elevation: 2,
    },

    // ========================================
    // ICONO
    // ========================================

    iconoContainer: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor:
        '#E6F6EB',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    // ========================================
    // INFORMACIÓN
    // ========================================

    info: {
      flex: 1,
      marginLeft: 14,
      marginRight: 10,
    },

    tituloTarjeta: {
      fontSize: 14,
      fontWeight:
        '700',
      color:
        '#292929',
    },

    descripcionTarjeta: {
      marginTop: 4,
      fontSize: 11,
      color:
        '#8A8A8A',
    },

    fechaTexto: {
      color:
        '#08752F',
      fontWeight:
        '600',
    },

    // ========================================
    // FLECHA
    // ========================================

    flechaContainer: {
      width: 39,
      height: 39,
      borderRadius: 20,
      backgroundColor:
        '#F0F8F2',
      justifyContent:
        'center',
      alignItems:
        'center',
    },
  });