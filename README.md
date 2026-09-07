# Gastos Compartidos 💸

PWA para organizar grupos de amigos, registrar gastos y calcular automáticamente quién le debe pagar a quién para que todos terminen pagando lo mismo (algoritmo que minimiza el número de transferencias).

Funciona **online**: los grupos viven en Firebase Firestore, así que puedes mandar un link y cualquiera que lo abra se une al grupo y ve/agrega gastos en tiempo real, sin necesidad de crear cuenta (solo escriben su nombre).

## 1. Configurar Firebase (una sola vez, ~5 min)

Como ya tienes proyectos en Firebase, puedes crear uno nuevo o reusar uno:

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) → crea un proyecto (o entra a uno existente).
2. En el menú lateral entra a **Firestore Database** → **Crear base de datos** → elige **modo de producción** → cualquier región (ej. `us-central`).
3. Ve a **Firestore Database → Reglas** y pega esto (permite que cualquiera con el link lea/escriba grupos, pero nada más):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /groups/{groupId} {
         allow read, write: if true;
       }
     }
   }
   ```
   Dale a **Publicar**. (Es una regla abierta a propósito para que funcione sin login; cualquiera con el link del grupo puede editarlo, igual que con un link de invitación de Google Docs).
4. Ve a **⚙️ Configuración del proyecto → General → Tus apps** → clic en el ícono web `</>` → regístrala con cualquier apodo (no marques Hosting).
5. Copia el objeto `firebaseConfig` que te muestra y pégalo en el archivo **`firebase-config.js`** de este proyecto, reemplazando los valores de ejemplo.

Eso es todo el backend — no hay servidor que mantener.

## 2. Subir a GitHub Pages

```
git init
git add .
git commit -m "App de gastos compartidos online"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/gastos-pwa.git
git push -u origin main
```

En GitHub: **Settings → Pages → Source** → rama `main`, carpeta `/ (root)` → Guardar.

Tu app quedará en `https://TU_USUARIO.github.io/gastos-pwa/`.

## 3. Cómo se usa

1. Creas un grupo con su nombre y el tuyo propio.
2. Tocas el ícono 🔗 arriba para copiar el link del grupo (o compartirlo directo por WhatsApp si el celular lo soporta).
3. Cualquiera que abra el link escribe su nombre una vez y queda dentro del grupo — no necesita instalar nada ni crear cuenta.
4. Todos pueden agregar gastos (qué se compró, cuánto, quién pagó, entre quiénes se reparte) y los cambios se ven en tiempo real en los celulares de todos.
5. En la pestaña **Balance** aparece cuánto gastó cada uno y los "pagos sugeridos" para saldar cuentas con el mínimo de transferencias.

## Notas importantes

- **Sin login = cualquiera con el link puede editar.** Es la misma lógica que un link de invitación de Google Docs. No compartas el link fuera del grupo de amigos.
- El nombre que escribes se guarda en tu navegador (no en el de nadie más), así no te lo vuelve a pedir la próxima vez que entres desde ese mismo celular.
- Firestore tiene una capa gratuita bastante generosa (50 mil lecturas y 20 mil escrituras al día); para un grupo de amigos normal no la vas a alcanzar a gastar.

## Estructura del proyecto

```
├── index.html          → estructura de la app
├── style.css           → estilos (tema oscuro, mobile-first)
├── app.js              → lógica: grupos, gastos, cálculo de deudas, sync en tiempo real
├── firebase-config.js  → ⚠️ EDITAR con tus credenciales de Firebase
├── manifest.json        → metadata de la PWA
├── sw.js                → service worker (cachea solo assets estáticos, no los datos)
└── icons/                → íconos de la app
```

## Posibles mejoras futuras

- Reglas de Firestore más finas (ej. código de invitación en vez de link directo abierto).
- Exportar el resumen de un grupo como imagen o texto para compartir por WhatsApp.
- Notificaciones push cuando alguien agrega un gasto.
