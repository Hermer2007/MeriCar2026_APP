import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] =
    useState(false);

  const iniciarSesion = () => {
    if (!usuario.trim() || !contrasena.trim()) {
      Alert.alert(
        'Campos incompletos',
        'Ingresa tu usuario y contraseña.'
      );
      return;
    }

    /*
      Más adelante reemplazaremos esto por la consulta
      real al backend y PostgreSQL.
    */
    navigation.replace('Home', {
      nombreUsuario: usuario.trim(),
      rol: 'EMPLEADO',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.contenido}
        behavior={
          Platform.OS === 'ios' ? 'padding' : undefined
        }
      >
        <View style={styles.encabezado}>
          <TouchableOpacity
            style={styles.botonRegresar}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={30}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.titulo}>
            Iniciar sesión
          </Text>
        </View>

        <View style={styles.formulario}>
          <Text style={styles.etiqueta}>
            Usuario
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ingrese su usuario"
            placeholderTextColor="#A0A0A0"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            returnKeyType="next"
          />

          <Text style={styles.etiquetaContrasena}>
            Contraseña
          </Text>

          <View style={styles.inputConIcono}>
            <TextInput
              style={styles.inputPassword}
              placeholder="Ingrese su contraseña"
              placeholderTextColor="#A0A0A0"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry={!mostrarContrasena}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={iniciarSesion}
            />

            <TouchableOpacity
              style={styles.botonOjo}
              onPress={() =>
                setMostrarContrasena(
                  (estadoAnterior) => !estadoAnterior
                )
              }
            >
              <Ionicons
                name={
                  mostrarContrasena
                    ? 'eye-off-outline'
                    : 'eye-outline'
                }
                size={24}
                color="#111111"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Recuperar contraseña',
                'Esta función se conectará posteriormente con el sistema de usuarios.'
              )
            }
          >
            <Text style={styles.olvido}>
              ¿Olvidó su contraseña?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botonIngresar}
            activeOpacity={0.85}
            onPress={iniciarSesion}
          >
            <Text style={styles.textoBoton}>
              Iniciar sesión
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  contenido: {
    flex: 1,
  },

  encabezado: {
    height: 120,
    backgroundColor: '#08752F',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },

  botonRegresar: {
    position: 'absolute',
    left: 22,
    bottom: 28,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '700',
    marginTop: 15,
  },

  formulario: {
    paddingHorizontal: 25,
    paddingTop: 38,
  },

  etiqueta: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 10,
  },

  etiquetaContrasena: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginTop: 28,
    marginBottom: 10,
  },

  input: {
    height: 58,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 13,
    paddingHorizontal: 17,
    fontSize: 17,
    color: '#111111',
    backgroundColor: '#FFFFFF',
  },

  inputConIcono: {
    height: 58,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  inputPassword: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 17,
    fontSize: 17,
    color: '#111111',
  },

  botonOjo: {
    width: 55,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  olvido: {
    fontSize: 16,
    color: '#08752F',
    marginTop: 20,
  },

  botonIngresar: {
    height: 60,
    backgroundColor: '#08752F',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },

  textoBoton: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },
});