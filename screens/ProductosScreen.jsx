import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
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
import { useProductos } from '../context/ProductosContext';
import { useToast } from '../context/ToastContext';
import { useAlert } from '../context/AlertContext';

const ProductosScreen = ({ navigation }) => {
  const { mostrarToast } = useToast();
  const { mostrarAlert } = useAlert();

  const {
    productos,
    agregarProducto: agregarProductoContext,
    actualizarPrecio,
    eliminarProducto: eliminarProductoContext,
  } = useProductos();

  const [busqueda, setBusqueda] = useState('');

  const [
    productoEditando,
    setProductoEditando,
  ] = useState(null);

  const [
    nuevoPrecio,
    setNuevoPrecio,
  ] = useState('');

  const [
    modalAgregar,
    setModalAgregar,
  ] = useState(false);

  const [
    nuevoNombre,
    setNuevoNombre,
  ] = useState('');

  const [
    precioNuevoProducto,
    setPrecioNuevoProducto,
  ] = useState('');

  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) =>
      producto.nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  }, [productos, busqueda]);

  // ==========================================
  // EDITAR PRECIO
  // ==========================================

  const abrirEditarPrecio = (producto) => {
    setProductoEditando(producto);

    setNuevoPrecio(
      Number(producto.precio).toFixed(2)
    );
  };

  const guardarPrecio = () => {
    const precioConvertido = Number(
      nuevoPrecio.replace(',', '.')
    );

    if (
      !nuevoPrecio.trim() ||
      Number.isNaN(precioConvertido) ||
      precioConvertido < 0
    ) {
      mostrarToast(
        'Ingrese un precio válido.',
        'warning'
      );

      return;
    }

    try {
      actualizarPrecio(
        productoEditando.id,
        precioConvertido
      );

      setProductoEditando(null);
      setNuevoPrecio('');

      mostrarToast(
        'Precio actualizado correctamente.',
        'success'
      );
    } catch (error) {
      mostrarToast(
        'No se pudo actualizar el precio.',
        'error'
      );
    }
  };

  // ==========================================
  // ELIMINAR PRODUCTO
  // ==========================================

  const eliminarProducto = (producto) => {
    mostrarAlert({
      titulo: 'Eliminar producto',
      mensaje: `¿Desea eliminar ${producto.nombre}?`,
      tipo: 'danger',
      mostrarCancelar: true,
      textoCancelar: 'Cancelar',
      textoConfirmar: 'Eliminar',
      onConfirmar: () => {
        try {
          eliminarProductoContext(
            producto.id
          );

          mostrarToast(
            'Producto eliminado correctamente.',
            'success'
          );
        } catch (error) {
          mostrarToast(
            'No se pudo eliminar el producto.',
            'error'
          );
        }
      },
    });
  };

  // ==========================================
  // AGREGAR PRODUCTO
  // ==========================================

  const agregarProducto = () => {
    const precioConvertido = Number(
      precioNuevoProducto.replace(',', '.')
    );

    // NOMBRE VACÍO
    if (!nuevoNombre.trim()) {
      mostrarToast(
        'Ingrese el nombre del producto.',
        'warning'
      );

      return;
    }

    // PRECIO VACÍO
    if (!precioNuevoProducto.trim()) {
      mostrarToast(
        'Ingrese el precio del producto.',
        'warning'
      );

      return;
    }

    // PRECIO INVÁLIDO
    if (
      Number.isNaN(precioConvertido) ||
      precioConvertido < 0
    ) {
      mostrarToast(
        'Ingrese un precio válido.',
        'warning'
      );

      return;
    }

    try {
      agregarProductoContext(
        nuevoNombre.trim(),
        precioConvertido
      );

      setNuevoNombre('');
      setPrecioNuevoProducto('');
      setModalAgregar(false);

      mostrarToast(
        'Producto registrado correctamente.',
        'success'
      );

      mostrarToast(
        'El producto ya está disponible en Inventario y Entregas.',
        'info'
      );
    } catch (error) {
      mostrarToast(
        'No se pudo registrar el producto.',
        'error'
      );
    }
  };

  // ==========================================
  // TARJETA
  // ==========================================

  const renderProducto = ({ item }) => (
    <View style={styles.tarjeta}>
      <View style={styles.iconoProducto}>
        <Ionicons
          name="cube"
          size={60}
          color="#08752F"
        />
      </View>

      <View
        style={styles.informacionProducto}
      >
        <Text
          style={styles.nombreProducto}
        >
          {item.nombre}
        </Text>

        <Text
          style={styles.precioTitulo}
        >
          Precio actual
        </Text>

        <TouchableOpacity
          style={styles.precioContainer}
          onPress={() =>
            abrirEditarPrecio(item)
          }
          activeOpacity={0.75}
        >
          <Text style={styles.precio}>
            $
            {Number(
              item.precio
            ).toFixed(2)}
          </Text>

          <Ionicons
            name="pencil"
            size={20}
            color="#08752F"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.botonEliminar}
        onPress={() =>
          eliminarProducto(item)
        }
      >
        <Ionicons
          name="trash-outline"
          size={22}
          color="#D11A2A"
        />

        <Text
          style={styles.textoEliminar}
        >
          Eliminar
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#08752F"
      />

      {/* ENCABEZADO */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botonRegresar}
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

        <View>
          <Text
            style={styles.tituloHeader}
          >
            Productos
          </Text>

          <Text
            style={
              styles.subtituloHeader
            }
          >
            Gestiona tus productos y
            precios
          </Text>
        </View>
      </View>

      {/* BUSCADOR */}

      <View
        style={
          styles.buscadorContainer
        }
      >
        <Ionicons
          name="search"
          size={23}
          color="#8A8A8A"
        />

        <TextInput
          style={styles.buscador}
          placeholder="Buscar producto..."
          placeholderTextColor="#999999"
          value={busqueda}
          onChangeText={setBusqueda}
          selectTextOnFocus
        />
      </View>

      {/* PRODUCTOS */}

      <FlatList
        data={productosFiltrados}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={renderProducto}
        contentContainerStyle={
          styles.lista
        }
        showsVerticalScrollIndicator={
          false
        }
        ListEmptyComponent={
          <View
            style={styles.listaVacia}
          >
            <Ionicons
              name="cube-outline"
              size={55}
              color="#BBBBBB"
            />

            <Text
              style={styles.textoVacio}
            >
              No se encontraron productos
            </Text>
          </View>
        }
      />

      {/* BOTÓN AGREGAR */}

      <View
        style={
          styles.botonAgregarContainer
        }
      >
        <TouchableOpacity
          style={styles.botonAgregar}
          onPress={() =>
            setModalAgregar(true)
          }
        >
          <Ionicons
            name="add"
            size={27}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.textoBotonAgregar
            }
          >
            Agregar nuevo producto
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL EDITAR PRECIO */}

      <Modal
        visible={
          productoEditando !== null
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setProductoEditando(null)
        }
      >
        <Pressable
          style={styles.modalFondo}
          onPress={() =>
            setProductoEditando(null)
          }
        >
          <Pressable
            style={
              styles.modalContenido
            }
            onPress={() => {}}
          >
            <Text
              style={styles.modalTitulo}
            >
              Modificar precio
            </Text>

            <Text
              style={
                styles.modalSubtitulo
              }
            >
              {productoEditando?.nombre}
            </Text>

            <Text
              style={styles.modalLabel}
            >
              Nuevo precio
            </Text>

            <TextInput
              style={styles.modalInput}
              value={nuevoPrecio}
              onChangeText={
                setNuevoPrecio
              }
              keyboardType="decimal-pad"
              placeholder="$0.00"
              selectTextOnFocus
            />

            <View
              style={styles.modalBotones}
            >
              <TouchableOpacity
                style={
                  styles.botonCancelar
                }
                onPress={() =>
                  setProductoEditando(
                    null
                  )
                }
              >
                <Text
                  style={
                    styles.textoCancelar
                  }
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.botonGuardar
                }
                onPress={guardarPrecio}
              >
                <Text
                  style={
                    styles.textoGuardar
                  }
                >
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL NUEVO PRODUCTO */}

      <Modal
        visible={modalAgregar}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalAgregar(false)
        }
      >
        <Pressable
          style={styles.modalFondo}
          onPress={() =>
            setModalAgregar(false)
          }
        >
          <Pressable
            style={
              styles.modalContenido
            }
            onPress={() => {}}
          >
            <Text
              style={styles.modalTitulo}
            >
              Nuevo producto
            </Text>

            <Text
              style={styles.modalLabel}
            >
              Nombre
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nombre del producto"
              placeholderTextColor="#999999"
              value={nuevoNombre}
              onChangeText={
                setNuevoNombre
              }
              autoCapitalize="words"
              selectTextOnFocus
            />

            <Text
              style={
                styles.modalLabelSeparado
              }
            >
              Precio
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="$0.00"
              placeholderTextColor="#999999"
              value={
                precioNuevoProducto
              }
              onChangeText={
                setPrecioNuevoProducto
              }
              keyboardType="decimal-pad"
              selectTextOnFocus
            />

            <View
              style={styles.modalBotones}
            >
              <TouchableOpacity
                style={
                  styles.botonCancelar
                }
                onPress={() =>
                  setModalAgregar(false)
                }
              >
                <Text
                  style={
                    styles.textoCancelar
                  }
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.botonGuardar
                }
                onPress={
                  agregarProducto
                }
              >
                <Text
                  style={
                    styles.textoGuardar
                  }
                >
                  Agregar
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default ProductosScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 115,
    backgroundColor: '#08752F',
    justifyContent: 'flex-end',
    paddingBottom: 18,
    paddingHorizontal: 65,
  },

  botonRegresar: {
    position: 'absolute',
    left: 18,
    bottom: 21,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tituloHeader: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
    textAlign: 'center',
  },

  subtituloHeader: {
    color: '#E3F2E8',
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },

  buscadorContainer: {
    height: 52,
    marginHorizontal: 20,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#DEDEDE',
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  buscador: {
    flex: 1,
    height: '100%',
    marginLeft: 9,
    fontSize: 15,
    color: '#222222',
  },

  lista: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },

  tarjeta: {
    minHeight: 132,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',

    elevation: 2,

    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  iconoProducto: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#E8F6EC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  informacionProducto: {
    flex: 1,
  },

  nombreProducto: {
    fontSize: 17,
    fontWeight: '700',
    color: '#151515',
    marginBottom: 7,
    marginHorizontal: 20,
  },

  precioTitulo: {
    fontSize: 12,
    color: '#888888',
    marginHorizontal: 20,
  },

  precioContainer: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
  },

  precio: {
    fontSize: 21,
    fontWeight: '700',
    color: '#08752F',
  },

  botonEliminar: {
    position: 'absolute',
    right: 13,
    bottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  textoEliminar: {
    color: '#D11A2A',
    fontSize: 12,
    fontWeight: '600',
  },

  botonAgregarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },

  botonAgregar: {
    height: 60,
    backgroundColor: '#08752F',
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },

  textoBotonAgregar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  listaVacia: {
    alignItems: 'center',
    paddingTop: 70,
  },

  textoVacio: {
    marginTop: 12,
    color: '#999999',
    fontSize: 15,
  },

  modalFondo: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  modalContenido: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
  },

  modalTitulo: {
    fontSize: 21,
    fontWeight: '700',
    color: '#151515',
  },

  modalSubtitulo: {
    marginTop: 3,
    marginBottom: 22,
    fontSize: 14,
    color: '#777777',
  },

  modalLabel: {
    marginTop: 20,
    marginBottom: 7,
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },

  modalLabelSeparado: {
    marginTop: 17,
    marginBottom: 7,
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },

  modalInput: {
    height: 52,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#222222',
  },

  modalBotones: {
    marginTop: 25,
    flexDirection: 'row',
    gap: 10,
  },

  botonCancelar: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoCancelar: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444444',
  },

  botonGuardar: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#08752F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoGuardar: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});