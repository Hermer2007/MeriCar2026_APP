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
import { useEntregas } from '../context/EntregasContext';
import { useToast } from '../context/ToastContext';
import BotonHome from '../components/BotonHome';

const DIAS = [
  'Lunes',
  'Miércoles',
  'Jueves',
  'Domingo',
];

const ClientesScreen = ({ navigation }) => {
  const { mostrarToast } = useToast();
  const { clientes } = useClientes();

  const {
    entregas,
    obtenerSaldoCliente,
  } = useEntregas();

  const [busqueda, setBusqueda] =
    useState('');

  const [modalFiltro, setModalFiltro] =
    useState(false);

  const [diaFiltro, setDiaFiltro] =
    useState('Todos');

  const [estadoFiltro, setEstadoFiltro] =
    useState('Todos');

  const obtenerFechaEntrega = (entrega) => {
    if (!entrega) {
      return null;
    }

    const fechaSeleccionada =
      entrega.fechaSeleccionada;

    if (
      fechaSeleccionada &&
      typeof fechaSeleccionada.toDate ===
        'function'
    ) {
      return fechaSeleccionada.toDate();
    }

    if (
      fechaSeleccionada?.seconds
    ) {
      return new Date(
        fechaSeleccionada.seconds * 1000
      );
    }

    if (
      fechaSeleccionada instanceof Date
    ) {
      return fechaSeleccionada;
    }

    if (
      typeof fechaSeleccionada === 'string'
    ) {
      const fecha =
        new Date(fechaSeleccionada);

      if (
        !Number.isNaN(fecha.getTime())
      ) {
        return fecha;
      }
    }

    if (entrega.fecha) {
      const partes =
        String(entrega.fecha).split('/');

      if (partes.length === 3) {
        const dia =
          Number(partes[0]);

        const mes =
          Number(partes[1]) - 1;

        const anio =
          Number(partes[2]);

        const fecha =
          new Date(
            anio,
            mes,
            dia,
            12,
            0,
            0
          );

        if (
          !Number.isNaN(fecha.getTime())
        ) {
          return fecha;
        }
      }

      const fecha =
        new Date(entrega.fecha);

      if (
        !Number.isNaN(fecha.getTime())
      ) {
        return fecha;
      }
    }

    return null;
  };

  const obtenerUltimaEntregaCliente = (
    clienteId
  ) => {
    const entregasCliente =
      (entregas || []).filter(
        (entrega) =>
          entrega.clienteId === clienteId
      );

    if (
      entregasCliente.length === 0
    ) {
      return null;
    }

    let fechaMasReciente = null;

    entregasCliente.forEach(
      (entrega) => {
        const fecha =
          obtenerFechaEntrega(entrega);

        if (!fecha) {
          return;
        }

        if (
          !fechaMasReciente ||
          fecha.getTime() >
            fechaMasReciente.getTime()
        ) {
          fechaMasReciente = fecha;
        }
      }
    );

    return fechaMasReciente;
  };

  const clientesFiltrados = useMemo(
    () => {
      let resultado = [...clientes];

      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (texto) {
        resultado =
          resultado.filter(
            (cliente) => {
              const nombreCliente =
                cliente.nombre ||
                `${
                  cliente.nombres || ''
                } ${
                  cliente.apellidos || ''
                }`.trim();

              return `${
                nombreCliente
              } ${
                cliente.telefono || ''
              }`
                .toLowerCase()
                .includes(texto);
            }
          );
      }

      if (
        diaFiltro !== 'Todos'
      ) {
        resultado =
          resultado.filter(
            (cliente) =>
              Array.isArray(
                cliente.diasTrabajo
              ) &&
              cliente.diasTrabajo.includes(
                diaFiltro
              )
          );
      }

      if (
        estadoFiltro ===
        'Con deuda'
      ) {
        resultado =
          resultado.filter(
            (cliente) => {
              const saldo =
                Number(
                  obtenerSaldoCliente(
                    cliente.id
                  )
                ) || 0;

              return saldo > 0;
            }
          );
      }

      if (
        estadoFiltro ===
        'Sin deuda'
      ) {
        resultado =
          resultado.filter(
            (cliente) => {
              const saldo =
                Number(
                  obtenerSaldoCliente(
                    cliente.id
                  )
                ) || 0;

              return saldo <= 0;
            }
          );
      }

      if (
        estadoFiltro ===
        'Última entrega'
      ) {
        resultado.sort(
          (a, b) => {
            const fechaA =
              obtenerUltimaEntregaCliente(
                a.id
              );

            const fechaB =
              obtenerUltimaEntregaCliente(
                b.id
              );

            if (
              !fechaA &&
              !fechaB
            ) {
              return 0;
            }

            if (!fechaA) {
              return 1;
            }

            if (!fechaB) {
              return -1;
            }

            return (
              fechaB.getTime() -
              fechaA.getTime()
            );
          }
        );
      }

      return resultado;
    },
    [
      clientes,
      entregas,
      busqueda,
      diaFiltro,
      estadoFiltro,
      obtenerSaldoCliente,
    ]
  );

  const iniciales = (cliente) => {
    const nombreCompleto =
      cliente.nombre ||
      `${
        cliente.nombres || ''
      } ${
        cliente.apellidos || ''
      }`.trim();

    const partes =
      nombreCompleto
        .trim()
        .split(' ')
        .filter(Boolean);

    const primera =
      partes[0]?.charAt(0) || '';

    const segunda =
      partes.length > 1
        ? partes[
            partes.length - 1
          ]?.charAt(0)
        : '';

    return `${primera}${segunda}`
      .toUpperCase();
  };

  const limpiarFiltros = () => {
    setDiaFiltro('Todos');
    setEstadoFiltro('Todos');
  };

  const renderCliente = ({
    item,
  }) => (
    <TouchableOpacity
      style={styles.cliente}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate(
          'EditarCliente',
          {
            cliente: item,
          }
        )
      }
    >
      <View style={styles.avatar}>
        <Text
          style={styles.iniciales}
        >
          {iniciales(item)}
        </Text>
      </View>

      <View
        style={styles.infoCliente}
      >
        <Text
          style={styles.nombre}
        >
          {item.nombre ||
            `${
              item.nombres || ''
            } ${
              item.apellidos || ''
            }`.trim()}
        </Text>

        {item.telefono ? (
          <Text
            style={styles.telefono}
          >
            {item.telefono}
          </Text>
        ) : null}

        <Text
          style={
            styles.diaCliente
          }
        >
          {Array.isArray(
            item.diasTrabajo
          )
            ? item.diasTrabajo.join(
                ', '
              )
            : ''}
        </Text>
      </View>

      <View
        style={
          styles.flechaCliente
        }
      >
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

        <View
          style={styles.headerCentro}
        >
          <Text
            style={
              styles.tituloHeader
            }
          >
            Clientes
          </Text>

          <Text
            style={
              styles.totalClientes
            }
          >
            {clientes.length}{' '}
            {clientes.length === 1
              ? 'cliente registrado'
              : 'clientes registrados'}
          </Text>
        </View>
        <BotonHome navigation={navigation} />
      </View>

      {/* BUSCADOR */}
      <View
        style={styles.busquedaFila}
      >
        <View
          style={
            styles.buscadorContainer
          }
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
            onChangeText={
              setBusqueda
            }
          />
        </View>

        <TouchableOpacity
          style={
            styles.botonFiltro
          }
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
        keyExtractor={(item) =>
          item.id
        }
        renderItem={renderCliente}
        contentContainerStyle={
          styles.lista
        }
        showsVerticalScrollIndicator={
          false
        }
        ListEmptyComponent={
          <View
            style={
              styles.estadoVacio
            }
          >
            <View
              style={
                styles.iconoVacio
              }
            >
              <Ionicons
                name="people-outline"
                size={55}
                color="#08752F"
              />
            </View>

            <Text
              style={
                styles.sinResultados
              }
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
        style={
          styles.botonAgregar
        }
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
          style={
            styles.modalFondo
          }
          onPress={() =>
            setModalFiltro(false)
          }
        >
          <Pressable
            style={
              styles.modalContenido
            }
            onPress={() => {}}
          >
            <View
              style={
                styles.modalEncabezado
              }
            >
              <View
                style={
                  styles.iconoFiltro
                }
              >
                <Ionicons
                  name="filter-outline"
                  size={26}
                  color="#08752F"
                />
              </View>

              <View
                style={{ flex: 1 }}
              >
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
                  setModalFiltro(
                    false
                  )
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
              style={
                styles.gridFiltros
              }
            >
              <BotonFiltro
                texto="Todos"
                seleccionado={
                  diaFiltro ===
                  'Todos'
                }
                onPress={() =>
                  setDiaFiltro(
                    'Todos'
                  )
                }
                icono="checkmark-circle"
              />

              {DIAS.map((dia) => (
                <BotonFiltro
                  key={dia}
                  texto={dia}
                  seleccionado={
                    diaFiltro ===
                    dia
                  }
                  onPress={() =>
                    setDiaFiltro(
                      dia
                    )
                  }
                  icono="calendar-outline"
                />
              ))}
            </View>

            <View
              style={
                styles.separador
              }
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
              Filtra los clientes por su estado
            </Text>

            <View
              style={
                styles.gridFiltros
              }
            >
              <BotonFiltro
                texto="Todos"
                seleccionado={
                  estadoFiltro ===
                  'Todos'
                }
                onPress={() =>
                  setEstadoFiltro(
                    'Todos'
                  )
                }
                icono="people-outline"
              />

              <BotonFiltro
                texto="Con deuda"
                seleccionado={
                  estadoFiltro ===
                  'Con deuda'
                }
                onPress={() =>
                  setEstadoFiltro(
                    'Con deuda'
                  )
                }
                icono="alert-circle-outline"
              />

              <BotonFiltro
                texto="Sin deuda"
                seleccionado={
                  estadoFiltro ===
                  'Sin deuda'
                }
                onPress={() =>
                  setEstadoFiltro(
                    'Sin deuda'
                  )
                }
                icono="checkmark-circle-outline"
              />

              <BotonFiltro
                texto="Última entrega"
                seleccionado={
                  estadoFiltro ===
                  'Última entrega'
                }
                onPress={() =>
                  setEstadoFiltro(
                    'Última entrega'
                  )
                }
                icono="time-outline"
              />
            </View>

            <View
              style={
                styles.botonesModal
              }
            >
              <TouchableOpacity
                style={styles.limpiar}
                onPress={
                  limpiarFiltros
                }
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
                  setModalFiltro(
                    false
                  );

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
    height: 115,
    backgroundColor: '#08752F',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 15,
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

  headerCentro: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  tituloHeader: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
    textAlign: 'center',
  },

  totalClientes: {
    color: '#DDEEE2',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
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
    color: '#000000',
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
    backgroundColor:
      'rgba(0,0,0,0.45)',
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