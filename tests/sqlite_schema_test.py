"""Pruebas de integración del esquema SQLite con la biblioteca estándar."""
from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / "src/data/database.js").read_text(encoding="utf-8")
match = re.search(r"const schema = `([\s\S]*?)`;\n", source)
if not match:
    raise SystemExit("No se encontró el esquema SQL en src/data/database.js")

connection = sqlite3.connect(":memory:")
connection.execute("PRAGMA foreign_keys = ON")
connection.executescript(match.group(1))
tables = [row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")]
assert len(tables) == 17, f"Se esperaban 17 tablas y hay {len(tables)}: {tables}"

connection.execute("INSERT INTO users(id,nombre,email,password_hash,creado_en,actualizado_en) VALUES('u','Usuario Test','u@test.local','hash','now','now')")
connection.execute("INSERT INTO families(id,nombre,creado_por,creado_en,actualizado_en) VALUES('f','Familia','u','now','now')")
connection.execute("INSERT INTO family_members(id,user_id,family_id,rol,estado,unido_en) VALUES('m','u','f','admin','activo','now')")
connection.execute("INSERT INTO categories(id,tipo,nombre,icono,color,creado_en) VALUES('c','gasto','Comida','food','#fff','now')")
connection.execute("INSERT INTO transactions(id,family_id,user_id,categoria_id,tipo,monto_centavos,fecha,descripcion,creado_en,actualizado_en) VALUES('t','f','u','c','gasto',1234,'2026-11-20','Compra','now','now')")

try:
    connection.execute("INSERT INTO transactions(id,family_id,user_id,categoria_id,tipo,monto_centavos,fecha,descripcion,creado_en,actualizado_en) VALUES('bad','f','u','c','ingreso',1234,'2026-11-20','Categoría incorrecta','now','now')")
    raise AssertionError("Se permitió una categoría incompatible")
except sqlite3.IntegrityError:
    pass

connection.execute("INSERT INTO saving_goals(id,family_id,nombre,monto_objetivo_centavos,creado_en,actualizado_en) VALUES('g','f','Meta',10000,'now','now')")
connection.execute("INSERT INTO goal_contributions(id,goal_id,user_id,monto_centavos,fecha,creado_en) VALUES('gc','g','u',2500,'2026-11-20','now')")
assert connection.execute("SELECT monto_acumulado_centavos FROM saving_goals WHERE id='g'").fetchone()[0] == 2500
connection.execute("UPDATE goal_contributions SET deleted_at='now' WHERE id='gc'")
assert connection.execute("SELECT monto_acumulado_centavos FROM saving_goals WHERE id='g'").fetchone()[0] == 0

connection.execute("INSERT INTO debts(id,family_id,creado_por,responsable_id,titulo,tipo,contraparte,monto_total_centavos,saldo_pendiente_centavos,fecha_creacion,estado,actualizado_en) VALUES('d','f','u','u','Deuda','por_pagar','X',10000,10000,'2026-11-20','pendiente','now')")
connection.execute("INSERT INTO debt_payments(id,debt_id,user_id,monto_centavos,fecha,creado_en) VALUES('dp','d','u',3000,'2026-11-20','now')")
assert connection.execute("SELECT saldo_pendiente_centavos,estado FROM debts WHERE id='d'").fetchone() == (7000, 'parcial')
for statement in (
    "INSERT INTO debt_payments(id,debt_id,user_id,monto_centavos,fecha,creado_en) VALUES('dp2','d','u',8000,'2026-11-20','now')",
    "UPDATE debt_payments SET monto_centavos=11000 WHERE id='dp'",
):
    try:
        connection.execute(statement)
        raise AssertionError("Se permitió un pago superior al saldo")
    except sqlite3.IntegrityError:
        pass
connection.execute("UPDATE debt_payments SET deleted_at='now' WHERE id='dp'")
assert connection.execute("SELECT saldo_pendiente_centavos,estado FROM debts WHERE id='d'").fetchone() == (10000, 'pendiente')

connection.execute("INSERT INTO recurring_rules(id,family_id,user_id,tipo,categoria_id,monto_centavos,descripcion,frecuencia,proxima_fecha,creado_en) VALUES('r','f','u','gasto','c',100,'Internet','mensual','2026-11-20','now')")
statement = "INSERT OR IGNORE INTO transactions(id,family_id,user_id,categoria_id,tipo,monto_centavos,fecha,descripcion,es_recurrente,creado_en,actualizado_en,actualizado_por,recurring_rule_id,recurring_occurrence_key) VALUES(?,?,?,?,?,?,?,?,1,?,?,?,?,?)"
values = ('rec1','f','u','c','gasto',100,'2026-11-20','Internet','now','now','u','r','2026-11-20')
connection.execute(statement, values)
connection.execute(statement, values)
assert connection.execute("SELECT COUNT(*) FROM transactions WHERE recurring_rule_id='r'").fetchone()[0] == 1

assert connection.execute("PRAGMA foreign_key_check").fetchall() == []
assert connection.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
print("OK: 17 tablas, claves foráneas, categorías, metas, deudas y recurrencias.")
