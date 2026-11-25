-- Esquema SQLite de MiBolsillo. Las semillas se insertan desde database.js.

CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, nombre TEXT NOT NULL CHECK(length(trim(nombre))>=2), email TEXT NOT NULL COLLATE NOCASE UNIQUE,
 password_hash TEXT NOT NULL, foto_url TEXT, email_verificado INTEGER NOT NULL DEFAULT 0 CHECK(email_verificado IN (0,1)),
 creado_en TEXT NOT NULL, actualizado_en TEXT NOT NULL, deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS families (
 id TEXT PRIMARY KEY, nombre TEXT NOT NULL CHECK(length(trim(nombre))>=2), moneda TEXT NOT NULL DEFAULT 'Bs',
 creado_por TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT, archivado INTEGER NOT NULL DEFAULT 0 CHECK(archivado IN (0,1)),
 creado_en TEXT NOT NULL, actualizado_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS family_members (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
 rol TEXT NOT NULL DEFAULT 'integrante' CHECK(rol IN ('admin','integrante','restringido')),
 estado TEXT NOT NULL DEFAULT 'activo' CHECK(estado IN ('activo','inactivo','expulsado')), unido_en TEXT NOT NULL, salio_en TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_member ON family_members(user_id) WHERE estado='activo';
CREATE TABLE IF NOT EXISTS invitations (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
 codigo TEXT NOT NULL UNIQUE CHECK(length(codigo)=8), creado_por TEXT NOT NULL REFERENCES users(id), vence_en TEXT NOT NULL,
 usado_por TEXT REFERENCES users(id) ON DELETE SET NULL, usado_en TEXT, revocada INTEGER NOT NULL DEFAULT 0 CHECK(revocada IN (0,1)), creado_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
 id TEXT PRIMARY KEY, family_id TEXT REFERENCES families(id) ON DELETE CASCADE,
 tipo TEXT NOT NULL CHECK(tipo IN ('ingreso','gasto')), nombre TEXT NOT NULL CHECK(length(trim(nombre))>=2),
 icono TEXT NOT NULL DEFAULT 'tag', color TEXT DEFAULT '#64748B', activa INTEGER NOT NULL DEFAULT 1 CHECK(activa IN (0,1)), creado_en TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_category_family ON categories(COALESCE(family_id,'SYSTEM'),tipo,lower(nombre));
CREATE TABLE IF NOT EXISTS transactions (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT, categoria_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
 tipo TEXT NOT NULL CHECK(tipo IN ('ingreso','gasto')), monto_centavos INTEGER NOT NULL CHECK(monto_centavos>0), fecha TEXT NOT NULL,
 descripcion TEXT NOT NULL CHECK(length(trim(descripcion))>=1), observacion TEXT,
 visibilidad TEXT NOT NULL DEFAULT 'familiar' CHECK(visibilidad IN ('familiar','personal')),
 metodo_pago TEXT DEFAULT 'efectivo' CHECK(metodo_pago IN ('efectivo','qr','transferencia','tarjeta','otro')),
 es_recurrente INTEGER NOT NULL DEFAULT 0 CHECK(es_recurrente IN (0,1)), deleted_at TEXT,
 creado_en TEXT NOT NULL, actualizado_en TEXT NOT NULL, actualizado_por TEXT REFERENCES users(id) ON DELETE SET NULL,
 recurring_rule_id TEXT REFERENCES recurring_rules(id) ON DELETE SET NULL, recurring_occurrence_key TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tx_recurring_once ON transactions(recurring_rule_id,recurring_occurrence_key) WHERE recurring_rule_id IS NOT NULL AND recurring_occurrence_key IS NOT NULL;
CREATE TABLE IF NOT EXISTS receipts (
 id TEXT PRIMARY KEY, transaction_id TEXT NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
 url TEXT NOT NULL, local_uri TEXT, sincronizado INTEGER NOT NULL DEFAULT 0 CHECK(sincronizado IN (0,1)), creado_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS favorite_transactions (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, nombre TEXT NOT NULL,
 tipo TEXT NOT NULL CHECK(tipo IN ('ingreso','gasto')), categoria_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
 metodo_pago TEXT DEFAULT 'efectivo', visibilidad TEXT NOT NULL DEFAULT 'familiar' CHECK(visibilidad IN ('familiar','personal')), creado_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS budgets (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
 user_id TEXT REFERENCES users(id) ON DELETE CASCADE, categoria_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
 nombre TEXT NOT NULL, monto_centavos INTEGER NOT NULL CHECK(monto_centavos>0), periodo TEXT NOT NULL DEFAULT 'mensual' CHECK(periodo IN ('semanal','mensual')),
 fecha_inicio TEXT NOT NULL, activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0,1)), creado_en TEXT NOT NULL, actualizado_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS saving_goals (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE, user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
 nombre TEXT NOT NULL, descripcion TEXT, monto_objetivo_centavos INTEGER NOT NULL CHECK(monto_objetivo_centavos>0),
 monto_acumulado_centavos INTEGER NOT NULL DEFAULT 0 CHECK(monto_acumulado_centavos>=0), fecha_limite TEXT,
 estado TEXT NOT NULL DEFAULT 'activa' CHECK(estado IN ('activa','completada','cancelada')), creado_en TEXT NOT NULL, actualizado_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS goal_contributions (
 id TEXT PRIMARY KEY, goal_id TEXT NOT NULL REFERENCES saving_goals(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT, monto_centavos INTEGER NOT NULL CHECK(monto_centavos>0),
 fecha TEXT NOT NULL, descripcion TEXT, deleted_at TEXT, creado_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS debts (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
 creado_por TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT, responsable_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 titulo TEXT NOT NULL, tipo TEXT NOT NULL CHECK(tipo IN ('por_pagar','por_cobrar')), contraparte TEXT NOT NULL,
 monto_total_centavos INTEGER NOT NULL CHECK(monto_total_centavos>0), saldo_pendiente_centavos INTEGER NOT NULL CHECK(saldo_pendiente_centavos>=0),
 fecha_creacion TEXT NOT NULL, vencimiento TEXT, estado TEXT NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente','parcial','pagada','cancelada')),
 observaciones TEXT, deleted_at TEXT, actualizado_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS debt_payments (
 id TEXT PRIMARY KEY, debt_id TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT, monto_centavos INTEGER NOT NULL CHECK(monto_centavos>0),
 fecha TEXT NOT NULL, transaction_id TEXT UNIQUE REFERENCES transactions(id) ON DELETE SET NULL, deleted_at TEXT, creado_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS recurring_rules (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, tipo TEXT NOT NULL CHECK(tipo IN ('ingreso','gasto')),
 categoria_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT, monto_centavos INTEGER NOT NULL CHECK(monto_centavos>0),
 descripcion TEXT NOT NULL, visibilidad TEXT NOT NULL DEFAULT 'familiar' CHECK(visibilidad IN ('familiar','personal')),
 metodo_pago TEXT DEFAULT 'efectivo', frecuencia TEXT NOT NULL CHECK(frecuencia IN ('semanal','quincenal','mensual','anual')),
 proxima_fecha TEXT NOT NULL, activa INTEGER NOT NULL DEFAULT 1 CHECK(activa IN (0,1)), creado_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
 tipo TEXT NOT NULL CHECK(tipo IN ('presupuesto','meta','deuda','familiar','consejo')),
 titulo TEXT NOT NULL, mensaje TEXT NOT NULL, leida INTEGER NOT NULL DEFAULT 0 CHECK(leida IN (0,1)), clave_unica TEXT NOT NULL UNIQUE, creada_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS push_tokens (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token TEXT NOT NULL UNIQUE, plataforma TEXT NOT NULL CHECK(plataforma IN ('android','ios')), actualizado_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_log (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL, user_id TEXT NOT NULL, entidad TEXT NOT NULL, entidad_id TEXT NOT NULL,
 accion TEXT NOT NULL CHECK(accion IN ('CREATE','UPDATE','DELETE','RESTORE')), datos_previos TEXT, datos_nuevos TEXT, fecha TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tx_family_date_active ON transactions(family_id,fecha DESC,visibilidad) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tx_family_category_active ON transactions(family_id,categoria_id,tipo,fecha) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tx_user_active ON transactions(user_id,fecha DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications(user_id,leida,creada_en DESC);
CREATE INDEX IF NOT EXISTS idx_debts_family_status_due ON debts(family_id,estado,vencimiento) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id,estado);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal ON goal_contributions(goal_id,fecha) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debt_id,fecha) WHERE deleted_at IS NULL;


CREATE TRIGGER IF NOT EXISTS trg_category_validate_insert BEFORE INSERT ON categories WHEN NEW.family_id IS NOT NULL BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE family_id=NEW.family_id AND user_id=(SELECT creado_por FROM families WHERE id=NEW.family_id) AND estado='activo' AND rol='admin') THEN RAISE(ABORT,'La familia no tiene administrador activo') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_goal_contribution_validate_update BEFORE UPDATE OF goal_id,user_id ON goal_contributions BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM saving_goals g JOIN family_members m ON m.family_id=g.family_id AND m.user_id=NEW.user_id AND m.estado='activo' WHERE g.id=NEW.goal_id) THEN RAISE(ABORT,'El usuario no pertenece a la familia de la meta') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_debt_payment_member_update BEFORE UPDATE OF debt_id,user_id ON debt_payments BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM debts d JOIN family_members m ON m.family_id=d.family_id AND m.user_id=NEW.user_id AND m.estado='activo' WHERE d.id=NEW.debt_id) THEN RAISE(ABORT,'El usuario no pertenece a la familia de la deuda') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_recurring_validate_update BEFORE UPDATE OF family_id,user_id,categoria_id,tipo ON recurring_rules BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE user_id=NEW.user_id AND family_id=NEW.family_id AND estado='activo') THEN RAISE(ABORT,'El usuario no pertenece a la familia de la regla') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM categories WHERE id=NEW.categoria_id AND tipo=NEW.tipo AND activa=1 AND (family_id IS NULL OR family_id=NEW.family_id)) THEN RAISE(ABORT,'La categoría no corresponde a la regla recurrente') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_budget_validate_update BEFORE UPDATE OF family_id,user_id ON budgets WHEN NEW.user_id IS NOT NULL BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE user_id=NEW.user_id AND family_id=NEW.family_id AND estado='activo') THEN RAISE(ABORT,'El usuario no pertenece a la familia del presupuesto') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_goal_validate_update BEFORE UPDATE OF family_id,user_id ON saving_goals WHEN NEW.user_id IS NOT NULL BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE user_id=NEW.user_id AND family_id=NEW.family_id AND estado='activo') THEN RAISE(ABORT,'El usuario no pertenece a la familia de la meta') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_tx_validate_insert BEFORE INSERT ON transactions BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE user_id=NEW.user_id AND family_id=NEW.family_id AND estado='activo') THEN RAISE(ABORT,'El usuario no pertenece a la familia activa') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM categories WHERE id=NEW.categoria_id AND tipo=NEW.tipo AND activa=1 AND (family_id IS NULL OR family_id=NEW.family_id)) THEN RAISE(ABORT,'La categoría no corresponde a la familia o al tipo') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_tx_validate_update BEFORE UPDATE OF family_id,user_id,categoria_id,tipo ON transactions BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE user_id=NEW.user_id AND family_id=NEW.family_id AND estado='activo') THEN RAISE(ABORT,'El usuario no pertenece a la familia activa') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM categories WHERE id=NEW.categoria_id AND tipo=NEW.tipo AND activa=1 AND (family_id IS NULL OR family_id=NEW.family_id)) THEN RAISE(ABORT,'La categoría no corresponde a la familia o al tipo') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_goal_contribution_validate BEFORE INSERT ON goal_contributions BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM saving_goals g JOIN family_members m ON m.family_id=g.family_id AND m.user_id=NEW.user_id AND m.estado='activo' WHERE g.id=NEW.goal_id) THEN RAISE(ABORT,'El usuario no pertenece a la familia de la meta') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_debt_payment_validate BEFORE INSERT ON debt_payments BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM debts d JOIN family_members m ON m.family_id=d.family_id AND m.user_id=NEW.user_id AND m.estado='activo' WHERE d.id=NEW.debt_id) THEN RAISE(ABORT,'El usuario no pertenece a la familia de la deuda') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_recurring_validate_insert BEFORE INSERT ON recurring_rules BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE user_id=NEW.user_id AND family_id=NEW.family_id AND estado='activo') THEN RAISE(ABORT,'El usuario no pertenece a la familia de la regla') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM categories WHERE id=NEW.categoria_id AND tipo=NEW.tipo AND activa=1 AND (family_id IS NULL OR family_id=NEW.family_id)) THEN RAISE(ABORT,'La categoría no corresponde a la regla recurrente') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_favorite_validate_insert BEFORE INSERT ON favorite_transactions BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE user_id=NEW.user_id AND family_id=NEW.family_id AND estado='activo') THEN RAISE(ABORT,'El usuario no pertenece a la familia del favorito') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM categories WHERE id=NEW.categoria_id AND tipo=NEW.tipo AND activa=1 AND (family_id IS NULL OR family_id=NEW.family_id)) THEN RAISE(ABORT,'La categoría no corresponde al favorito') END;
END;

