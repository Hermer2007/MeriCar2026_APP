import { initializeApp } from 'firebase/app';

import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';

import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBqUlpixE4UCbt-lVTO1wUdTyLEi6w-PKU',
  authDomain: 'mericar-1b27f.firebaseapp.com',
  projectId: 'mericar-1b27f',
  storageBucket: 'mericar-1b27f.firebasestorage.app',
  messagingSenderId: '626745853856',
  appId: '1:626745853856:web:132ef7f4ee640ce5e3c6c5',
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence:
    getReactNativePersistence(
      AsyncStorage
    ),
});

const db = getFirestore(app);

export {
  app,
  auth,
  db,
};