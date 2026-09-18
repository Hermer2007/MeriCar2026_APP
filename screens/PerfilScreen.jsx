import React, { useEffect, useState } from 'react';

import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

import { useUsuarios } from '../context/UsuariosContext';
import { useToast } from '../context/ToastContext';
import { useAlert } from '../context/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PerfilScreen = ({ navigation }) => {
  const {
    usuarioActual,
    bloquearSesion,
  } = useUsuarios();

  const { mostrarToast } = useToast();

  const { mostrarAlert } = useAlert();

  const insets = useSafeAreaInsets();

  const [modalPin, setModalPin] =
    useState(false);

  const [nuevoPin, setNuevoPin] =
    useState('');

  const [confirmarPin, setConfirmarPin] =
    useState('');

  const [
    mostrarNuevoPin,
    setMostrarNuevoPin,
  ] = useState(false);

  const [
    mostrarConfirmarPin,
    setMostrarConfirmarPin,
  ] = useState(false);

  const [
    pinConfigurado,
    setPinConfigurado,
  ] = useState(false);

  const [
    huellaConfigurada,
    setHuellaConfigurada,
  ] = useState(false);

  // ==========================================
  // CLAVE DEL PIN
  // ==========================================

  const obtenerClavePin = () => {
    if (!usuarioActual?.id) {
      return null;
    }

    return `mericar_pin_${usuarioActual.id}`;
  };

  // ==========================================
  // COMPROBAR SI YA TIENE PIN
  // ==========================================

  const comprobarPin = async () => {
    try {
      const clave =
        obtenerClavePin();

      if (!clave) {
        return;
      }

      const pinGuardado =
        await SecureStore.getItemAsync(
          clave
        );

      setPinConfigurado(
        !!pinGuardado
      );
    } catch (error) {
      console.log(
        'Error comprobando PIN:',
        error
      );
    }
  };

  useEffect(() => {
    comprobarPin();
  }, [usuarioActual]);

  // ==========================================
  // ABRIR MODAL
  // ==========================================

  const abrirModalPin = () => {
    setNuevoPin('');
    setConfirmarPin('');

    setMostrarNuevoPin(false);
    setMostrarConfirmarPin(false);

    setModalPin(true);
  };

  // ==========================================
  // CERRAR MODAL
  // ==========================================

  const cerrarModalPin = () => {
    Keyboard.dismiss();

    setNuevoPin('');
    setConfirmarPin('');

    setMostrarNuevoPin(false);
    setMostrarConfirmarPin(false);

    setModalPin(false);
  };

  // ==========================================
  // SOLO NÚMEROS
  // ==========================================

  const cambiarNuevoPin = (texto) => {
    const soloNumeros =
      texto.replace(
        /[^0-9]/g,
        ''
      );

    setNuevoPin(
      soloNumeros
    );
  };

  const cambiarConfirmacion = (texto) => {
    const soloNumeros =
      texto.replace(
        /[^0-9]/g,
        ''
      );

    setConfirmarPin(
      soloNumeros
    );
  };

  // ==========================================
  // GUARDAR PIN
  // ==========================================

  const guardarPin = async () => {
    Keyboard.dismiss();

    if (
      nuevoPin.length !== 6
    ) {
      mostrarToast(
        'El PIN debe tener exactamente 6 dígitos.',
        'warning'
      );

      return;
    }

    if (
      confirmarPin.length !== 6
    ) {
      mostrarToast(
        'Confirme el PIN de 6 dígitos.',
        'warning'
      );

      return;
    }

    if (
      nuevoPin !== confirmarPin
    ) {
      mostrarToast(
        'Los PIN ingresados no coinciden.',
        'error'
      );

      return;
    }

    const clave =
      obtenerClavePin();

    if (!clave) {
      mostrarToast(
        'No se pudo identificar al usuario.',
        'error'
      );

      return;
    }

    try {
      await SecureStore.setItemAsync(
        clave,
        nuevoPin
      );

      await SecureStore.setItemAsync(
        'mericar_usuario_pin',
        String(usuarioActual.id)
      );

      setPinConfigurado(true);

      cerrarModalPin();

      mostrarToast(
        'PIN guardado correctamente.',
        'success'
      );
    } catch (error) {
      console.log(
        'Error guardando PIN:',
        error
      );

      mostrarToast(
        'No se pudo guardar el PIN.',
        'error'
      );
    }
  };

  // ==========================================
// CLAVE DE HUELLA
// ==========================================

