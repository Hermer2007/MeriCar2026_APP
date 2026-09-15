import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useClientes } from '../context/ClientesContext';
import { useToast } from '../context/ToastContext';

const DIAS = ['Lunes', 'Miércoles', 'Jueves', 'Domingo'];

const ClientesScreen = ({ navigation }) => {
  const { mostrarToast } = useToast();
  const { clientes } = useClientes();

  const [busqueda, setBusqueda] = useState('');
  const [modalFiltro, setModalFiltro] = useState(false);

  const [diaFiltro, setDiaFiltro] = useState('Todos');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [orden, setOrden] = useState('Nombre');

  const clientesFiltrados = useMemo(() => {
    let resultado = [...clientes];

    const texto = busqueda.trim().toLowerCase();

    if (texto) {
      resultado = resultado.filter((cliente) => {
        const nombreCliente =
          cliente.nombre ||
          `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();

        return `${nombreCliente} ${cliente.telefono || ''}`
          .toLowerCase()
          .includes(texto);
      });
    }

    if (diaFiltro !== 'Todos') {
      resultado = resultado.filter((cliente) =>
        cliente.diasTrabajo.includes(diaFiltro)
      );
    }

    if (estadoFiltro === 'Con deuda') {
      resultado = resultado.filter(
        (cliente) => Number(cliente.saldoPendiente) > 0
      );
    }

    if (estadoFiltro === 'Sin deuda') {
      resultado = resultado.filter(
        (cliente) => Number(cliente.saldoPendiente) === 0
      );
    }

    if (orden === 'Nombre') {
      resultado.sort((a, b) => {
        const nombreA =
          a.nombre ||
          `${a.nombres || ''} ${a.apellidos || ''}`.trim();

        const nombreB =
          b.nombre ||
          `${b.nombres || ''} ${b.apellidos || ''}`.trim();

        return nombreA.localeCompare(nombreB);
      });
    }

    if (orden === 'Día de entrega') {
      resultado.sort((a, b) =>
        (a.diasTrabajo[0] || '').localeCompare(
          b.diasTrabajo[0] || ''
        )
      );
    }

    if (orden === 'Saldo pendiente') {
      resultado.sort(
        (a, b) =>
          Number(b.saldoPendiente) -
          Number(a.saldoPendiente)
      );
    }

    if (orden === 'Última entrega') {
      resultado.sort((a, b) => {
        if (!a.ultimaEntrega) return 1;
        if (!b.ultimaEntrega) return -1;

        return (
          new Date(b.ultimaEntrega).getTime() -
          new Date(a.ultimaEntrega).getTime()
        );
      });
    }

    return resultado;
  }, [
    clientes,
    busqueda,
    diaFiltro,
    estadoFiltro,
    orden,
  ]);

  const iniciales = (cliente) => {
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

  const limpiarFiltros = () => {
    setDiaFiltro('Todos');
    setEstadoFiltro('Todos');
    setOrden('Nombre');
  };

  const renderCliente = ({ item }) => (
    <TouchableOpacity
      style={styles.cliente}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate('EditarCliente', {
          cliente: item,
        })
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.iniciales}>
          {iniciales(item)}
        </Text>
      </View>

      <View style={styles.infoCliente}>
        <Text style={styles.nombre}>
          {item.nombre ||
            `${item.nombres || ''} ${
              item.apellidos || ''
            }`.trim()}
        </Text>

        {item.telefono ? (
          <Text style={styles.telefono}>
            {item.telefono}
          </Text>
        ) : null}

        <Text style={styles.diaCliente}>
          {item.diasTrabajo?.join(', ')}
        </Text>
      </View>

      <View style={styles.flechaCliente}>
        <Ionicons
          name="chevron-forward"
          size={22}
          color="#08752F"
        />
      </View>
    </TouchableOpacity>
  );

  const BotonFiltro = ({
    texto,
    seleccionado,
    onPress,
    icono,
  }) => (
    <TouchableOpacity
      style={[
        styles.opcionFiltro,
        seleccionado &&
          styles.opcionFiltroActiva,
      ]}
      onPress={onPress}
    >
      {icono && (
        <Ionicons
          name={icono}
          size={18}
          color={
            seleccionado
              ? '#FFFFFF'
              : '#222222'
          }
        />
      )}

      <Text
        style={[
          styles.textoFiltro,
          seleccionado &&
            styles.textoFiltroActivo,
        ]}
      >
        {texto}
      </Text>
    </TouchableOpacity>
  );

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

        <Text style={styles.tituloHeader}>
          Clientes
        </Text>
      </View>

      {/* BUSCADOR */}
      <View style={styles.busquedaFila}>
        <View
          style={styles.buscadorContainer}
        >
          <Ionicons
            name="search"
            size={22}
            color="#555555"
          />

          <TextInput
            style={styles.buscador}
            placeholder="Buscar cliente..."
            placeholderTextColor="#8D8D8D"
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        <TouchableOpacity
          style={styles.botonFiltro}
          onPress={() =>
            setModalFiltro(true)
          }
        >
          <Ionicons
            name="filter-outline"
            size={25}
            color="#222222"
          />
        </TouchableOpacity>
      </View>

      {/* LISTA */}
      <FlatList
        data={clientesFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderCliente}
        contentContainerStyle={
          styles.lista
        }
        showsVerticalScrollIndicator={
          false
        }
        ListEmptyComponent={
          <View style={styles.estadoVacio}>
            <View
              style={styles.iconoVacio}
            >
              <Ionicons
                name="people-outline"
                size={55}
                color="#08752F"
              />
            </View>

            <Text
              style={styles.sinResultados}
            >
              No se encontraron clientes
            </Text>

            <Text
              style={
                styles.descripcionVacia
              }
            >
              Prueba con otra búsqueda o registra un nuevo cliente.
            </Text>
          </View>
        }
      />

      {/* AGREGAR CLIENTE */}
      <TouchableOpacity
        style={styles.botonAgregar}
        onPress={() =>
          navigation.navigate(
            'ClienteRegistro'
          )
        }
      >
        <Ionicons
          name="add"
          size={38}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {/* MODAL FILTRO */}
      <Modal
        visible={modalFiltro}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalFiltro(false)
        }
      >
        <Pressable
          style={styles.modalFondo}
          onPress={() =>
            setModalFiltro(false)
          }
        >
          <Pressable
            style={styles.modalContenido}
            onPress={() => {}}
          >
            <View
              style={
                styles.modalEncabezado
              }
            >
              <View
                style={styles.iconoFiltro}
              >
                <Ionicons
                  name="filter-outline"
                  size={26}
                  color="#08752F"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={
                    styles.modalTitulo
                  }
                >
                  Filtrar clientes
                </Text>

                <Text
                  style={
                    styles.modalSubtitulo
                  }
                >
                  Selecciona las opciones para refinar la búsqueda
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setModalFiltro(false)
                }
              >
                <Ionicons
                  name="close"
                  size={28}
                  color="#333333"
                />
              </TouchableOpacity>
            </View>

            {/* DÍAS */}
            <Text
              style={
                styles.seccionTitulo
              }
            >
              Filtrar por día
            </Text>

            <Text
              style={
                styles.seccionDescripcion
              }
            >
              Muestra solo los clientes que trabajan en:
            </Text>

            <View
              style={styles.gridFiltros}
            >
              <BotonFiltro
                texto="Todos"
                seleccionado={
                  diaFiltro === 'Todos'
                }
                onPress={() =>
                  setDiaFiltro('Todos')
                }
                icono="checkmark-circle"
              />

              {DIAS.map((dia) => (
                <BotonFiltro
                  key={dia}
                  texto={dia}
                  seleccionado={
                    diaFiltro === dia
                  }
                  onPress={() =>
                    setDiaFiltro(dia)
                  }
                  icono="calendar-outline"
                />
              ))}
            </View>

            <View
              style={styles.separador}
            />

            {/* ESTADO */}
            <Text
              style={
                styles.seccionTitulo
              }
            >
              Estado
            </Text>

            <Text
              style={
                styles.seccionDescripcion
              }
            >
              Filtra según la deuda del cliente
            </Text>

            <View
              style={styles.gridFiltros}
            >
              {[
                'Todos',
                'Con deuda',
                'Sin deuda',
              ].map((estado) => (
                <BotonFiltro
                  key={estado}
                  texto={estado}
                  seleccionado={
                    estadoFiltro ===
                    estado
                  }
                  onPress={() =>
                    setEstadoFiltro(
                      estado
                    )
                  }
                />
              ))}
            </View>

            <View
              style={styles.separador}
            />

            {/* ORDEN */}
            <Text
              style={
                styles.seccionTitulo
              }
            >
              Ordenar por
            </Text>

            <Text
              style={
                styles.seccionDescripcion
              }
            >
              Organiza la lista de resultados
            </Text>

            <View
              style={styles.gridFiltros}
            >
              {[
                'Nombre',
                'Día de entrega',
                'Última entrega',
                'Saldo pendiente',
              ].map((item) => (
                <BotonFiltro
                  key={item}
                  texto={item}
                  seleccionado={
                    orden === item
                  }
                  onPress={() =>
                    setOrden(item)
                  }
                />
              ))}
            </View>

            <View
              style={
                styles.botonesModal
              }
            >
              <TouchableOpacity
                style={styles.limpiar}
                onPress={limpiarFiltros}
              >
                <Ionicons
                  name="trash-outline"
                  size={19}
                  color="#08752F"
                />

                <Text
                  style={
                    styles.textoLimpiar
                  }
                >
                  Limpiar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.aplicar}
                onPress={() => {
                  setModalFiltro(false);

                  mostrarToast(
                    'Filtros aplicados correctamente.',
                    'success'
                  );
                }}
              >
                <Ionicons
                  name="filter-outline"
                  size={19}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.textoAplicar
                  }
                >
                  Aplicar filtros
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default ClientesScreen;

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
    left: 18,
    bottom: 11,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tituloHeader: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
  },

  busquedaFila: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 17,
    gap: 10,
  },

  buscadorContainer: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: '#DEDEDE',
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  buscador: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },

  botonFiltro: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderColor: '#DEDEDE',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  lista: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 90,
  },

  cliente: {
    minHeight: 72,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
  },

  diaCliente: {
    fontSize: 12,
    color: '#777777',
    marginTop: 3,
  },

  flechaCliente: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#A7D4B3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  iniciales: {
    color: '#176B33',
    fontSize: 17,
    fontWeight: '700',
  },

  estadoVacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
    paddingVertical: 55,
  },

  iconoVacio: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  sinResultados: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 7,
  },

  descripcionVacia: {
    fontSize: 14,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 20,
  },

  infoCliente: {
    flex: 1,
  },

  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202020',
  },

  telefono: {
    fontSize: 14,
    color: '#444444',
    marginTop: 2,
  },

  dia: {
    maxWidth: 85,
    textAlign: 'right',
    color: '#333333',
    fontSize: 13,
  },

  botonAgregar: {
    position: 'absolute',
    right: 25,
    bottom: 60,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#08752F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 7,
  },

  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },

  modalContenido: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },

  modalEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  iconoFiltro: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F3E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  modalTitulo: {
    fontSize: 21,
    fontWeight: '700',
  },

  modalSubtitulo: {
    color: '#777777',
    fontSize: 12,
    marginTop: 2,
  },

  seccionTitulo: {
    fontSize: 15,
    fontWeight: '700',
  },

  seccionDescripcion: {
    fontSize: 12,
    color: '#777777',
    marginTop: 2,
    marginBottom: 10,
  },

  gridFiltros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  opcionFiltro: {
    width: '48%',
    height: 39,
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  opcionFiltroActiva: {
    backgroundColor: '#08752F',
    borderColor: '#08752F',
  },

  textoFiltro: {
    fontSize: 12,
    fontWeight: '600',
  },

  textoFiltroActivo: {
    color: '#FFFFFF',
  },

  separador: {
    height: 1,
    backgroundColor: '#E7E7E7',
    marginVertical: 15,
  },

  botonesModal: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },

  limpiar: {
    flex: 1,
    height: 47,
    borderWidth: 1,
    borderColor: '#08752F',
    borderRadius: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },

  textoLimpiar: {
    color: '#08752F',
    fontWeight: '700',
  },

  aplicar: {
    flex: 1.2,
    height: 47,
    backgroundColor: '#08752F',
    borderRadius: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },

  textoAplicar: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});