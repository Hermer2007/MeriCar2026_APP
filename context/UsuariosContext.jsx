import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { auth, db } from '../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UsuariosContext = createContext();

const obtenerFechaActual = () => {
  const fecha = new Date();

  const anio =
    fecha.getFullYear();

  const mes = String(
    fecha.getMonth() + 1
  ).padStart(2, '0');

  const dia = String(
    fecha.getDate()
  ).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
};

export const UsuariosProvider = ({
  children,
}) => {
  const [
    usuarios,
    setUsuarios,
  ] = useState([]);

  const [
    solicitudes,
    setSolicitudes,
  ] = useState([]);

  const [
    usuarioActual,
    setUsuarioActual,
  ] = useState(null);

  const [
    cargandoSesion,
    setCargandoSesion,
  ] = useState(true);

  const autenticandoManualRef =
    useRef(false);

  const [
    notificacionesUsuariosVistas,
    setNotificacionesUsuariosVistas,
  ] = useState([]);

  // ==========================================
  // RESTAURAR SESIÓN DE FIREBASE
  // ==========================================

  useEffect(() => {
    const cancelarEscucha =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          try {
            if (!firebaseUser) {
              setUsuarioActual(null);
              setCargandoSesion(false);
              return;
            }

            if (
              autenticandoManualRef.current
            ) {
              setCargandoSesion(false);
              return;
            }

            const fechaSesion =
              await AsyncStorage.getItem(
                'mericar_fecha_sesion'
              );

            const fechaActual =
              obtenerFechaActual();

            if (
              !fechaSesion ||
              fechaSesion !== fechaActual
            ) {
              await AsyncStorage.multiRemove(
                [
                  'mericar_fecha_sesion',
                  'mericar_app_bloqueada',
                ]
              );

              await signOut(auth);

              setUsuarioActual(null);
              setCargandoSesion(false);

              return;
            }

            const referenciaUsuario =
              doc(
                db,
                'usuarios',
                firebaseUser.uid
              );

            const documentoUsuario =
              await getDoc(
                referenciaUsuario
              );

            if (
              !documentoUsuario.exists()
            ) {
              await AsyncStorage.multiRemove(
                [
                  'mericar_fecha_sesion',
                  'mericar_app_bloqueada',
                ]
              );

              await signOut(auth);

              setUsuarioActual(null);
              setCargandoSesion(false);

              return;
            }

            const datosUsuario = {
              id: documentoUsuario.id,
              ...documentoUsuario.data(),
            };

            if (
              datosUsuario.estado !==
              'ACTIVO'
            ) {
              await AsyncStorage.multiRemove(
                [
                  'mericar_fecha_sesion',
                  'mericar_app_bloqueada',
                ]
              );

              await signOut(auth);

              setUsuarioActual(null);
              setCargandoSesion(false);

              return;
            }

            const appBloqueada =
              await AsyncStorage.getItem(
                'mericar_app_bloqueada'
              );

            if (
              appBloqueada === 'true'
            ) {
              setUsuarioActual(null);
              setCargandoSesion(false);

              return;
            }

            setUsuarioActual(
              datosUsuario
            );

            setCargandoSesion(false);
          } catch (error) {
            console.log(
              'Error al restaurar sesión:',
              error
            );

            setUsuarioActual(null);
            setCargandoSesion(false);
          }
        }
      );

    return () => {
      cancelarEscucha();
    };
  }, []);

  // ==========================================
  // ESCUCHAR USUARIOS
  // ==========================================

  useEffect(() => {
    const referencia =
      collection(
        db,
        'usuarios'
      );

    const cancelarEscucha =
      onSnapshot(
        referencia,
        (snapshot) => {
          const datos =
            snapshot.docs.map(
              (documento) => ({
                id: documento.id,
                ...documento.data(),
              })
            );

          setUsuarios(datos);
        },
        (error) => {
          console.log(
            'Error al leer usuarios:',
            error
          );
        }
      );

    return () => {
      cancelarEscucha();
    };
  }, []);

  // ==========================================
  // ESCUCHAR SOLICITUDES
  // ==========================================

  useEffect(() => {
    const referencia =
      collection(
        db,
        'solicitudesUsuarios'
      );

    const cancelarEscucha =
      onSnapshot(
        referencia,
        (snapshot) => {
          const datos =
            snapshot.docs.map(
              (documento) => ({
                id: documento.id,
                ...documento.data(),
              })
            );

          datos.sort(
            (a, b) => {
              const fechaA =
                a.fechaSolicitud || '';

              const fechaB =
                b.fechaSolicitud || '';

              return fechaB.localeCompare(
                fechaA
              );
            }
          );

          setSolicitudes(datos);
        },
        (error) => {
          console.log(
            'Error al leer solicitudes:',
            error
          );
        }
      );

    return () => {
      cancelarEscucha();
    };
  }, []);

  // ==========================================
  // REGISTRAR NUEVA SOLICITUD
  // ==========================================

  const registrarSolicitud =
    async ({
      nombre,
      correo,
      password,
      rol,
    }) => {
      autenticandoManualRef.current =
        true;

      try {
        const nombreLimpio =
          nombre.trim();

        const correoLimpio =
          correo
            .trim()
            .toLowerCase();

        const credencial =
          await createUserWithEmailAndPassword(
            auth,
            correoLimpio,
            password
          );

        const nuevoUsuario =
          credencial.user;

        const uid =
          nuevoUsuario.uid;

        await setDoc(
          doc(
            db,
            'usuarios',
            uid
          ),
          {
            nombre:
              nombreLimpio,

            usuario:
              correoLimpio,

            correo:
              correoLimpio,

            rol,

            estado:
              'PENDIENTE',

            solicitaRestablecimiento:
              false,

            solicitaHabilitacion:
              false,

            fechaRegistro:
              new Date().toISOString(),
          }
        );

        await addDoc(
          collection(
            db,
            'solicitudesUsuarios'
          ),
          {
            uidUsuario:
              uid,

            nombre:
              nombreLimpio,

            usuario:
              correoLimpio,

            correo:
              correoLimpio,

            rol,

            estado:
              'PENDIENTE',

            fechaSolicitud:
              new Date().toISOString(),
          }
        );

        await signOut(auth);

        return true;
      } catch (error) {
        console.log(
          'Error al registrar solicitud:',
          error.code,
          error.message
        );

        if (
          error.code ===
          'auth/email-already-in-use'
        ) {
          return {
            error:
              'EMAIL_EN_USO',
          };
        }

        if (
          error.code ===
          'auth/invalid-email'
        ) {
          return {
            error:
              'CORREO_INVALIDO',
          };
        }

        if (
          error.code ===
          'auth/weak-password'
        ) {
          return {
            error:
              'PASSWORD_DEBIL',
          };
        }

        return false;
      } finally {
        autenticandoManualRef.current =
          false;
      }
    };

  // ==========================================
  // EXISTE SOLICITUD
  // ==========================================

  const existeSolicitud = (
    correo
  ) => {
    const correoLimpio =
      correo
        .trim()
        .toLowerCase();

    return solicitudes.some(
      (item) =>
        item.correo
          ?.toLowerCase() ===
          correoLimpio &&
        item.estado ===
          'PENDIENTE'
    );
  };

  // ==========================================
  // EXISTE USUARIO
  // ==========================================

  const existeUsuario = (
    valor
  ) => {
    const busqueda =
      valor
        .trim()
        .toLowerCase();

    return usuarios.some(
      (item) =>
        item.usuario
          ?.toLowerCase() ===
          busqueda ||
        item.correo
          ?.toLowerCase() ===
          busqueda
    );
  };

  // ==========================================
  // APROBAR SOLICITUD
  // ==========================================

  const aprobarSolicitud =
    async (solicitudId) => {
      try {
        const solicitud =
          solicitudes.find(
            (item) =>
              item.id ===
              solicitudId
          );

        if (!solicitud) {
          return false;
        }

        const uid =
          solicitud.uidUsuario;

        if (!uid) {
          console.log(
            'La solicitud no tiene uidUsuario'
          );

          return false;
        }

        await updateDoc(
          doc(
            db,
            'usuarios',
            uid
          ),
          {
            estado:
              'ACTIVO',

            fechaAprobacion:
              new Date().toISOString(),
          }
        );

        await updateDoc(
          doc(
            db,
            'solicitudesUsuarios',
            solicitudId
          ),
          {
            estado:
              'APROBADA',

            fechaAprobacion:
              new Date().toISOString(),
          }
        );

        return true;
      } catch (error) {
        console.log(
          'Error al aprobar solicitud:',
          error
        );

        return false;
      }
    };

  // ==========================================
  // RECHAZAR SOLICITUD
  // ==========================================

  const rechazarSolicitud =
    async (solicitudId) => {
      try {
        const solicitud =
          solicitudes.find(
            (item) =>
              item.id ===
              solicitudId
          );

        if (!solicitud) {
          return false;
        }

        const uid =
          solicitud.uidUsuario;

        if (uid) {
          await updateDoc(
            doc(
              db,
              'usuarios',
              uid
            ),
            {
              estado:
                'RECHAZADO',

              fechaRechazo:
                new Date().toISOString(),
            }
          );
        }

        await updateDoc(
          doc(
            db,
            'solicitudesUsuarios',
            solicitudId
          ),
          {
            estado:
              'RECHAZADA',

            fechaRechazo:
              new Date().toISOString(),
          }
        );

        return true;
      } catch (error) {
        console.log(
          'Error al rechazar solicitud:',
          error
        );

        return false;
      }
    };

  // ==========================================
  // HABILITAR / INHABILITAR USUARIO
  // ==========================================

  const cambiarEstadoUsuario =
    async (usuarioId) => {
      try {
        const usuario =
          usuarios.find(
            (item) =>
              item.id ===
              usuarioId
          );

        if (!usuario) {
          return false;
        }

        const nuevoEstado =
          usuario.estado ===
          'ACTIVO'
            ? 'INHABILITADO'
            : 'ACTIVO';

        await updateDoc(
          doc(
            db,
            'usuarios',
            usuarioId
          ),
          {
            estado:
              nuevoEstado,
          }
        );

        return true;
      } catch (error) {
        console.log(
          'Error al cambiar estado:',
          error
        );

        return false;
      }
    };

  // ==========================================
  // BORRAR USUARIO
  // ==========================================

  const borrarUsuario =
    async (usuarioId) => {
      try {
        await deleteDoc(
          doc(
            db,
            'usuarios',
            usuarioId
          )
        );

        return true;
      } catch (error) {
        console.log(
          'Error al borrar usuario:',
          error
        );

        return false;
      }
    };

  // ==========================================
  // SOLICITAR RESTABLECIMIENTO
  // ==========================================

  const solicitarRestablecimiento =
    async (correo, nota) => {
      try {
        const correoLimpio =
          correo
            .trim()
            .toLowerCase();

        const notaLimpia =
          nota.trim();

        const usuario =
          usuarios.find(
            (item) =>
              item.correo
                ?.toLowerCase() ===
              correoLimpio
          );

        if (!usuario) {
          return false;
        }

        await updateDoc(
          doc(
            db,
            'usuarios',
            usuario.id
          ),
          {
            solicitaRestablecimiento:
              true,

            fechaSolicitudRestablecimiento:
              new Date().toISOString(),

            notaRestablecimiento:
              notaLimpia,
          }
        );

        return true;
      } catch (error) {
        console.log(
          'Error al solicitar restablecimiento:',
          error
        );

        return false;
      }
    };

  // ==========================================
  // ATENDER RESTABLECIMIENTO
  // ==========================================

  const atenderRestablecimiento =
    async (usuarioId) => {
      try {
        const usuario =
          usuarios.find(
            (item) =>
              item.id ===
              usuarioId
          );

        if (!usuario) {
          console.log(
            'Usuario no encontrado para restablecimiento.'
          );

          return false;
        }

        if (!usuario.correo) {
          console.log(
            'El usuario no tiene correo registrado.'
          );

          return false;
        }

        if (
          usuario.solicitaRestablecimiento !==
          true
        ) {
          console.log(
            'El usuario no tiene una solicitud de restablecimiento pendiente.'
          );

          return false;
        }

        await sendPasswordResetEmail(
          auth,
          usuario.correo
        );

        await updateDoc(
          doc(
            db,
            'usuarios',
            usuarioId
          ),
          {
            solicitaRestablecimiento:
              false,

            fechaSolicitudRestablecimiento:
              null,

            notaRestablecimiento:
              null,

            fechaAtencionRestablecimiento:
              new Date().toISOString(),
          }
        );

        setNotificacionesUsuariosVistas(
          (anteriores) =>
            anteriores.filter(
              (id) =>
                id !==
                `restablecimiento_${usuarioId}`
            )
        );

        return true;
      } catch (error) {
        console.log(
          'Error al atender restablecimiento:',
          error.code,
          error.message
        );

        return false;
      }
    };

  // ==========================================
  // SOLICITAR HABILITACIÓN
  // ==========================================

  const solicitarHabilitacion =
    async (correo, nota) => {
      try {
        const correoLimpio =
          correo
            .trim()
            .toLowerCase();

        const notaLimpia =
          nota.trim();

        const usuario =
          usuarios.find(
            (item) =>
              item.correo
                ?.toLowerCase() ===
              correoLimpio
          );

        if (!usuario) {
          return {
            error:
              'USUARIO_NO_ENCONTRADO',
          };
        }

        if (
          usuario.estado !==
          'INHABILITADO'
        ) {
          return {
            error:
              'CUENTA_NO_INHABILITADA',
          };
        }

        if (
          usuario.solicitaHabilitacion ===
          true
        ) {
          return {
            error:
              'SOLICITUD_EXISTENTE',
          };
        }

        await updateDoc(
          doc(
            db,
            'usuarios',
            usuario.id
          ),
          {
            solicitaHabilitacion:
              true,

            notaHabilitacion:
              notaLimpia,

            fechaSolicitudHabilitacion:
              new Date().toISOString(),
          }
        );

        return true;
      } catch (error) {
        console.log(
          'Error al solicitar habilitación:',
          error
        );

        return false;
      }
    };

  // ==========================================
  // APROBAR HABILITACIÓN
  // ==========================================

  const aprobarHabilitacion =
    async (usuarioId) => {
      try {
        const usuario =
          usuarios.find(
            (item) =>
              item.id ===
              usuarioId
          );

        if (!usuario) {
          return false;
        }

        if (
          usuario.estado !==
          'INHABILITADO'
        ) {
          return false;
        }

        if (
          usuario.solicitaHabilitacion !==
          true
        ) {
          return false;
        }

        await updateDoc(
          doc(
            db,
            'usuarios',
            usuarioId
          ),
          {
            estado:
              'ACTIVO',

            solicitaHabilitacion:
              false,

            notaHabilitacion:
              null,

            fechaSolicitudHabilitacion:
              null,

            fechaHabilitacion:
              new Date().toISOString(),
          }
        );

        setNotificacionesUsuariosVistas(
          (anteriores) =>
            anteriores.filter(
              (id) =>
                id !==
                `habilitacion_${usuarioId}`
            )
        );

        return true;
      } catch (error) {
        console.log(
          'Error al aprobar habilitación:',
          error
        );

        return false;
      }
    };

  // ==========================================
  // RECHAZAR HABILITACIÓN
  // ==========================================

  const rechazarHabilitacion =
    async (usuarioId) => {
      try {
        const usuario =
          usuarios.find(
            (item) =>
              item.id ===
              usuarioId
          );

        if (!usuario) {
          return false;
        }

        if (
          usuario.solicitaHabilitacion !==
          true
        ) {
          return false;
        }

        await updateDoc(
          doc(
            db,
            'usuarios',
            usuarioId
          ),
          {
            solicitaHabilitacion:
              false,

            notaHabilitacion:
              null,

            fechaSolicitudHabilitacion:
              null,

            fechaRechazoHabilitacion:
              new Date().toISOString(),
          }
        );

        setNotificacionesUsuariosVistas(
          (anteriores) =>
            anteriores.filter(
              (id) =>
                id !==
                `habilitacion_${usuarioId}`
            )
        );

        return true;
      } catch (error) {
        console.log(
          'Error al rechazar habilitación:',
          error
        );

        return false;
      }
    };

  // ==========================================
  // NOTIFICACIONES NO VISTAS
  // ==========================================

  const obtenerNotificacionesUsuarios =
    () => {
      const solicitudesPendientes =
        solicitudes
          .filter(
            (solicitud) =>
              solicitud.estado ===
              'PENDIENTE'
          )
          .map(
            (solicitud) =>
              `solicitud_${solicitud.id}`
          );

      const restablecimientos =
        usuarios
          .filter(
            (usuario) =>
              usuario.solicitaRestablecimiento ===
              true
          )
          .map(
            (usuario) =>
              `restablecimiento_${usuario.id}`
          );

      const habilitaciones =
        usuarios
          .filter(
            (usuario) =>
              usuario.estado ===
                'INHABILITADO' &&
              usuario.solicitaHabilitacion ===
                true
          )
          .map(
            (usuario) =>
              `habilitacion_${usuario.id}`
          );

      const notificacionesActuales = [
        ...solicitudesPendientes,
        ...restablecimientos,
        ...habilitaciones,
      ];

      return notificacionesActuales.filter(
        (id) =>
          !notificacionesUsuariosVistas.includes(
            id
          )
      ).length;
    };

  // ==========================================
  // MARCAR NOTIFICACIONES COMO LEÍDAS
  // ==========================================

  const marcarNotificacionesUsuariosLeidas =
    () => {
      const solicitudesPendientes =
        solicitudes
          .filter(
            (solicitud) =>
              solicitud.estado ===
              'PENDIENTE'
          )
          .map(
            (solicitud) =>
              `solicitud_${solicitud.id}`
          );

      const restablecimientos =
        usuarios
          .filter(
            (usuario) =>
              usuario.solicitaRestablecimiento ===
              true
          )
          .map(
            (usuario) =>
              `restablecimiento_${usuario.id}`
          );

      const habilitaciones =
        usuarios
          .filter(
            (usuario) =>
              usuario.estado ===
                'INHABILITADO' &&
              usuario.solicitaHabilitacion ===
                true
          )
          .map(
            (usuario) =>
              `habilitacion_${usuario.id}`
          );

      const notificacionesActuales = [
        ...solicitudesPendientes,
        ...restablecimientos,
        ...habilitaciones,
      ];

      setNotificacionesUsuariosVistas(
        (anteriores) => [
          ...new Set([
            ...anteriores,
            ...notificacionesActuales,
          ]),
        ]
      );
    };

  // ==========================================
  // AUTENTICAR USUARIO
  // ==========================================

  const autenticarUsuario =
    async (
      username,
      password
    ) => {
      try {
        const valor =
          username
            .trim()
            .toLowerCase();

        const usuarioEncontrado =
          usuarios.find(
            (item) =>
              item.usuario
                ?.toLowerCase() ===
                valor ||
              item.correo
                ?.toLowerCase() ===
                valor
          );

        if (!usuarioEncontrado) {
          return null;
        }

        if (
          usuarioEncontrado.estado ===
          'PENDIENTE'
        ) {
          return {
            error:
              'PENDIENTE',
          };
        }

        if (
          usuarioEncontrado.estado ===
          'RECHAZADO'
        ) {
          return {
            error:
              'RECHAZADO',
          };
        }

        if (
          usuarioEncontrado.estado ===
          'INHABILITADO'
        ) {
          return {
            error:
              'INHABILITADO',
          };
        }

        if (
          usuarioEncontrado.estado !==
          'ACTIVO'
        ) {
          return {
            error:
              'NO_ACTIVO',
          };
        }

        const correo =
          usuarioEncontrado.correo;

        autenticandoManualRef.current =
          true;

        try {
          const credencial =
            await signInWithEmailAndPassword(
              auth,
              correo,
              password
            );

          const referenciaUsuario =
            doc(
              db,
              'usuarios',
              credencial.user.uid
            );

          const documentoUsuario =
            await getDoc(
              referenciaUsuario
            );

          if (
            !documentoUsuario.exists()
          ) {
            await signOut(auth);

            return {
              error:
                'NO_ACTIVO',
            };
          }

          const datosUsuario = {
            id: documentoUsuario.id,
            ...documentoUsuario.data(),
          };

          if (
            datosUsuario.estado !==
            'ACTIVO'
          ) {
            await signOut(auth);

            return {
              error:
                datosUsuario.estado ||
                'NO_ACTIVO',
            };
          }

          await AsyncStorage.setItem(
            'mericar_fecha_sesion',
            obtenerFechaActual()
          );

          await AsyncStorage.removeItem(
            'mericar_app_bloqueada'
          );

          return datosUsuario;
        } finally {
          autenticandoManualRef.current =
            false;
        }
      } catch (error) {
        console.log(
          'Error al iniciar sesión:',
          error.code
        );

        return null;
      }
    };

  // ==========================================
  // INICIAR SESIÓN EN CONTEXT
  // ==========================================

  const iniciarSesion = (
    usuario
  ) => {
    setUsuarioActual(
      usuario
    );
  };

  // ==========================================
  // BLOQUEAR SESIÓN
  // ==========================================

  const bloquearSesion =
    async () => {
      try {
        await AsyncStorage.setItem(
          'mericar_app_bloqueada',
          'true'
        );
      } catch (error) {
        console.log(
          'Error al bloquear sesión:',
          error
        );
      }

      setUsuarioActual(null);
    };

  // ==========================================
  // DESBLOQUEAR CON PIN / HUELLA
  // ==========================================

  const desbloquearSesionConPin =
    async (usuario) => {
      try {
        const firebaseUser =
          auth.currentUser;

        if (!firebaseUser) {
          return {
            error:
              'SIN_SESION_FIREBASE',
          };
        }

        if (
          String(
            firebaseUser.uid
          ) !==
          String(
            usuario.id
          )
        ) {
          return {
            error:
              'USUARIO_DIFERENTE',
          };
        }

        const fechaSesion =
          await AsyncStorage.getItem(
            'mericar_fecha_sesion'
          );

        if (
          fechaSesion !==
          obtenerFechaActual()
        ) {
          await AsyncStorage.multiRemove(
            [
              'mericar_fecha_sesion',
              'mericar_app_bloqueada',
            ]
          );

          await signOut(auth);

          setUsuarioActual(null);

          return {
            error:
              'JORNADA_VENCIDA',
          };
        }

        const documentoUsuario =
          await getDoc(
            doc(
              db,
              'usuarios',
              firebaseUser.uid
            )
          );

        if (
          !documentoUsuario.exists()
        ) {
          return {
            error:
              'USUARIO_NO_DISPONIBLE',
          };
        }

        const datosUsuario = {
          id: documentoUsuario.id,
          ...documentoUsuario.data(),
        };

        if (
          datosUsuario.estado !==
          'ACTIVO'
        ) {
          await signOut(auth);

          setUsuarioActual(null);

          return {
            error:
              datosUsuario.estado ||
              'NO_ACTIVO',
          };
        }

        await AsyncStorage.removeItem(
          'mericar_app_bloqueada'
        );

        setUsuarioActual(
          datosUsuario
        );

        return {
          ok: true,
          usuario:
            datosUsuario,
        };
      } catch (error) {
        console.log(
          'Error al desbloquear con PIN:',
          error
        );

        return {
          error:
            'ERROR_PIN',
        };
      }
    };

  // ==========================================
  // CERRAR SESIÓN COMPLETAMENTE
  // ==========================================

  const cerrarSesion =
    async () => {
      try {
        await AsyncStorage.multiRemove(
          [
            'mericar_fecha_sesion',
            'mericar_app_bloqueada',
          ]
        );

        await signOut(auth);
      } catch (error) {
        console.log(
          'Error al cerrar sesión:',
          error
        );
      }

      setUsuarioActual(null);
    };

  return (
    <UsuariosContext.Provider
      value={{
        usuarios,

        solicitudes,

        usuarioActual,

        cargandoSesion,

        registrarSolicitud,

        existeSolicitud,

        existeUsuario,

        aprobarSolicitud,

        rechazarSolicitud,

        cambiarEstadoUsuario,

        borrarUsuario,

        solicitarRestablecimiento,

        atenderRestablecimiento,

        solicitarHabilitacion,

        aprobarHabilitacion,

        rechazarHabilitacion,

        obtenerNotificacionesUsuarios,

        marcarNotificacionesUsuariosLeidas,

        autenticarUsuario,

        iniciarSesion,

        bloquearSesion,

        desbloquearSesionConPin,

        cerrarSesion,
      }}
    >
      {children}
    </UsuariosContext.Provider>
  );
};

export const useUsuarios = () =>
  useContext(UsuariosContext);