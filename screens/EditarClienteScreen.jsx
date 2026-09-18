import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useClientes } from '../context/ClientesContext';
import { useToast } from '../context/ToastContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BotonHome from '../components/BotonHome';

const DIAS = ['Lunes', 'Miércoles', 'Jueves', 'Domingo'];

const EditarClienteScreen = ({ navigation, route }) => {
  const { cliente } = route.params;

  const { editarCliente } = useClientes();
  const { mostrarToast } = useToast();

  const insets = useSafeAreaInsets()

  const [nombre, setNombre] = useState(
    cliente.nombre ||
      `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
  );

  const [cedula, setCedula] = useState(
    cliente.cedula || ''
  );

  const [telefono, setTelefono] = useState(
    cliente.telefono || ''
  );

  const [correo, setCorreo] = useState(
    cliente.correo || ''
  );

  const [direccion, setDireccion] = useState(
    cliente.direccion || ''
  );

  const [diasTrabajo, setDiasTrabajo] = useState(
    cliente.diasTrabajo || []
  );

  const [observaciones, setObservaciones] = useState(
    cliente.observaciones || ''
  );

  const cambiarDia = (dia) => {
    setDiasTrabajo((actuales) =>
      actuales.includes(dia)
        ? actuales.filter((item) => item !== dia)
        : [...actuales, dia]
    );
  };

  const guardarCambios = () => {
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      mostrarToast(
        'Ingrese el nombre del cliente.',
        'warning'
      );
      return;
    }

    if (diasTrabajo.length === 0) {
      mostrarToast(
        'Seleccione al menos un día de entrega.',
        'warning'
      );
      return;
    }

    editarCliente({
      id: cliente.id,
      nombre: nombreLimpio,
      cedula: cedula.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
      direccion: direccion.trim(),
      diasTrabajo,
      observaciones: observaciones.trim(),
    });

    mostrarToast(
      'Cliente actualizado correctamente.',
      'success'
    );

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#08752F"
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.regresar}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <Text style={styles.tituloHeader}>
          Editar cliente
        </Text>
        <BotonHome navigation={navigation} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.contenido,
            {
              paddingBottom: 30 + insets.bottom,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.icono}>
            <Ionicons
              name="person"
              size={58}
              color="#08752F"
            />
          </View>

          <Text style={styles.titulo}>
            Editar cliente
          </Text>

          <Text style={styles.subtitulo}>
            Modifique la información del cliente.
          </Text>

          <Text style={styles.label}>
            Nombre del cliente *
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="person"
              size={19}
              color="#999999"
            />

            <TextInput
              style={styles.input}
              placeholder="Ingrese el nombre del cliente"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
              selectTextOnFocus
            />
          </View>

          <Text style={styles.label}>
            Días de entrega *
          </Text>

          <Text style={styles.descripcionDias}>
            Seleccione los días en los que se realizan entregas.
          </Text>

          <View style={styles.dias}>
            {DIAS.map((dia) => {
              const seleccionado = diasTrabajo.includes(dia);

              return (
                <TouchableOpacity
                  key={dia}
                  style={[
                    styles.diaCard,
                    seleccionado && styles.diaSeleccionado,
                  ]}
                  onPress={() => cambiarDia(dia)}
                >
                  <Ionicons
                    name={
                      seleccionado
                        ? 'checkbox'
                        : 'square-outline'
                    }
                    size={21}
                    color="#08752F"
                  />

                  <Text style={styles.textoDia}>
                    {dia}
                  </Text>

                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#08752F"
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>
            Cédula
            <Text style={styles.opcional}>
              {' '}(opcional)
            </Text>
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="card-outline"
              size={19}
              color="#999999"
            />

            <TextInput
              style={styles.input}
              placeholder="Ingrese la cédula"
              keyboardType="numeric"
              value={cedula}
              onChangeText={setCedula}
              selectTextOnFocus
            />
          </View>

          <Text style={styles.label}>
            Teléfono
            <Text style={styles.opcional}>
              {' '}(opcional)
            </Text>
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="call"
              size={19}
              color="#999999"
            />

            <TextInput
              style={styles.input}
              placeholder="Ingrese el teléfono"
              keyboardType="phone-pad"
              value={telefono}
              onChangeText={setTelefono}
              selectTextOnFocus
            />
          </View>

          <Text style={styles.label}>
            Correo
            <Text style={styles.opcional}>
              {' '}(opcional)
            </Text>
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={19}
              color="#999999"
            />

            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={correo}
              onChangeText={setCorreo}
              selectTextOnFocus
            />
          </View>

          <Text style={styles.label}>
            Dirección
            <Text style={styles.opcional}>
              {' '}(opcional)
            </Text>
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="location-outline"
              size={19}
              color="#999999"
            />

            <TextInput
              style={styles.input}
              placeholder="Ingrese la dirección"
              value={direccion}
              onChangeText={setDireccion}
              selectTextOnFocus
            />
          </View>

          <Text style={styles.label}>
            Observaciones
            <Text style={styles.opcional}>
              {' '}(opcional)
            </Text>
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="chatbubble-ellipses"
              size={19}
              color="#999999"
            />

            <TextInput
              style={styles.input}
              placeholder="Ingrese observaciones"
              value={observaciones}
              onChangeText={setObservaciones}
              selectTextOnFocus
            />
          </View>

          <TouchableOpacity
            style={styles.guardar}
            onPress={guardarCambios}
          >
            <Ionicons
              name="save-outline"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.textoGuardar}>
              Guardar cambios
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default EditarClienteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 100,
    backgroundColor: '#08752F',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },

  regresar: {
    position: 'absolute',
    left: 18,
    bottom: 11,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tituloHeader: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
  },

  contenido: {
    paddingHorizontal: 23,
    paddingVertical: 16,
    paddingBottom: 30,
  },

  icono: {
    alignSelf: 'center',
    width: 100,
    height: 80,
    borderRadius: 50,
    backgroundColor: '#E5F3E9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  titulo: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 5,
  },

  subtitulo: {
    textAlign: 'center',
    color: '#777777',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },

  opcional: {
    fontWeight: '400',
    color: '#666666',
  },

  inputContainer: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
  },

  input: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 14,
  },

  descripcionDias: {
    color: '#777777',
    fontSize: 11,
    marginBottom: 10,
  },

  dias: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  diaCard: {
    width: '23%',
    minHeight: 72,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  diaSeleccionado: {
    backgroundColor: '#ECF7EF',
    borderColor: '#08752F',
  },

  textoDia: {
    fontSize: 11,
    color: '#08752F',
    fontWeight: '600',
  },

  guardar: {
    height: 52,
    borderRadius: 9,
    backgroundColor: '#08752F',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },

  textoGuardar: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
