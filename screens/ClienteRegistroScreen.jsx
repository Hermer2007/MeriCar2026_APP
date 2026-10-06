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
  Switch,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useClientes } from '../context/ClientesContext';
import { useEntregas } from '../context/EntregasContext';
import { useToast } from '../context/ToastContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BotonHome from '../components/BotonHome';

const DIAS = ['Lunes', 'Miércoles', 'Jueves', 'Sábado', 'Domingo'];

const ClienteRegistroScreen = ({ navigation, route, }) => {
  const { mostrarToast } = useToast();
  const { agregarCliente } = useClientes();
  const { vincularEntregaACliente, } = useEntregas();

  const insets = useSafeAreaInsets()

  const [nombre, setNombre] = useState(
    route.params?.nombreTemporal || ''
  );
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [diasTrabajo, setDiasTrabajo] = useState([]);
  const [facturacion, setFacturacion] = useState(false);
  const [aliasFacturacion, setAliasFacturacion] = useState('');

  const entregaTemporalId =
    route.params?.entregaTemporalId || null;

  const cambiarDia = (dia) => {
    setDiasTrabajo((actuales) =>
      actuales.includes(dia)
        ? actuales.filter((item) => item !== dia)
        : [...actuales, dia]
    );
  };

  const guardarCliente = async () => {
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

    const nuevoCliente = {
      nombre: nombreLimpio,
      cedula: cedula.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
      direccion: direccion.trim(),
      diasTrabajo,
      facturacion,
      aliasFacturacion:
        facturacion
          ? aliasFacturacion.trim()
          : '',
    };

    const resultado =
      await agregarCliente(nuevoCliente);

    if (!resultado?.ok) {
      mostrarToast(
        'No se pudo registrar el cliente.',
        'error'
      );

      return;
    }

    if (entregaTemporalId) {
      const resultadoVinculacion =
        await vincularEntregaACliente(
          entregaTemporalId,
          resultado.id
        );

      if (!resultadoVinculacion?.ok) {
        mostrarToast(
          'El cliente fue registrado, pero no se pudo vincular la entrega.',
          'warning'
        );

        return;
      }
    }

    mostrarToast(
      'Cliente registrado correctamente.',
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
          Agregar cliente
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
              name="person-add"
              size={58}
              color="#08752F"
            />
          </View>

          <Text style={styles.titulo}>
            Nuevo cliente
          </Text>

          <Text style={styles.subtitulo}>
            Complete los datos para registrar
            {'\n'}un nuevo cliente.
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
              placeholderTextColor="#999999"
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

          {/* FACTURACIÓN */}

          <View style={styles.facturacionCard}>

            <View style={styles.facturacionIcono}>

              <Ionicons
                name="receipt-outline"
                size={27}
                color="#08752F"
              />

            </View>


            <View style={styles.facturacionInfo}>

              <Text style={styles.facturacionTitulo}>
                Facturación
              </Text>

              <Text style={styles.facturacionDescripcion}>
                Incluir a este cliente en la facturación del día.
              </Text>

            </View>


            <Switch
              value={facturacion}
              onValueChange={setFacturacion}
              trackColor={{
                false: '#D5D5D5',
                true: '#63C487',
              }}
              thumbColor={
                facturacion
                  ? '#08752F'
                  : '#F4F4F4'
              }
            />

          </View>

          {facturacion && (
            <View style={styles.aliasContainer}>

              <Text style={styles.aliasLabel}>
                Alias para facturación (opcional)
              </Text>

              <View style={styles.inputContainer}>

                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#08752F"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Ingrese el nombre para facturación"
                  placeholderTextColor="#999999"
                  value={aliasFacturacion}
                  onChangeText={setAliasFacturacion}
                />

              </View>

              <Text style={styles.aliasAyuda}>
                Este nombre se mostrará en Facturación del día.
              </Text>

            </View>
          )}

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
              placeholderTextColor="#999999"
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
              placeholderTextColor="#999999"
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
              placeholderTextColor="#999999"
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
              placeholderTextColor="#999999"
              value={direccion}
              onChangeText={setDireccion}
              selectTextOnFocus
            />
          </View>

          <TouchableOpacity
            style={styles.guardar}
            onPress={guardarCliente}
          >
            <Ionicons
              name="person-add"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.textoGuardar}>
              Guardar cliente
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ClienteRegistroScreen;

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
    color: '#000000',
  },

  descripcionDias: {
    color: '#777777',
    fontSize: 11,
    marginBottom: 10,
  },

  dias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
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

  facturacionCard: {
    minHeight: 78,
    marginTop: 18,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  facturacionIcono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5F3E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  facturacionInfo: {
    flex: 1,
    paddingRight: 10,
  },

  facturacionTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 3,
  },

  facturacionDescripcion: {
    fontSize: 11,
    lineHeight: 15,
    color: '#777777',
  },

  aliasContainer: {
    marginTop: 14,
    marginBottom: 4,
  },

  aliasLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 7,
  },

  aliasAyuda: {
    fontSize: 10,
    color: '#888888',
    marginTop: 5,
    marginLeft: 3,
  },
});