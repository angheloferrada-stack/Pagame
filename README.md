# Gastos Compartidos 💸

PWA simple para organizar grupos de amigos, registrar quién compró qué y cuánto gastó, y calcular automáticamente quién le debe pagar a quién para que todos terminen pagando lo mismo (usa un algoritmo que minimiza el número de transferencias).

Funciona 100% en el navegador (sin backend): los datos se guardan en `localStorage`, así que quedan solo en el dispositivo/navegador donde se usa.

## Cómo subirla a GitHub Pages

1. Crea un repositorio nuevo en GitHub (ej: `gastos-pwa`).
2. Sube todos estos archivos a la raíz del repo:
   ```
   git init
   git add .
   git commit -m "Primera versión de la app"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/gastos-pwa.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Source**, selecciona la rama `main` y la carpeta `/ (root)`. Guarda.
4. En un par de minutos tu app quedará disponible en:
   `https://TU_USUARIO.github.io/gastos-pwa/`

## Instalarla como app (PWA)

Abre el link en el celular (Chrome/Safari) y usa "Agregar a pantalla de inicio" (o el ícono de instalar que aparece en la barra de direcciones en desktop). Quedará como una app normal, con ícono propio y funcionando sin conexión.

## Cómo se usa

1. Crea un grupo y escribe los nombres de tus amigos separados por coma.
2. Cada vez que alguien compre algo, agrega un gasto: descripción, monto, quién pagó y entre quiénes se divide (puedes destildar a alguien si esa compra no le corresponde).
3. En la pestaña **Balance** vas a ver cuánto gastó cada uno y, más abajo, la lista de "Pagos sugeridos": quién le transfiere plata a quién y cuánto, para que al final todos hayan puesto lo mismo.

## Estructura del proyecto

```
├── index.html      → estructura de la app
├── style.css       → estilos (tema oscuro, mobile-first)
├── app.js          → lógica: grupos, gastos, cálculo de deudas
├── manifest.json   → metadata de la PWA
├── sw.js           → service worker (offline)
└── icons/          → íconos de la app
```

## Posibles mejoras futuras

- Sincronizar entre varios celulares (necesitaría un backend, ej. Firebase).
- Exportar el resumen de un grupo como imagen o texto para compartir por WhatsApp.
- Categorías de gastos.
