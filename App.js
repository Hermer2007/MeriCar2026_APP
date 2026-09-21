import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AppNavigator from './navigators/AppNavigator';

import { ProductosProvider } from './context/ProductosContext';
import { InventarioProvider } from './context/InventarioContext';
import { ClientesProvider } from './context/ClientesContext';
import { EntregasProvider } from './context/EntregasContext';
import { UsuariosProvider } from './context/UsuariosContext';
import { ToastProvider } from './context/ToastContext';
import { AlertProvider } from './context/AlertContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <AlertProvider>
            <UsuariosProvider>
              <ProductosProvider>
                <InventarioProvider>
                  <ClientesProvider>
                    <EntregasProvider>
                      <AppNavigator />
                    </EntregasProvider>
                  </ClientesProvider>
                </InventarioProvider>
              </ProductosProvider>
            </UsuariosProvider>
          </AlertProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}