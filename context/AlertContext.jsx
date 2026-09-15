import React, {
  createContext,
  useContext,
  useState,
} from 'react';

import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const AlertContext =
  createContext();

const CONFIG = {
  info: {
    color: '#1672B8',
    background: '#EFF7FD',
    icon: 'information-circle',
  },

  warning: {
    color: '#C87500',
    background: '#FFF6E3',
    icon: 'warning',
  },

  danger: {
    color: '#D93025',
    background: '#FDEDEC',
    icon: 'trash-outline',
  },

  success: {
    color: '#08752F',
    background: '#EAF6ED',
    icon: 'checkmark-circle',
  },

  question: {
    color: '#08752F',
    background: '#EAF6ED',
    icon: 'help-circle',
  },
};

export const AlertProvider = ({
  children,
}) => {
  const [
    visible,
    setVisible,
  ] = useState(false);

  const [
    alerta,
    setAlerta,
  ] = useState({
    titulo: '',
    mensaje: '',
    tipo: 'info',
    textoConfirmar: 'Aceptar',
    textoCancelar: 'Cancelar',
    mostrarCancelar: false,
    onConfirmar: null,
    onCancelar: null,
  });

  // ==========================================
  // MOSTRAR ALERTA
  // ==========================================

  const mostrarAlert = ({
    titulo,
    mensaje,
    tipo = 'info',

    textoConfirmar =
      'Aceptar',

    textoCancelar =
      'Cancelar',

    mostrarCancelar =
      false,

    onConfirmar =
      null,

    onCancelar =
      null,
  }) => {
    setAlerta({
      titulo,
      mensaje,
      tipo,
      textoConfirmar,
      textoCancelar,
      mostrarCancelar,
      onConfirmar,
      onCancelar,
    });

    setVisible(
      true
    );
  };

  // ==========================================
  // CERRAR
  // ==========================================

  const cerrarAlert =
    () => {
      setVisible(
        false
      );
    };

  // ==========================================
  // CONFIRMAR
  // ==========================================

  const confirmar =
    () => {
      const funcion =
        alerta.onConfirmar;

      cerrarAlert();

      if (
        typeof funcion ===
        'function'
      ) {
        setTimeout(
          () => {
            funcion();
          },
          150
        );
      }
    };

  // ==========================================
  // CANCELAR
  // ==========================================

  const cancelar =
    () => {
      const funcion =
        alerta.onCancelar;

      cerrarAlert();

      if (
        typeof funcion ===
        'function'
      ) {
        setTimeout(
          () => {
            funcion();
          },
          150
        );
      }
    };

  const config =
    CONFIG[
      alerta.tipo
    ] ||
    CONFIG.info;

  return (
    <AlertContext.Provider
      value={{
        mostrarAlert,
        cerrarAlert,
      }}
    >
      {children}

      <Modal
        visible={
          visible
        }
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={
          alerta.mostrarCancelar
            ? cancelar
            : cerrarAlert
        }
      >
        <TouchableWithoutFeedback
          onPress={
            alerta.mostrarCancelar
              ? undefined
              : cerrarAlert
          }
        >
          <View
            style={
              styles.fondo
            }
          >
            <TouchableWithoutFeedback>
              <View
                style={
                  styles.tarjeta
                }
              >
                {/* ICONO */}

                <View
                  style={[
                    styles.iconoContainer,

                    {
                      backgroundColor:
                        config.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      config.icon
                    }
                    size={38}
                    color={
                      config.color
                    }
                  />
                </View>

                {/* TÍTULO */}

                <Text
                  style={
                    styles.titulo
                  }
                >
                  {
                    alerta.titulo
                  }
                </Text>

                {/* MENSAJE */}

                <Text
                  style={
                    styles.mensaje
                  }
                >
                  {
                    alerta.mensaje
                  }
                </Text>

                {/* BOTONES */}

                <View
                  style={[
                    styles.botonesContainer,

                    !alerta.mostrarCancelar &&
                      styles.botonUnicoContainer,
                  ]}
                >
                  {alerta.mostrarCancelar && (
                    <TouchableOpacity
                      style={
                        styles.botonCancelar
                      }
                      activeOpacity={
                        0.8
                      }
                      onPress={
                        cancelar
                      }
                    >
                      <Text
                        style={
                          styles.textoCancelar
                        }
                      >
                        {
                          alerta.textoCancelar
                        }
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.botonConfirmar,

                      {
                        backgroundColor:
                          config.color,
                      },

                      !alerta.mostrarCancelar &&
                        styles.botonUnico,
                    ]}
                    activeOpacity={
                      0.85
                    }
                    onPress={
                      confirmar
                    }
                  >
                    <Text
                      style={
                        styles.textoConfirmar
                      }
                    >
                      {
                        alerta.textoConfirmar
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAlert = () =>
  useContext(
    AlertContext
  );

// ============================================
// ESTILOS
// ============================================

const styles =
  StyleSheet.create({
    fondo: {
      flex: 1,

      backgroundColor:
        'rgba(0, 0, 0, 0.48)',

      justifyContent:
        'center',

      alignItems:
        'center',

      paddingHorizontal:
        26,
    },

    tarjeta: {
      width:
        '100%',

      maxWidth:
        390,

      backgroundColor:
        '#FFFFFF',

      borderRadius:
        22,

      paddingHorizontal:
        22,

      paddingTop:
        25,

      paddingBottom:
        20,

      alignItems:
        'center',

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 7,
      },

      shadowOpacity:
        0.18,

      shadowRadius:
        12,

      elevation:
        12,
    },

    iconoContainer: {
      width:
        72,

      height:
        72,

      borderRadius:
        36,

      justifyContent:
        'center',

      alignItems:
        'center',

      marginBottom:
        15,
    },

    titulo: {
      fontSize:
        20,

      fontWeight:
        '800',

      color:
        '#222222',

      textAlign:
        'center',

      marginBottom:
        8,
    },

    mensaje: {
      fontSize:
        13,

      lineHeight:
        20,

      color:
        '#666666',

      textAlign:
        'center',

      paddingHorizontal:
        4,
    },

    botonesContainer: {
      width:
        '100%',

      flexDirection:
        'row',

      gap:
        10,

      marginTop:
        24,
    },

    botonUnicoContainer: {
      justifyContent:
        'center',
    },

    botonCancelar: {
      flex: 1,

      height:
        48,

      borderRadius:
        11,

      backgroundColor:
        '#F1F2F3',

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    botonConfirmar: {
      flex: 1,

      height:
        48,

      borderRadius:
        11,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    botonUnico: {
      maxWidth:
        190,
    },

    textoCancelar: {
      color:
        '#444444',

      fontSize:
        13,

      fontWeight:
        '700',
    },

    textoConfirmar: {
      color:
        '#FFFFFF',

      fontSize:
        13,

      fontWeight:
        '800',
    },
  });