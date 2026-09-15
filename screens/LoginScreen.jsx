import React, { useRef, useState } from 'react';

import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
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

export default function LoginScreen({ navigation }) {

  const {
    usuarios,
    autenticarUsuario,
    iniciarSesion,
    desbloquearSesionConPin,
    solicitarRestablecimiento,
  } = useUsuarios();

  const { mostrarToast } = useToast();
  const { mostrarAlert } = useAlert();

  const [usuario, setUsuario] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [
    mostrarLogin,
    setMostrarLogin,
  ] = useState(false);

  const [modalPin, setModalPin] =
    useState(false);

  const [pin, setPin] =
    useState('');

  const inputPinRef =
    useRef(null);

  const [
    correoRecuperacion,
    setCorreoRecuperacion,
  ] = useState('');

  const [
  notaRecuperacion,
  setNotaRecuperacion,
] = useState('');

  const [
    modalRecuperacion,
    setModalRecuperacion,
  ] = useState(false);

  const login = async () => {
    Keyboard.dismiss();

    const usuarioLimpio =
      usuario.trim();

    const passwordLimpio =
      password.trim();

    if (
      !usuarioLimpio &&
      !passwordLimpio
    ) {
      mostrarToast(
        'Ingrese sus datos para iniciar sesión.',
        'warning'
      );

      return;
    }

    if (!usuarioLimpio) {
      mostrarToast(
        'Ingrese su usuario o correo electrónico.',
        'warning'
      );

      return;
    }

    if (!passwordLimpio) {
      mostrarToast(
        'Ingrese su contraseña.',
        'warning'
      );

      return;
    }

    const usuarioEncontrado =
      await autenticarUsuario(
        usuarioLimpio,
        passwordLimpio
      );

    if (!usuarioEncontrado) {
      mostrarToast(
        'Usuario o contraseña incorrectos.',
        'error'
      );

      return;
    }

    if (
      usuarioEncontrado.error ===
      'PENDIENTE'
    ) {
      mostrarAlert({
        titulo: 'Cuenta pendiente',
        mensaje:
          'Su cuenta todavía está pendiente de aprobación por el administrador.',
        tipo: 'warning',
        textoConfirmar: 'Entendido',
      });

      return;
    }

    if (
      usuarioEncontrado.error ===
      'RECHAZADO'
    ) {
      mostrarAlert({
        titulo: 'Solicitud rechazada',
        mensaje:
          'Su solicitud de registro fue rechazada por el administrador.',
        tipo: 'danger',
        textoConfirmar: 'Entendido',
      });

      return;
    }

    if (
      usuarioEncontrado.error ===
      'INHABILITADO'
    ) {
      mostrarAlert({
        titulo: 'Cuenta inhabilitada',
        mensaje:
          'Este usuario se encuentra inhabilitado.',
        tipo: 'warning',
        textoConfirmar: 'Entendido',
      });

      return;
    }

    if (
      usuarioEncontrado.error ===
      'NO_ACTIVO'
    ) {
      mostrarAlert({
        titulo: 'Acceso no disponible',
        mensaje:
          'Esta cuenta todavía no se encuentra habilitada para ingresar al sistema.',
        tipo: 'warning',
        textoConfirmar: 'Entendido',
      });

      return;
    }

    iniciarSesion(
      usuarioEncontrado
    );

    setUsuario('');
    setPassword('');
    setMostrarPassword(false);

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Home',
        },
      ],
    });
  };

  const abrirLogin = () => {
    Keyboard.dismiss();

    setMostrarLogin(
      !mostrarLogin
    );
  };

  const iniciarHuella = async () => {
    Keyboard.dismiss();

    try {
      const usuarioHuellaId =
        await SecureStore.getItemAsync(
          'mericar_usuario_huella'
        );

      if (!usuarioHuellaId) {
        mostrarAlert({
          titulo: 'Huella no configurada',
          mensaje:
            'Primero debe iniciar sesión con su usuario y contraseña y activar la huella desde Perfil.',
          tipo: 'warning',
          textoConfirmar: 'Entendido',
        });

        return;
      }

      const usuarioHuella =
        usuarios.find(
          (item) =>
            String(item.id) ===
            String(usuarioHuellaId)
        );

      if (!usuarioHuella) {
        mostrarAlert({
          titulo: 'Cuenta no disponible',
          mensaje:
            'No se encontró la cuenta asociada a la huella digital.',
          tipo: 'warning',
          textoConfirmar: 'Entendido',
        });

        return;
      }

      if (
        usuarioHuella.estado !==
        'ACTIVO'
      ) {
        mostrarAlert({
          titulo: 'Cuenta inhabilitada',
          mensaje:
            'No puede ingresar con huella porque esta cuenta se encuentra inhabilitada.',
          tipo: 'warning',
          textoConfirmar: 'Entendido',
        });

        return;
      }

      const huellaActivada =
        await SecureStore.getItemAsync(
          `mericar_huella_${usuarioHuella.id}`
        );

      if (
        huellaActivada !== 'true'
      ) {
        mostrarAlert({
          titulo: 'Huella no configurada',
          mensaje:
            'La huella digital no está activada para esta cuenta en este dispositivo.',
          tipo: 'warning',
          textoConfirmar: 'Entendido',
        });

        return;
      }

      const tieneHardware =
        await LocalAuthentication
          .hasHardwareAsync();

      if (!tieneHardware) {
        mostrarAlert({
          titulo: 'Huella no disponible',
          mensaje:
            'Este dispositivo no cuenta con un sensor biométrico compatible.',
          tipo: 'warning',
          textoConfirmar: 'Entendido',
        });

        return;
      }

      const tiposDisponibles =
        await LocalAuthentication
          .supportedAuthenticationTypesAsync();

      const tieneHuella =
        tiposDisponibles.includes(
          LocalAuthentication
            .AuthenticationType
            .FINGERPRINT
        );

      if (!tieneHuella) {
        mostrarAlert({
          titulo: 'Huella no disponible',
          mensaje:
            'Este dispositivo no admite autenticación mediante huella digital.',
          tipo: 'warning',
          textoConfirmar: 'Entendido',
        });

        return;
      }

      const biometriaRegistrada =
        await LocalAuthentication
          .isEnrolledAsync();

      if (!biometriaRegistrada) {
        mostrarAlert({
          titulo: 'Huella no registrada',
          mensaje:
            'No existe una huella digital registrada actualmente en este dispositivo.',
          tipo: 'warning',
          textoConfirmar: 'Entendido',
        });

        return;
      }

      const resultadoHuella =
        await LocalAuthentication
          .authenticateAsync({
            promptMessage:
              'Ingrese su huella para acceder a MERICAR',
            cancelLabel: 'Cancelar',
            disableDeviceFallback: true,
          });

      if (!resultadoHuella.success) {
        return;
      }
      const resultadoDesbloqueo =
        await desbloquearSesionConPin(
          usuarioHuella
        );

      if (!resultadoDesbloqueo?.ok) {

        if (
          resultadoDesbloqueo?.error ===
            'SIN_SESION_FIREBASE' ||
          resultadoDesbloqueo?.error ===
            'JORNADA_VENCIDA'
        ) {
          mostrarAlert({
            titulo:
              'Sesión del día finalizada',
            mensaje:
              'Para comenzar una nueva jornada debe ingresar nuevamente con su usuario y contraseña.',
            tipo: 'warning',
            textoConfirmar:
              'Entendido',
          });

          return;
        }

        if (
          resultadoDesbloqueo?.error ===
          'USUARIO_DIFERENTE'
        ) {
          mostrarAlert({
            titulo:
              'Huella no disponible',
            mensaje:
              'La sesión guardada en este dispositivo pertenece a otra cuenta. Ingrese con usuario y contraseña.',
            tipo: 'warning',
            textoConfirmar:
              'Entendido',
          });

          return;
        }

        if (
          resultadoDesbloqueo?.error ===
            'INHABILITADO' ||
          resultadoDesbloqueo?.error ===
            'RECHAZADO' ||
          resultadoDesbloqueo?.error ===
            'PENDIENTE' ||
          resultadoDesbloqueo?.error ===
            'NO_ACTIVO'
        ) {
          mostrarAlert({
            titulo:
              'Cuenta no disponible',
            mensaje:
              'Esta cuenta ya no se encuentra habilitada para ingresar al sistema.',
            tipo: 'warning',
            textoConfirmar:
              'Entendido',
          });

          return;
        }

        mostrarToast(
          'No se pudo iniciar sesión con huella.',
          'error'
        );

        return;
      }

      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Home',
          },
        ],
      });

    } catch (error) {
      console.log(
        'Error ingresando con huella:',
        error
      );

      mostrarToast(
        'No se pudo iniciar sesión con huella.',
        'error'
      );
    }
  };

  const abrirPin = async () => {
    Keyboard.dismiss();

    try {
      const usuarioPinId =
        await SecureStore.getItemAsync(
          'mericar_usuario_pin'
        );

      if (!usuarioPinId) {
        mostrarAlert({
          titulo: 'PIN no configurado',
          mensaje:
            'Primero debe iniciar sesión con su usuario y contraseña y configurar un PIN desde Perfil.',
          tipo: 'warning',
          textoConfirmar: 'Entendido',
        });

        return;
      }

      const usuarioPin =
        usuarios.find(
          (item) =>
            String(item.id) ===
            String(usuarioPinId)
        );

      if (!usuarioPin) {
        mostrarAlert({
          titulo: 'Cuenta no disponible',
          mensaje:
            'No se encontró la cuenta asociada al PIN.',
          tipo: 'warning',
          textoConfirmar: 'Entendido',
        });

        return;
      }

      if (
        usuarioPin.estado !==
        'ACTIVO'
      ) {
        mostrarAlert({
          titulo: 'Cuenta inhabilitada',
          mensaje:
            'La cuenta asociada a este PIN se encuentra inhabilitada.',
          tipo: 'warning',
          textoConfirmar: 'Entendido',
        });

        return;
      }

      setPin('');
      setModalPin(true);

      setTimeout(() => {
        inputPinRef.current?.focus();
      }, 300);

    } catch (error) {
      console.log(
        'Error abriendo PIN:',
        error
      );

      mostrarToast(
        'No se pudo acceder al PIN.',
        'error'
      );
    }
  };

  const cambiarPin = (texto) => {
    const soloNumeros =
      texto.replace(
        /[^0-9]/g,
        ''
      );

    setPin(
      soloNumeros
    );
  };

  const cerrarModalPin = () => {
    Keyboard.dismiss();

    setPin('');
    setModalPin(false);
  };

  const ingresarConPin =
    async () => {
      Keyboard.dismiss();

      if (
        pin.length !== 6
      ) {
        mostrarToast(
          'Ingrese un PIN de 6 dígitos.',
          'warning'
        );

        return;
      }

      try {
        const usuarioPinId =
          await SecureStore.getItemAsync(
            'mericar_usuario_pin'
          );

        if (!usuarioPinId) {
          cerrarModalPin();

          mostrarAlert({
            titulo: 'PIN no configurado',
            mensaje:
              'Configure un PIN desde su perfil.',
            tipo: 'warning',
            textoConfirmar: 'Entendido',
          });

          return;
        }

        const usuarioPin =
          usuarios.find(
            (item) =>
              String(item.id) ===
              String(usuarioPinId)
          );

        if (!usuarioPin) {
          cerrarModalPin();

          mostrarToast(
            'No se encontró la cuenta asociada.',
            'error'
          );

          return;
        }

        if (
          usuarioPin.estado !==
          'ACTIVO'
        ) {
          cerrarModalPin();

          mostrarAlert({
            titulo: 'Cuenta inhabilitada',
            mensaje:
              'No puede ingresar con PIN porque esta cuenta se encuentra inhabilitada.',
            tipo: 'warning',
            textoConfirmar: 'Entendido',
          });

          return;
        }

        const pinGuardado =
          await SecureStore.getItemAsync(
            `mericar_pin_${usuarioPin.id}`
          );

        if (!pinGuardado) {
          cerrarModalPin();

          mostrarAlert({
            titulo: 'PIN no configurado',
            mensaje:
              'Esta cuenta todavía no tiene un PIN configurado.',
            tipo: 'warning',
            textoConfirmar: 'Entendido',
          });

          return;
        }

        if (
          pin !==
          pinGuardado
        ) {
          mostrarToast(
            'PIN incorrecto.',
            'error'
          );

          setPin('');

          return;
        }

        const resultadoDesbloqueo =
          await desbloquearSesionConPin(
            usuarioPin
          );

        if (!resultadoDesbloqueo?.ok) {
          cerrarModalPin();

          if (
            resultadoDesbloqueo?.error ===
              'SIN_SESION_FIREBASE' ||
            resultadoDesbloqueo?.error ===
              'JORNADA_VENCIDA'
          ) {
            mostrarAlert({
              titulo: 'Sesión del día finalizada',
              mensaje:
                'Para comenzar una nueva jornada debe ingresar nuevamente con su usuario y contraseña.',
              tipo: 'warning',
              textoConfirmar: 'Entendido',
            });

            return;
          }

          if (
            resultadoDesbloqueo?.error ===
            'USUARIO_DIFERENTE'
          ) {
            mostrarAlert({
              titulo: 'PIN no disponible',
              mensaje:
                'La sesión guardada en este dispositivo pertenece a otra cuenta. Ingrese con usuario y contraseña.',
              tipo: 'warning',
              textoConfirmar: 'Entendido',
            });

            return;
          }

          if (
            resultadoDesbloqueo?.error ===
              'INHABILITADO' ||
            resultadoDesbloqueo?.error ===
              'RECHAZADO' ||
            resultadoDesbloqueo?.error ===
              'PENDIENTE' ||
            resultadoDesbloqueo?.error ===
              'NO_ACTIVO'
          ) {
            mostrarAlert({
              titulo: 'Cuenta no disponible',
              mensaje:
                'Esta cuenta ya no se encuentra habilitada para ingresar al sistema.',
              tipo: 'warning',
              textoConfirmar: 'Entendido',
            });

            return;
          }

          mostrarToast(
            'No se pudo iniciar sesión con PIN.',
            'error'
          );

          return;
        }

        cerrarModalPin();

        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Home',
            },
          ],
        });

      } catch (error) {
        console.log(
          'Error ingresando con PIN:',
          error
        );

        mostrarToast(
          'No se pudo iniciar sesión con PIN.',
          'error'
        );
      }
    };

  const abrirRecuperacion =
  () => {
    Keyboard.dismiss();

    setCorreoRecuperacion('');
    setNotaRecuperacion('');

    setModalRecuperacion(true);
  };

