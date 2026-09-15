import React, { useState } from 'react';

import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useUsuarios } from '../context/UsuariosContext';
import { useToast } from '../context/ToastContext';

const RegistroUsuarioScreen = ({ navigation }) => {
  // ==========================================
  // CONTEXT
  // ==========================================

  const {
    registrarSolicitud,
    existeSolicitud,
    existeUsuario,
  } = useUsuarios();

  const {
    mostrarToast,
  } = useToast();

  // ==========================================
  // ESTADOS
  // ==========================================

  const [
    nombre,
    setNombre,
  ] = useState('');

  const [
    correo,
    setCorreo,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    confirmarPassword,
    setConfirmarPassword,
  ] = useState('');

  const [
    rol,
    setRol,
  ] = useState('');

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [
    mostrarConfirmacion,
    setMostrarConfirmacion,
  ] = useState(false);

  // ==========================================
  // ROLES
  // ==========================================

  const roles = [
    {
      nombre: 'EMPLEADO',
      icono: 'person-outline',
    },

    {
      nombre: 'CONTADOR',
      icono: 'calculator-outline',
    },
  ];

  // ==========================================
  // VALIDAR CORREO
  // ==========================================

  const validarCorreo = (
    valor
  ) => {
    const expresion =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return expresion.test(
      valor
    );
  };

  // ==========================================
  // ENVIAR SOLICITUD
  // ==========================================

  const enviarSolicitud = async () => {
      const nombreLimpio =
        nombre.trim();

      const correoLimpio =
        correo
          .trim()
          .toLowerCase();

      const passwordLimpio =
        password.trim();

      const confirmacionLimpia =
        confirmarPassword.trim();

      // ======================================
      // TODOS LOS CAMPOS VACÍOS
      // ======================================

      if (
        !nombreLimpio &&
        !correoLimpio &&
        !passwordLimpio &&
        !confirmacionLimpia &&
        !rol
      ) {
        mostrarToast(
          'Complete los datos para enviar la solicitud.',
          'warning'
        );

        return;
      }

      // ======================================
      // NOMBRE
      // ======================================

      if (!nombreLimpio) {
        mostrarToast(
          'Ingrese su nombre.',
          'warning'
        );

        return;
      }

      // ======================================
      // CORREO
      // ======================================

      if (!correoLimpio) {
        mostrarToast(
          'Ingrese su correo electrónico.',
          'warning'
        );

        return;
      }

      if (
        !validarCorreo(
          correoLimpio
        )
      ) {
        mostrarToast(
          'Ingrese un correo electrónico válido.',
          'warning'
        );

        return;
      }

      // ======================================
      // USUARIO YA REGISTRADO
      // ======================================

      if (
        existeUsuario(
          correoLimpio
        )
      ) {
        mostrarToast(
          'Ya existe una cuenta registrada con este correo.',
          'error'
        );

        return;
      }

      // ======================================
      // SOLICITUD YA EXISTENTE
      // ======================================

      if (
        existeSolicitud(
          correoLimpio
        )
      ) {
        mostrarToast(
          'Ya existe una solicitud pendiente con este correo.',
          'warning'
        );

        return;
      }

      // ======================================
      // CONTRASEÑA
      // ======================================

      if (!passwordLimpio) {
        mostrarToast(
          'Ingrese una contraseña.',
          'warning'
        );

        return;
      }

      if (
        passwordLimpio.length <
        6
      ) {
        mostrarToast(
          'La contraseña debe tener al menos 6 caracteres.',
          'warning'
        );

        return;
      }

      // ======================================
      // CONFIRMAR CONTRASEÑA
      // ======================================

      if (
        !confirmacionLimpia
      ) {
        mostrarToast(
          'Confirme su contraseña.',
          'warning'
        );

        return;
      }

      if (
        passwordLimpio !==
        confirmacionLimpia
      ) {
        mostrarToast(
          'Las contraseñas no coinciden.',
          'warning'
        );

        return;
      }

      // ======================================
      // ROL
      // ======================================

      if (!rol) {
        mostrarToast(
          'Seleccione el rol solicitado.',
          'warning'
        );

        return;
      }

      // ======================================
      // GUARDAR SOLICITUD
      // ======================================

      const resultado =
        await registrarSolicitud({
          nombre: nombreLimpio,
          correo: correoLimpio,
          password: passwordLimpio,
          rol,
        });

      if (
        resultado?.error ===
        'EMAIL_EN_USO'
      ) {
        mostrarToast(
          'Este correo ya está registrado en Firebase Authentication.',
          'error'
        );

        return;
      }

      if (
        resultado?.error ===
        'CORREO_INVALIDO'
      ) {
        mostrarToast(
          'El correo electrónico no es válido.',
          'error'
        );

        return;
      }

      if (
        resultado?.error ===
        'PASSWORD_DEBIL'
      ) {
        mostrarToast(
          'La contraseña no cumple los requisitos de seguridad.',
          'error'
        );

        return;
      }

      if (!resultado) {
        mostrarToast(
          'No se pudo enviar la solicitud.',
          'error'
        );

        return;
      }

      // ======================================
      // LIMPIAR FORMULARIO
      // ======================================

      setNombre('');

      setCorreo('');

      setPassword('');

      setConfirmarPassword(
        ''
      );

      setRol('');

      setMostrarPassword(
        false
      );

      setMostrarConfirmacion(
        false
      );

      // ======================================
      // NOTIFICACIONES
      // ======================================

      mostrarToast(
        'Solicitud enviada correctamente.',
        'success'
      );

      mostrarToast(
        'Espere la aprobación del administrador para iniciar sesión.',
        'info'
      );

      navigation.goBack();
    };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <View
      style={
        styles.container
      }
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#08752F"
      />

      {/* =====================================
          HEADER
      ===================================== */}

      <View
        style={
          styles.header
        }
      >
        <TouchableOpacity
          style={
            styles.regresar
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

        <Text
          style={
            styles.tituloHeader
          }
        >
          Solicitar registro
        </Text>
      </View>

      {/* =====================================
          CONTENIDO
      ===================================== */}

      <ScrollView
        contentContainerStyle={
          styles.contenido
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ICONO */}

        <View
          style={
            styles.iconoPrincipal
          }
        >
          <Ionicons
            name="person-add-outline"
            size={52}
            color="#08752F"
          />
        </View>

        <Text
          style={
            styles.titulo
          }
        >
          Crear solicitud
        </Text>

        <Text
          style={
            styles.subtitulo
          }
        >
          Complete la información para solicitar una cuenta de acceso.
        </Text>

        {/* ===================================
            NOMBRE
        =================================== */}

        <Text
          style={
            styles.label
          }
        >
          Nombre
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
            style={
              styles.input
            }
            placeholder="Ingrese su nombre"
            placeholderTextColor="#999999"
            value={
              nombre
            }
            onChangeText={
              setNombre
            }
            autoCapitalize="words"
          />
        </View>

        {/* ===================================
            CORREO
        =================================== */}

        <Text
          style={
            styles.label
          }
        >
          Correo electrónico
        </Text>

        <View
          style={
            styles.inputContainer
          }
        >
          <Ionicons
            name="mail-outline"
            size={20}
            color="#777777"
          />

          <TextInput
            style={
              styles.input
            }
            placeholder="Ingrese su correo electrónico"
            placeholderTextColor="#999999"
            value={
              correo
            }
            onChangeText={
              setCorreo
            }
            autoCapitalize="none"
            autoCorrect={
              false
            }
            keyboardType="email-address"
          />
        </View>

        {/* ===================================
            CONTRASEÑA
        =================================== */}

        <Text
          style={
            styles.label
          }
        >
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
            style={
              styles.input
            }
            placeholder="Ingrese una contraseña"
            placeholderTextColor="#999999"
            value={
              password
            }
            onChangeText={
              setPassword
            }
            secureTextEntry={
              !mostrarPassword
            }
            autoCapitalize="none"
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

        {/* ===================================
            CONFIRMAR CONTRASEÑA
        =================================== */}

        <Text
          style={
            styles.label
          }
        >
          Confirmar contraseña
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
            style={
              styles.input
            }
            placeholder="Repita la contraseña"
            placeholderTextColor="#999999"
            value={
              confirmarPassword
            }
            onChangeText={
              setConfirmarPassword
            }
            secureTextEntry={
              !mostrarConfirmacion
            }
            autoCapitalize="none"
          />

          <TouchableOpacity
            onPress={() =>
              setMostrarConfirmacion(
                !mostrarConfirmacion
              )
            }
          >
            <Ionicons
              name={
                mostrarConfirmacion
                  ? 'eye-off-outline'
                  : 'eye-outline'
              }
              size={21}
              color="#777777"
            />
          </TouchableOpacity>
        </View>

        {/* ===================================
            ROL
        =================================== */}

        <Text
          style={
            styles.label
          }
        >
          Rol solicitado
        </Text>

        <Text
          style={
            styles.descripcionRol
          }
        >
          Seleccione el tipo de acceso que necesita.
        </Text>

        <View
          style={
            styles.rolesContainer
          }
        >
          {roles.map(
            (item) => {
              const seleccionado =
                rol ===
                item.nombre;

              return (
                <TouchableOpacity
                  key={
                    item.nombre
                  }
                  style={[
                    styles.rolCard,

                    seleccionado &&
                      styles.rolSeleccionado,
                  ]}
                  onPress={() =>
                    setRol(
                      item.nombre
                    )
                  }
                  activeOpacity={
                    0.8
                  }
                >
                  <Ionicons
                    name={
                      item.icono
                    }
                    size={24}
                    color="#08752F"
                  />

                  <Text
                    style={[
                      styles.rolTexto,

                      seleccionado &&
                        styles.rolTextoSeleccionado,
                    ]}
                  >
                    {
                      item.nombre
                    }
                  </Text>

                  <Ionicons
                    name={
                      seleccionado
                        ? 'checkbox'
                        : 'square-outline'
                    }
                    size={23}
                    color="#08752F"
                  />
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {/* ===================================
            INFORMACIÓN
        =================================== */}

        <View
          style={
            styles.infoBox
          }
        >
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#1672B8"
          />

          <Text
            style={
              styles.infoTexto
            }
          >
            La cuenta no se activará inmediatamente. La solicitud deberá ser aprobada por un administrador.
          </Text>
        </View>

        {/* ===================================
            BOTÓN
        =================================== */}

        <TouchableOpacity
          style={
            styles.botonRegistrar
          }
          activeOpacity={
            0.85
          }
          onPress={
            enviarSolicitud
          }
        >
          <Ionicons
            name="send-outline"
            size={22}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.textoRegistrar
            }
          >
            Enviar solicitud
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default RegistroUsuarioScreen;

// ============================================
// ESTILOS
// ============================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#FFFFFF',
    },

    // HEADER

    header: {
      height: 105,
      backgroundColor:
        '#08752F',
      justifyContent:
        'flex-end',
      alignItems:
        'center',
      paddingBottom: 20,
    },

    regresar: {
      position:
        'absolute',
      left: 17,
      bottom: 11,
      width: 48,
      height: 48,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    tituloHeader: {
      color:
        '#FFFFFF',
      fontSize: 22,
      fontWeight:
        '700',
    },

    // CONTENIDO

    contenido: {
      paddingHorizontal: 23,
      paddingTop: 20,
      paddingBottom: 40,
    },

    // ICONO

    iconoPrincipal: {
      alignSelf:
        'center',
      width: 95,
      height: 95,
      borderRadius: 48,
      backgroundColor:
        '#E8F4EB',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    titulo: {
      textAlign:
        'center',
      fontSize: 23,
      fontWeight:
        '700',
      color:
        '#222222',
      marginTop: 12,
    },

    subtitulo: {
      textAlign:
        'center',
      fontSize: 12,
      color:
        '#777777',
      lineHeight: 18,
      marginTop: 5,
      marginBottom: 18,
    },

    // CAMPOS

    label: {
      fontSize: 13,
      fontWeight:
        '700',
      color:
        '#222222',
      marginTop: 12,
      marginBottom: 6,
    },

    inputContainer: {
      height: 50,
      borderWidth: 1,
      borderColor:
        '#DDDDDD',
      borderRadius: 9,
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 12,
    },

    input: {
      flex: 1,
      height: '100%',
      marginLeft: 8,
      fontSize: 14,
      color:
        '#222222',
    },

    // ROLES

    descripcionRol: {
      fontSize: 10,
      color:
        '#777777',
      marginBottom: 7,
    },

    rolesContainer: {
      gap: 7,
    },

    rolCard: {
      minHeight: 50,
      borderWidth: 1,
      borderColor:
        '#DFDFDF',
      borderRadius: 9,
      paddingHorizontal: 12,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    rolSeleccionado: {
      borderColor:
        '#87C99A',
      backgroundColor:
        '#F1F8F3',
    },

    rolTexto: {
      flex: 1,
      marginLeft: 10,
      fontSize: 12,
      fontWeight:
        '600',
      color:
        '#333333',
    },

    rolTextoSeleccionado: {
      color:
        '#08752F',
      fontWeight:
        '700',
    },

    // INFO

    infoBox: {
      minHeight: 65,
      marginTop: 18,
      backgroundColor:
        '#EFF7FD',
      borderWidth: 1,
      borderColor:
        '#C1DDEF',
      borderRadius: 9,
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 12,
    },

    infoTexto: {
      flex: 1,
      marginLeft: 9,
      fontSize: 10,
      color:
        '#42677F',
      lineHeight: 15,
    },

    // BOTÓN

    botonRegistrar: {
      height: 53,
      backgroundColor:
        '#08752F',
      borderRadius: 9,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 8,
      marginTop: 18,
    },

    textoRegistrar: {
      color:
        '#FFFFFF',
      fontSize: 15,
      fontWeight:
        '700',
    },
  });