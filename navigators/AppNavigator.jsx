import React from 'react';

import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';

import RegistroUsuarioScreen from '../screens/RegistroUsuarioScreen';
import UsuariosScreen from '../screens/UsuariosScreen';

import ProductosScreen from '../screens/ProductosScreen';

import InventarioScreen from '../screens/InventarioScreen';
import RegistrarStockScreen from '../screens/RegistrarStockScreen';

import ClientesScreen from '../screens/ClientesScreen';
import ClienteRegistroScreen from '../screens/ClienteRegistroScreen';
import ClienteDetalleScreen from '../screens/ClienteDetalleScreen';
import EditarClienteScreen from '../screens/EditarClienteScreen';

import NuevaEntregaScreen from '../screens/NuevaEntregaScreen';
import EditarEntregaScreen from '../screens/EditarEntregaScreen';
import EntregasScreen from '../screens/EntregasScreen';
import EntregasDiaScreen from '../screens/EntregasDiaScreen';
import OtraEntregaScreen from '../screens/OtraEntregaScreen';

import ReportesScreen from '../screens/ReportesScreen';
import ReporteDetalleScreen from '../screens/ReporteDetalleScreen';
import ReportesMenuScreen from '../screens/ReportesMenuScreen';
import ClientesEntregasScreen from '../screens/ClientesEntregasScreen';
import CuentasCobrarScreen from '../screens/CuentasCobrarScreen';
import ProductosVendidosScreen from '../screens/ProductosVendidosScreen';

import PerfilScreen from '../screens/PerfilScreen';

import {
  useUsuarios,
} from '../context/UsuariosContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const {
    usuarioActual,
    cargandoSesion,
  } = useUsuarios();

  // ==========================================
  // ESPERAR A FIREBASE
  // ==========================================

  if (cargandoSesion) {
    return (
      <ImageBackground
        source={require('../assets/images/fondo-modal.png')}
        style={styles.fondoCarga}
        resizeMode="cover"
      >
        <View style={styles.capaOscura}>

          <View style={styles.cargandoCard}>

            <Text style={styles.cargandoTitulo}>
              MERICAR
            </Text>

            <ActivityIndicator
              size="large"
              color="#08752F"
              style={styles.cargandoIndicador}
            />

            <Text style={styles.cargandoTexto}>
              Iniciando sesión...
            </Text>

          </View>

        </View>
      </ImageBackground>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={
          usuarioActual
            ? 'sesion-iniciada'
            : 'sesion-cerrada'
        }
        initialRouteName={
          usuarioActual
            ? 'Home'
            : 'Welcome'
        }
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />

        {/* USUARIOS */}

        <Stack.Screen
          name="Registros"
          component={UsuariosScreen}
        />

        <Stack.Screen
          name="RegistroUsuario"
          component={RegistroUsuarioScreen}
        />

        {/* PRODUCTOS */}

        <Stack.Screen
          name="Productos"
          component={ProductosScreen}
        />

        {/* INVENTARIO */}

        <Stack.Screen
          name="Inventario"
          component={InventarioScreen}
        />

        <Stack.Screen
          name="RegistrarStock"
          component={RegistrarStockScreen}
        />

        {/* CLIENTES */}

        <Stack.Screen
          name="Clientes"
          component={ClientesScreen}
        />

        <Stack.Screen
          name="ClienteRegistro"
          component={ClienteRegistroScreen}
        />

        <Stack.Screen
          name="EditarCliente"
          component={EditarClienteScreen}
        />

        <Stack.Screen
          name="ClienteDetalle"
          component={ClienteDetalleScreen}
        />

        {/* ENTREGAS */}

        <Stack.Screen
          name="Entregas"
          component={EntregasScreen}
        />

        <Stack.Screen
          name="EntregasDia"
          component={EntregasDiaScreen}
        />

        <Stack.Screen
          name="NuevaEntrega"
          component={NuevaEntregaScreen}
        />

        <Stack.Screen
          name="EditarEntrega"
          component={EditarEntregaScreen}
        />

        <Stack.Screen
          name="OtraEntrega"
          component={OtraEntregaScreen}
        />

        {/* PERFIL */}

        <Stack.Screen
          name="Perfil"
          component={PerfilScreen}
        />

        {/* REPORTES */}

        <Stack.Screen
          name="Reportes"
          component={ReportesMenuScreen}
        />

        <Stack.Screen
          name="ReportesGenerales"
          component={ReportesScreen}
        />

        <Stack.Screen
          name="ReporteDetalle"
          component={ReporteDetalleScreen}
        />

        <Stack.Screen
          name="ClientesEntregas"
          component={ClientesEntregasScreen}
        />

        <Stack.Screen
          name="CuentasCobrar"
          component={CuentasCobrarScreen}
        />

        <Stack.Screen
          name="ProductosVendidos"
          component={ProductosVendidosScreen}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({

  fondoCarga: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  capaOscura: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cargandoCard: {
    width: 230,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 25,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 7,

    elevation: 6,
  },

  cargandoTitulo: {
    color: '#08752F',
    fontSize: 21,
    fontWeight: '800',
  },

  cargandoIndicador: {
    marginVertical: 20,
  },

  cargandoTexto: {
    color: '#666666',
    fontSize: 13,
  },

});