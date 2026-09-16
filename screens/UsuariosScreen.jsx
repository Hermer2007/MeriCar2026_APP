import React, {
  useEffect,
  useState,
} from 'react';

import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useUsuarios } from '../context/UsuariosContext';
import { useToast } from '../context/ToastContext';
import { useAlert } from '../context/AlertContext';

export default function UsuariosScreen({
  navigation,
}) {
  const {
    usuarios,
    solicitudes,
    usuarioActual,

    aprobarSolicitud,
    rechazarSolicitud,

    cambiarEstadoUsuario,

    atenderRestablecimiento,
    aprobarHabilitacion,
    rechazarHabilitacion,

    marcarNotificacionesUsuariosLeidas,
  } = useUsuarios();

  const {
    mostrarToast,
  } = useToast();

  const {
    mostrarAlert,
  } = useAlert();

  const [
    usuarioSeleccionado,
    setUsuarioSeleccionado,
  ] = useState(null);

  const [
    modalVisible,
    setModalVisible,
  ] = useState(false);

  const [
    mostrarUsuariosActivos,
    setMostrarUsuariosActivos,
  ] = useState(true);

  const [
    mostrarUsuariosInhabilitados,
    setMostrarUsuariosInhabilitados,
  ] = useState(false);

  // ==========================================
  // MARCAR NOTIFICACIONES COMO VISTAS
  // ==========================================

  useEffect(() => {
    marcarNotificacionesUsuariosLeidas();
  }, []);

  // ==========================================
  // SOLICITUDES PENDIENTES
  // ==========================================

  const solicitudesPendientes =
    solicitudes.filter(
      (solicitud) =>
        solicitud.estado ===
        'PENDIENTE'
    );

  // ==========================================
  // USUARIOS POR ESTADO
  // ==========================================

  const usuariosActivos =
    usuarios.filter(
      (usuario) =>
        usuario.estado ===
        'ACTIVO'
    );

  const usuariosInhabilitados =
    usuarios.filter(
      (usuario) =>
        usuario.estado ===
        'INHABILITADO'
    );

  const restablecimientosPendientes =
    usuarios.filter(
      (usuario) =>
        usuario.solicitaRestablecimiento ===
        true
    ).length;

  const habilitacionesPendientes =
    usuarios.filter(
      (usuario) =>
        usuario.estado === 'INHABILITADO' &&
        usuario.solicitaHabilitacion === true
    ).length;

  const totalSolicitudes =
    solicitudesPendientes.length +
    habilitacionesPendientes;

  // ==========================================
  // APROBAR
  // ==========================================

  const aprobar = (
    solicitud
  ) => {
    mostrarAlert({
      titulo:
        'Aprobar solicitud',

      mensaje:
        `¿Desea aprobar la cuenta de ${solicitud.nombre}?`,

      tipo:
        'question',

      mostrarCancelar:
        true,

      textoCancelar:
        'Cancelar',

      textoConfirmar:
        'Aprobar',

      onConfirmar: async () => {
        const resultado =
          await aprobarSolicitud(
            solicitud.id
          );

        if (!resultado) {
          mostrarToast(
            'No se pudo aprobar la solicitud.',
            'error'
          );

          return;
        }

        mostrarToast(
          'Usuario aprobado correctamente.',
          'success'
        );
      },
    });
  };

  // ==========================================
  // RECHAZAR
  // ==========================================

  const rechazar = (
    solicitud
  ) => {
    mostrarAlert({
      titulo:
        'Rechazar solicitud',

      mensaje:
        `¿Desea rechazar la solicitud de ${solicitud.nombre}?`,

      tipo:
        'warning',

      mostrarCancelar:
        true,

      textoCancelar:
        'Cancelar',

      textoConfirmar:
        'Rechazar',

      onConfirmar: async () => {
        const resultado =
          await rechazarSolicitud(
            solicitud.id
          );

        if (!resultado) {
          mostrarToast(
            'No se pudo rechazar la solicitud.',
            'error'
          );

          return;
        }

        mostrarToast(
          'Solicitud rechazada.',
          'success'
        );
      },
    });
  };

  // ==========================================
  // ABRIR OPCIONES
  // ==========================================

  const abrirOpciones = (
    usuario
  ) => {
    setUsuarioSeleccionado(
      usuario
    );

    setModalVisible(
      true
    );
  };

  const cerrarOpciones =
    () => {
      setModalVisible(
        false
      );

      setUsuarioSeleccionado(
        null
      );
    };

  // ==========================================
  // RESTABLECER CONTRASEÑA
  // ==========================================

  const restablecerPassword =
    () => {
      if (
        !usuarioSeleccionado
      ) {
        return;
      }

      const usuario =
        usuarioSeleccionado;

      if (
        usuario.estado !==
        'ACTIVO'
      ) {
        cerrarOpciones();

        mostrarToast(
          'El usuario debe estar activo para restablecer su contraseña.',
          'warning'
        );

        return;
      }

      if (
        usuario.solicitaRestablecimiento !==
        true
      ) {
        cerrarOpciones();

        mostrarToast(
          'Este usuario no tiene una solicitud de recuperación pendiente.',
          'warning'
        );

        return;
      }

      setModalVisible(
        false
      );

      mostrarAlert({
        titulo:
          'Restablecer contraseña',

        mensaje:
          `¿Desea autorizar el restablecimiento de contraseña de ${usuario.nombre}? Se enviará un correo a ${usuario.correo}.`,

        tipo:
          'question',

        mostrarCancelar:
          true,

        textoCancelar:
          'Cancelar',

        textoConfirmar:
          'Enviar correo',

        onConfirmar: async () => {
          const resultado =
            await atenderRestablecimiento(
              usuario.id
            );

          if (!resultado) {
            setUsuarioSeleccionado(
              null
            );

            mostrarToast(
              'No se pudo enviar el correo de restablecimiento.',
              'error'
            );

            return;
          }

          setUsuarioSeleccionado(
            null
          );

          mostrarToast(
            'Correo de restablecimiento enviado correctamente.',
            'success'
          );
        },

        onCancelar: () => {
          setUsuarioSeleccionado(
            null
          );
        },
      });
    };

  // ==========================================
  // CAMBIAR ESTADO
  // ==========================================

  const cambiarEstado =
    () => {
      if (
        !usuarioSeleccionado
      ) {
        return;
      }

      if (
        String(
          usuarioSeleccionado.id
        ) ===
        String(
          usuarioActual?.id
        )
      ) {
        cerrarOpciones();

        mostrarToast(
          'No puede inhabilitar su propia cuenta mientras está conectado.',
          'warning'
        );

        return;
      }

      const usuario =
        usuarioSeleccionado;

      const estaActivo =
        usuario.estado ===
        'ACTIVO';

      setModalVisible(
        false
      );

      mostrarAlert({
        titulo:
          estaActivo
            ? 'Inhabilitar usuario'
            : 'Habilitar usuario',

        mensaje:
          estaActivo
            ? `¿Está seguro de que desea inhabilitar a ${usuario.nombre}?`
            : `¿Está seguro de que desea habilitar a ${usuario.nombre}?`,

        tipo:
          estaActivo
            ? 'warning'
            : 'question',

        mostrarCancelar:
          true,

        textoCancelar:
          'Cancelar',

        textoConfirmar:
          estaActivo
            ? 'Inhabilitar'
            : 'Habilitar',

        onConfirmar: async () => {
          const resultado =
            await cambiarEstadoUsuario(
              usuario.id
            );

          if (!resultado) {
            setUsuarioSeleccionado(
              null
            );

            mostrarToast(
              'No se pudo cambiar el estado del usuario.',
              'error'
            );

            return;
          }

          setUsuarioSeleccionado(
            null
          );

          mostrarToast(
            estaActivo
              ? 'Usuario inhabilitado.'
              : 'Usuario habilitado.',
            'success'
          );
        },

        onCancelar: () => {
          setUsuarioSeleccionado(
            null
          );
        },
      });
    };

  // ==========================================
  // SOLICITUD DE HABILITACIÓN
  // ==========================================

  const habilitarSolicitud = (usuario) => {
    setModalVisible(false);

    mostrarAlert({
      titulo: 'Habilitar usuario',
      mensaje:
        `¿Desea aprobar la solicitud de habilitación de ${usuario.nombre}?`,
      tipo: 'question',
      mostrarCancelar: true,
      textoCancelar: 'Cancelar',
      textoConfirmar: 'Habilitar',

      onConfirmar: async () => {
        const resultado =
          await aprobarHabilitacion(usuario.id);

        setUsuarioSeleccionado(null);

        if (!resultado) {
          mostrarToast(
            'No se pudo habilitar al usuario.',
            'error'
          );
          return;
        }

        mostrarToast(
          'Usuario habilitado correctamente.',
          'success'
        );
      },

      onCancelar: () => {
        setUsuarioSeleccionado(null);
      },
    });
  };

  const rechazarSolicitudHabilitacion =
    (usuario) => {
      setModalVisible(false);

      mostrarAlert({
        titulo: 'Rechazar habilitación',
        mensaje:
          `¿Desea rechazar la solicitud de habilitación de ${usuario.nombre}? La cuenta continuará inhabilitada.`,
        tipo: 'warning',
        mostrarCancelar: true,
        textoCancelar: 'Cancelar',
        textoConfirmar: 'Rechazar',

        onConfirmar: async () => {
          const resultado =
            await rechazarHabilitacion(usuario.id);

          setUsuarioSeleccionado(null);

          if (!resultado) {
            mostrarToast(
              'No se pudo rechazar la solicitud.',
              'error'
            );
            return;
          }

          mostrarToast(
            'Solicitud de habilitación rechazada.',
            'success'
          );
        },

        onCancelar: () => {
          setUsuarioSeleccionado(null);
        },
      });
    };

  // ==========================================
  // NOMBRE ROL
  // ==========================================

  const obtenerRol = (
    rol
  ) => {
    if (
      rol ===
      'ADMINISTRADOR'
    ) {
      return 'Administrador';
    }

    if (
      rol ===
      'EMPLEADO'
    ) {
      return 'Empleado';
    }

    if (
      rol ===
      'CONTADOR'
    ) {
      return 'Contador';
    }

    return rol;
  };

  // ==========================================
  // TARJETA USUARIO ACTIVO
  // ==========================================

  const renderUsuarioActivo = (
    usuario
  ) => {
    const esActual =
      String(usuario.id) ===
      String(usuarioActual?.id);

    return (
      <View
        key={usuario.id}
        style={[
          styles.usuarioCard,
          styles.usuarioCardActivo,
        ]}
      >
        <View
          style={[
            styles.avatarUsuario,
            styles.avatarUsuarioActivo,
          ]}
        >
          <Ionicons
            name="person"
            size={25}
            color="#08752F"
          />
        </View>

        <View
          style={
            styles.usuarioInfo
          }
        >
          <View
            style={
              styles.nombreFila
            }
          >
            <Text
              style={
                styles.nombreUsuario
              }
            >
              {usuario.nombre}
            </Text>

            {esActual && (
              <View
                style={
                  styles.badgeTu
                }
              >
                <Text
                  style={
                    styles.badgeTuTexto
                  }
                >
                  Tú
                </Text>
              </View>
            )}
          </View>

          <Text
            style={
              styles.correoUsuario
            }
          >
            {usuario.correo}
          </Text>

          <View
            style={
              styles.filaEtiquetas
            }
          >
            <View
              style={
                styles.badgeRol
              }
            >
              <Text
                style={
                  styles.badgeRolTexto
                }
              >
                {obtenerRol(
                  usuario.rol
                )}
              </Text>
            </View>

            <View
              style={
                styles.badgeActivo
              }
            >
              <Ionicons
                name="checkmark-circle"
                size={11}
                color="#08752F"
              />

              <Text
                style={
                  styles.badgeActivoTexto
                }
              >
                ACTIVO
              </Text>
            </View>
          </View>

          {usuario.solicitaRestablecimiento && (
            <View
              style={
                styles.alertaRecuperacion
              }
            >
              <Ionicons
                name="warning-outline"
                size={18}
                color="#B06C00"
              />

              <View
                style={
                  styles.alertaContenido
                }
              >
                <Text
                  style={
                    styles.alertaTexto
                  }
                >
                  Solicita restablecer contraseña
                </Text>

                {usuario.notaRestablecimiento ? (
                  <Text
                    style={
                      styles.alertaNota
                    }
                  >
                    Nota: {usuario.notaRestablecimiento}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={
            styles.botonOpciones
          }
          onPress={() =>
            abrirOpciones(
              usuario
            )
          }
        >
          <Ionicons
            name="ellipsis-vertical"
            size={23}
            color="#555555"
          />
        </TouchableOpacity>
      </View>
    );
  };

  // ==========================================
  // TARJETA USUARIO INHABILITADO
  // ==========================================

  const renderUsuarioInhabilitado = (
    usuario
  ) => {
    const solicitaHabilitacion =
      usuario.solicitaHabilitacion === true;

    return (
      <View
        key={usuario.id}
        style={[
          styles.usuarioCard,
          styles.usuarioCardInhabilitado,
          solicitaHabilitacion &&
            styles.usuarioCardSolicitaHabilitacion,
        ]}
      >
        <View
          style={[
            styles.avatarUsuario,
            styles.avatarUsuarioInhabilitado,
          ]}
        >
          <Ionicons
            name="person-outline"
            size={25}
            color="#777777"
          />
        </View>

        <View
          style={
            styles.usuarioInfo
          }
        >
          <Text
            style={
              styles.nombreUsuarioInhabilitado
            }
          >
            {usuario.nombre}
          </Text>

          <Text
            style={
              styles.correoUsuarioInhabilitado
            }
          >
            {usuario.correo}
          </Text>

          <View
            style={
              styles.filaEtiquetas
            }
          >
            <View
              style={
                styles.badgeRolGris
              }
            >
              <Text
                style={
                  styles.badgeRolGrisTexto
                }
              >
                {obtenerRol(
                  usuario.rol
                )}
              </Text>
            </View>

            <View
              style={
                styles.badgeInhabilitado
              }
            >
              <Ionicons
                name="ban-outline"
                size={11}
                color="#666666"
              />

              <Text
                style={
                  styles.badgeInhabilitadoTexto
                }
              >
                INHABILITADO
              </Text>
            </View>
          </View>

          {solicitaHabilitacion && (
            <View style={styles.alertaHabilitacion}>
              <Ionicons
                name="alert-circle-outline"
                size={19}
                color="#B06C00"
              />

              <View style={styles.alertaContenido}>
                <Text style={styles.alertaHabilitacionTitulo}>
                  Solicita habilitación de cuenta
                </Text>

                {usuario.notaHabilitacion ? (
                  <Text style={styles.alertaNota}>
                    Motivo: {usuario.notaHabilitacion}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={
            styles.botonOpciones
          }
          onPress={() =>
            abrirOpciones(
              usuario
            )
          }
        >
          <Ionicons
            name="ellipsis-vertical"
            size={23}
            color="#777777"
          />
        </TouchableOpacity>
      </View>
    );
  };

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

      {/* HEADER */}

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
          Usuarios
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.contenido
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* RESUMEN */}

        <View
          style={
            styles.resumenContainer
          }
        >
          <View
            style={
              styles.resumenCard
            }
          >
            <View
              style={
                styles.resumenIcono
              }
            >
              <Ionicons
                name="time-outline"
                size={24}
                color="#D98B00"
              />
            </View>

            <Text
              style={
                styles.resumenNumero
              }
            >
              {
                totalSolicitudes
              }
            </Text>

            <Text
              style={
                styles.resumenTexto
              }
            >
              Solicitudes
            </Text>
          </View>

          <View
            style={
              styles.resumenCard
            }
          >
            <View
              style={
                styles.resumenIconoVerde
              }
            >
              <Ionicons
                name="people-outline"
                size={24}
                color="#08752F"
              />
            </View>

            <Text
              style={
                styles.resumenNumero
              }
            >
              {
                usuariosActivos.length
              }
            </Text>

            <Text
              style={
                styles.resumenTexto
              }
            >
              Activos
            </Text>
          </View>

          <View
            style={
              styles.resumenCard
            }
          >
            <View
              style={
                styles.resumenIconoRojo
              }
            >
              <Ionicons
                name="key-outline"
                size={24}
                color="#D93025"
              />
            </View>

            <Text
              style={
                styles.resumenNumero
              }
            >
              {
                restablecimientosPendientes
              }
            </Text>

            <Text
              style={
                styles.resumenTexto
              }
            >
              Recuperación
            </Text>
          </View>
        </View>

        {/* SOLICITUDES */}

        <Text
          style={
            styles.tituloSeccion
          }
        >
          Solicitudes pendientes
        </Text>

        {solicitudesPendientes.length ===
        0 ? (
          <View
            style={
              styles.vacio
            }
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={34}
              color="#9A9A9A"
            />

            <Text
              style={
                styles.vacioTexto
              }
            >
              No hay solicitudes pendientes.
            </Text>
          </View>
        ) : (
          solicitudesPendientes.map(
            (solicitud) => (
              <View
                key={
                  solicitud.id
                }
                style={
                  styles.solicitudCard
                }
              >
                <View
                  style={
                    styles.avatarSolicitud
                  }
                >
                  <Ionicons
                    name="person-add-outline"
                    size={26}
                    color="#08752F"
                  />
                </View>

                <View
                  style={
                    styles.solicitudInfo
                  }
                >
                  <Text
                    style={
                      styles.nombreSolicitud
                    }
                  >
                    {
                      solicitud.nombre
                    }
                  </Text>

                  <Text
                    style={
                      styles.correoSolicitud
                    }
                  >
                    {
                      solicitud.correo
                    }
                  </Text>

                  <View
                    style={
                      styles.filaEtiquetas
                    }
                  >
                    <View
                      style={
                        styles.badgeRol
                      }
                    >
                      <Text
                        style={
                          styles.badgeRolTexto
                        }
                      >
                        {obtenerRol(
                          solicitud.rol
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.badgePendiente
                      }
                    >
                      <Text
                        style={
                          styles.badgePendienteTexto
                        }
                      >
                        PENDIENTE
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={
                    styles.botonesSolicitud
                  }
                >
                  <TouchableOpacity
                    style={
                      styles.botonRechazar
                    }
                    onPress={() =>
                      rechazar(
                        solicitud
                      )
                    }
                  >
                    <Ionicons
                      name="close"
                      size={21}
                      color="#D93025"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={
                      styles.botonAprobar
                    }
                    onPress={() =>
                      aprobar(
                        solicitud
                      )
                    }
                  >
                    <Ionicons
                      name="checkmark"
                      size={21}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )
          )
        )}

        {/* USUARIOS ACTIVOS */}

        <TouchableOpacity
          style={
            styles.encabezadoDesplegable
          }
          activeOpacity={0.7}
          onPress={() =>
            setMostrarUsuariosActivos(
              !mostrarUsuariosActivos
            )
          }
        >
          <View
            style={
              styles.encabezadoIzquierda
            }
          >
            <View
              style={
                styles.iconoSeccionActivo
              }
            >
              <Ionicons
                name="people-outline"
                size={20}
                color="#08752F"
              />
            </View>

            <View>
              <Text
                style={
                  styles.tituloDesplegable
                }
              >
                Usuarios registrados
              </Text>

              <Text
                style={
                  styles.subtituloDesplegable
                }
              >
                {usuariosActivos.length}{' '}
                {usuariosActivos.length === 1
                  ? 'usuario activo'
                  : 'usuarios activos'}
              </Text>
            </View>
          </View>

          <Ionicons
            name={
              mostrarUsuariosActivos
                ? 'chevron-up'
                : 'chevron-down'
            }
            size={22}
            color="#555555"
          />
        </TouchableOpacity>

        {mostrarUsuariosActivos && (
          <View
            style={
              styles.contenidoDesplegable
            }
          >
            {usuariosActivos.length ===
            0 ? (
              <View
                style={
                  styles.vacioPequeno
                }
              >
                <Text
                  style={
                    styles.vacioTexto
                  }
                >
                  No hay usuarios activos.
                </Text>
              </View>
            ) : (
              usuariosActivos.map(
                renderUsuarioActivo
              )
            )}
          </View>
        )}

        {/* USUARIOS INHABILITADOS */}

        <TouchableOpacity
          style={[
            styles.encabezadoDesplegable,
            styles.encabezadoInhabilitados,
          ]}
          activeOpacity={0.7}
          onPress={() =>
            setMostrarUsuariosInhabilitados(
              !mostrarUsuariosInhabilitados
            )
          }
        >
          <View
            style={
              styles.encabezadoIzquierda
            }
          >
            <View
              style={
                styles.iconoSeccionInhabilitado
              }
            >
              <Ionicons
                name="person-remove-outline"
                size={20}
                color="#666666"
              />
            </View>

            <View>
              <Text
                style={
                  styles.tituloDesplegable
                }
              >
                Usuarios inhabilitados
              </Text>

              <Text
                style={
                  styles.subtituloDesplegable
                }
              >
                {usuariosInhabilitados.length}{' '}
                {usuariosInhabilitados.length === 1
                  ? 'usuario inhabilitado'
                  : 'usuarios inhabilitados'}
              </Text>
            </View>
          </View>

          <Ionicons
            name={
              mostrarUsuariosInhabilitados
                ? 'chevron-up'
                : 'chevron-down'
            }
            size={22}
            color="#666666"
          />
        </TouchableOpacity>

        {mostrarUsuariosInhabilitados && (
          <View
            style={
              styles.contenidoDesplegable
            }
          >
            {usuariosInhabilitados.length ===
            0 ? (
              <View
                style={
                  styles.vacioPequeno
                }
              >
                <Text
                  style={
                    styles.vacioTexto
                  }
                >
                  No hay usuarios inhabilitados.
                </Text>
              </View>
            ) : (
              usuariosInhabilitados.map(
                renderUsuarioInhabilitado
              )
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL OPCIONES */}

      <Modal
        visible={
          modalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={
          cerrarOpciones
        }
      >
        <TouchableOpacity
          style={
            styles.modalFondo
          }
          activeOpacity={1}
          onPress={
            cerrarOpciones
          }
        >
          <View
            style={
              styles.modalContenido
            }
          >
            <Text
              style={
                styles.modalTitulo
              }
            >
              Opciones
            </Text>

            <Text
              style={
                styles.modalNombre
              }
            >
              {
                usuarioSeleccionado
                  ?.nombre
              }
            </Text>

            {usuarioSeleccionado?.estado ===
              'ACTIVO' && (
              <TouchableOpacity
                style={
                  styles.opcion
                }
                onPress={
                  restablecerPassword
                }
              >
                <Ionicons
                  name="key-outline"
                  size={22}
                  color="#08752F"
                />

                <Text
                  style={
                    styles.opcionTexto
                  }
                >
                  Restablecer contraseña
                </Text>
              </TouchableOpacity>
            )}

            {usuarioSeleccionado?.estado ===
              'INHABILITADO' &&
              usuarioSeleccionado?.solicitaHabilitacion ===
                true && (
                <>
                  <TouchableOpacity
                    style={styles.opcion}
                    onPress={() =>
                      habilitarSolicitud(
                        usuarioSeleccionado
                      )
                    }
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={22}
                      color="#08752F"
                    />

                    <Text style={styles.opcionTexto}>
                      Aprobar habilitación
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.opcion,
                      styles.ultimaOpcion,
                    ]}
                    onPress={() =>
                      rechazarSolicitudHabilitacion(
                        usuarioSeleccionado
                      )
                    }
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={22}
                      color="#D93025"
                    />

                    <Text
                      style={[
                        styles.opcionTexto,
                        styles.opcionRechazarTexto,
                      ]}
                    >
                      Rechazar solicitud
                    </Text>
                  </TouchableOpacity>
                </>
              )}

            {!(
              usuarioSeleccionado?.estado ===
                'INHABILITADO' &&
              usuarioSeleccionado?.solicitaHabilitacion ===
                true
            ) && (
              <TouchableOpacity
                style={[
                  styles.opcion,
                  styles.ultimaOpcion,
                ]}
                onPress={cambiarEstado}
              >
                <Ionicons
                  name={
                    usuarioSeleccionado?.estado ===
                    'ACTIVO'
                      ? 'ban-outline'
                      : 'checkmark-circle-outline'
                  }
                  size={22}
                  color={
                    usuarioSeleccionado?.estado ===
                    'ACTIVO'
                      ? '#B06C00'
                      : '#08752F'
                  }
                />

                <Text
                  style={[
                    styles.opcionTexto,
                    usuarioSeleccionado?.estado ===
                      'ACTIVO' &&
                      styles.opcionInhabilitarTexto,
                  ]}
                >
                  {usuarioSeleccionado?.estado ===
                  'ACTIVO'
                    ? 'Inhabilitar usuario'
                    : 'Habilitar usuario'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F7F8F9',
    },

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

    contenido: {
      padding: 16,
      paddingBottom: 45,
    },

    resumenContainer: {
      flexDirection:
        'row',
      gap: 8,
    },

    resumenCard: {
      flex: 1,
      backgroundColor:
        '#FFFFFF',
      borderRadius: 13,
      paddingVertical: 13,
      alignItems:
        'center',
      borderWidth: 1,
      borderColor:
        '#E5E5E5',
    },

    resumenIcono: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        '#FFF4DA',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    resumenIconoVerde: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        '#E8F6EC',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    resumenIconoRojo: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        '#FCEBEA',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    resumenNumero: {
      fontSize: 19,
      fontWeight:
        '800',
      color:
        '#222222',
      marginTop: 5,
    },

    resumenTexto: {
      fontSize: 9,
      color:
        '#777777',
      marginTop: 2,
      textAlign:
        'center',
    },

    tituloSeccion: {
      fontSize: 17,
      fontWeight:
        '800',
      color:
        '#222222',
      marginTop: 22,
      marginBottom: 10,
    },

    vacio: {
      minHeight: 100,
      borderRadius: 13,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E5E5E5',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    vacioPequeno: {
      minHeight: 70,
      borderRadius: 13,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E5E5E5',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginBottom: 9,
    },

    vacioTexto: {
      marginTop: 7,
      fontSize: 11,
      color:
        '#777777',
    },

    solicitudCard: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        '#E3E3E3',
      padding: 13,
      marginBottom: 9,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    avatarSolicitud: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor:
        '#E8F6EC',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 11,
    },

    solicitudInfo: {
      flex: 1,
    },

    nombreSolicitud: {
      fontSize: 14,
      fontWeight:
        '700',
      color:
        '#222222',
    },

    correoSolicitud: {
      fontSize: 10,
      color:
        '#777777',
      marginTop: 3,
    },

    filaEtiquetas: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 5,
      marginTop: 7,
    },

    badgeRol: {
      backgroundColor:
        '#E8F6EC',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },

    badgeRolTexto: {
      color:
        '#08752F',
      fontSize: 8,
      fontWeight:
        '700',
    },

    badgePendiente: {
      backgroundColor:
        '#FFF3D6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },

    badgePendienteTexto: {
      color:
        '#B06C00',
      fontSize: 8,
      fontWeight:
        '700',
    },

    botonesSolicitud: {
      gap: 8,
      marginLeft: 8,
    },

    botonRechazar: {
      width: 37,
      height: 37,
      borderRadius: 19,
      backgroundColor:
        '#FDEDEC',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    botonAprobar: {
      width: 37,
      height: 37,
      borderRadius: 19,
      backgroundColor:
        '#08752F',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    // ==========================================
    // SECCIONES DESPLEGABLES
    // ==========================================

    encabezadoDesplegable: {
      minHeight: 72,
      backgroundColor:
        '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        '#E3E3E3',
      marginTop: 25,
      marginBottom: 10,
      paddingHorizontal: 14,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    encabezadoInhabilitados: {
      marginTop: 16,
      backgroundColor:
        '#F2F2F2',
      borderColor:
        '#DDDDDD',
    },

    encabezadoIzquierda: {
      flexDirection:
        'row',
      alignItems:
        'center',
      flex: 1,
    },

    iconoSeccionActivo: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        '#E8F6EC',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 11,
    },

    iconoSeccionInhabilitado: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        '#E2E2E2',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 11,
    },

    tituloDesplegable: {
      fontSize: 15,
      fontWeight:
        '800',
      color:
        '#222222',
    },

    subtituloDesplegable: {
      fontSize: 10,
      color:
        '#777777',
      marginTop: 3,
    },

    contenidoDesplegable: {
      width: '100%',
    },

    // ==========================================
    // USUARIOS ACTIVOS
    // ==========================================

    usuarioCard: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        '#E3E3E3',
      padding: 13,
      marginBottom: 9,
      flexDirection:
        'row',
      alignItems:
        'flex-start',
    },

    usuarioCardActivo: {
      borderLeftWidth: 4,
      borderLeftColor:
        '#08752F',
    },

    avatarUsuario: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 11,
    },

    avatarUsuarioActivo: {
      backgroundColor:
        '#E8F6EC',
    },

    usuarioInfo: {
      flex: 1,
    },

    nombreFila: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 6,
    },

    nombreUsuario: {
      fontSize: 14,
      fontWeight:
        '700',
      color:
        '#222222',
      flexShrink: 1,
    },

    correoUsuario: {
      fontSize: 10,
      color:
        '#777777',
      marginTop: 3,
    },

    badgeTu: {
      backgroundColor:
        '#08752F',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
    },

    badgeTuTexto: {
      color:
        '#FFFFFF',
      fontSize: 8,
      fontWeight:
        '700',
    },

    badgeActivo: {
      backgroundColor:
        '#E8F6EC',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 3,
    },

    badgeActivoTexto: {
      color:
        '#08752F',
      fontSize: 8,
      fontWeight:
        '700',
    },

    // ==========================================
    // USUARIOS INHABILITADOS
    // ==========================================

    usuarioCardInhabilitado: {
      borderLeftWidth: 4,
      borderLeftColor:
        '#9A9A9A',
      backgroundColor:
        '#EEEEEE',
      borderColor:
        '#D7D7D7',
    },

    avatarUsuarioInhabilitado: {
      backgroundColor:
        '#DADADA',
    },

    nombreUsuarioInhabilitado: {
      fontSize: 14,
      fontWeight:
        '700',
      color:
        '#555555',
      flexShrink: 1,
    },

    correoUsuarioInhabilitado: {
      fontSize: 10,
      color:
        '#888888',
      marginTop: 3,
    },

    badgeRolGris: {
      backgroundColor:
        '#DDDDDD',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },

    badgeRolGrisTexto: {
      color:
        '#666666',
      fontSize: 8,
      fontWeight:
        '700',
    },

    badgeInhabilitado: {
      backgroundColor:
        '#DCDCDC',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 3,
    },

    badgeInhabilitadoTexto: {
      color:
        '#666666',
      fontSize: 8,
      fontWeight:
        '700',
    },

    usuarioCardSolicitaHabilitacion: {
      backgroundColor: '#FFF7DD',
      borderColor: '#E3B341',
      borderLeftColor: '#D99A00',
    },

    alertaHabilitacion: {
      marginTop: 9,
      minHeight: 40,
      backgroundColor: '#FFF0BD',
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 9,
      paddingVertical: 8,
    },

    alertaHabilitacionTitulo: {
      color: '#8A5900',
      fontSize: 9,
      fontWeight: '700',
    },

    opcionRechazarTexto: {
      color: '#D93025',
    },

    // ==========================================
    // RECUPERACIÓN
    // ==========================================

    alertaRecuperacion: {
      marginTop: 9,
      minHeight: 35,
      backgroundColor:
        '#FFF4DA',
      borderRadius: 8,
      flexDirection:
        'row',
      alignItems:
        'flex-start',
      paddingHorizontal: 9,
      paddingVertical: 8,
    },

    alertaContenido: {
      flex: 1,
      marginLeft: 6,
    },

    alertaTexto: {
      color:
        '#8A5900',
      fontSize: 9,
      fontWeight:
        '600',
    },

    alertaNota: {
      color:
        '#8A5900',
      fontSize: 9,
      marginTop: 4,
      lineHeight: 13,
    },

    botonOpciones: {
      width: 40,
      height: 40,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    // ==========================================
    // MODAL
    // ==========================================

    modalFondo: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.42)',
      justifyContent:
        'flex-end',
    },

    modalContenido: {
      backgroundColor:
        '#FFFFFF',
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      padding: 20,
      paddingBottom: 32,
    },

    modalTitulo: {
      fontSize: 18,
      fontWeight:
        '800',
      color:
        '#222222',
    },

    modalNombre: {
      fontSize: 11,
      color:
        '#777777',
      marginTop: 4,
      marginBottom: 15,
    },

    opcion: {
      height: 54,
      borderBottomWidth: 1,
      borderBottomColor:
        '#EEEEEE',
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    ultimaOpcion: {
      borderBottomWidth: 0,
    },

    opcionTexto: {
      marginLeft: 11,
      fontSize: 13,
      fontWeight:
        '600',
      color:
        '#333333',
    },

    opcionInhabilitarTexto: {
      color:
        '#8A5900',
    },
  });