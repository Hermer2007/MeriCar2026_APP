import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const ToastContext =
  createContext();

const ANCHO_PANTALLA =
  Dimensions.get('window').width;

const LIMITE_DESLIZAMIENTO =
  ANCHO_PANTALLA * 0.2;

const CONFIG = {
  success: {
    color: '#08752F',
    background: '#EFF8F1',
    border: '#B7DCBF',
    icon: 'checkmark-circle',
    duration: 3000,
  },

  error: {
    color: '#D71920',
    background: '#FFF1F1',
    border: '#F0B7B9',
    icon: 'close-circle',
    duration: 4000,
  },

  warning: {
    color: '#C87500',
    background: '#FFF8E8',
    border: '#F1D59A',
    icon: 'warning',
    duration: 3500,
  },

  info: {
    color: '#1672B8',
    background: '#EFF7FD',
    border: '#B8D9EF',
    icon: 'information-circle',
    duration: 3200,
  },
};

export const ToastProvider = ({
  children,
}) => {
  const [
    toastActual,
    setToastActual,
  ] = useState(null);

  // ==========================================
  // ANIMACIONES
  // ==========================================

  const translateY =
    useRef(
      new Animated.Value(-130)
    ).current;

  const translateX =
    useRef(
      new Animated.Value(0)
    ).current;

  const opacity =
    useRef(
      new Animated.Value(1)
    ).current;

  // ==========================================
  // REFERENCIAS
  // ==========================================

  const temporizadorRef =
    useRef(null);

  const toastActivoRef =
    useRef(false);

  const duracionActualRef =
    useRef(3000);

  const ultimoMensajeRef =
    useRef('');

  const ultimoMensajeTiempoRef =
    useRef(0);

  const cerrandoRef =
    useRef(false);

  // ==========================================
  // LIMPIAR TEMPORIZADOR
  // ==========================================

  const limpiarTemporizador =
    useCallback(() => {
      if (
        temporizadorRef.current
      ) {
        clearTimeout(
          temporizadorRef.current
        );

        temporizadorRef.current =
          null;
      }
    }, []);

  // ==========================================
  // FINALIZAR CIERRE
  // ==========================================

  const finalizarCierre =
    useCallback(() => {
      setToastActual(
        null
      );

      toastActivoRef.current =
        false;

      cerrandoRef.current =
        false;

      translateX.setValue(
        0
      );

      translateY.setValue(
        -130
      );

      opacity.setValue(
        1
      );
    }, [
      translateX,
      translateY,
      opacity,
    ]);

  // ==========================================
  // CERRAR TOAST
  // ==========================================

  const cerrarToast =
    useCallback(
      (
        direccion = null
      ) => {
        if (
          !toastActivoRef.current ||
          cerrandoRef.current
        ) {
          return;
        }

        cerrandoRef.current =
          true;

        limpiarTemporizador();

        // ======================================
        // CIERRE POR DESLIZAMIENTO
        // ======================================

        if (direccion) {
          const destino =
            direccion ===
            'derecha'
              ? ANCHO_PANTALLA +
                80
              : -ANCHO_PANTALLA -
                80;

          Animated.parallel([
            Animated.timing(
              translateX,
              {
                toValue:
                  destino,

                duration: 230,

                useNativeDriver:
                  true,
              }
            ),

            Animated.timing(
              opacity,
              {
                toValue: 0,

                duration: 180,

                useNativeDriver:
                  true,
              }
            ),
          ]).start(
            finalizarCierre
          );

          return;
        }

        // ======================================
        // CIERRE AUTOMÁTICO
        // ======================================

        Animated.parallel([
          Animated.timing(
            translateY,
            {
              toValue: -130,

              duration: 220,

              useNativeDriver:
                true,
            }
          ),

          Animated.timing(
            opacity,
            {
              toValue: 0,

              duration: 180,

              useNativeDriver:
                true,
            }
          ),
        ]).start(
          finalizarCierre
        );
      },
      [
        finalizarCierre,
        limpiarTemporizador,
        opacity,
        translateX,
        translateY,
      ]
    );

  // ==========================================
  // REINICIAR TEMPORIZADOR
  // ==========================================

  const reiniciarTemporizador =
    useCallback(() => {
      limpiarTemporizador();

      if (
        !toastActivoRef.current
      ) {
        return;
      }

      temporizadorRef.current =
        setTimeout(
          () => {
            cerrarToast();
          },
          duracionActualRef.current
        );
    }, [
      cerrarToast,
      limpiarTemporizador,
    ]);

  // ==========================================
  // MOSTRAR TOAST
  // ==========================================

  const mostrarToast =
    useCallback(
      (
        mensaje,
        tipo = 'info',
        duracionPersonalizada = null
      ) => {
        const ahora =
          Date.now();

        // ======================================
        // EVITAR REPETICIONES
        // ======================================

        if (
          ultimoMensajeRef.current ===
            mensaje &&
          ahora -
            ultimoMensajeTiempoRef.current <
            1500
        ) {
          return;
        }

        ultimoMensajeRef.current =
          mensaje;

        ultimoMensajeTiempoRef.current =
          ahora;

        const duracion =
          duracionPersonalizada ??
          CONFIG[tipo]
            ?.duration ??
          3500;

        duracionActualRef.current =
          duracion;

        limpiarTemporizador();

        cerrandoRef.current =
          false;

        toastActivoRef.current =
          true;

        translateX.setValue(
          0
        );

        translateY.setValue(
          -130
        );

        opacity.setValue(
          1
        );

        setToastActual({
          id:
            Date.now().toString(),

          mensaje,

          tipo,

          duracion,
        });
      },
      [
        limpiarTemporizador,
        opacity,
        translateX,
        translateY,
      ]
    );

  // ==========================================
  // APARECER TOAST
  // ==========================================

  useEffect(() => {
    if (!toastActual) {
      return;
    }

    toastActivoRef.current =
      true;

    duracionActualRef.current =
      toastActual.duracion;

    translateX.setValue(
      0
    );

    translateY.setValue(
      -130
    );

    opacity.setValue(
      1
    );

    Animated.spring(
      translateY,
      {
        toValue: 0,

        useNativeDriver:
          true,

        friction: 8,

        tension: 70,
      }
    ).start();

    reiniciarTemporizador();

    return () => {
      limpiarTemporizador();
    };
  }, [
    toastActual,
    limpiarTemporizador,
    reiniciarTemporizador,
    translateX,
    translateY,
    opacity,
  ]);

  // ==========================================
  // DESLIZAMIENTO
  // ==========================================

  const panResponder =
    useRef(
      PanResponder.create({
        // --------------------------------------
        // DETECTAR MOVIMIENTO HORIZONTAL
        // --------------------------------------

        onMoveShouldSetPanResponder:
          (
            event,
            gesture
          ) => {
            const horizontal =
              Math.abs(
                gesture.dx
              );

            const vertical =
              Math.abs(
                gesture.dy
              );

            return (
              horizontal >
                5 &&
              horizontal >
                vertical
            );
          },

        // --------------------------------------
        // COMIENZA DESLIZAMIENTO
        // --------------------------------------

        onPanResponderGrant:
          () => {
            limpiarTemporizador();
          },

        // --------------------------------------
        // MOVIMIENTO
        // --------------------------------------

        onPanResponderMove:
          (
            event,
            gesture
          ) => {
            translateX.setValue(
              gesture.dx
            );

            const distancia =
              Math.min(
                Math.abs(
                  gesture.dx
                ),
                ANCHO_PANTALLA
              );

            const nuevaOpacidad =
              1 -
              distancia /
                ANCHO_PANTALLA;

            opacity.setValue(
              Math.max(
                0.3,
                nuevaOpacidad
              )
            );
          },

        // --------------------------------------
        // SOLTAR
        // --------------------------------------

        onPanResponderRelease:
          (
            event,
            gesture
          ) => {
            // DERECHA

            if (
              gesture.dx >
              LIMITE_DESLIZAMIENTO
            ) {
              cerrarToast(
                'derecha'
              );

              return;
            }

            // IZQUIERDA

            if (
              gesture.dx <
              -LIMITE_DESLIZAMIENTO
            ) {
              cerrarToast(
                'izquierda'
              );

              return;
            }

            // NO LLEGÓ AL LÍMITE
            // REGRESA A SU POSICIÓN

            Animated.parallel([
              Animated.spring(
                translateX,
                {
                  toValue: 0,

                  useNativeDriver:
                    true,

                  friction: 7,

                  tension: 70,
                }
              ),

              Animated.timing(
                opacity,
                {
                  toValue: 1,

                  duration: 150,

                  useNativeDriver:
                    true,
                }
              ),
            ]).start(
              () => {
                reiniciarTemporizador();
              }
            );
          },

        // --------------------------------------
        // GESTO CANCELADO
        // --------------------------------------

        onPanResponderTerminate:
          () => {
            Animated.parallel([
              Animated.spring(
                translateX,
                {
                  toValue: 0,

                  useNativeDriver:
                    true,

                  friction: 7,
                }
              ),

              Animated.timing(
                opacity,
                {
                  toValue: 1,

                  duration: 150,

                  useNativeDriver:
                    true,
                }
              ),
            ]).start(
              () => {
                reiniciarTemporizador();
              }
            );
          },
      })
    ).current;

  // ==========================================
  // CONFIGURACIÓN VISUAL
  // ==========================================

  const configActual =
    CONFIG[
      toastActual?.tipo
    ] ||
    CONFIG.info;

  return (
    <ToastContext.Provider
      value={{
        mostrarToast,
        cerrarToast,
      }}
    >
      {children}

      {toastActual && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.toastWrapper,

            {
              opacity,

              transform: [
                {
                  translateY,
                },

                {
                  translateX,
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.toast,

              {
                backgroundColor:
                  configActual.background,

                borderColor:
                  configActual.border,
              },
            ]}
          >
            {/* ICONO */}

            <View
              style={[
                styles.iconoContainer,

                {
                  backgroundColor:
                    `${configActual.color}15`,
                },
              ]}
            >
              <Ionicons
                name={
                  configActual.icon
                }
                size={25}
                color={
                  configActual.color
                }
              />
            </View>

            {/* TEXTO */}

            <View
              style={
                styles.textoContainer
              }
            >
              <Text
                style={[
                  styles.mensaje,

                  {
                    color:
                      configActual.color,
                  },
                ]}
              >
                {
                  toastActual.mensaje
                }
              </Text>

              <View
                style={
                  styles.deslizarContainer
                }
              >
                <Ionicons
                  name="swap-horizontal-outline"
                  size={13}
                  color="#999999"
                />

                <Text
                  style={
                    styles.deslizarTexto
                  }
                >
                  Deslice para cerrar
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () =>
  useContext(
    ToastContext
  );

// ============================================
// ESTILOS
// ============================================

const styles =
  StyleSheet.create({
    toastWrapper: {
      position:
        'absolute',

      top: 48,

      left: 16,
      right: 16,

      zIndex: 9999,

      elevation: 20,
    },

    toast: {
      minHeight: 70,

      borderWidth: 1,

      borderRadius: 16,

      paddingHorizontal: 13,
      paddingVertical: 11,

      flexDirection:
        'row',

      alignItems:
        'center',

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.14,

      shadowRadius: 8,

      elevation: 8,
    },

    iconoContainer: {
      width: 43,
      height: 43,

      borderRadius: 22,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    textoContainer: {
      flex: 1,

      marginLeft: 11,
    },

    mensaje: {
      fontSize: 13,

      fontWeight:
        '700',

      lineHeight: 18,
    },

    deslizarContainer: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginTop: 4,
    },

    deslizarTexto: {
      marginLeft: 3,

      color:
        '#888888',

      fontSize: 9,

      fontWeight:
        '500',
    },
  });