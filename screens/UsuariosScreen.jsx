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
    borrarUsuario,

    atenderRestablecimiento,

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
  // CONTADORES
  // ==========================================

  const usuariosActivos =
    usuarios.filter(
      (usuario) =>
        usuario.estado ===
        'ACTIVO'
    ).length;

  const restablecimientosPendientes =
    usuarios.filter(
      (usuario) =>
        usuario.solicitaRestablecimiento ===
        true
    ).length;

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

      onConfirmar: () => {
        const resultado =
          aprobarSolicitud(
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

      onConfirmar: () => {
        rechazarSolicitud(
          solicitud.id
        );

        mostrarToast(
          'Solicitud rechazada.',
          'success'
        );
      },
    });
  };

  // ==========================================
  // ABRIR OPCIONES USUARIO
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

      setModalVisible(
        false
      );

      mostrarAlert({
        titulo:
          'Restablecer contraseña',

        mensaje:
          `¿Desea atender la solicitud de restablecimiento de ${usuario.nombre}?`,

        tipo:
          'question',

        mostrarCancelar:
          true,

        textoCancelar:
          'Cancelar',

        textoConfirmar:
          'Continuar',

        onConfirmar: () => {
          atenderRestablecimiento(
            usuario.id
          );

          setUsuarioSeleccionado(
            null
          );

          mostrarToast(
            'Solicitud de restablecimiento atendida.',
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

        onConfirmar: () => {
          cambiarEstadoUsuario(
            usuario.id
          );

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
  // BORRAR USUARIO
  // ==========================================

  const borrar =
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
          'No puede eliminar su propia cuenta mientras está conectado.',
          'warning'
        );

        return;
      }

      const usuario =
        usuarioSeleccionado;

      setModalVisible(
        false
      );

      mostrarAlert({
        titulo:
          'Eliminar usuario',

        mensaje:
          `¿Está seguro de que desea eliminar la cuenta de ${usuario.nombre}? Esta acción no se puede deshacer.`,

        tipo:
          'danger',

        mostrarCancelar:
          true,

        textoCancelar:
          'Cancelar',

        textoConfirmar:
          'Eliminar',

        onConfirmar: () => {
          borrarUsuario(
            usuario.id
          );

          setUsuarioSeleccionado(
            null
          );

          mostrarToast(
            'Usuario eliminado.',
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
                solicitudesPendientes.length
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
              {usuariosActivos}
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

        {/* USUARIOS */}

        <Text
          style={[
            styles.tituloSeccion,
            styles.seccionUsuarios,
          ]}
        >
          Usuarios registrados
        </Text>

        {usuarios.map(
          (usuario) => {
            const esActual =
              String(usuario.id) ===
              String(usuarioActual?.id);

            const estaActivo =
              usuario.estado === 'ACTIVO';

            const estaInhabilitado =
              usuario.estado === 'INHABILITADO';

            const estaRechazado =
              usuario.estado === 'RECHAZADO';

            const estaPendiente =
              usuario.estado === 'PENDIENTE';

            return (
              <View
                key={usuario.id}
                style={[
                  styles.usuarioCard,
                  estaActivo && styles.usuarioCardActivo,
                  estaInhabilitado && styles.usuarioCardInhabilitado,
                  estaRechazado && styles.usuarioCardRechazado,
                  estaPendiente && styles.usuarioCardPendiente,
                ]}
              >
                <View
                  style={[
                    styles.avatarUsuario,
                    estaActivo && styles.avatarUsuarioActivo,
                    estaInhabilitado && styles.avatarUsuarioInhabilitado,
                    estaRechazado && styles.avatarUsuarioRechazado,
                    estaPendiente && styles.avatarUsuarioPendiente,
                  ]}
                >
                  <Ionicons
                    name={
                      estaRechazado
                        ? 'person-remove'
                        : estaInhabilitado
                        ? 'person-outline'
                        : estaPendiente
                        ? 'time-outline'
                        : 'person'
                    }
                    size={25}
                    color={
                      estaRechazado
                        ? '#D93025'
                        : estaInhabilitado
                        ? '#B06C00'
                        : estaPendiente
                        ? '#B06C00'
                        : '#08752F'
                    }
                  />
                </View>

                <View style={styles.usuarioInfo}>
                  <View style={styles.nombreFila}>
                    <Text style={styles.nombreUsuario}>
                      {usuario.nombre}
                    </Text>

                    {esActual && (
                      <View style={styles.badgeTu}>
                        <Text style={styles.badgeTuTexto}>
                          Tú
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.correoUsuario}>
                    {usuario.correo}
                  </Text>

                  <View style={styles.filaEtiquetas}>
                    <View style={styles.badgeRol}>
                      <Text style={styles.badgeRolTexto}>
                        {obtenerRol(usuario.rol)}
                      </Text>
                    </View>

                    {estaActivo && (
                      <View style={styles.badgeActivo}>
                        <Ionicons
                          name="checkmark-circle"
                          size={11}
                          color="#08752F"
                        />
                        <Text style={styles.badgeActivoTexto}>
                          ACTIVO
                        </Text>
                      </View>
                    )}

                    {estaInhabilitado && (
                      <View style={styles.badgeInhabilitado}>
                        <Ionicons
                          name="ban-outline"
                          size={11}
                          color="#B06C00"
                        />
                        <Text style={styles.badgeInhabilitadoTexto}>
                          INHABILITADO
                        </Text>
                      </View>
                    )}

                    {estaRechazado && (
                      <View style={styles.badgeRechazado}>
                        <Ionicons
                          name="close-circle"
                          size={11}
                          color="#D93025"
                        />
                        <Text style={styles.badgeRechazadoTexto}>
                          RECHAZADO
                        </Text>
                      </View>
                    )}

                    {estaPendiente && (
                      <View style={styles.badgeEstadoPendiente}>
                        <Ionicons
                          name="time-outline"
                          size={11}
                          color="#B06C00"
                        />
                        <Text style={styles.badgeEstadoPendienteTexto}>
                          PENDIENTE
                        </Text>
                      </View>
                    )}
                  </View>

                  {usuario.solicitaRestablecimiento && (
                    <View style={styles.alertaRecuperacion}>
                      <Ionicons
                        name="warning-outline"
                        size={18}
                        color="#B06C00"
                      />
                      <Text style={styles.alertaTexto}>
                        Solicita restablecer contraseña
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.botonOpciones}
                  onPress={() => abrirOpciones(usuario)}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={23}
                    color="#555555"
                  />
                </TouchableOpacity>
              </View>
            );
          }
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

            <TouchableOpacity
              style={
                styles.opcion
              }
              onPress={
                cambiarEstado
              }
            >
              <Ionicons
                name={
                  usuarioSeleccionado
                    ?.estado ===
                  'ACTIVO'
                    ? 'ban-outline'
                    : 'checkmark-circle-outline'
                }
                size={22}
                color="#08752F"
              />

              <Text
                style={
                  styles.opcionTexto
                }
              >
                {usuarioSeleccionado
                  ?.estado ===
                'ACTIVO'
                  ? 'Inhabilitar usuario'
                  : 'Habilitar usuario'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.opcion,
                styles.opcionEliminar,
              ]}
              onPress={
                borrar
              }
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color="#D93025"
              />

              <Text
                style={
                  styles.opcionEliminarTexto
                }
              >
                Borrar cuenta
              </Text>
            </TouchableOpacity>
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
      paddingBottom: 40,
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

    seccionUsuarios: {
      marginTop: 27,
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
      borderLeftColor: '#08752F',
    },

    usuarioCardInhabilitado: {
      borderLeftWidth: 4,
      borderLeftColor: '#D98B00',
      backgroundColor: '#FFFCF5',
    },

    usuarioCardRechazado: {
      borderLeftWidth: 4,
      borderLeftColor: '#D93025',
      backgroundColor: '#FFF8F7',
    },

    usuarioCardPendiente: {
      borderLeftWidth: 4,
      borderLeftColor: '#D98B00',
      backgroundColor: '#FFFCF5',
    },

    avatarUsuario: {
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

    avatarUsuarioActivo: {
      backgroundColor: '#E8F6EC',
    },

    avatarUsuarioInhabilitado: {
      backgroundColor: '#FFF4DA',
    },

    avatarUsuarioRechazado: {
      backgroundColor: '#FDEDEC',
    },

    avatarUsuarioPendiente: {
      backgroundColor: '#FFF4DA',
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
      backgroundColor: '#E8F6EC',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },

    badgeActivoTexto: {
      color: '#08752F',
      fontSize: 8,
      fontWeight: '700',
    },

    badgeInhabilitado: {
      backgroundColor: '#FFF3D6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },

    badgeInhabilitadoTexto: {
      color: '#B06C00',
      fontSize: 8,
      fontWeight: '700',
    },

    badgeRechazado: {
      backgroundColor: '#FDEDEC',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },

    badgeRechazadoTexto: {
      color: '#D93025',
      fontSize: 8,
      fontWeight: '700',
    },

    badgeEstadoPendiente: {
      backgroundColor: '#FFF3D6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },

    badgeEstadoPendienteTexto: {
      color: '#B06C00',
      fontSize: 8,
      fontWeight: '700',
    },

    alertaRecuperacion: {
      marginTop: 9,
      minHeight: 35,
      backgroundColor:
        '#FFF4DA',
      borderRadius: 8,
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal: 9,
    },

    alertaTexto: {
      flex: 1,
      marginLeft: 6,
      color:
        '#8A5900',
      fontSize: 9,
      fontWeight:
        '600',
    },

    botonOpciones: {
      width: 40,
      height: 40,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

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

    opcionTexto: {
      marginLeft: 11,
      fontSize: 13,
      fontWeight:
        '600',
      color:
        '#333333',
    },

    opcionEliminar: {
      borderBottomWidth: 0,
    },

    opcionEliminarTexto: {
      marginLeft: 11,
      fontSize: 13,
      fontWeight:
        '600',
      color:
        '#D93025',
    },
  });