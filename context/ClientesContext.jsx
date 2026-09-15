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
} from 'firebase/firestore';

import { db } from '../firebase/config';

const ClientesContext = createContext();

export const ClientesProvider = ({ children }) => {

  const [clientes, setClientes] = useState([]);

  // ==========================================
  // LEER CLIENTES EN TIEMPO REAL
  // ==========================================

  useEffect(() => {

    const referenciaClientes = collection(
      db,
      'clientes'
    );

    const cancelarEscucha = onSnapshot(
      referenciaClientes,

      (snapshot) => {

        const listaClientes =
          snapshot.docs.map((documento) => ({
            id: documento.id,
            ...documento.data(),
          }));

        setClientes(listaClientes);
      },

      (error) => {
        console.log(
          'Error al leer clientes:',
          error
        );
      }
    );

    return () => cancelarEscucha();

  }, []);

  // ==========================================
  // AGREGAR CLIENTE
  // ==========================================

  const agregarCliente = async (cliente) => {

    try {

      const nuevoCliente = {
        saldoPendiente: 0,
        ultimaEntrega: null,
        ...cliente,
      };

      await addDoc(
        collection(db, 'clientes'),
        nuevoCliente
      );

      return true;

    } catch (error) {

      console.log(
        'Error al agregar cliente:',
        error
      );

      return false;
    }
  };

  // ==========================================
  // EDITAR CLIENTE
  // ==========================================

  const editarCliente = async (
    clienteEditado
  ) => {

    try {

      const referenciaCliente = doc(
        db,
        'clientes',
        clienteEditado.id
      );

      const {
        id,
        ...datosCliente
      } = clienteEditado;

      await updateDoc(
        referenciaCliente,
        datosCliente
      );

      return true;

    } catch (error) {

      console.log(
        'Error al editar cliente:',
        error
      );

      return false;
    }
  };

  return (
    <ClientesContext.Provider
      value={{
        clientes,
        agregarCliente,
        editarCliente,
      }}
    >
      {children}
    </ClientesContext.Provider>
  );
};

export const useClientes = () =>
  useContext(ClientesContext);