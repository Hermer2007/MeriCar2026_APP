import React from 'react';

import {
  ActivityIndicator,
  StyleSheet,
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

const Stack =
  createNativeStackNavigator();

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
      <View
        style={
          styles.cargandoContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#08752F"
        />
      </View>
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
          animation:
            'slide_from_right',
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

        {/* =====================================
            USUARIOS
        ===================================== */}

        <Stack.Screen
          name="Registros"
          component={UsuariosScreen}
        />

        <Stack.Screen
          name="RegistroUsuario"
          component={
            RegistroUsuarioScreen
          }
        />

        {/* =====================================
            PRODUCTOS
        ===================================== */}

        <Stack.Screen
          name="Productos"
          component={ProductosScreen}
        />

        {/* =====================================
            INVENTARIO
        ===================================== */}

        <Stack.Screen
          name="Inventario"
          component={InventarioScreen}
        />

        <Stack.Screen
          name="RegistrarStock"
          component={
            RegistrarStockScreen
          }
        />

        {/* =====================================
            CLIENTES
        ===================================== */}

        <Stack.Screen
          name="Clientes"
          component={ClientesScreen}
        />

        <Stack.Screen
          name="ClienteRegistro"
          component={
            ClienteRegistroScreen
          }
        />

        <Stack.Screen
          name="EditarCliente"
          component={
            EditarClienteScreen
          }
        />

        <Stack.Screen
          name="ClienteDetalle"
          component={
            ClienteDetalleScreen
          }
        />

        {/* =====================================
            ENTREGAS
        ===================================== */}

        <Stack.Screen
          name="Entregas"
          component={EntregasScreen}
        />

        <Stack.Screen
          name="EntregasDia"
          component={
            EntregasDiaScreen
          }
        />

        <Stack.Screen
          name="NuevaEntrega"
          component={
            NuevaEntregaScreen
          }
        />

        <Stack.Screen
          name="EditarEntrega"
          component={
            EditarEntregaScreen
          }
        />

        <Stack.Screen
          name="OtraEntrega"
          component={
            OtraEntregaScreen
          }
        />

        {/* =====================================
            PERFIL
        ===================================== */}

        <Stack.Screen
          name="Perfil"
          component={PerfilScreen}
        />

        {/* =====================================
            REPORTES
        ===================================== */}

        <Stack.Screen
          name="Reportes"
          component={
            ReportesMenuScreen
          }
        />

        <Stack.Screen
          name="ReportesGenerales"
          component={ReportesScreen}
        />

        <Stack.Screen
          name="ReporteDetalle"
          component={
            ReporteDetalleScreen
          }
        />

        <Stack.Screen
          name="ClientesEntregas"
          component={
            ClientesEntregasScreen
          }
        />

        <Stack.Screen
          name="CuentasCobrar"
          component={
            CuentasCobrarScreen
          }
        />

        <Stack.Screen
          name="ProductosVendidos"
          component={
            ProductosVendidosScreen
          }
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles =
  StyleSheet.create({
    cargandoContainer: {
      flex: 1,
      backgroundColor: '#F7F8F9',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });