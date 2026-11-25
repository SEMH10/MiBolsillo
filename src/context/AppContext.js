import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getDb } from '../data/database';
import { obtenerTransacciones, agregarTransaccion, modificarTransaccion, eliminarTransaccion, obtenerResumenFinanciero } from '../data/datos';
import { loginUser, registerUser, restoreSession, logoutUser } from '../services/authService';
import { processDueRecurringRules } from '../services/recurringService';
import { checkLocalAlerts, countUnread } from '../services/notificationService';

const AppContext = createContext(null);
const EMPTY_SUMMARY = { income: 0, expense: 0, balance: 0, count: 0 };

export function AppProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // true justo después de registrarse: la navegación muestra la pantalla de bienvenida al grupo.
  const [pendingOnboarding, setPendingOnboarding] = useState(false);

  // La referencia evita cierres obsoletos: las funciones de abajo son estables y siempre ven al usuario actual.
  const userRef = useRef(null);
  const setCurrentUser = useCallback((user) => {
    userRef.current = user;
    setCurrentUserState(user);
  }, []);

  const clearData = useCallback(() => {
    setTransactions([]);
    setSummary(EMPTY_SUMMARY);
    setUnreadCount(0);
  }, []);

  const loadData = useCallback(async (user) => {
    if (!user?.id || !user?.familyId) { clearData(); return; }
    try {
      await processDueRecurringRules();
      await checkLocalAlerts(user.familyId, user.id);
      const [items, totals, unread] = await Promise.all([
        obtenerTransacciones({ familyId: user.familyId, viewerUserId: user.id }),
        obtenerResumenFinanciero({ familyId: user.familyId, viewerUserId: user.id }),
        countUnread(user.id),
      ]);
      setTransactions(items);
      setSummary(totals);
      setUnreadCount(unread);
    } catch (e) {
      console.warn('No se pudieron cargar los datos:', e);
    }
  }, [clearData]);

  const refresh = useCallback((user) => loadData(user || userRef.current), [loadData]);

  const refreshUnread = useCallback(async () => {
    if (userRef.current?.id) setUnreadCount(await countUnread(userRef.current.id));
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      await getDb();
      const user = await restoreSession();
      if (user) {
        await loadData(user);
        setCurrentUser(user);
      }
    } catch (e) {
      setError(e?.message || 'No se pudo abrir la base de datos.');
    } finally {
      setLoading(false);
    }
  }, [loadData, setCurrentUser]);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  const reload = useCallback(() => {
    setError(null);
    setLoading(true);
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email, password) => {
    const user = await loginUser(email, password);
    await loadData(user);
    setCurrentUser(user);
    return user;
  }, [loadData, setCurrentUser]);

  const register = useCallback(async (data) => {
    const user = await registerUser(data);
    await loadData(user);
    setPendingOnboarding(true);
    setCurrentUser(user);
    return user;
  }, [loadData, setCurrentUser]);

  const logout = useCallback(async () => {
    await logoutUser();
    setPendingOnboarding(false);
    setCurrentUser(null);
    clearData();
  }, [clearData, setCurrentUser]);

  const finishOnboarding = useCallback(() => setPendingOnboarding(false), []);

  const addTransaction = useCallback(async (input) => {
    const user = userRef.current;
    if (!user) throw new Error('Inicia sesión para registrar movimientos.');
    const db = await getDb();
    const membership = await db.getFirstAsync("SELECT rol FROM family_members WHERE user_id=? AND family_id=? AND estado='activo'", [user.id, user.familyId]);
    if (!membership || membership.rol === 'restringido') throw new Error('Tu rol no permite registrar movimientos.');
    const saved = await agregarTransaccion({ ...input, userId: user.id, familyId: user.familyId });
    await loadData(user);
    return saved;
  }, [loadData]);

  const updateTransaction = useCallback(async (id, patch) => {
    const saved = await modificarTransaccion(id, patch, userRef.current?.id);
    await loadData(userRef.current);
    return saved;
  }, [loadData]);

  const deleteTransaction = useCallback(async (id) => {
    await eliminarTransaccion(id, userRef.current?.id);
    await loadData(userRef.current);
  }, [loadData]);

  const value = useMemo(() => ({
    currentUser, setCurrentUser, transactions, summary, unreadCount, loading, error, pendingOnboarding,
    refresh, refreshUnread, reload, login, register, logout, finishOnboarding,
    addTransaction, updateTransaction, deleteTransaction,
  }), [currentUser, transactions, summary, unreadCount, loading, error, pendingOnboarding,
    setCurrentUser, refresh, refreshUnread, reload, login, register, logout, finishOnboarding,
    addTransaction, updateTransaction, deleteTransaction]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