const cerrarRecuperacion =
  () => {
    Keyboard.dismiss();

    setCorreoRecuperacion('');
    setNotaRecuperacion('');

    setModalRecuperacion(false);
  };
  const enviarSolicitudRecuperacion =
    async () => {
      Keyboard.dismiss();

      const correoLimpio =
        correoRecuperacion
          .trim()
          .toLowerCase();

      const notaLimpia =
        notaRecuperacion
          .trim();

      if (!correoLimpio) {
        mostrarToast(
          'Ingrese su correo electrónico.',
          'warning'
        );

        return;
      }

      const correoValido =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !correoValido.test(
          correoLimpio
        )
      ) {
        mostrarToast(
          'Ingrese un correo electrónico válido.',
          'warning'
        );

        return;
      }

      if (!notaLimpia) {
        mostrarToast(
          'Ingrese una nota para la solicitud.',
          'warning'
        );

        return;
      }

      const resultado =
        await solicitarRestablecimiento(
          correoLimpio,
          notaLimpia
        );

      if (!resultado) {
        mostrarToast(
          'No existe una cuenta registrada con ese correo.',
          'error'
        );

        return;
      }

      mostrarToast(
        'Solicitud enviada al administrador.',
        'success'
      );

      cerrarRecuperacion();
    };

  return (
    <KeyboardAvoidingView
      style={styles.container}
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
        <View style={styles.container}>
          <StatusBar
            barStyle="light-content"
            backgroundColor="#08752F"
          />

          <View style={styles.header}>
            <View
              style={
                styles.logoContainer
              }
            >
              <Ionicons
                name="leaf"
                size={41}
                color="#FFFFFF"
              />
            </View>

            <Text
              style={styles.logoTexto}
            >
              MERICAR
            </Text>

            <Text
              style={
                styles.logoSubtitulo
              }
            >
              Gestión de distribución
            </Text>
          </View>

          <View style={styles.contenido}>
            <Text
              style={styles.bienvenido}
            >
              Bienvenido
            </Text>

            <Text
              style={styles.descripcion}
            >
              Seleccione una opción para acceder al sistema.
            </Text>

            <View
              style={
                styles.metodosContainer
              }
            >
              <TouchableOpacity
                style={[
                  styles.metodoCard,

                  mostrarLogin &&
                    styles.metodoSeleccionado,
                ]}
                activeOpacity={0.8}
                onPress={abrirLogin}
              >
                <View
                  style={styles.iconoMetodo}
                >
                  <Ionicons
                    name="person-outline"
                    size={28}
                    color="#08752F"
                  />
                </View>

                <Text
                  style={styles.metodoTexto}
                >
                  Usuario y
                </Text>

                <Text
                  style={styles.metodoTexto}
                >
                  contraseña
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.metodoCard}
                activeOpacity={0.8}
                onPress={iniciarHuella}
              >
                <View
                  style={styles.iconoMetodo}
                >
                  <Ionicons
                    name="finger-print-outline"
                    size={31}
                    color="#08752F"
                  />
                </View>

                <Text
                  style={styles.metodoTexto}
                >
                  Huella
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.metodoCard}
                activeOpacity={0.8}
                onPress={abrirPin}
              >
                <View
                  style={styles.iconoMetodo}
                >
                  <Ionicons
                    name="keypad-outline"
                    size={29}
                    color="#08752F"
                  />
                </View>

                <Text
                  style={styles.metodoTexto}
                >
                  PIN
                </Text>
              </TouchableOpacity>
            </View>

            {mostrarLogin && (
              <View
                style={
                  styles.loginContainer
                }
              >
                <Text
                  style={
                    styles.loginTitulo
                  }
                >
                  Iniciar sesión
                </Text>

                <Text style={styles.label}>
                  Usuario o correo electrónico
                </Text>

                <View
                  style={
                    styles.inputContainer
                  }
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#777777"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Ingrese su usuario o correo"
                    placeholderTextColor="#999999"
                    value={usuario}
                    onChangeText={
                      setUsuario
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <Text style={styles.label}>
                  Contraseña
                </Text>

                <View
                  style={
                    styles.inputContainer
                  }
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#777777"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Ingrese su contraseña"
                    placeholderTextColor="#999999"
                    value={password}
                    onChangeText={
                      setPassword
                    }
                    secureTextEntry={
                      !mostrarPassword
                    }
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={
                      Keyboard.dismiss
                    }
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setMostrarPassword(
                        !mostrarPassword
                      )
                    }
                  >
                    <Ionicons
                      name={
                        mostrarPassword
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={21}
                      color="#777777"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={
                    styles.olvidoPassword
                  }
                  onPress={
                    abrirRecuperacion
                  }
                >
                  <Text
                    style={
                      styles.textoOlvidoPassword
                    }
                  >
                    ¿Olvidó su contraseña?
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.botonIngresar
                  }
                  activeOpacity={0.85}
                  onPress={login}
                >
                  <Ionicons
                    name="log-in-outline"
                    size={22}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.textoIngresar
                    }
                  >
                    INGRESAR
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={
                styles.botonRegistro
              }
              activeOpacity={0.85}
              onPress={() => {
                Keyboard.dismiss();

                navigation.navigate(
                  'RegistroUsuario'
                );
              }}
            >
              <Ionicons
                name="person-add-outline"
                size={21}
                color="#08752F"
              />

              <Text
                style={
                  styles.textoRegistro
                }
              >
                REGISTRARSE
              </Text>
            </TouchableOpacity>
          </View>

          <Modal
            visible={modalPin}
            transparent
            animationType="fade"
            onRequestClose={
              cerrarModalPin
            }
          >
            <KeyboardAvoidingView
              style={
                styles.modalKeyboard
              }
              behavior={
                Platform.OS === 'ios'
                  ? 'padding'
                  : undefined
              }
            >
              <TouchableWithoutFeedback
                onPress={
                  Keyboard.dismiss
                }
                accessible={false}
              >
                <View
                  style={
                    styles.modalFondo
                  }
                >
                  <TouchableWithoutFeedback>
                    <View
                      style={
                        styles.modalPin
                      }
                    >
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

                      <View
                        style={
                          styles.iconoPinGrande
                        }
                      >
                        <Ionicons
                          name="keypad-outline"
                          size={38}
                          color="#08752F"
                        />
                      </View>

                      <Text
                        style={
                          styles.tituloPin
                        }
                      >
                        Ingresa tu PIN
                      </Text>

                      <Text
                        style={
                          styles.descripcionPin
                        }
                      >
                        Utiliza tu PIN de 6 dígitos para acceder a MERICAR.
                      </Text>

                      <View
                        style={
                          styles.pinCirculosContainer
                        }
                      >
                        {[
                          0,
                          1,
                          2,
                          3,
                          4,
                          5,
                        ].map(
                          (indice) => (
                            <View
                              key={indice}
                              style={[
                                styles.pinCirculo,

                                indice <
                                  pin.length &&
                                  styles.pinCirculoLleno,
                              ]}
                            />
                          )
                        )}

                        <TextInput
                          ref={inputPinRef}
                          style={
                            styles.inputPinOculto
                          }
                          value={pin}
                          onChangeText={
                            cambiarPin
                          }
                          keyboardType="number-pad"
                          maxLength={6}
                          autoFocus
                          caretHidden
                        />
                      </View>

                      <TouchableOpacity
                        style={
                          styles.botonPin
                        }
                        activeOpacity={0.85}
                        onPress={
                          ingresarConPin
                        }
                      >
                        <Ionicons
                          name="log-in-outline"
                          size={21}
                          color="#FFFFFF"
                        />

                        <Text
                          style={
                            styles.textoBotonPin
                          }
                        >
                          INGRESAR
                        </Text>
                      </TouchableOpacity>

                      <Text
                        style={
                          styles.avisoPin
                        }
                      >
                        Si olvidaste tu PIN, inicia sesión con tu usuario y contraseña y restablécelo desde Perfil.
                      </Text>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Modal>

          <Modal
            visible={
              modalRecuperacion
            }
            transparent
            animationType="fade"
            onRequestClose={
              cerrarRecuperacion
            }
          >
            <KeyboardAvoidingView
              style={
                styles.modalKeyboard
              }
              behavior={
                Platform.OS === 'ios'
                  ? 'padding'
                  : undefined
              }
            >
              <TouchableWithoutFeedback
                onPress={
                  Keyboard.dismiss
                }
                accessible={false}
              >
                <View
                  style={
                    styles.modalFondo
                  }
                >
                  <TouchableWithoutFeedback>
                    <View
                      style={
                        styles.modalRecuperacion
                      }
                    >
                      <View
                        style={
                          styles.modalHeader
                        }
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
                            Recuperar contraseña
                          </Text>

                          <Text
                            style={
                              styles.modalSubtitulo
                            }
                          >
                            Ingrese el correo electrónico asociado a su cuenta.
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={
                            styles.botonCerrarModal
                          }
                          onPress={
                            cerrarRecuperacion
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
                          styles.iconoRecuperacion
                        }
                      >
                        <Ionicons
                          name="key-outline"
                          size={31}
                          color="#08752F"
                        />
                      </View>

                      <Text
                        style={
                          styles.labelRecuperacion
                        }
                      >
                        Correo electrónico
                      </Text>

                      <View
                        style={
                          styles.inputRecuperacion
                        }
                      >
                        <Ionicons
                          name="mail-outline"
                          size={20}
                          color="#777777"
                        />

                        <TextInput
                          style={
                            styles.inputTextoRecuperacion
                          }
                          placeholder="Ingrese su correo electrónico"
                          placeholderTextColor="#999999"
                          value={
                            correoRecuperacion
                          }
                          onChangeText={
                            setCorreoRecuperacion
                          }
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onSubmitEditing={
                            Keyboard.dismiss
                          }
                        />
                      </View>

                      <Text style={styles.labelRecuperacion}>
                        Nota
                      </Text>

                      <View style={styles.inputNotaRecuperacion}>
                        <TextInput
                          style={styles.inputTextoNota}
                          placeholder="Escriba el motivo de su solicitud..."
                          placeholderTextColor="#999999"
                          value={notaRecuperacion}
                          onChangeText={setNotaRecuperacion}
                          multiline
                          maxLength={200}
                          textAlignVertical="top"
                        />
                      </View>

                      <View
                        style={
                          styles.infoRecuperacion
                        }
                      >
                        <Ionicons
                          name="information-circle-outline"
                          size={19}
                          color="#1672B8"
                        />

                        <Text
                          style={
                            styles.infoRecuperacionTexto
                          }
                        >
                          El administrador recibirá una solicitud para gestionar el restablecimiento de su contraseña.
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={
                          styles.botonEnviarRecuperacion
                        }
                        activeOpacity={0.85}
                        onPress={
                          enviarSolicitudRecuperacion
                        }
                      >
                        <Ionicons
                          name="send-outline"
                          size={20}
                          color="#FFFFFF"
                        />

                        <Text
                          style={
                            styles.textoEnviarRecuperacion
                          }
                        >
                          Enviar solicitud
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 240,
    backgroundColor: '#08752F',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 25,
  },

  logoContainer: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor:
      'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  logoTexto: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  logoSubtitulo: {
    color: '#DCEFE2',
    fontSize: 11,
    marginTop: 4,
  },

  contenido: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
  },

  bienvenido: {
    fontSize: 23,
    fontWeight: '700',
    color: '#222222',
    textAlign: 'center',
  },

  descripcion: {
    textAlign: 'center',
    fontSize: 11,
    color: '#777777',
    marginTop: 5,
    marginBottom: 20,
  },

  metodosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 9,
  },

  metodoCard: {
    flex: 1,
    height: 112,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  metodoSeleccionado: {
    borderColor: '#08752F',
    backgroundColor: '#F0F8F2',
    borderWidth: 1.5,
  },

  iconoMetodo: {
    width: 49,
    height: 49,
    borderRadius: 13,
    backgroundColor: '#E9F5EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  metodoTexto: {
    color: '#333333',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  loginContainer: {
    marginTop: 19,
  },

  loginTitulo: {
    fontSize: 16,
    color: '#222222',
    fontWeight: '700',
    marginBottom: 4,
  },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333333',
    marginTop: 11,
    marginBottom: 6,
  },

  inputContainer: {
    height: 49,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },

  input: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    color: '#222222',
    marginLeft: 8,
  },

  olvidoPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },

  textoOlvidoPassword: {
    color: '#08752F',
    fontSize: 11,
    fontWeight: '700',
  },

  botonIngresar: {
    height: 51,
    backgroundColor: '#08752F',
    borderRadius: 9,
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },

  textoIngresar: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  botonRegistro: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#08752F',
    borderRadius: 9,
    marginTop: 15,
    marginBottom: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },

  textoRegistro: {
    color: '#08752F',
    fontSize: 13,
    fontWeight: '800',
  },

  modalKeyboard: {
    flex: 1,
  },

  modalFondo: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  modalPin: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
  },

  cerrarModal: {
    position: 'absolute',
    right: 13,
    top: 13,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },

  iconoPinGrande: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#E9F5EC',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },

  tituloPin: {
    marginTop: 13,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },

  descripcionPin: {
    marginTop: 5,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 15,
    color: '#777777',
  },

  pinCirculosContainer: {
    height: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    position: 'relative',
  },

  pinCirculo: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#08752F',
    backgroundColor: '#FFFFFF',
  },

  pinCirculoLleno: {
    backgroundColor: '#08752F',
  },

  inputPinOculto: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },

  botonPin: {
    height: 51,
    backgroundColor: '#08752F',
    borderRadius: 9,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  textoBotonPin: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  avisoPin: {
    marginTop: 13,
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 14,
    color: '#777777',
  },

  modalRecuperacion: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  modalTituloContainer: {
    flex: 1,
    paddingRight: 10,
  },

  modalTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },

  modalSubtitulo: {
    fontSize: 10,
    color: '#777777',
    lineHeight: 15,
    marginTop: 4,
  },

  botonCerrarModal: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconoRecuperacion: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignSelf: 'center',
    backgroundColor: '#E9F5EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
  },

  labelRecuperacion: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333333',
    marginTop: 12,
    marginBottom: 7,
  },

  inputRecuperacion: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  inputTextoRecuperacion: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#222222',
  },

  infoRecuperacion: {
    minHeight: 57,
    backgroundColor: '#EFF7FD',
    borderWidth: 1,
    borderColor: '#C1DDEF',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 13,
  },

  infoRecuperacionTexto: {
    flex: 1,
    color: '#42677F',
    fontSize: 9,
    lineHeight: 14,
    marginLeft: 7,
  },

  botonEnviarRecuperacion: {
    height: 50,
    backgroundColor: '#08752F',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 16,
  },

  textoEnviarRecuperacion: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  inputNotaRecuperacion: {
  minHeight: 85,
  borderWidth: 1,
  borderColor: '#DDDDDD',
  borderRadius: 9,
  paddingHorizontal: 12,
  paddingVertical: 10,
},

inputTextoNota: {
  minHeight: 60,
  fontSize: 13,
  color: '#222222',
},
});