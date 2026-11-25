# Revisión y mejoras (noviembre 2026)

## Verificado
- `npm install` normal (sin `--legacy-peer-deps`) y versiones alineadas con Expo SDK 58.
- El bundle Android compila con Metro (1043 módulos, sin errores).
- ESLint (`no-undef`, reglas de hooks) sin errores en `src/`.
- 13 pruebas de integración sobre SQLite real (`npm test`) + prueba del esquema en Python: todas pasan.
- **No verificado:** ejecución en Expo Go / dispositivo (cámara, galería, aspecto visual, rendimiento).

## Errores corregidos
1. **Pantalla de recurrentes se cerraba** al haber reglas: usaba `t` (tema) sin definirlo.
2. **Movimientos sin categoría ni ícono**: la lectura no unía la tabla de categorías; ahora muestra nombre, color e ícono (los nombres de ícono de la base se traducen a MaterialCommunityIcons).
3. **Montos con coma** ("12,50", teclado típico en español): en metas, deudas, presupuestos y aportes producían errores confusos. Ahora todo pasa por `toCents`.
4. **Fecha UTC vs local**: desde las 20:00 en Bolivia los registros salían con la fecha de mañana. Todo usa fecha local.
5. **Categorías personalizadas no servían**: el formulario de movimientos tenía listas fijas. Ahora lee la base (también en presupuestos y recurrentes).
6. **Presupuestos**: nunca se renovaban y siempre eran personales. Ahora hay periodo vigente que rota y alcance familiar/personal. Las alertas se repiten por periodo y llegan a cada miembro (antes la clave única global dejaba sin alerta al segundo usuario).
7. **Campos de correo** se capitalizaban (`Field` ignoraba `autoCapitalize`).
8. **Reglas recurrentes inválidas** (categoría desactivada) rompían la carga de datos; ahora se omiten y se informa.
9. `withTransaction` no devolvía el resultado.
10. Metas nunca pasaban a "completada".

## Coherencia
- Navegación por sesión: al iniciar/cerrar sesión la app cambia sola (se eliminaron 5 `replace('Main')` y el `reset` manual). Onboarding se muestra tras registrarse.
- Pantallas inalcanzables ahora enlazadas: Reporte mensual (desde Estadísticas) y Recurrentes (Planificación y Más).
- Pantalla Filtros (no hacía nada) integrada en Movimientos; eliminadas las pantallas duplicadas `Budgets/Debts/Goals` y `EmailVerification`.
- Las pantallas ya no ejecutan SQL: nuevos servicios de categorías, favoritos, notificaciones y reportes.
- Interfaz: zona segura (notch), botón "Volver" automático, teclado que no tapa campos, botones con estado de carga (importante: crear cuenta/iniciar sesión tarda por PBKDF2), pantalla de error de arranque con "Reintentar".
- Nuevo: editar movimientos, quitar favoritos, marcar notificaciones como leídas, contador en la campana.
- Documentación: README reescrito (decía que no había base de datos); eliminados `FIX_SUMMARY(S).md`, `INSTALACION.md`, `TEST_REPORT.md` desactualizados.

## Para decidir tú
- Los 14 archivos de `src/data/*.js` por tabla (`metas.js`, `usuarios.js`...) no se usan en pantallas; se conservaron por si la materia los exige. Si no, se pueden borrar.
- `authService`: el hash de contraseña ahora usa 2 000 rondas de PBKDF2 (antes 310 000, ≈ 2 minutos en Expo Go; ahora ≈ 2-3 s). Es menos costoso de romper por fuerza bruta si alguien copiara la base; como los datos son locales y viven en el almacenamiento privado de la app, se consideró aceptable. Las cuentas antiguas siguen entrando (la primera vez tardará lo de antes) y se actualizan solas. Para subirlo, cambia `iterations` en `src/services/authService.js`.

## Tipo de cambio (tomado del proyecto de un compañero)
Se extrajo la consulta a `open.er-api.com` y se integró siguiendo la arquitectura de esta app: `services/exchangeRateService.js` + `screens/home/ExchangeRateScreen.js`. Mejoras sobre el original: tiempo máximo de espera de 10 s, caché en SQLite (se ve el último valor sin internet), convertidor Bs ↔ USD, uso de las utilidades comunes y acceso desde Inicio y Más. Probado con 5 pruebas con `fetch` simulado; **no** se probó contra la API real desde el entorno de revisión.
