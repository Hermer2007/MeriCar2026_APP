import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useClientes } from '../context/ClientesContext';
import BotonHome from '../components/BotonHome';

const DIAS = [
  {
    id: 'lunes',
    nombre: 'Lunes',
  },
  {
    id: 'miércoles',
    nombre: 'Miércoles',
  },
  {
    id: 'jueves',
    nombre: 'Jueves',
  },
  {
    id: 'domingo',
    nombre: 'Domingo',
  },
];

const EntregasScreen = ({ navigation }) => {
  const { clientes } = useClientes();

  // ==========================================
  // CLIENTES POR DÍA
  // ==========================================

  const contarClientes = (dia) => {
    return clientes.filter((cliente) => {
      // Soporta tanto:
      // diaTrabajo: "Lunes"
      //
      // como:
      // diasTrabajo: ["Lunes", "Jueves"]

      if (Array.isArray(cliente.diasTrabajo)) {
        return cliente.diasTrabajo.some(
          (d) =>
            String(d).toLowerCase() ===
            dia.toLowerCase()
        );
      }

      return (
        String(cliente.diaTrabajo || '').toLowerCase() ===
        dia.toLowerCase()
      );
    }).length;
  };

  const abrirDia = (dia) => {
    navigation.navigate('EntregasDia', {
      dia: dia.nombre,
    });
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

        <Text style={styles.tituloHeader}>
          Entregas
        </Text>
        <BotonHome navigation={navigation} />
      </View>

      {/* DÍAS */}

      <View style={styles.contenido}>
        {DIAS.map((dia) => {
          const cantidad = contarClientes(dia.nombre);

          return (
            <TouchableOpacity
              key={dia.id}
              style={styles.tarjetaDia}
              activeOpacity={0.75}
              onPress={() => abrirDia(dia)}
            >
              <View style={styles.iconoContainer}>
                <Ionicons
                  name="calendar"
                  size={43}
                  color="#08752F"
                />
              </View>

              <View style={styles.informacionDia}>
                <Text style={styles.nombreDia}>
                  {dia.nombre}
                </Text>

                <Text style={styles.cantidad}>
                  {cantidad}{' '}
                  {cantidad === 1
                    ? 'cliente'
                    : 'clientes'}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color="#08752F"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default EntregasScreen;

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
    paddingBottom: 20,
  },

  regresar: {
    position: 'absolute',
    left: 17,
    bottom: 11,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tituloHeader: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },

  contenido: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  tarjetaDia: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 13,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },

  iconoContainer: {
    width: 60,
    alignItems: 'center',
  },

  informacionDia: {
    flex: 1,
    marginLeft: 15,
  },

  nombreDia: {
    fontSize: 21,
    fontWeight: '700',
    color: '#08752F',
  },

  cantidad: {
    fontSize: 15,
    color: '#555555',
    marginTop: 7,
  },
});