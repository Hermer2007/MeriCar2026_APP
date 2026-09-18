import React, { useMemo, useState } from 'react';

import {
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

import { useInventario } from '../context/InventarioContext';
import { useProductos } from '../context/ProductosContext';
import { useToast } from '../context/ToastContext';
import BotonHome from '../components/BotonHome';

const RegistrarStockScreen = ({ navigation }) => {

  // ==========================================
  // CONTEXT
  // ==========================================

  const { mostrarToast } = useToast();
  const { registrarStock } = useInventario();
  const { productos } = useProductos();


  // ==========================================
  // ESTADOS
  // ==========================================

  const [
    productoSeleccionado,
    setProductoSeleccionado,
  ] = useState(null);

  const [cantidad, setCantidad] =
    useState('');

  const [listaStock, setListaStock] =
    useState([]);

  const [
    modalProductos,
    setModalProductos,
  ] = useState(false);


  // ==========================================
  // FECHA ACTUAL
  // ==========================================

  const fechaActual = useMemo(() => {

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

  }, []);


  // ==========================================
  // AGREGAR PRODUCTO A LA LISTA
  // ==========================================

  const agregarALista = () => {

    // ----------------------------------------
    // PRODUCTO NO SELECCIONADO
    // ----------------------------------------

    if (!productoSeleccionado) {

      mostrarToast(
        'Seleccione un producto.',
        'warning'
      );

      return;
    }


    // ----------------------------------------
    // VALIDAR CANTIDAD
    // ----------------------------------------

    const cantidadNumerica =
      Number(cantidad);


    if (
      !cantidad ||
      Number.isNaN(cantidadNumerica) ||
      cantidadNumerica <= 0
    ) {

      mostrarToast(
        'Ingrese una cantidad válida.',
        'warning'
      );

      return;
    }


    // ----------------------------------------
    // VERIFICAR SI YA ESTABA EN LA LISTA
    // ----------------------------------------

    const productoYaExiste =
      listaStock.some(
        (item) =>
          String(item.id) ===
          String(productoSeleccionado.id)
      );


    // ----------------------------------------
    // AGREGAR / ACUMULAR
    // ----------------------------------------

    setListaStock((actual) => {

      const existente =
        actual.find(
          (item) =>
            String(item.id) ===
            String(
              productoSeleccionado.id
            )
        );


      // Si ya existe, acumulamos cantidad
      if (existente) {

        return actual.map(
          (item) =>
            String(item.id) ===
            String(
              productoSeleccionado.id
            )
              ? {
                  ...item,

                  cantidad:
                    Number(
                      item.cantidad
                    ) +
                    cantidadNumerica,
                }
              : item
        );
      }


      // Producto nuevo
      return [
        ...actual,

        {
          id:
            productoSeleccionado.id,

          nombre:
            productoSeleccionado.nombre,

          cantidad:
            cantidadNumerica,
        },
      ];
    });


    // ----------------------------------------
    // NOTIFICACIÓN
    // ----------------------------------------

    if (productoYaExiste) {

      mostrarToast(
        'La cantidad del producto fue actualizada.',
        'info'
      );

    } else {

      mostrarToast(
        'Producto agregado al registro.',
        'success'
      );
    }


    // ----------------------------------------
    // LIMPIAR CAMPOS
    // ----------------------------------------

    setProductoSeleccionado(null);

    setCantidad('');
  };


  // ==========================================
  // ELIMINAR PRODUCTO DE LA LISTA
  // ==========================================

  const eliminarDeLista = (id) => {

    setListaStock(
      (actual) =>
        actual.filter(
          (item) =>
            String(item.id) !==
            String(id)
        )
    );


    mostrarToast(
      'Producto eliminado de la lista.',
      'info'
    );
  };


  // ==========================================
  // GUARDAR REGISTRO
  // ==========================================

  const guardarRegistro = () => {

    // ----------------------------------------
    // LISTA VACÍA
    // ----------------------------------------

    if (
      listaStock.length === 0
    ) {

      mostrarToast(
        'Agregue al menos un producto antes de guardar.',
        'warning'
      );

      return;
    }


    // ----------------------------------------
    // FECHA / DÍA
    // ----------------------------------------

    const hoy = new Date();

    const dias = [
      'domingo',
      'lunes',
      'martes',
      'miércoles',
      'jueves',
      'viernes',
      'sábado',
    ];


    // ----------------------------------------
    // CREAR REGISTRO
    // ----------------------------------------

    const nuevoRegistro = {

      id:
        Date.now().toString(),

      fecha:
        fechaActual,

      dia:
        dias[hoy.getDay()],

      productos:
        listaStock.map(
          (item) => ({
            id:
              item.id,

            nombre:
              item.nombre,

            cantidad:
              Number(
                item.cantidad
              ),
          })
        ),
    };


    // ----------------------------------------
    // VERIFICAR CONTEXT
    // ----------------------------------------

    if (
      typeof registrarStock !==
      'function'
    ) {

      mostrarToast(
        'No se pudo registrar el stock.',
        'error'
      );

      mostrarToast(
        'Intente nuevamente o comuníquese con soporte técnico.',
        'info'
      );

      return;
    }


    // ----------------------------------------
    // GUARDAR
    // ----------------------------------------

    try {

      const resultado = registrarStock(
  nuevoRegistro
);

setListaStock([]);

if (resultado === 'actualizado') {
  mostrarToast(
    'Registro de stock actualizado correctamente.',
    'success'
  );

  mostrarToast(
    'El registro anterior de esta fecha fue reemplazado.',
    'info'
  );
} else {
  mostrarToast(
    'Stock registrado correctamente.',
    'success'
  );

  mostrarToast(
    'El nuevo registro ya está disponible en Inventario.',
    'info'
  );
}

navigation.goBack();

    } catch (error) {

      mostrarToast(
        'Ocurrió un error al registrar el stock.',
        'error'
      );

      mostrarToast(
        'Intente nuevamente o comuníquese con soporte técnico.',
        'info'
      );
    }
  };


  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <View style={styles.container}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#08752F"
      />


      {/* HEADER */}

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


        <View style={styles.headerCentro}>

          <Text
            style={
              styles.tituloHeader
            }
          >
            Registrar stock
          </Text>


          <Text
            style={
              styles.subtituloHeader
            }
          >
            Control de inventario
          </Text>

        </View>


        <Ionicons
          name="calendar-outline"
          size={27}
          color="#FFFFFF"
        />
        <BotonHome navigation={navigation} />
      </View>


      {/* FECHA */}

      <View style={styles.seccion}>

        <View
          style={
            styles.labelConIcono
          }
        >

          <Ionicons
            name="calendar-outline"
            size={20}
            color="#08752F"
          />


          <Text style={styles.label}>
            Fecha
          </Text>

        </View>


        <View
          style={
            styles.fechaBloqueada
          }
        >

          <Ionicons
            name="calendar-outline"
            size={20}
            color="#777777"
          />


          <Text
            style={
              styles.fechaTexto
            }
          >
            {fechaActual}
          </Text>


          <Ionicons
            name="lock-closed-outline"
            size={21}
            color="#777777"
          />

        </View>

      </View>


      {/* PRODUCTO */}

      <View style={styles.seccion}>

        <View
          style={
            styles.labelConIcono
          }
        >

          <Ionicons
            name="cube-outline"
            size={20}
            color="#08752F"
          />


          <Text style={styles.label}>
            Producto
          </Text>

        </View>


        <TouchableOpacity
          style={styles.selector}
          onPress={() =>
            setModalProductos(true)
          }
          activeOpacity={0.8}
        >

          <Text
            style={[
              styles.textoSelector,

              !productoSeleccionado &&
                styles.placeholder,
            ]}
          >

            {productoSeleccionado
              ? productoSeleccionado.nombre
              : 'Selecciona un producto'}

          </Text>


          <Ionicons
            name="chevron-down"
            size={22}
            color="#222222"
          />

        </TouchableOpacity>

      </View>


      {/* CANTIDAD */}

      <View style={styles.seccion}>

        <View
          style={
            styles.labelConIcono
          }
        >

          <Text
            style={
              styles.iconoCantidad
            }
          >
            #
          </Text>


          <Text style={styles.label}>
            Cantidad
          </Text>

        </View>


        <TextInput
          style={styles.input}
          placeholder="Ingresa la cantidad"
          placeholderTextColor="#999999"
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
        />


        <TouchableOpacity
          style={
            styles.botonAgregar
          }
          onPress={agregarALista}
          activeOpacity={0.85}
        >

          <Ionicons
            name="add-circle-outline"
            size={23}
            color="#FFFFFF"
          />


          <Text
            style={
              styles.textoBotonAgregar
            }
          >
            Agregar a la lista
          </Text>

        </TouchableOpacity>

      </View>


      {/* LISTA DE STOCK */}

      <View
        style={
          styles.stockContainer
        }
      >

        <View
          style={
            styles.stockTituloContainer
          }
        >

          <Ionicons
            name="cube-outline"
            size={22}
            color="#08752F"
          />


          <Text
            style={
              styles.stockTitulo
            }
          >
            Stock por registrar hoy
          </Text>

        </View>


        {listaStock.length === 0 ? (

          <View
            style={
              styles.listaVacia
            }
          >

            <Text
              style={
                styles.textoListaVacia
              }
            >
              Aún no se han agregado productos
            </Text>

          </View>

        ) : (

          listaStock.map(
            (item) => (

              <View
                key={item.id}
                style={
                  styles.filaStock
                }
              >

                <View
                  style={
                    styles.stockIzquierda
                  }
                >

                  <Ionicons
                    name="cube-outline"
                    size={22}
                    color="#08752F"
                  />


                  <Text
                    style={
                      styles.nombreProducto
                    }
                  >
                    {item.nombre}
                  </Text>

                </View>


                <View
                  style={
                    styles.stockDerecha
                  }
                >

                  <View
                    style={
                      styles.cantidadBadge
                    }
                  >

                    <Text
                      style={
                        styles.cantidadBadgeTexto
                      }
                    >
                      +{item.cantidad}
                    </Text>

                  </View>


                  <TouchableOpacity
                    style={
                      styles.botonEliminar
                    }
                    onPress={() =>
                      eliminarDeLista(
                        item.id
                      )
                    }
                  >

                    <Ionicons
                      name="trash-outline"
                      size={22}
                      color="#D71920"
                    />

                  </TouchableOpacity>

                </View>

              </View>
            )
          )
        )}

      </View>


      {/* GUARDAR */}

      <TouchableOpacity
        style={
          styles.botonGuardar
        }
        activeOpacity={0.85}
        onPress={guardarRegistro}
      >

        <Ionicons
          name="save-outline"
          size={23}
          color="#FFFFFF"
        />


        <Text
          style={
            styles.textoGuardar
          }
        >
          Guardar registro
        </Text>

      </TouchableOpacity>


      {/* MODAL PRODUCTOS */}

      <Modal
        visible={modalProductos}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalProductos(false)
        }
      >

        <Pressable
          style={
            styles.modalFondo
          }
          onPress={() =>
            setModalProductos(false)
          }
        >

          <Pressable
            style={
              styles.modalContenido
            }
            onPress={() => {}}
          >

            <Text
              style={
                styles.modalTitulo
              }
            >
              Seleccionar producto
            </Text>


            {productos.map(
              (producto) => (

                <TouchableOpacity
                  key={
                    producto.id
                  }
                  style={
                    styles.opcionProducto
                  }
                  onPress={() => {

                    setProductoSeleccionado(
                      producto
                    );

                    setModalProductos(
                      false
                    );
                  }}
                >

                  <View
                    style={
                      styles.opcionProductoIzquierda
                    }
                  >

                    <Ionicons
                      name="cube-outline"
                      size={22}
                      color="#08752F"
                    />


                    <Text
                      style={
                        styles.opcionProductoTexto
                      }
                    >
                      {producto.nombre}
                    </Text>

                  </View>


                  {productoSeleccionado?.id ===
                    producto.id && (

                    <Ionicons
                      name="checkmark-circle"
                      size={23}
                      color="#08752F"
                    />

                  )}

                </TouchableOpacity>

              )
            )}

          </Pressable>

        </Pressable>

      </Modal>

    </View>
  );
};


