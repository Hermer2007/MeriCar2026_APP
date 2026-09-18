import React, { useMemo, useState } from 'react';

import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useClientes } from '../context/ClientesContext';
import { useEntregas } from '../context/EntregasContext';

const EntregasDiaScreen = ({ navigation, route }) => {
  const { clientes } = useClientes();
  const { entregas } = useEntregas();

  const dia = route.params?.dia || '';

  const [busqueda, setBusqueda] = useState('');

  // ==========================================
// ENTREGA REGISTRADA HOY
// ==========================================

  const obtenerFechaHoy = () => {
    const hoy = new Date();

    const dia = String(
      hoy.getDate()
    ).padStart(2, '0');

    const mes = String(
      hoy.getMonth() + 1
    ).padStart(2, '0');

    const anio =
      hoy.getFullYear();

    return `${dia}/${mes}/${anio}`;
  };

  const clienteEntregadoHoy = (clienteId) => {
    const fechaHoy =
      obtenerFechaHoy();

    return entregas.some(
      (entrega) =>
        String(entrega.clienteId) ===
          String(clienteId) &&
        entrega.fecha === fechaHoy
    );
  };

  // ==========================================
  // CLIENTES DEL DÍA
  // ==========================================

  const clientesDelDia = useMemo(() => {
    return clientes.filter((cliente) => {
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
    });
  }, [clientes, dia]);

  // ==========================================
  // BUSCADOR
  // ==========================================

  const clientesFiltrados = useMemo(() => {
  const texto = busqueda
    .trim()
    .toLowerCase();

  if (!texto) {
    return clientesDelDia;
  }

  return clientesDelDia.filter((cliente) => {
    const nombreCompleto =
      cliente.nombre ||
      `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();

    const telefono =
      String(cliente.telefono || '');

    return (
      nombreCompleto.toLowerCase().includes(texto) ||
      telefono.includes(texto)
    );
  });
}, [
  clientesDelDia,
  busqueda,
]);

  // ==========================================
  // INICIALES
  // ==========================================

  const obtenerIniciales = (cliente) => {
  const nombreCompleto =
    cliente.nombre ||
    `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();

  const partes = nombreCompleto
    .trim()
    .split(' ')
    .filter(Boolean);

  const primera =
    partes[0]?.charAt(0) || '';

  const segunda =
    partes.length > 1
      ? partes[partes.length - 1]?.charAt(0)
      : '';

  return `${primera}${segunda}`.toUpperCase();
};

  // ==========================================
  // NUEVA ENTREGA DEL CLIENTE
  // ==========================================

  const seleccionarCliente = (cliente) => {
    navigation.navigate(
      'ClienteDetalle',
      {
        cliente,
      }
    );
  };

  // ==========================================
  // OTRA ENTREGA
  // ==========================================

  const otraEntrega = () => {
    navigation.navigate(
      'OtraEntrega',
      {
        dia,
      }
    );
  };

  // ==========================================
  // CLIENTE
  // ==========================================

  const renderCliente = ({ item }) => {
  const entregadoHoy =
    clienteEntregadoHoy(item.id);

  return (
      <TouchableOpacity
        style={styles.clienteCard}
        activeOpacity={0.75}
        onPress={() =>
          seleccionarCliente(item)
        }
      >
        <View
          style={[
            styles.avatar,
            entregadoHoy
              ? styles.avatarEntregado
              : styles.avatarPendiente,
          ]}
        >
          <Text
            style={[
              styles.avatarTexto,
              entregadoHoy
                ? styles.avatarTextoEntregado
                : styles.avatarTextoPendiente,
            ]}
          >
            {obtenerIniciales(item)}
          </Text>
        </View>

        <View style={styles.clienteInfo}>
          <Text style={styles.nombreCliente}>
  {item.nombre ||
    `${item.nombres || ''} ${item.apellidos || ''}`.trim()}
</Text>

          <Text style={styles.telefono}>
            {item.telefono ||
              'Sin teléfono'}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
          color="#08752F"
        />
      </TouchableOpacity>
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

        <View style={styles.headerCentro}>
          <Text style={styles.tituloHeader}>
            Entregas - {dia}
          </Text>

          <Text style={styles.subtituloHeader}>
            {clientesDelDia.length}{' '}
            {clientesDelDia.length === 1
              ? 'cliente'
              : 'clientes'}
          </Text>
        </View>
      </View>

      {/* BUSCADOR */}

      <View style={styles.busquedaContainer}>
        <Ionicons
          name="search-outline"
          size={21}
          color="#777777"
        />

        <TextInput
          style={styles.inputBusqueda}
          placeholder="Buscar cliente..."
          placeholderTextColor="#888888"
          value={busqueda}
          onChangeText={setBusqueda}
          selectTextOnFocus
        />

        {busqueda.length > 0 && (
          <TouchableOpacity
            onPress={() =>
              setBusqueda('')
            }
          >
            <Ionicons
              name="close-circle"
              size={20}
              color="#AAAAAA"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* LISTA */}

      <FlatList
        data={clientesFiltrados}
        keyExtractor={(item) =>
          String(item.id)
        }
        renderItem={renderCliente}
        contentContainerStyle={
          styles.lista
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Ionicons
              name="people-outline"
              size={48}
              color="#B7B7B7"
            />

            <Text style={styles.vacioTitulo}>
              No hay clientes
            </Text>

            <Text style={styles.vacioTexto}>
              No existen clientes registrados
              para {dia}.
            </Text>
          </View>
        }
      />

      {/* OTRA ENTREGA */}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.botonOtraEntrega}
          onPress={otraEntrega}
        >
          <Ionicons
            name="add"
            size={24}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.textoOtraEntrega
            }
          >
            Otra entrega
          </Text>
        </TouchableOpacity>

        <Text style={styles.ayuda}>
          Registrar entrega para un cliente
          que no está en la lista
        </Text>
      </View>
    </View>
  );
};

export default EntregasDiaScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 115,
    backgroundColor: '#08752F',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 13,
  },

  regresar: {
    position: 'absolute',
    left: 17,
    bottom: 17,
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCentro: {
    alignItems: 'center',
  },

  tituloHeader: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  subtituloHeader: {
    color: '#E5F2E8',
    fontSize: 12,
    marginTop: 3,
  },

  busquedaContainer: {
    height: 48,
    marginHorizontal: 20,
    marginTop: 13,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputBusqueda: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 14,
    color: '#222222',
  },

  lista: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },

  clienteCard: {
    minHeight: 67,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    marginBottom: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarPendiente: {
    backgroundColor: '#FFF3CD',
  },

  avatarEntregado: {
    backgroundColor: '#E1F0E5',
  },

  avatarTexto: {
    fontSize: 15,
    fontWeight: '700',
  },

  avatarTextoPendiente: {
    color: '#D39E00',
  },

  avatarTextoEntregado: {
    color: '#08752F',
  },

  clienteInfo: {
    flex: 1,
    marginLeft: 12,
  },

  nombreCliente: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
  },

  telefono: {
    fontSize: 11,
    color: '#666666',
    marginTop: 3,
  },

  vacio: {
    alignItems: 'center',
    paddingTop: 60,
  },

  vacioTitulo: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: '700',
    color: '#555555',
  },

  vacioTexto: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 13,
  },

  botonOtraEntrega: {
    height: 48,
    borderRadius: 9,
    backgroundColor: '#08752F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  textoOtraEntrega: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  ayuda: {
    textAlign: 'center',
    color: '#888888',
    fontSize: 9,
    marginTop: 5,
  },
});