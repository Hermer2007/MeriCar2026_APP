import React, { useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function QRTransferencia() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.botonQr}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="qr-code-outline"
          size={21}
          color="#08752F"
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitulo}>
                  QR para transferencia
                </Text>

                <Text style={styles.modalSubtitulo}>
                  Escanea el código para realizar el pago
                </Text>
              </View>

              <TouchableOpacity
                style={styles.botonCerrar}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color="#555555"
                />
              </TouchableOpacity>
            </View>

            <Image
              source={require('../assets/images/qr-transferencia.png')}
              style={styles.imagenQr}
              resizeMode="contain"
            />

            <TouchableOpacity
              style={styles.botonListo}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.botonListoTexto}>
                Listo
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  botonQr: {
    width: 31,
    height: 31,
    borderRadius: 8,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  modalContenido: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    maxHeight: '90%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  modalTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#08752F',
  },

  modalSubtitulo: {
    fontSize: 12,
    color: '#777777',
    marginTop: 3,
  },

  botonCerrar: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  imagenQr: {
    width: '100%',
    height: 470,
    alignSelf: 'center',
  },

  botonListo: {
    backgroundColor: '#08752F',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  botonListoTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});