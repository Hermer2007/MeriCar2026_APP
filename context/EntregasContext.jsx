import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../firebase/config';

const EntregasContext = createContext();

export const EntregasProvider = ({ children }) => {

  const [entregas, setEntregas] = useState([]);

  // ==========================================
  // LEER ENTREGAS EN TIEMPO REAL
  // ==========================================

  useEffect(() => {

    const referenciaEntregas = query(
      collection(db, 'entregas'),
      orderBy('fechaCreacion', 'desc')
    );

    const cancelarEscucha = onSnapshot(
      referenciaEntregas,

      (snapshot) => {

        const listaEntregas =
          snapshot.docs.map((documento) => ({
            id: documento.id,
            ...documento.data(),
          }));

        setEntregas(listaEntregas);
      },

      (error) => {
        console.log(
          'Error al leer entregas:',
          error
        );
      }
    );

    return () => cancelarEscucha();

  }, []);

  // ==========================================
  // AGREGAR ENTREGA
  // ==========================================

  const agregarEntrega = async (
    nuevaEntrega
  ) => {

    try {

      const entregaGuardar = {
        ...nuevaEntrega,
        fechaCreacion: serverTimestamp(),
      };

      await addDoc(
        collection(db, 'entregas'),
        entregaGuardar
      );

      return true;

    } catch (error) {

      console.log(
        'Error al agregar entrega:',
        error
      );

      return false;
    }
  };

  // ==========================================
  // ACTUALIZAR ENTREGA
  // ==========================================

  const actualizarEntrega = async (
    entregaActualizada
  ) => {

    try {

      const referenciaEntrega = doc(
        db,
        'entregas',
        entregaActualizada.id
      );

      const {
        id,
        fechaCreacion,
        ...datosEntrega
      } = entregaActualizada;

      await updateDoc(
        referenciaEntrega,
        datosEntrega
      );

      return true;

    } catch (error) {

      console.log(
        'Error al actualizar entrega:',
        error
      );

      return false;
    }
  };

  // ==========================================
  // OBTENER ENTREGAS DE UN CLIENTE
  // ==========================================

  const obtenerEntregasCliente = (
    clienteId
  ) => {

    return entregas.filter(
      (entrega) =>
        String(entrega.clienteId) ===
        String(clienteId)
    );
  };

  return (
    <EntregasContext.Provider
      value={{
        entregas,
        agregarEntrega,
        actualizarEntrega,
        obtenerEntregasCliente,
      }}
    >
      {children}
    </EntregasContext.Provider>
  );
};

export const useEntregas = () =>
  useContext(EntregasContext);