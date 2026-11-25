# Modelo de datos MiBolsillo (17 entidades)

Los importes monetarios se almacenan como enteros de centavos (`monto_centavos`) para evitar errores de coma flotante. Fechas se guardan en ISO `YYYY-MM-DD`; marcas temporales en ISO 8601. Los booleanos se representan con `INTEGER` 0/1. JSON de auditoría se conserva como texto JSON.

| N.º | Tabla | Propósito | Relaciones principales |
|---:|---|---|---|
| 1 | `users` | Cuentas y credenciales con hash | Creador de familias, miembro, propietario de movimientos |
| 2 | `families` | Espacio financiero familiar y moneda | Creador → `users` |
| 3 | `family_members` | Membresía, rol y estado | `users`, `families` |
| 4 | `invitations` | Códigos únicos, vencimiento y uso | `families`, creador/usuario usado |
| 5 | `categories` | Categorías globales o familiares | `families` opcional |
| 6 | `transactions` | Ingresos y gastos | `families`, `users`, `categories`, regla recurrente opcional |
| 7 | `receipts` | Referencia a archivo local de comprobante | `transactions` (máximo 1 por movimiento) |
| 8 | `favorite_transactions` | Plantillas de movimientos frecuentes | `families`, `users`, `categories` |
| 9 | `budgets` | Presupuestos personales o familiares | `families`, `users` opcional, `categories` opcional |
| 10 | `saving_goals` | Objetivos de ahorro y acumulado | `families`, `users` opcional |
| 11 | `goal_contributions` | Aportes y reversión | `saving_goals`, `users` |
| 12 | `debts` | Deudas por pagar/cobrar y saldo | `families`, creador y responsable en `users` |
| 13 | `debt_payments` | Pagos y reversión | `debts`, `users`, transacción opcional |
| 14 | `recurring_rules` | Reglas de generación periódica | `families`, `users`, `categories` |
| 15 | `notifications` | Alertas internas locales | `users`, `families` |
| 16 | `push_tokens` | Tokens reservados para futura integración | `users` |
| 17 | `audit_log` | Historial de operaciones | Guarda IDs de familia/usuario como datos de auditoría |

## Reglas e índices destacados

- Un usuario solo puede tener una membresía activa a la vez (`idx_unique_active_member`), igual que el modelo PostgreSQL suministrado.
- Categorías globales y familiares no se duplican por tipo y nombre normalizado.
- Una transacción requiere que su usuario pertenezca a la familia y que la categoría activa coincida con el tipo de movimiento.
- `receipts.transaction_id` es único.
- Las aportaciones recalculan el acumulado de la meta en INSERT/UPDATE/DELETE.
- Los pagos recalculan saldo y estado de deuda; no se aceptan pagos por encima del saldo.
- `recurring_occurrence_key` y un índice único parcial en `transactions` impiden generar dos veces la misma ocurrencia. Son columnas técnicas, no una tabla adicional.
- Las consultas de transacciones usan parámetros `?`.
- La versión del esquema se controla con `PRAGMA user_version`.

## Relaciones y alcance local

La base se almacena en el dispositivo. Los miembros, códigos de invitación, alertas y datos no se sincronizan entre teléfonos. Un código de invitación puede aceptarse únicamente dentro de la misma instalación/base local. `push_tokens` no implica envío de push.