const obtenerClaveHuella = () => {
  if (!usuarioActual?.id) {
    return null;
  }

  return `mericar_huella_${usuarioActual.id}`;
};

// ==========================================
// COMPROBAR HUELLA
// ==========================================

const comprobarHuella = async () => {
  try {
    const clave =
      obtenerClaveHuella();

    if (!clave) {
      return;
    }

    const huellaGuardada =
      await SecureStore.getItemAsync(
        clave
      );

    setHuellaConfigurada(
      huellaGuardada === 'true'
    );
  } catch (error) {
    console.log(
      'Error comprobando huella:',
      error
    );
  }
};

useEffect(() => {
  comprobarHuella();
}, [usuarioActual]);

// ==========================================
// ACTIVAR HUELLA
// ==========================================

const activarHuella = async () => {
  try {
    const clave =
      obtenerClaveHuella();

    if (!clave) {
      mostrarToast(
        'No se pudo identificar al usuario.',
        'error'
      );

      return;
    }

    const tieneHardware =
      await LocalAuthentication.hasHardwareAsync();

    if (!tieneHardware) {
      mostrarAlert({
        titulo: 'Huella digital',
        mensaje:
          'Este dispositivo no cuenta con un sensor biométrico compatible.',
        tipo: 'warning',
        textoConfirmar: 'Aceptar',
      });

      return;
    }

    const tiposDisponibles =
      await LocalAuthentication.supportedAuthenticationTypesAsync();

    const tieneHuella =
      tiposDisponibles.includes(
        LocalAuthentication
          .AuthenticationType
          .FINGERPRINT
      );

    if (!tieneHuella) {
      mostrarAlert({
        titulo: 'Huella digital',
        mensaje:
          'Este dispositivo no admite autenticación mediante huella digital.',
        tipo: 'warning',
        textoConfirmar: 'Aceptar',
      });

      return;
    }

    const tieneBiometriaRegistrada =
      await LocalAuthentication.isEnrolledAsync();

    if (!tieneBiometriaRegistrada) {
      mostrarAlert({
        titulo: 'Huella no configurada',
        mensaje:
          'Primero debe registrar una huella digital en la configuración de seguridad de su teléfono.',
        tipo: 'warning',
        textoConfirmar: 'Aceptar',
      });

      return;
    }

    const resultado =
      await LocalAuthentication.authenticateAsync({
        promptMessage:
          'Confirme su huella para activar el acceso',
        cancelLabel: 'Cancelar',
        fallbackLabel:
          'Usar seguridad del dispositivo',
        disableDeviceFallback: true,
      });

    if (!resultado.success) {
      return;
    }

    await SecureStore.setItemAsync(
      clave,
      'true'
    );

    await SecureStore.setItemAsync(
      'mericar_usuario_huella',
      String(usuarioActual.id)
    );

    setHuellaConfigurada(true);

    mostrarToast(
      'Huella activada correctamente.',
      'success'
    );
  } catch (error) {
    console.log(
      'Error activando huella:',
      error
    );

    mostrarToast(
      'No se pudo activar la huella.',
      'error'
    );
  }
};

// ==========================================
// DESACTIVAR HUELLA
// ==========================================

