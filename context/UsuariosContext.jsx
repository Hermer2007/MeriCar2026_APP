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
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { auth, db } from '../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UsuariosContext = createContext();

const obtenerFechaActual = () => {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
};

export const UsuariosProvider = ({ children }) => {
  const [usuarios, setUsuarios] = useState([]);

  const [solicitudes, setSolicitudes] = useState([]);

  const [usuarioActual, setUsuarioActual] = useState(null);

  const [cargandoSesion, setCargandoSesion] = useState(true);

  const autenticandoManualRef = useRef(false);

  const [
    notificacionesUsuariosVistas,
    setNotificacionesUsuariosVistas,
  ] = useState([]);

  // ==========================================
  // RESTAURAR SESIÓN DE FIREBASE
  // ==========================================

  useEffect(() => {
    const cancelarEscucha = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (!firebaseUser) {
            setUsuarioActual(null);
            setCargandoSesion(false);
            return;
          }

          // Durante un login manual, LoginScreen será quien
          // coloque usuarioActual después de validar la cuenta.
          if (autenticandoManualRef.current) {
            setCargandoSesion(false);
            return;
          }

          const fechaSesion = await AsyncStorage.getItem(
            'mericar_fecha_sesion'
          );

          const fechaActual = obtenerFechaActual();

          // La sesión solo sirve durante el mismo día.
          if (!fechaSesion || fechaSesion !== fechaActual) {
            await AsyncStorage.multiRemove([
              'mericar_fecha_sesion',
              'mericar_app_bloqueada',
            ]);

            await signOut(auth);
            setUsuarioActual(null);
            setCargandoSesion(false);
            return;
          }

          const referenciaUsuario = doc(
            db,
            'usuarios',
            firebaseUser.uid
          );

          const documentoUsuario = await getDoc(
            referenciaUsuario
          );

          if (!documentoUsuario.exists()) {
            await AsyncStorage.multiRemove([
              'mericar_fecha_sesion',
              'mericar_app_bloqueada',
            ]);

            await signOut(auth);
            setUsuarioActual(null);
            setCargandoSesion(false);
            return;
          }

          const datosUsuario = {
            id: documentoUsuario.id,
            ...documentoUsuario.data(),
          };

          if (datosUsuario.estado !== 'ACTIVO') {
            await AsyncStorage.multiRemove([
              'mericar_fecha_sesion',
              'mericar_app_bloqueada',
            ]);

            await signOut(auth);
            setUsuarioActual(null);
            setCargandoSesion(false);
            return;
          }

          const appBloqueada = await AsyncStorage.getItem(
            'mericar_app_bloqueada'
          );

          if (appBloqueada === 'true') {
            setUsuarioActual(null);
            setCargandoSesion(false);
            return;
          }

          setUsuarioActual(datosUsuario);
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
    const referencia = collection(db, 'usuarios');

    const cancelarEscucha = onSnapshot(
      referencia,
      (snapshot) => {
        const datos = snapshot.docs.map(
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
    const referencia = collection(
      db,
      'solicitudesUsuarios'
    );

    const cancelarEscucha = onSnapshot(
      referencia,
      (snapshot) => {
        const datos = snapshot.docs.map(
          (documento) => ({
            id: documento.id,
            ...documento.data(),
          })
        );

        datos.sort((a, b) => {
          const fechaA =
            a.fechaSolicitud || '';

          const fechaB =
            b.fechaSolicitud || '';

          return fechaB.localeCompare(
            fechaA
          );
        });

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

  const registrarSolicitud = async ({
    nombre,
    correo,
    password,
    rol,
  }) => {
    try {
      const nombreLimpio =
        nombre.trim();

      const correoLimpio = correo
        .trim()
        .toLowerCase();

      // ------------------------------------------
      // 1. CREAR CUENTA EN FIREBASE AUTHENTICATION
      // ------------------------------------------

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

      // ------------------------------------------
      // 2. CREAR USUARIO PENDIENTE EN FIRESTORE
      // ------------------------------------------

      await setDoc(
        doc(
          db,
          'usuarios',
          uid
        ),
        {
          nombre: nombreLimpio,

          usuario: correoLimpio,

          correo: correoLimpio,

          rol,

          estado: 'PENDIENTE',

          solicitaRestablecimiento:
            false,

          fechaRegistro:
            new Date().toISOString(),
        }
      );

      // ------------------------------------------
      // 3. CREAR SOLICITUD PARA EL ADMINISTRADOR
      // ------------------------------------------

      await addDoc(
        collection(
          db,
          'solicitudesUsuarios'
        ),
        {
          uidUsuario: uid,

          nombre: nombreLimpio,

          usuario: correoLimpio,

          correo: correoLimpio,

          rol,

          estado: 'PENDIENTE',

          fechaSolicitud:
            new Date().toISOString(),
        }
      );

      // ------------------------------------------
      // 4. CERRAR SESIÓN DEL USUARIO RECIÉN CREADO
      // ------------------------------------------

      /*
        createUserWithEmailAndPassword inicia
        automáticamente sesión con la cuenta
        que acaba de crear.

        Como esa cuenta todavía está PENDIENTE,
        cerramos inmediatamente esa sesión.
      */

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
    }
  };

  // ==========================================
  // EXISTE SOLICITUD
  // ==========================================

  const existeSolicitud = (
    correo
  ) => {
    const correoLimpio = correo
      .trim()
      .toLowerCase();

    return solicitudes.some(
      (item) =>
        item.correo?.toLowerCase() ===
          correoLimpio &&
        item.estado === 'PENDIENTE'
    );
  };

  // ==========================================
  // EXISTE USUARIO
  // ==========================================

  const existeUsuario = (
    valor
  ) => {
    const busqueda = valor
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

  const aprobarSolicitud = async (
    solicitudId
  ) => {
    try {
      const solicitud =
        solicitudes.find(
          (item) =>
            item.id === solicitudId
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

      // ------------------------------------------
      // ACTIVAR USUARIO
      // ------------------------------------------

      await updateDoc(
        doc(
          db,
          'usuarios',
          uid
        ),
        {
          estado: 'ACTIVO',

          fechaAprobacion:
            new Date().toISOString(),
        }
      );

      // ------------------------------------------
      // MARCAR SOLICITUD COMO APROBADA
      // ------------------------------------------

      await updateDoc(
        doc(
          db,
          'solicitudesUsuarios',
          solicitudId
        ),
        {
          estado: 'APROBADA',

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

  const rechazarSolicitud = async (
    solicitudId
  ) => {
    try {
      const solicitud =
        solicitudes.find(
          (item) =>
            item.id === solicitudId
        );

      if (!solicitud) {
        return false;
      }

      const uid =
        solicitud.uidUsuario;

      // ------------------------------------------
      // MARCAR USUARIO COMO RECHAZADO
      // ------------------------------------------

      if (uid) {
        await updateDoc(
          doc(
            db,
            'usuarios',
            uid
          ),
          {
            estado: 'RECHAZADO',

            fechaRechazo:
              new Date().toISOString(),
          }
        );
      }

      // ------------------------------------------
      // MARCAR SOLICITUD COMO RECHAZADA
      // ------------------------------------------

      await updateDoc(
        doc(
          db,
          'solicitudesUsuarios',
          solicitudId
        ),
        {
          estado: 'RECHAZADA',

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

  const cambiarEstadoUsuario = async (
    usuarioId
  ) => {
    try {
      const usuario =
        usuarios.find(
          (item) =>
            item.id === usuarioId
        );

      if (!usuario) {
        return false;
      }

      const nuevoEstado =
        usuario.estado === 'ACTIVO'
          ? 'INHABILITADO'
          : 'ACTIVO';

      await updateDoc(
        doc(
          db,
          'usuarios',
          usuarioId
        ),
        {
          estado: nuevoEstado,
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

  /*
    IMPORTANTE:

    Por ahora esta función elimina el documento
    de Firestore.

    La cuenta de Firebase Authentication no
    puede eliminarse de forma segura desde
    una cuenta administradora usando solamente
    el SDK cliente.

    Más adelante podemos hacerlo mediante
    Firebase Admin / Cloud Functions.
  */

  const borrarUsuario = async (
    usuarioId
  ) => {
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
    async (correo) => {
      try {
        const correoLimpio =
          correo
            .trim()
            .toLowerCase();

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

      const notificacionesActuales = [
        ...solicitudesPendientes,
        ...restablecimientos,
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

      const notificacionesActuales = [
        ...solicitudesPendientes,
        ...restablecimientos,
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

  const autenticarUsuario = async (
    username,
    password
  ) => {
    try {
      const valor = username
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

      // ------------------------------------------
      // CUENTA PENDIENTE
      // ------------------------------------------

      if (
        usuarioEncontrado.estado ===
        'PENDIENTE'
      ) {
        return {
          error: 'PENDIENTE',
        };
      }

      // ------------------------------------------
      // CUENTA RECHAZADA
      // ------------------------------------------

      if (
        usuarioEncontrado.estado ===
        'RECHAZADO'
      ) {
        return {
          error: 'RECHAZADO',
        };
      }

      // ------------------------------------------
      // CUENTA INHABILITADA
      // ------------------------------------------

      if (
        usuarioEncontrado.estado ===
        'INHABILITADO'
      ) {
        return {
          error: 'INHABILITADO',
        };
      }

      // ------------------------------------------
      // CUALQUIER OTRO ESTADO NO ACTIVO
      // ------------------------------------------

      if (
        usuarioEncontrado.estado !==
        'ACTIVO'
      ) {
        return {
          error: 'NO_ACTIVO',
        };
      }

      const correo =
        usuarioEncontrado.correo;

      // ------------------------------------------
      // FIREBASE VALIDA LA CONTRASEÑA
      // ------------------------------------------

      autenticandoManualRef.current = true;

      try {
        const credencial = await signInWithEmailAndPassword(
          auth,
          correo,
          password
        );

        const referenciaUsuario = doc(
          db,
          'usuarios',
          credencial.user.uid
        );

        const documentoUsuario = await getDoc(
          referenciaUsuario
        );

        if (!documentoUsuario.exists()) {
          await signOut(auth);
          return { error: 'NO_ACTIVO' };
        }

        const datosUsuario = {
          id: documentoUsuario.id,
          ...documentoUsuario.data(),
        };

        if (datosUsuario.estado !== 'ACTIVO') {
          await signOut(auth);

          return {
            error: datosUsuario.estado || 'NO_ACTIVO',
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
        autenticandoManualRef.current = false;
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
    setUsuarioActual(usuario);
  };

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const bloquearSesion = async () => {
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

  const desbloquearSesionConPin = async (usuario) => {
    try {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        return { error: 'SIN_SESION_FIREBASE' };
      }

      if (String(firebaseUser.uid) !== String(usuario.id)) {
        return { error: 'USUARIO_DIFERENTE' };
      }

      const fechaSesion = await AsyncStorage.getItem(
        'mericar_fecha_sesion'
      );

      if (fechaSesion !== obtenerFechaActual()) {
        await AsyncStorage.multiRemove([
          'mericar_fecha_sesion',
          'mericar_app_bloqueada',
        ]);

        await signOut(auth);
        setUsuarioActual(null);

        return { error: 'JORNADA_VENCIDA' };
      }

      const documentoUsuario = await getDoc(
        doc(db, 'usuarios', firebaseUser.uid)
      );

      if (!documentoUsuario.exists()) {
        return { error: 'USUARIO_NO_DISPONIBLE' };
      }

      const datosUsuario = {
        id: documentoUsuario.id,
        ...documentoUsuario.data(),
      };

      if (datosUsuario.estado !== 'ACTIVO') {
        await signOut(auth);
        setUsuarioActual(null);

        return {
          error: datosUsuario.estado || 'NO_ACTIVO',
        };
      }

      await AsyncStorage.removeItem(
        'mericar_app_bloqueada'
      );

      setUsuarioActual(datosUsuario);

      return {
        ok: true,
        usuario: datosUsuario,
      };
    } catch (error) {
      console.log(
        'Error al desbloquear con PIN:',
        error
      );

      return { error: 'ERROR_PIN' };
    }
  };

  const cerrarSesion = async () => {
    try {
      await AsyncStorage.multiRemove([
        'mericar_fecha_sesion',
        'mericar_app_bloqueada',
      ]);

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