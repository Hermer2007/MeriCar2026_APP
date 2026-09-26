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
  deleteDoc,
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

      const documentoCliente = await addDoc(
        collection(db, 'clientes'),
        nuevoCliente
      );

      return {
        ok: true,
        id: documentoCliente.id,
      };

    } catch (error) {

      console.log(
        'Error al agregar cliente:',
        error
      );

      return {
        ok: false,
        id: null,
      };
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

  // ==========================================
  // GUARDAR ORDEN DE CLIENTES POR DÍA
  // ==========================================

  const guardarOrdenClientes = async (
    dia,
    clientesOrdenados
  ) => {

    try {

      const claveDia =
        String(dia)
          .trim()
          .toLowerCase();

      const actualizaciones =
        clientesOrdenados.map(
          async (cliente, index) => {

            const referenciaCliente =
              doc(
                db,
                'clientes',
                cliente.id
              );

            const ordenActual = {
              ...(cliente.ordenEntregaPorDia || {}),
            };

            ordenActual[claveDia] =
              index + 1;

            await updateDoc(
              referenciaCliente,
              {
                ordenEntregaPorDia:
                  ordenActual,
              }
            );
          }
        );

      await Promise.all(
        actualizaciones
      );

      return true;

    } catch (error) {

      console.log(
        'Error al guardar orden de clientes:',
        error
      );

      return false;
    }
  };

  const eliminarCliente = async (
    clienteId
  ) => {
    try {
      if (!clienteId) {
        return false;
      }

      const referenciaCliente = doc(
        db,
        'clientes',
        clienteId
      );

      await deleteDoc(
        referenciaCliente
      );

      return true;
    } catch (error) {
      console.log(
        'Error al eliminar cliente:',
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
        eliminarCliente,
        editarCliente,
        guardarOrdenClientes,
      }}
    >
      {children}
    </ClientesContext.Provider>
  );
};

export const useClientes = () =>
  useContext(ClientesContext);