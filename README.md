# MiBolsillo v2.0

App móvil de finanzas familiares hecha con **React Native + Expo (SDK 58)**, **SQLite** (`expo-sqlite`) y React Navigation. Todo se guarda en el dispositivo (sin servidor).

## Cómo ejecutarla
Requisitos: Node.js LTS, npm y **Expo Go compatible con SDK 58**.

```bash
npm install
npx expo start
```
Escanea el QR con Expo Go (o `npx expo start --android`). La primera ejecución crea `mibolsillo.db` automáticamente. Si Expo avisa de versiones desalineadas: `npx expo install --fix`.

## Qué incluye
- Cuentas locales con contraseña protegida (PBKDF2 + sal) y sesión en `expo-secure-store`.
- Grupo familiar: un grupo propio al registrarse, invitaciones de un solo uso (solo válidas en el mismo dispositivo).
- Movimientos: crear, **editar**, eliminar (con auditoría), filtrar por tipo/visibilidad/método, favoritos, comprobante con cámara o galería.
- Categorías del sistema + personalizadas (administrador). Los formularios las leen de la base.
- Presupuestos familiares o personales que se **renuevan solos** cada semana/mes, con alertas al 80 % y 100 %.
- Metas de ahorro (estado "completada" automático), deudas con pagos/cobros, movimientos recurrentes sin duplicados.
- **Tipo de cambio USD → BOB** (API pública `open.er-api.com`, sin clave): consulta en línea, último valor guardado si no hay internet, balance en dólares y convertidor. Es la única función que usa internet.
- Estadísticas, reporte mensual navegable, notificaciones locales con contador, tema claro/oscuro.

## Estructura
```
App.js                  Proveedores y pantalla de error de arranque
src/context/            AppContext (sesión, movimientos, resumen) y ThemeContext
src/navigation/         RootNavigator (auth ↔ app según sesión), BottomBar
src/screens/            auth · home · movements · statistics · planning · family · notifications · profile
src/components/         UI (Page, Glass, Field, Button...), TransactionRow, CategoryPicker
src/services/           Lógica de negocio (auth, presupuestos, metas, deudas, reportes...)
src/data/               database.js (esquema, triggers, semillas) y acceso a datos por tabla
src/utils/              Formato, fechas locales, montos, íconos de categoría
tests/                  Pruebas de la capa de datos y del esquema
docs/                   Modelo de datos, esquema SQL y registro de cambios
```
Regla de capas: **pantalla → servicio → base de datos**. Las pantallas no ejecutan SQL.

## Pruebas
```bash
npm test               # capa de datos sobre SQLite real (Node 22.13 o superior)
npm run test:schema    # esquema SQL con Python
```

## Límites conocidos
- Los datos son locales: no hay sincronización entre teléfonos ni correo/push reales. Solo el tipo de cambio necesita internet.
- No se pudo probar en un dispositivo físico desde el entorno de revisión (ver `docs/CAMBIOS_REALIZADOS.md`).
