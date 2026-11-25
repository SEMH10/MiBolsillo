import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import BottomBar from './BottomBar';

// Autenticación
import Welcome from '../screens/auth/WelcomeScreen';
import Login from '../screens/auth/LoginScreen';
import Register from '../screens/auth/RegisterScreen';
import Forgot from '../screens/auth/ForgotPasswordScreen';
import Onboarding from '../screens/auth/OnboardingScreen';
import CreateFamily from '../screens/auth/CreateFamilyScreen';
import JoinFamily from '../screens/auth/JoinFamilyScreen';

// Pestañas principales
import Dashboard from '../screens/home/DashboardScreen';
import Movements from '../screens/movements/MovementsScreen';
import Statistics from '../screens/statistics/StatisticsScreen';
import Planning from '../screens/planning/PlanningScreen';
import More from '../screens/profile/MoreScreen';

// Pantallas secundarias
import AddTransaction from '../screens/movements/AddTransactionScreen';
import Detail from '../screens/movements/TransactionDetailScreen';
import Receipt from '../screens/movements/ReceiptScreen';
import MonthlyReport from '../screens/statistics/MonthlyReportScreen';
import Budget from '../screens/planning/BudgetScreen';
import Goal from '../screens/planning/GoalFormScreen';
import Debt from '../screens/planning/DebtFormScreen';
import Recurring from '../screens/planning/RecurringScreen';
import GoalDetail from '../screens/planning/GoalDetailScreen';
import DebtDetail from '../screens/planning/DebtDetailScreen';
import Family from '../screens/family/FamilyScreen';
import Notifications from '../screens/notifications/NotificationsScreen';
import Profile from '../screens/profile/ProfileScreen';
import Settings from '../screens/profile/SettingsScreen';
import Favorites from '../screens/profile/FavoritesScreen';
import Categories from '../screens/profile/CategoriesScreen';
import ExchangeRate from '../screens/home/ExchangeRateScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <BottomBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Movements" component={Movements} />
      <Tab.Screen name="Statistics" component={Statistics} />
      <Tab.Screen name="Planning" component={Planning} />
      <Tab.Screen name="More" component={More} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { theme: t, isDark } = useTheme();
  const { currentUser, pendingOnboarding } = useApp();
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: t.bg1, card: t.surface, text: t.text, border: t.border, primary: t.primary },
  };
  const loggedIn = !!currentUser;

  return (
    <NavigationContainer theme={navTheme}>
      {/*
        El navegador se vuelve a montar cuando cambia la sesión (key): al iniciar sesión se muestra la app,
        y al cerrarla vuelve a Bienvenida sin tener que hacer navigation.replace/reset en cada pantalla.
      */}
      <Stack.Navigator
        key={loggedIn ? 'app' : 'auth'}
        initialRouteName={loggedIn ? (pendingOnboarding ? 'Onboarding' : 'Main') : 'Welcome'}
        screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: t.bg1 } }}
      >
        {loggedIn ? (
          <>
            <Stack.Screen name="Onboarding" component={Onboarding} />
            <Stack.Screen name="CreateFamily" component={CreateFamily} />
            <Stack.Screen name="JoinFamily" component={JoinFamily} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="AddTransaction" component={AddTransaction} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="TransactionDetail" component={Detail} />
            <Stack.Screen name="Receipt" component={Receipt} />
            <Stack.Screen name="MonthlyReport" component={MonthlyReport} />
            <Stack.Screen name="BudgetForm" component={Budget} />
            <Stack.Screen name="GoalForm" component={Goal} />
            <Stack.Screen name="DebtForm" component={Debt} />
            <Stack.Screen name="Recurring" component={Recurring} />
            <Stack.Screen name="GoalDetail" component={GoalDetail} />
            <Stack.Screen name="DebtDetail" component={DebtDetail} />
            <Stack.Screen name="Categories" component={Categories} />
            <Stack.Screen name="Family" component={Family} />
            <Stack.Screen name="Notifications" component={Notifications} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Settings" component={Settings} />
            <Stack.Screen name="Favorites" component={Favorites} />
            <Stack.Screen name="ExchangeRate" component={ExchangeRate} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={Welcome} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="ForgotPassword" component={Forgot} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