export default RegistrarStockScreen;


// ============================================
// ESTILOS
// EXACTAMENTE LOS MISMOS
// ============================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 20,
  },


  header: {
    height: 110,
    backgroundColor: '#08752F',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 17,
  },


  botonRegresar: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 14,
    color: '#E5F2E8',
    marginTop: 2,
  },


  seccion: {
    marginHorizontal: 20,
    marginTop: 13,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },


  labelConIcono: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },


  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202020',
  },


  iconoCantidad: {
    fontSize: 22,
    fontWeight: '700',
    color: '#08752F',
  },


  fechaBloqueada: {
    height: 48,
    borderRadius: 9,
    backgroundColor: '#F3F3F5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },


  fechaTexto: {
    flex: 1,
    marginLeft: 9,
    color: '#666666',
    fontSize: 15,
  },


  selector: {
    height: 50,
    borderWidth: 1,
    borderColor: '#58C283',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
  },


  textoSelector: {
    fontSize: 15,
    color: '#222222',
  },


  placeholder: {
    color: '#555555',
  },


  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#58C283',
    borderRadius: 9,
    paddingHorizontal: 13,
    fontSize: 15,
    color: '#222222',
  },


  botonAgregar: {
    marginTop: 12,
    height: 48,
    borderRadius: 9,
    backgroundColor: '#08752F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },


  textoBotonAgregar: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },


  stockContainer: {
    marginHorizontal: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    borderRadius: 13,
    overflow: 'hidden',
  },


  stockTituloContainer: {
    minHeight: 52,
    backgroundColor: '#EEF7F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 9,
  },


  stockTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202020',
  },


  listaVacia: {
    minHeight: 68,
    justifyContent: 'center',
    alignItems: 'center',
  },


  textoListaVacia: {
    color: '#999999',
    fontSize: 14,
  },


  filaStock: {
    minHeight: 58,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  stockIzquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },


  nombreProducto: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },


  stockDerecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },


  cantidadBadge: {
    minWidth: 48,
    height: 32,
    backgroundColor: '#E9F5ED',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },


  cantidadBadgeTexto: {
    color: '#08752F',
    fontSize: 16,
    fontWeight: '700',
  },


  botonEliminar: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },


  botonGuardar: {
    marginHorizontal: 20,
    marginTop: 16,
    height: 55,
    borderRadius: 10,
    backgroundColor: '#08752F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },


  textoGuardar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },


  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },


  modalContenido: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 20,
  },


  modalTitulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161616',
    marginBottom: 10,
  },


  opcionProducto: {
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  opcionProductoIzquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },


  opcionProductoTexto: {
    fontSize: 15,
    color: '#222222',
  },

});