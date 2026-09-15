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

const InventarioContext = createContext();

export const InventarioProvider = ({
  children,
}) => {

  const [inventario, setInventario] =
    useState([]);

  // ==========================================
  // LEER INVENTARIO
  // ==========================================

  useEffect(() => {

    const referenciaInventario =
      collection(
        db,
        'inventario'
      );

    const cancelarEscucha =
      onSnapshot(
        referenciaInventario,

        (snapshot) => {

          const listaInventario =
            snapshot.docs.map(
              (documento) => ({
                id: documento.id,
                ...documento.data(),
              })
            );

          setInventario(
            listaInventario
          );
        },

        (error) => {
          console.log(
            'Error al leer inventario:',
            error
          );
        }
      );

    return () =>
      cancelarEscucha();

  }, []);

  // ==========================================
  // REGISTRAR O ACTUALIZAR STOCK
  // ==========================================

  const registrarStock = async (
    nuevoRegistro
  ) => {

    try {

      const registroExistente =
        inventario.find(
          (registro) =>
            registro.fecha ===
            nuevoRegistro.fecha
        );

      // ======================================
      // ACTUALIZAR REGISTRO DEL DÍA
      // ======================================

      if (registroExistente) {

        const referenciaRegistro =
          doc(
            db,
            'inventario',
            registroExistente.id
          );

        await updateDoc(
          referenciaRegistro,
          nuevoRegistro
        );

        return 'actualizado';
      }

      // ======================================
      // CREAR REGISTRO NUEVO
      // ======================================

      await addDoc(
        collection(
          db,
          'inventario'
        ),
        nuevoRegistro
      );

      return 'nuevo';

    } catch (error) {

      console.log(
        'Error al registrar stock:',
        error
      );

      return false;
    }
  };

  return (
    <InventarioContext.Provider
      value={{
        inventario,
        registrarStock,
      }}
    >
      {children}
    </InventarioContext.Provider>
  );
};

export const useInventario = () => {
  return useContext(
    InventarioContext
  );
};