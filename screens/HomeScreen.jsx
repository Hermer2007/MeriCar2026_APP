import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const MODULOS = [
  {
    id: 'clientes',
    titulo: 'Clientes',
    icono: 'people',
  },
  {
    id: 'entregas',
    titulo: 'Entregas',
    icono: 'car',
  },
  {
    id: 'registros',
    titulo: 'Registros',
    icono: 'person-add',
    soloAdministrador: true,
  },
  {
    id: 'inventario',
    titulo: 'Inventario',
    icono: 'cube',
  },
  {
    id: 'productos',
    titulo: 'Productos',
    icono: 'basket',
  },
  {
    id: 'reportes',
    titulo: 'Reportes',
    icono: 'bar-chart',
  },
];

const HomeScreen = ({ navigation, route }) => {
  const nombreUsuario =
    route.params?.nombreUsuario || 'Empleado';

  const rol = route.params?.rol || 'EMPLEADO';

  const esAdministrador =
    rol === 'ADMINISTRADOR';

  const abrirModulo = (modulo) => {
    if (
      modulo.soloAdministrador &&
      !esAdministrador
    ) {
      Alert.alert(
        'Acceso restringido',
        'Solo el administrador puede ingresar al apartado de Registros.'
      );
      return;
    }

    Alert.alert(
      modulo.titulo,
      `El módulo ${modulo.titulo} se conectará después.`
    );
  };

  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Deseas salir de la aplicación?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () =>
            navigation.replace('Login'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.encabezado}>
        <View style={styles.avatar}>
          <Ionicons
            name="person"
            size={46}
            color="#08752F"
          />
        </View>

        <View style={styles.informacionUsuario}>
          <Text style={styles.saludo}>
            Hola, {nombreUsuario}
          </Text>

          <Text style={styles.subtitulo}>
            {rol === 'ADMINISTRADOR'
              ? 'Administrador'
              : 'Bienvenido al sistema'}
          </Text>
        </View>
      </View>

      <View style={styles.curva} />

      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cuadricula}>
          {MODULOS.map((modulo) => {
            const bloqueado =
              modulo.soloAdministrador &&
              !esAdministrador;

            return (
              <TouchableOpacity
                key={modulo.id}
                style={[
                  styles.tarjeta,
                  bloqueado && styles.tarjetaBloqueada,
                ]}
                activeOpacity={0.8}
                onPress={() => abrirModulo(modulo)}
              >
                {bloqueado && (
                  <Ionicons
                    name="lock-closed"
                    size={18}
                    color="#8A8A8A"
                    style={styles.candado}
                  />
                )}

                <Ionicons
                  name={modulo.icono}
                  size={54}
                  color={
                    bloqueado
                      ? '#A5A5A5'
                      : '#08752F'
                  }
                />

                <Text
                  style={[
                    styles.nombreModulo,
                    bloqueado &&
                      styles.nombreModuloBloqueado,
                  ]}
                >
                  {modulo.titulo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.navegacion}>
        <TouchableOpacity
          style={styles.opcionNavegacion}
        >
          <Ionicons
            name="home"
            size={28}
            color="#08752F"
          />

          <Text style={styles.textoActivo}>
            Inicio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.opcionNavegacion}
          onPress={() =>
            Alert.alert(
              'Buscar',
              'La búsqueda general se implementará después.'
            )
          }
        >
          <Ionicons
            name="search"
            size={28}
            color="#222222"
          />

          <Text style={styles.textoNavegacion}>
            Buscar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.opcionNavegacion}
          onPress={() =>
            Alert.alert(
              'Perfil',
              `Usuario: ${nombreUsuario}\nRol: ${rol}`
            )
          }
        >
          <Ionicons
            name="person"
            size={28}
            color="#222222"
          />

          <Text style={styles.textoNavegacion}>
            Perfil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.opcionNavegacion}
          onPress={cerrarSesion}
        >
          <Ionicons
            name="log-out-outline"
            size={30}
            color="#222222"
          />

          <Text style={styles.textoNavegacion}>
            Salir
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  encabezado: {
    height: 190,
    backgroundColor: '#08752F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 20,
  },

  curva: {
    position: 'absolute',
    top: 152,
    left: -25,
    width: '115%',
    height: 90,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 55,
    borderTopRightRadius: 55,
    transform: [{ rotate: '-2deg' }],
  },

  avatar: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },

  informacionUsuario: {
    marginLeft: 18,
    zIndex: 2,
  },

  saludo: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
  },

  subtitulo: {
    color: '#E9F5EC',
    fontSize: 16,
    marginTop: 5,
  },

  contenido: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 28,
  },

  cuadricula: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  tarjeta: {
    width: '48%',
    height: 145,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },

  tarjetaBloqueada: {
    backgroundColor: '#F2F2F2',
  },

  candado: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  nombreModulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#08752F',
    marginTop: 10,
  },

  nombreModuloBloqueado: {
    color: '#929292',
  },

  navegacion: {
    height: 82,
    borderTopWidth: 1,
    borderTopColor: '#E2E2E2',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 5,
  },

  opcionNavegacion: {
    minWidth: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoActivo: {
    fontSize: 12,
    color: '#08752F',
    fontWeight: '600',
    marginTop: 4,
  },

  textoNavegacion: {
    fontSize: 12,
    color: '#333333',
    marginTop: 4,
  },
});