const desactivarHuella = () => {
  mostrarAlert({
    titulo: 'Desactivar huella',
    mensaje:
      '¿Desea desactivar el acceso mediante huella digital en este dispositivo?',
    tipo: 'question',
    mostrarCancelar: true,
    textoCancelar: 'Cancelar',
    textoConfirmar: 'Desactivar',

    onConfirmar: async () => {
      try {
        const clave =
          obtenerClaveHuella();

        if (!clave) {
          return;
        }

        await SecureStore.deleteItemAsync(
          clave
        );

        const usuarioHuella =
          await SecureStore.getItemAsync(
            'mericar_usuario_huella'
          );

        if (
          String(usuarioHuella) ===
          String(usuarioActual.id)
        ) {
          await SecureStore.deleteItemAsync(
            'mericar_usuario_huella'
          );
        }

        setHuellaConfigurada(false);

        mostrarToast(
          'Huella desactivada correctamente.',
          'success'
        );
      } catch (error) {
        console.log(
          'Error desactivando huella:',
          error
        );

        mostrarToast(
          'No se pudo desactivar la huella.',
          'error'
        );
      }
    },
  });
};

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const cerrarSesion = () => {
    mostrarAlert({
      titulo:
        'Cerrar sesión',

      mensaje:
        '¿Desea salir de la aplicación?',

      tipo:
        'question',

      mostrarCancelar:
        true,

      textoCancelar:
        'Cancelar',

      textoConfirmar:
        'Salir',

      onConfirmar: async () => {
        await bloquearSesion();

        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Login',
            },
          ],
        });
      },
    });
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

        <Text
          style={styles.tituloHeader}
        >
          Perfil
        </Text>
      </View>

      {/* PERFIL */}
      <ScrollView
        style={styles.contenido}
        contentContainerStyle={styles.contenidoScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatar}>
          <Ionicons
            name="person"
            size={58}
            color="#08752F"
          />
        </View>

        <Text
          style={styles.nombrePrincipal}
        >
          {usuarioActual?.nombre ||
            'Usuario'}
        </Text>

        <View style={styles.badgeRol}>
          <Text
            style={styles.badgeTexto}
          >
            {usuarioActual?.rol ||
              'Usuario'}
          </Text>
        </View>

        {/* INFORMACIÓN */}

        <View style={styles.tarjeta}>
          <View style={styles.fila}>
            <View style={styles.icono}>
              <Ionicons
                name="person-outline"
                size={23}
                color="#08752F"
              />
            </View>

            <View style={styles.infoFila}>
              <Text style={styles.label}>
                Nombre
              </Text>

              <Text style={styles.valor}>
                {usuarioActual?.nombre ||
                  ''}
              </Text>
            </View>
          </View>

          <View
            style={styles.separador}
          />

          <View style={styles.fila}>
            <View style={styles.icono}>
              <Ionicons
                name="at-outline"
                size={23}
                color="#08752F"
              />
            </View>

            <View style={styles.infoFila}>
              <Text style={styles.label}>
                Usuario
              </Text>

              <Text style={styles.valor}>
                {usuarioActual?.usuario ||
                  usuarioActual?.correo ||
                  ''}
              </Text>
            </View>
          </View>

          <View
            style={styles.separador}
          />

          <View style={styles.fila}>
            <View style={styles.icono}>
              <Ionicons
                name="shield-checkmark-outline"
                size={23}
                color="#08752F"
              />
            </View>

            <View style={styles.infoFila}>
              <Text style={styles.label}>
                Rol
              </Text>

              <Text style={styles.valor}>
                {usuarioActual?.rol ||
                  ''}
              </Text>
            </View>
          </View>
        </View>

        {/* =====================================
            SEGURIDAD
        ===================================== */}

        <Text
          style={styles.tituloSeguridad}
        >
          Seguridad
        </Text>

        <View
          style={styles.tarjetaSeguridad}
        >
          <View
            style={
              styles.seguridadSuperior
            }
          >
            <View
              style={
                styles.iconoSeguridad
              }
            >
              <Ionicons
                name="keypad-outline"
                size={25}
                color="#08752F"
              />
            </View>

            <View style={styles.infoFila}>
              <Text
                style={
                  styles.tituloPin
                }
              >
                PIN de acceso
              </Text>

              <Text
                style={
                  pinConfigurado
                    ? styles.pinActivo
                    : styles.pinInactivo
                }
              >
                {pinConfigurado
                  ? 'PIN configurado'
                  : 'PIN no configurado'}
              </Text>
            </View>

            <Ionicons
              name={
                pinConfigurado
                  ? 'checkmark-circle'
                  : 'alert-circle-outline'
              }
              size={24}
              color={
                pinConfigurado
                  ? '#08752F'
                  : '#D98B00'
              }
            />
          </View>

          <TouchableOpacity
            style={
              styles.botonRestablecer
            }
            activeOpacity={0.8}
            onPress={abrirModalPin}
          >
            <Ionicons
              name="refresh-outline"
              size={21}
              color="#08752F"
            />

            <Text
              style={
                styles.textoRestablecer
              }
            >
              Restablecer PIN
            </Text>
          </TouchableOpacity>
        </View>

        <View
            style={[
            styles.tarjetaSeguridad,
            styles.tarjetaHuella,
          ]}
        >
          <View
            style={
              styles.seguridadSuperior
            }
          >
            <View
              style={
                styles.iconoSeguridad
              }
            >
              <Ionicons
                name="finger-print-outline"
                size={27}
                color="#08752F"
              />
            </View>

            <View style={styles.infoFila}>
              <Text
                style={styles.tituloPin}
              >
                Huella digital
              </Text>

              <Text
                style={
                  huellaConfigurada
                    ? styles.pinActivo
                    : styles.pinInactivo
                }
              >
                {huellaConfigurada
                  ? 'Huella activada'
                  : 'Huella no configurada'}
              </Text>
            </View>

            <Ionicons
              name={
                huellaConfigurada
                  ? 'checkmark-circle'
                  : 'alert-circle-outline'
              }
              size={24}
              color={
                huellaConfigurada
                  ? '#08752F'
                  : '#D98B00'
              }
            />
          </View>

          <TouchableOpacity
            style={
              styles.botonRestablecer
            }
            activeOpacity={0.8}
            onPress={
              huellaConfigurada
                ? desactivarHuella
                : activarHuella
            }
          >
            <Ionicons
              name={
                huellaConfigurada
                  ? 'finger-print-outline'
                  : 'finger-print'
              }
              size={22}
              color="#08752F"
            />

            <Text
              style={
                styles.textoRestablecer
              }
            >
              {huellaConfigurada
                ? 'DESACTIVAR HUELLA'
                : 'ACTIVAR HUELLA'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* =====================================
          NAVEGACIÓN INFERIOR
      ===================================== */}

      <View
        style={[
          styles.bottomNavigation,
          {
            paddingBottom: insets.bottom,
            height: 78 + insets.bottom,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            navigation.navigate(
              'Home'
            )
          }
        >
          <Ionicons
            name="home-outline"
            size={27}
            color="#222222"
          />

          <Text style={styles.navTexto}>
            Inicio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
        >
          <Ionicons
            name="person"
            size={27}
            color="#08752F"
          />

          <Text
            style={styles.navActivo}
          >
            Perfil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={cerrarSesion}
        >
          <Ionicons
            name="log-out-outline"
            size={29}
            color="#222222"
          />

          <Text style={styles.navTexto}>
            Salir
          </Text>
        </TouchableOpacity>
      </View>

      {/* =====================================
          MODAL PIN
      ===================================== */}

      <Modal
        visible={modalPin}
        transparent
        animationType="fade"
        onRequestClose={
          cerrarModalPin
        }
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboard}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View
              style={styles.modalFondo}
            >
              <TouchableWithoutFeedback>
                <View
                  style={styles.modalContenido}
                >
                  <View
                    style={styles.modalHeader}
                  >
                    <View
                      style={
                        styles.modalTituloContainer
                      }
                    >
                      <Text
                        style={
                          styles.modalTitulo
                        }
                      >
                        {pinConfigurado
                          ? 'Restablecer PIN'
                          : 'Configurar PIN'}
                      </Text>

                      <Text
                        style={
                          styles.modalDescripcion
                        }
                      >
                        Cree un PIN de 6 dígitos para acceder rápidamente a su cuenta.
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={
                        styles.cerrarModal
                      }
                      onPress={
                        cerrarModalPin
                      }
                    >
                      <Ionicons
                        name="close"
                        size={25}
                        color="#555555"
                      />
                    </TouchableOpacity>
                  </View>

                  <View
                    style={
                      styles.iconoModalPin
                    }
                  >
                    <Ionicons
                      name="keypad-outline"
                      size={34}
                      color="#08752F"
                    />
                  </View>

                  {/* NUEVO PIN */}

                  <Text
                    style={styles.labelPin}
                  >
                    Nuevo PIN
                  </Text>

                  <View
                    style={
                      styles.inputPinContainer
                    }
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={21}
                      color="#777777"
                    />

                    <TextInput
                      style={
                        styles.inputPin
                      }
                      value={nuevoPin}
                      onChangeText={
                        cambiarNuevoPin
                      }
                      placeholder="6 dígitos"
                      placeholderTextColor="#999999"
                      keyboardType="number-pad"
                      maxLength={6}
                      secureTextEntry={
                        !mostrarNuevoPin
                      }
                    />

                    <TouchableOpacity
                      onPress={() =>
                        setMostrarNuevoPin(
                          !mostrarNuevoPin
                        )
                      }
                    >
                      <Ionicons
                        name={
                          mostrarNuevoPin
                            ? 'eye-off-outline'
                            : 'eye-outline'
                        }
                        size={21}
                        color="#777777"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* CONFIRMAR */}

                  <Text
                    style={styles.labelPin}
                  >
                    Confirmar PIN
                  </Text>

                  <View
                    style={
                      styles.inputPinContainer
                    }
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={21}
                      color="#777777"
                    />

                    <TextInput
                      style={
                        styles.inputPin
                      }
                      value={
                        confirmarPin
                      }
                      onChangeText={
                        cambiarConfirmacion
                      }
                      placeholder="Repita el PIN"
                      placeholderTextColor="#999999"
                      keyboardType="number-pad"
                      maxLength={6}
                      secureTextEntry={
                        !mostrarConfirmarPin
                      }
                      returnKeyType="done"
                      onSubmitEditing={
                        Keyboard.dismiss
                      }
                    />

                    <TouchableOpacity
                      onPress={() =>
                        setMostrarConfirmarPin(
                          !mostrarConfirmarPin
                        )
                      }
                    >
                      <Ionicons
                        name={
                          mostrarConfirmarPin
                            ? 'eye-off-outline'
                            : 'eye-outline'
                        }
                        size={21}
                        color="#777777"
                      />
                    </TouchableOpacity>
                  </View>

                  <View
                    style={styles.infoPin}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={20}
                      color="#1672B8"
                    />

                    <Text
                      style={
                        styles.infoPinTexto
                      }
                    >
                      Este PIN pertenece únicamente a su cuenta en este dispositivo.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={
                      styles.botonGuardarPin
                    }
                    activeOpacity={0.85}
                    onPress={guardarPin}
                  >
                    <Ionicons
                      name="save-outline"
                      size={21}
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.textoGuardarPin
                      }
                    >
                      GUARDAR PIN
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default PerfilScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 90,
    backgroundColor: '#08752F',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 15,
  },

  regresar: {
    position: 'absolute',
    left: 18,
    bottom: 9,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tituloHeader: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '700',
  },

  contenido: {
  flex: 1,
},

