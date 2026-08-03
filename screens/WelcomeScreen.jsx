import React, { useEffect } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  useEffect(() => {
    const temporizador = setTimeout(() => {
      navigation.replace('Login');
    }, 2500);

    return () => clearTimeout(temporizador);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.decoracionSuperior} />
      <View style={styles.decoracionInferior} />

      <View style={styles.contenido}>
        <Image
          source={require('../assets/images/logo-mericar.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.bienvenido}>
          Bienvenido
        </Text>

        <Text style={styles.descripcion}>
          Sistema de gestión para
        </Text>

        <Text style={styles.empresa}>
          Distribuidora de Huevos
        </Text>

        <View style={styles.barraFondo}>
          <View style={styles.barraProgreso} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  contenido: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    zIndex: 2,
  },

  logo: {
    width: 275,
    height: 245,
    marginBottom: 20,
  },

  bienvenido: {
    fontSize: 31,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 15,
  },

  descripcion: {
    fontSize: 18,
    color: '#222222',
    textAlign: 'center',
    marginBottom: 7,
  },

  empresa: {
    fontSize: 18,
    fontWeight: '700',
    color: '#08752F',
    textAlign: 'center',
  },

  barraFondo: {
    width: 82,
    height: 6,
    backgroundColor: '#B9DEC6',
    borderRadius: 20,
    marginTop: 55,
    overflow: 'hidden',
  },

  barraProgreso: {
    width: '55%',
    height: '100%',
    backgroundColor: '#08752F',
    borderRadius: 20,
    alignSelf: 'flex-end',
  },

  decoracionSuperior: {
    position: 'absolute',
    width: 300,
    height: 170,
    top: -75,
    left: -85,
    borderRadius: 150,
    backgroundColor: '#08752F',
    transform: [{ rotate: '-12deg' }],
  },

  decoracionInferior: {
    position: 'absolute',
    width: 330,
    height: 180,
    right: -120,
    bottom: -100,
    borderRadius: 180,
    backgroundColor: '#68B76C',
    transform: [{ rotate: '-14deg' }],
  },
});