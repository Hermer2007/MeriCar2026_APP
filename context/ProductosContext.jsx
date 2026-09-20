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
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/config';

const ProductosContext = createContext();

export const ProductosProvider = ({ children }) => {

  const [productos, setProductos] = useState([]);

  // ==========================================
  // LEER PRODUCTOS EN TIEMPO REAL
  // ==========================================

  useEffect(() => {

    const referenciaProductos = collection(
      db,
      'productos'
    );

    const cancelarEscucha = onSnapshot(
      referenciaProductos,

      (snapshot) => {

        const listaProductos =
          snapshot.docs.map((documento) => ({
            id: documento.id,
            ...documento.data(),
          }));

        setProductos(listaProductos);
      },

      (error) => {
        console.log(
          'Error al leer productos:',
          error
        );
      }
    );

    return () => cancelarEscucha();

  }, []);

  // ==========================================
  // AGREGAR PRODUCTO
  // ==========================================

  const agregarProducto = async (
    nombre,
    precio,
    precioCompra
  ) => {

    try {

      const nuevoProducto = {
        nombre,
        precio,
        precioCompra,
      };

      await addDoc(
        collection(db, 'productos'),
        nuevoProducto
      );

      return true;

    } catch (error) {

      console.log(
        'Error al agregar producto:',
        error
      );

      return false;
    }
  };

  // ==========================================
  // ACTUALIZAR PRECIO DE VENTA
  // ==========================================

  const actualizarPrecio = async (
    id,
    nuevoPrecio
  ) => {

    try {

      const referenciaProducto = doc(
        db,
        'productos',
        id
      );

      await updateDoc(
        referenciaProducto,
        {
          precio: nuevoPrecio,
        }
      );

      return true;

    } catch (error) {

      console.log(
        'Error al actualizar precio de venta:',
        error
      );

      return false;
    }
  };

  // ==========================================
  // ACTUALIZAR PRECIO DE COMPRA
  // ==========================================

  const actualizarPrecioCompra = async (
    id,
    nuevoPrecioCompra
  ) => {

    try {

      const referenciaProducto = doc(
        db,
        'productos',
        id
      );

      await updateDoc(
        referenciaProducto,
        {
          precioCompra: nuevoPrecioCompra,
        }
      );

      return true;

    } catch (error) {

      console.log(
        'Error al actualizar precio de compra:',
        error
      );

      return false;
    }
  };

  // ==========================================
  // ELIMINAR PRODUCTO
  // ==========================================

  const eliminarProducto = async (id) => {

    try {

      const referenciaProducto = doc(
        db,
        'productos',
        id
      );

      await deleteDoc(
        referenciaProducto
      );

      return true;

    } catch (error) {

      console.log(
        'Error al eliminar producto:',
        error
      );

      return false;
    }
  };

  return (
    <ProductosContext.Provider
      value={{
        productos,
        agregarProducto,
        actualizarPrecio,
        actualizarPrecioCompra,
        eliminarProducto,
      }}
    >
      {children}
    </ProductosContext.Provider>
  );
};

export const useProductos = () => {
  return useContext(ProductosContext);
};