CREATE TRIGGER IF NOT EXISTS trg_budget_validate_insert BEFORE INSERT ON budgets WHEN NEW.user_id IS NOT NULL BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE user_id=NEW.user_id AND family_id=NEW.family_id AND estado='activo') THEN RAISE(ABORT,'El usuario no pertenece a la familia del presupuesto') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_goal_validate_insert BEFORE INSERT ON saving_goals WHEN NEW.user_id IS NOT NULL BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE user_id=NEW.user_id AND family_id=NEW.family_id AND estado='activo') THEN RAISE(ABORT,'El usuario no pertenece a la familia de la meta') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_debt_validate_insert BEFORE INSERT ON debts BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE user_id=NEW.creado_por AND family_id=NEW.family_id AND estado='activo') THEN RAISE(ABORT,'El creador no pertenece a la familia de la deuda') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE user_id=NEW.responsable_id AND family_id=NEW.family_id AND estado='activo') THEN RAISE(ABORT,'El responsable no pertenece a la familia de la deuda') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_invitation_validate_insert BEFORE INSERT ON invitations BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE user_id=NEW.creado_por AND family_id=NEW.family_id AND estado='activo' AND rol='admin') THEN RAISE(ABORT,'Solo el administrador activo puede crear invitaciones') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_notification_validate_insert BEFORE INSERT ON notifications BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM family_members WHERE user_id=NEW.user_id AND family_id=NEW.family_id AND estado='activo') THEN RAISE(ABORT,'El destinatario no pertenece a la familia') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_tx_updated AFTER UPDATE ON transactions BEGIN UPDATE transactions SET actualizado_en=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trg_budget_updated AFTER UPDATE ON budgets BEGIN UPDATE budgets SET actualizado_en=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trg_goal_updated AFTER UPDATE ON saving_goals BEGIN UPDATE saving_goals SET actualizado_en=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trg_goal_contribution_insert AFTER INSERT ON goal_contributions WHEN NEW.deleted_at IS NULL BEGIN
 UPDATE saving_goals SET monto_acumulado_centavos=(SELECT COALESCE(SUM(monto_centavos),0) FROM goal_contributions WHERE goal_id=NEW.goal_id AND deleted_at IS NULL) WHERE id=NEW.goal_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_goal_contribution_update AFTER UPDATE ON goal_contributions BEGIN
 UPDATE saving_goals SET monto_acumulado_centavos=(SELECT COALESCE(SUM(monto_centavos),0) FROM goal_contributions WHERE goal_id=NEW.goal_id AND deleted_at IS NULL) WHERE id=NEW.goal_id;
 UPDATE saving_goals SET monto_acumulado_centavos=(SELECT COALESCE(SUM(monto_centavos),0) FROM goal_contributions WHERE goal_id=OLD.goal_id AND deleted_at IS NULL) WHERE id=OLD.goal_id AND OLD.goal_id<>NEW.goal_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_goal_contribution_delete AFTER DELETE ON goal_contributions BEGIN
 UPDATE saving_goals SET monto_acumulado_centavos=(SELECT COALESCE(SUM(monto_centavos),0) FROM goal_contributions WHERE goal_id=OLD.goal_id AND deleted_at IS NULL) WHERE id=OLD.goal_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_debt_payment_validate_update BEFORE UPDATE ON debt_payments WHEN NEW.deleted_at IS NULL BEGIN
 SELECT CASE WHEN NEW.monto_centavos>(SELECT monto_total_centavos FROM debts WHERE id=NEW.debt_id)-COALESCE((SELECT SUM(monto_centavos) FROM debt_payments WHERE debt_id=NEW.debt_id AND deleted_at IS NULL AND id<>OLD.id),0) THEN RAISE(ABORT,'El pago supera el saldo disponible') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_debt_payment_insert AFTER INSERT ON debt_payments WHEN NEW.deleted_at IS NULL BEGIN
 SELECT CASE WHEN NEW.monto_centavos>(SELECT saldo_pendiente_centavos FROM debts WHERE id=NEW.debt_id) THEN RAISE(ABORT,'El pago supera el saldo pendiente') END;
 UPDATE debts SET saldo_pendiente_centavos=saldo_pendiente_centavos-NEW.monto_centavos,
 estado=CASE WHEN saldo_pendiente_centavos-NEW.monto_centavos=0 THEN 'pagada' ELSE 'parcial' END, actualizado_en=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.debt_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_debt_payment_update AFTER UPDATE ON debt_payments BEGIN
 UPDATE debts SET saldo_pendiente_centavos=monto_total_centavos-(SELECT COALESCE(SUM(monto_centavos),0) FROM debt_payments WHERE debt_id=NEW.debt_id AND deleted_at IS NULL),
 estado=CASE WHEN monto_total_centavos-(SELECT COALESCE(SUM(monto_centavos),0) FROM debt_payments WHERE debt_id=NEW.debt_id AND deleted_at IS NULL)=0 THEN 'pagada' WHEN (SELECT COALESCE(SUM(monto_centavos),0) FROM debt_payments WHERE debt_id=NEW.debt_id AND deleted_at IS NULL)=0 THEN 'pendiente' ELSE 'parcial' END,
 actualizado_en=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.debt_id;
 UPDATE debts SET saldo_pendiente_centavos=monto_total_centavos-(SELECT COALESCE(SUM(monto_centavos),0) FROM debt_payments WHERE debt_id=OLD.debt_id AND deleted_at IS NULL),
 estado=CASE WHEN monto_total_centavos-(SELECT COALESCE(SUM(monto_centavos),0) FROM debt_payments WHERE debt_id=OLD.debt_id AND deleted_at IS NULL)=0 THEN 'pagada' WHEN (SELECT COALESCE(SUM(monto_centavos),0) FROM debt_payments WHERE debt_id=OLD.debt_id AND deleted_at IS NULL)=0 THEN 'pendiente' ELSE 'parcial' END WHERE id=OLD.debt_id AND OLD.debt_id<>NEW.debt_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_debt_payment_delete AFTER DELETE ON debt_payments BEGIN
 UPDATE debts SET saldo_pendiente_centavos=monto_total_centavos-(SELECT COALESCE(SUM(monto_centavos),0) FROM debt_payments WHERE debt_id=OLD.debt_id AND deleted_at IS NULL),
 estado=CASE WHEN monto_total_centavos-(SELECT COALESCE(SUM(monto_centavos),0) FROM debt_payments WHERE debt_id=OLD.debt_id AND deleted_at IS NULL)=0 THEN 'pagada' WHEN (SELECT COALESCE(SUM(monto_centavos),0) FROM debt_payments WHERE debt_id=OLD.debt_id AND deleted_at IS NULL)=0 THEN 'pendiente' ELSE 'parcial' END WHERE id=OLD.debt_id;
END;

