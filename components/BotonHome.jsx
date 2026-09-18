import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BotonHome({
  navigation,
}) {
  return (
    <TouchableOpacity
      style={styles.boton}
      onPress={() =>
        navigation.navigate('Home')
      }
    >
      <Ionicons
        name="home-outline"
        size={27}
        color="#FFFFFF"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  boton: {
    position: 'absolute',
    right: 18,
    bottom: 15,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
});