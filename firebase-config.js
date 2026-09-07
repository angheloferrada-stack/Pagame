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
  apiKey: "PEGA_AQUI_TU_API_KEY",
  authDomain: "PEGA_AQUI.firebaseapp.com",
  projectId: "PEGA_AQUI_TU_PROJECT_ID",
  storageBucket: "PEGA_AQUI.appspot.com",
  messagingSenderId: "PEGA_AQUI",
  appId: "PEGA_AQUI"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
