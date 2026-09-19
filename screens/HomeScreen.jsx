import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { useUsuarios } from '../context/UsuariosContext';
import { useToast } from '../context/ToastContext';
import { useAlert } from '../context/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { obtenerRegistrosAntiguos } from '../utils/registrosAntiguos';
import { useEntregas } from '../context/EntregasContext';



const HomeScreen = ({
  navigation,
}) => {
  const { mostrarToast } =
    useToast();

  const { mostrarAlert } =
    useAlert();

  const { entregas } = useEntregas();

  const registrosAntiguos =
    obtenerRegistrosAntiguos(entregas);

  const cantidadRegistrosAntiguos =
    registrosAntiguos.length;

  const {
    usuarioActual,
    bloquearSesion,
    obtenerNotificacionesUsuarios,
  } = useUsuarios();

  const insets = useSafeAreaInsets();

  // ==========================================
  // USUARIO ACTUAL
  // ==========================================

  const nombreUsuario =
    usuarioActual?.nombre ||
    'Usuario';

  const rol =
    usuarioActual?.rol ||
    '';

  const esAdministrador =
    rol ===
    'ADMINISTRADOR';

  // ==========================================
  // NOTIFICACIONES
  // ==========================================

  const notificacionesUsuarios =
    obtenerNotificacionesUsuarios();

  // ==========================================
  // NOMBRE DEL ROL
  // ==========================================

  const obtenerNombreRol =
    () => {
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

      return rol ||
        'Usuario';
    };

  // ==========================================
  // MÓDULOS
  // ==========================================

  const MODULOS = [
    {
      id: 'clientes',
      titulo: 'Clientes',
      tipoIcono:
        'ionicons',
      icono:
        'people',
      pantalla:
        'Clientes',
    },

    {
      id: 'entregas',
      titulo: 'Entregas',
      tipoIcono:
        'material',
      icono:
        'truck',
      pantalla:
        'Entregas',
    },

    {
      id: 'registros',
      titulo: 'Usuarios',
      tipoIcono:
        'ionicons',
      icono:
        'person-add',
      pantalla:
        'Registros',
      soloAdministrador:
        true,
    },

    {
      id: 'inventario',
      titulo: 'Inventario',
      tipoIcono:
        'ionicons',
      icono:
        'cube',
      pantalla:
        'Inventario',
    },

    {
      id: 'productos',
      titulo: 'Productos',
      tipoIcono:
        'ionicons',
      icono:
        'basket',
      pantalla:
        'Productos',
    },

    {
      id: 'reportes',
      titulo: 'Reportes',
      tipoIcono:
        'ionicons',
      icono:
        'bar-chart',
      pantalla:
        'Reportes',
    },
  ];

  // ==========================================
  // ABRIR MÓDULO
  // ==========================================

  const abrirModulo = (
    modulo
  ) => {
    if (
      modulo.soloAdministrador &&
      !esAdministrador
    ) {
      mostrarToast(
        'El apartado de Usuarios está restringido.',
        'warning'
      );

      return;
    }

    navigation.navigate(
      modulo.pantalla
    );
  };

  // ==========================================
  // MOSTRAR ICONO
  // ==========================================

  const mostrarIcono = (
    modulo,
    bloqueado
  ) => {
    const color =
      bloqueado
        ? '#9CA3A0'
        : '#08752F';

    if (
      modulo.tipoIcono ===
      'material'
    ) {
      return (
        <MaterialCommunityIcons
          name={
            modulo.icono
          }
          size={34}
          color={color}
        />
      );
    }

    return (
      <Ionicons
        name={
          modulo.icono
        }
        size={34}
        color={color}
      />
    );
  };

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const salir = () => {
  mostrarAlert({
    titulo: 'Cerrar sesión',
    mensaje:
      '¿Estás seguro de que deseas salir?',
    tipo: 'question',
    textoConfirmar: 'Salir',
    textoCancelar: 'Cancelar',
    mostrarCancelar: true,

    onConfirmar: async () => {
      await bloquearSesion();

      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Login',
          },
        ],
      });
    },
  });
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
        <View
          style={
            styles.usuarioContainer
          }
        >
          <View
            style={
              styles.avatar
            }
          >
            <Ionicons
              name="person"
              size={37}
              color="#08752F"
            />
          </View>

          <View
            style={
              styles.usuarioInfo
            }
          >
            <Text
              style={
                styles.saludo
              }
              numberOfLines={1}
            >
              Hola,{' '}
              {nombreUsuario}
            </Text>

            <View
              style={
                styles.rolContainer
              }
            >
              <Ionicons
                name="shield-checkmark"
                size={13}
                color="#08752F"
              />

              <Text
                style={
                  styles.rolTexto
                }
              >
                {obtenerNombreRol()}
              </Text>
            </View>
          </View>
        </View>

      {/* PAPELERA DE REGISTROS */}

        <TouchableOpacity
          style={styles.botonRegistrosAntiguos}
          onPress={() =>
            navigation.navigate('RegistrosAntiguos')
          }
        >
          <Ionicons
            name="trash-outline"
            size={32}
            color="#FFFFFF"
          />

          {cantidadRegistrosAntiguos > 0 && (
            <View style={styles.badgeRegistros}>
              <Text style={styles.badgeRegistrosTexto}>
                {cantidadRegistrosAntiguos > 99
                  ? '99+'
                  : cantidadRegistrosAntiguos}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* CONTENIDO */}

      <View
        style={
          styles.contenido
        }
      >
        <View>
          <Text
            style={
              styles.tituloPrincipal
            }
          >
            Menú principal
          </Text>

          <Text
            style={
              styles.descripcion
            }
          >
            Selecciona una opción para continuar
          </Text>
        </View>

        <View
          style={
            styles.grid
          }
        >
          {MODULOS.map(
            (modulo) => {
              const bloqueado =
                modulo.soloAdministrador &&
                !esAdministrador;

              const esUsuarios =
                modulo.id ===
                'registros';

              return (
                <TouchableOpacity
                  key={
                    modulo.id
                  }
                  style={[
                    styles.tarjeta,

                    bloqueado &&
                      styles.tarjetaBloqueada,
                  ]}
                  activeOpacity={
                    0.75
                  }
                  onPress={() =>
                    abrirModulo(
                      modulo
                    )
                  }
                >
                  {/* NOTIFICACIÓN */}

                  {esUsuarios &&
                    esAdministrador &&
                    notificacionesUsuarios >
                      0 && (
                      <View
                        style={
                          styles.badgeNotificacion
                        }
                      >
                        <Text
                          style={
                            styles.badgeNotificacionTexto
                          }
                        >
                          {notificacionesUsuarios >
                          99
                            ? '99+'
                            : notificacionesUsuarios}
                        </Text>
                      </View>
                    )}

                  {/* ICONO */}

                  <View
                    style={[
                      styles.iconoContainer,

                      bloqueado &&
                        styles.iconoBloqueado,
                    ]}
                  >
                    {mostrarIcono(
                      modulo,
                      bloqueado
                    )}
                  </View>

                  {/* CANDADO */}

                  {bloqueado && (
                    <Ionicons
                      name="lock-closed"
                      size={15}
                      color="#999999"
                      style={
                        styles.candado
                      }
                    />
                  )}

                  {/* TÍTULO */}

                  <Text
                    style={[
                      styles.tituloModulo,

                      bloqueado &&
                        styles.textoBloqueado,
                    ]}
                  >
                    {
                      modulo.titulo
                    }
                  </Text>

                  {/* FLECHA */}

                  <View
                    style={[
                      styles.flechaContainer,

                      bloqueado &&
                        styles.flechaBloqueada,
                    ]}
                  >
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={
                        bloqueado
                          ? '#999999'
                          : '#08752F'
                      }
                    />
                  </View>
                </TouchableOpacity>
              );
            }
          )}
        </View>
      </View>

      {/* BARRA INFERIOR */}

      <View
        style={[
          styles.bottomNavigation,
          {
            paddingBottom: insets.bottom,
            height: 76 + insets.bottom,
          },
        ]}
      >
        <TouchableOpacity
          style={
            styles.navItem
          }
        >
          <Ionicons
            name="home"
            size={27}
            color="#08752F"
          />

          <Text
            style={
              styles.navActivo
            }
          >
            Inicio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.navItem
          }
          onPress={() =>
            navigation.navigate(
              'Perfil'
            )
          }
        >
          <Ionicons
            name="person-outline"
            size={27}
            color="#222222"
          />

          <Text
            style={
              styles.navTexto
            }
          >
            Perfil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.navItem
          }
          onPress={
            salir
          }
        >
          <Ionicons
            name="log-out-outline"
            size={29}
            color="#222222"
          />

          <Text
            style={
              styles.navTexto
            }
          >
            Salir
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:'#F7F8F9',
    },

    header: {
      height: 165,
      backgroundColor:'#08752F',
      paddingHorizontal: 18,
      paddingTop: 28,
      justifyContent:'center',
    },

    usuarioContainer: {
      flexDirection:'row',
      alignItems:'center',
    },

    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor:'#FFFFFF',
      justifyContent:'center',
      alignItems:'center',
    },

    usuarioInfo: {
      flex: 1,
      marginLeft: 14,
    },

    saludo: {
      color:'#FFFFFF',
      fontSize: 20,
      fontWeight:'700',
    },

    rolContainer: {
      alignSelf:'flex-start',
      marginTop: 7,
      minHeight: 23,
      backgroundColor:'#FFFFFF',
      borderRadius: 13,
      paddingHorizontal: 9,
      flexDirection:'row',
      alignItems:'center',
      gap: 4,
    },

    rolTexto: {
      color:'#08752F',
      fontSize: 10,
      fontWeight:'700',
    },

    contenido: {
      flex: 1,
      backgroundColor:'#F7F8F9',
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      marginTop: -20,
      paddingHorizontal: 14,
      paddingTop: 27,
      paddingBottom: 16,
    },

    tituloPrincipal: {
      color:'#202020',
      fontSize: 22,
      fontWeight:'800',
    },

    descripcion: {
      color:'#888888',
      fontSize: 12,
      marginTop: 5,
      marginBottom: 18,
    },

    grid: {
      flex: 1,
      flexDirection:'row',
      flexWrap:'wrap',
      justifyContent:'space-between',
      alignContent:'space-between',
    },

    tarjeta: {
      width: '48%',
      height: '30.8%',
      minHeight: 125,
      backgroundColor:'#FFFFFF',
      borderWidth: 1,
      borderColor:'#E3E3E3',
      borderRadius: 16,
      paddingHorizontal: 15,
      paddingVertical: 15,
      shadowColor:'#000000',
      shadowOffset: {width: 0,height: 3,},
      shadowOpacity: 0.08,
      shadowRadius: 5,
      elevation: 4,
    },

    tarjetaBloqueada: {
      backgroundColor:'#F3F3F3',
    },

    badgeNotificacion: {
      position:'absolute',
      top: 10,
      right: 10,
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor:'#D93025',
      justifyContent:'center',
      alignItems:'center',
      paddingHorizontal: 6,
      zIndex: 10,
      elevation: 6,
      borderWidth: 2,
      borderColor:'#FFFFFF',
    },

    badgeNotificacionTexto: {
      color:'#FFFFFF',
      fontSize: 10,
      fontWeight:'800',
    },

    iconoContainer: {
      width: 55,
      height: 55,
      borderRadius: 14,
      backgroundColor:'#E8F6EC',
      justifyContent:'center',
      alignItems:'center',
    },

    iconoBloqueado: {
      backgroundColor:'#E5E5E5',
    },

    tituloModulo: {
      color:'#202020',
      fontSize: 15,
      fontWeight:'700',
      marginTop: 13,
    },

    textoBloqueado: {
      color:'#999999',
    },

    candado: {
      position:'absolute',
      top: 14,
      right: 14,
    },

    flechaContainer: {
      position:'absolute',
      right: 13,
      bottom: 13,
      width: 33,
      height: 33,
      borderRadius: 17,
      backgroundColor:'#E8F6EC',
      justifyContent:'center',
      alignItems:'center',
    },

    flechaBloqueada: {
      backgroundColor:'#E5E5E5',
    },

    bottomNavigation: {
      height: 76,
      backgroundColor:'#FFFFFF',
      borderTopWidth: 1,
      borderTopColor:'#E5E5E5',
      flexDirection:'row',
      justifyContent:'space-around',
      alignItems:'center',
    },

    navItem: {
      flex: 1,
      height: '100%',
      justifyContent:'center',
      alignItems:'center',
    },

    navTexto: {
      marginTop: 3,
      fontSize: 10,
      color:'#333333',
    },

    navActivo: {
      marginTop: 3,
      fontSize: 10,
      color:'#08752F',
      fontWeight:'700',
    },

    botonRegistrosAntiguos: {
      position: 'absolute',
      right: 18,
      bottom: 45,
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },

    badgeRegistros: {
      position: 'absolute',
      top: 1,
      right: 1,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#D71920',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },

    badgeRegistrosTexto: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },
  });