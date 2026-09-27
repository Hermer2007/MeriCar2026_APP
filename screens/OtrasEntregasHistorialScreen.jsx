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
import BotonHome from '../components/BotonHome';

export default function OtrasEntregasHistorialScreen({
  navigation,
}) {
  const { entregas } = useEntregas();

  // ==========================================
  // FECHA ACTUAL
  // ==========================================

  const obtenerFechaHoy = () => {
    const hoy = new Date();

    const dia = String(
      hoy.getDate()
    ).padStart(2, '0');

    const mes = String(
      hoy.getMonth() + 1
    ).padStart(2, '0');

    const anio = hoy.getFullYear();

    return `${dia}/${mes}/${anio}`;
  };

  const fechaHoy = obtenerFechaHoy();

  // ==========================================
  // OTRAS ENTREGAS DE HOY
  // ==========================================

  const otrasEntregasHoy = useMemo(() => {
    return entregas
      .filter(
        (entrega) =>
          entrega.tipo === 'OTRA_ENTREGA' &&
          !entrega.clienteId &&
          entrega.fecha === fechaHoy
      )
      .sort((a, b) => {
        return String(a.hora || '').localeCompare(
          String(b.hora || '')
        );
      });
  }, [entregas, fechaHoy]);

  // ==========================================
  // NOMBRE
  // ==========================================

  const obtenerNombre = (entrega) => {
    return (
      entrega.nombreTemporal ||
      entrega.nombreCliente ||
      'Cliente no registrado'
    );
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
            Otras entregas
          </Text>

          <Text style={styles.subtituloHeader}>
            {otrasEntregasHoy.length}{' '}
            {otrasEntregasHoy.length === 1
              ? 'entrega de hoy'
              : 'entregas de hoy'}
          </Text>
        </View>

        <BotonHome navigation={navigation} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* FECHA */}

        <View style={styles.fechaContainer}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color="#08752F"
          />

          <Text style={styles.fechaTexto}>
            {fechaHoy}
          </Text>
        </View>

        {/* SIN ENTREGAS */}

        {otrasEntregasHoy.length === 0 && (
          <View style={styles.sinEntregas}>
            <Ionicons
              name="receipt-outline"
              size={50}
              color="#B8B8B8"
            />

            <Text style={styles.sinEntregasTitulo}>
              Sin otras entregas
            </Text>

            <Text style={styles.sinEntregasTexto}>
              Todavía no se han registrado entregas
              para personas no registradas el día de hoy.
            </Text>
          </View>
        )}

        {/* ENTREGAS */}

        {otrasEntregasHoy.map((entrega) => (
          <View
            key={entrega.id}
            style={styles.tarjeta}
          >
            <View style={styles.tarjetaHeader}>
              <View style={styles.personaContainer}>
                <View style={styles.iconoPersona}>
                  <Ionicons
                    name="person-outline"
                    size={22}
                    color="#B86A00"
                  />
                </View>

                <View style={styles.nombreContainer}>
                  <Text style={styles.nombre}>
                    {obtenerNombre(entrega)}
                  </Text>

                  <View style={styles.horaFila}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color="#777777"
                    />

                    <Text style={styles.hora}>
                      {entrega.hora || 'Sin hora'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.total}>
                $
                {Number(
                  entrega.total || 0
                ).toFixed(2)}
              </Text>
            </View>

            <View style={styles.separador} />

            <View style={styles.resumen}>
              <View>
                <Text style={styles.resumenLabel}>
                  Abonado
                </Text>

                <Text style={styles.abonado}>
                  $
                  {Number(
                    entrega.abona || 0
                  ).toFixed(2)}
                </Text>
              </View>

              <View style={styles.resumenDerecha}>
                <Text style={styles.resumenLabel}>
                  Saldo pendiente
                </Text>

                <Text
                  style={[
                    styles.saldo,
                    Number(
                      entrega.saldoPendiente || 0
                    ) <= 0 &&
                      styles.saldoCero,
                  ]}
                >
                  $
                  {Number(
                    entrega.saldoPendiente || 0
                  ).toFixed(2)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.botonDetalle}
              activeOpacity={0.8}
              onPress={() => {
                navigation.navigate(
                  'EditarEntrega',
                  {
                    entrega: entrega,
                  }
                );
              }}
            >
              <Ionicons
                name="eye-outline"
                size={19}
                color="#08752F"
              />

              <Text style={styles.botonDetalleTexto}>
                Ver detalle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonAgregar}
              activeOpacity={0.8}
              onPress={() => {
                navigation.navigate(
                    'ClienteRegistro',
                    {
                    nombreTemporal:
                        entrega.nombreTemporal ||
                        '',
                    entregaTemporalId:
                        entrega.id,
                    }
                );
              }}
            >
              <Ionicons
                name="person-add-outline"
                size={18}
                color="#B86A00"
              />

              <Text style={styles.botonAgregarTexto}>
                Agregar cliente
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 105,
    backgroundColor: '#08752F',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
    alignItems: 'center',
  },

  tituloHeader: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
  },

  subtituloHeader: {
    color: '#DDEEE2',
    fontSize: 11,
    marginTop: 2,
  },

  scroll: {
    flex: 1,
  },

  contenido: {
    padding: 18,
    paddingBottom: 40,
  },

  fechaContainer: {
    height: 48,
    backgroundColor: '#F6F8F7',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },

  fechaTexto: {
    color: '#08752F',
    fontWeight: '700',
    fontSize: 13,
  },

  sinEntregas: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },

  sinEntregasTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#555555',
    marginTop: 15,
  },

  sinEntregasTexto: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 7,
  },

  tarjeta: {
    borderWidth: 1,
    borderColor: '#E8C98D',
    borderRadius: 13,
    padding: 15,
    marginBottom: 14,
    backgroundColor: '#FFFDF8',
  },

  tarjetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  personaContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconoPersona: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF3D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  nombreContainer: {
    flex: 1,
  },

  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },

  horaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },

  hora: {
    fontSize: 12,
    color: '#777777',
  },

  total: {
    fontSize: 18,
    fontWeight: '700',
    color: '#08752F',
    marginLeft: 10,
  },

  separador: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 13,
  },

  resumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  resumenDerecha: {
    alignItems: 'flex-end',
  },

  resumenLabel: {
    fontSize: 11,
    color: '#777777',
  },

  abonado: {
    fontSize: 14,
    fontWeight: '700',
    color: '#08752F',
    marginTop: 3,
  },

  saldo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D71920',
    marginTop: 3,
  },

  saldoCero: {
    color: '#08752F',
  },

  botonAgregar: {
    height: 43,
    borderWidth: 1,
    borderColor: '#E8C98D',
    borderRadius: 9,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFF9ED',
  },

  botonAgregarTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B86A00',
  },

  botonDetalle: {
    height: 43,
    borderWidth: 1,
    borderColor: '#B8D9C1',
    borderRadius: 9,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F3FAF5',
  },

  botonDetalleTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#08752F',
  },
});