contenidoScroll: {
  paddingHorizontal: 25,
  paddingTop: 20,
  paddingBottom: 25,
  alignItems: 'center',
},

  avatar: {
    width: 85,
    height: 85,
    borderRadius: 48,
    backgroundColor: '#E5F3E9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  nombrePrincipal: {
    marginTop: 10,
    fontSize: 19,
    fontWeight: '700',
    color: '#222222',
  },

  badgeRol: {
    marginTop: 5,
    backgroundColor: '#E5F3E9',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeTexto: {
    color: '#08752F',
    fontSize: 10,
    fontWeight: '700',
  },

  tarjeta: {
    width: '100%',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },

  fila: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
  },

  icono: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#EAF5ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  infoFila: {
    flex: 1,
  },

  label: {
    fontSize: 11,
    color: '#777777',
  },

  valor: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
  },

  separador: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },

  tituloSeguridad: {
    width: '100%',
    marginTop: 13,
    marginBottom: 9,
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },

  tarjetaSeguridad: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 13,
    padding: 15,
  },

  seguridadSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconoSeguridad: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EAF5ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  tituloPin: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
  },

  pinActivo: {
    marginTop: 3,
    fontSize: 10,
    color: '#08752F',
  },

  pinInactivo: {
    marginTop: 3,
    fontSize: 10,
    color: '#D98B00',
  },

  botonRestablecer: {
    height: 45,
    marginTop: 14,
    borderWidth: 1.3,
    borderColor: '#08752F',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  textoRestablecer: {
    color: '#08752F',
    fontSize: 12,
    fontWeight: '700',
  },

  bottomNavigation: {
    height: 78,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
  },

  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  navTexto: {
    color: '#333333',
    fontSize: 12,
    marginTop: 3,
  },

  navActivo: {
    color: '#08752F',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },

  modalKeyboard: {
    flex: 1,
  },

  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  modalContenido: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 19,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  modalTituloContainer: {
    flex: 1,
    paddingRight: 10,
  },

  modalTitulo: {
    fontSize: 19,
    fontWeight: '700',
    color: '#222222',
  },

  modalDescripcion: {
    marginTop: 4,
    color: '#777777',
    fontSize: 10,
    lineHeight: 15,
  },

  cerrarModal: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconoModalPin: {
    width: 67,
    height: 67,
    borderRadius: 34,
    backgroundColor: '#EAF5ED',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
  },

  labelPin: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333333',
    marginTop: 13,
    marginBottom: 6,
  },

  inputPinContainer: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  inputPin: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    color: '#222222',
    fontSize: 16,
    letterSpacing: 4,
  },

  infoPin: {
    minHeight: 54,
    backgroundColor: '#EFF7FD',
    borderWidth: 1,
    borderColor: '#C1DDEF',
    borderRadius: 9,
    paddingHorizontal: 10,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoPinTexto: {
    flex: 1,
    color: '#42677F',
    fontSize: 9,
    lineHeight: 14,
    marginLeft: 7,
  },

  botonGuardarPin: {
    height: 50,
    backgroundColor: '#08752F',
    borderRadius: 9,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },

  textoGuardarPin: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  tarjetaHuella: {
    marginTop: 12,
  },
});