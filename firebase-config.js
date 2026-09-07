// ⚠️ Reemplaza esto con la configuración de TU proyecto de Firebase.
// La encuentras en: Firebase Console → ⚙️ Configuración del proyecto → General
// → "Tus apps" → ícono web (</>) → "Configuración del SDK" → selecciona "Config".
//
// Se ve más o menos así (son valores públicos, es normal que queden en el código):
//
// const firebaseConfig = {
//   apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//   authDomain: "tu-proyecto.firebaseapp.com",
//   projectId: "tu-proyecto",
//   storageBucket: "tu-proyecto.appspot.com",
//   messagingSenderId: "123456789012",
//   appId: "1:123456789012:web:abcdef1234567890"
// };

const firebaseConfig = {
  apiKey: "AIzaSyD1t7ocR-b4d1Y7r7ku2gHkpV5V4ccASgE",
  authDomain: "pagameapp-62e3c.firebaseapp.com",
  projectId: "pagameapp-62e3c",
  storageBucket: "pagameapp-62e3c.firebasestorage.app",
  messagingSenderId: "76329030516",
  appId: "1:76329030516:web:0fb79411926996cf439221"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
