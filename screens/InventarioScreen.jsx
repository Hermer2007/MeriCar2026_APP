import React, { useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useInventario } from '../context/InventarioContext';

const InventarioScreen = ({ navigation }) => {
  const { inventario } = useInventario();

  const [registrosAbiertos, setRegistrosAbiertos] =
    useState([]);

  const alternarRegistro = (id) => {
    setRegistrosAbiertos((actuales) => {
      if (actuales.includes(id)) {
        return actuales.filter(
          (registroId) =>
            registroId !== id
        );
      }

      return [
        ...actuales,
        id,
      ];
    });
  };

  const renderRegistro = ({ item }) => {
    const estaAbierto =
      registrosAbiertos.includes(
        item.id
      );

    return (
      <View style={styles.tarjeta}>

        {/* ENCABEZADO DE LA FECHA */}

        <TouchableOpacity
          style={
            styles.encabezadoTarjeta
          }
          activeOpacity={0.7}
          onPress={() =>
            alternarRegistro(
              item.id
            )
          }
        >
          <View style={styles.iconoFecha}>
            <Ionicons
              name="calendar-outline"
              size={26}
              color="#08752F"
            />
          </View>

          <View
            style={
              styles.fechaContainer
            }
          >
            <Text style={styles.fecha}>
              {item.fecha}
            </Text>

            <Text style={styles.dia}>
              {item.dia}
            </Text>
          </View>

          <Ionicons
            name={
              estaAbierto
                ? 'chevron-up'
                : 'chevron-down'
            }
            size={23}
            color="#08752F"
          />
        </TouchableOpacity>

        {/* PRODUCTOS */}

        {estaAbierto && (
          <View
            style={
              styles.listaProductos
            }
          >
            {item.productos.map(
              (
                producto,
                index
              ) => (
                <View
                  key={`${item.id}-${index}`}
                  style={[
                    styles.filaProducto,
                    index ===
                      item.productos
                        .length -
                        1 &&
                      styles.ultimaFila,
                  ]}
                >
                  <Text
                    style={
                      styles.nombreProducto
                    }
                  >
                    {producto.nombre}
                  </Text>

                  <Text
                    style={
                      styles.cantidad
                    }
                  >
                    {producto.cantidad}
                  </Text>
                </View>
              )
            )}
          </View>
        )}
      </View>
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
          style={
            styles.botonRegresar
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

        <View>
          <Text
            style={
              styles.tituloHeader
            }
          >
            Inventario
          </Text>

          <Text
            style={
              styles.subtituloHeader
            }
          >
            Control de stock por día
          </Text>
        </View>
      </View>

      {/* BOTÓN REGISTRAR STOCK */}

      <View
        style={
          styles.botonContainer
        }
      >
        <TouchableOpacity
          style={
            styles.botonRegistrar
          }
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate(
              'RegistrarStock'
            )
          }
        >
          <Ionicons
            name="add-circle-outline"
            size={27}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.textoBotonRegistrar
            }
          >
            Registrar stock
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTA */}

      <FlatList
        data={inventario}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={
          renderRegistro
        }
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
                name="cube-outline"
                size={55}
                color="#08752F"
              />
            </View>

            <Text
              style={
                styles.sinResultados
              }
            >
              No hay registros de inventario
            </Text>

            <Text
              style={
                styles.descripcionVacia
              }
            >
              Registra el stock del día para comenzar a gestionar el inventario.
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default InventarioScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 120,
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
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },

  subtituloHeader: {
    color: '#E3F2E8',
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },

  botonContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },

  botonRegistrar: {
    height: 57,
    borderRadius: 12,
    backgroundColor: '#08752F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  textoBotonRegistrar: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  lista: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },

  estadoVacio: {
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

  tarjeta: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    overflow: 'hidden',

    elevation: 2,

    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  encabezadoTarjeta: {
    minHeight: 78,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconoFecha: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#E7F3EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  fechaContainer: {
    flex: 1,
  },

  fecha: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161616',
  },

  dia: {
    fontSize: 15,
    color: '#737373',
    marginTop: 2,
  },

  listaProductos: {
    marginHorizontal: 15,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
  },

  filaProducto: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    paddingHorizontal: 10,
  },

  ultimaFila: {
    borderBottomWidth: 0,
  },

  nombreProducto: {
    fontSize: 16,
    color: '#1C1C1C',
  },

  cantidad: {
    fontSize: 18,
    fontWeight: '700',
    color: '#08752F',
  },
});