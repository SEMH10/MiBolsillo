import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const ON_PRIMARY = '#063B37';

// Contenedor de pantalla: fondo, zona segura (notch/barra de estado), teclado y botón "Volver" automático.
// tabs=true reserva espacio para la barra inferior flotante (solo pantallas de pestañas).
export function Page({ children, scroll = true, tabs = false, back }) {
  const { theme: t } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const showBack = back !== undefined ? back : !tabs && navigation.canGoBack();
  const padding = {
    paddingHorizontal: 20,
    paddingTop: insets.top + 12,
    paddingBottom: (tabs ? 110 : 32) + insets.bottom,
  };
  const content = (
    <>
      {showBack ? (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 10, paddingVertical: 4 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={t.text} />
          <Text style={{ color: t.text, marginLeft: 6, fontWeight: '700', fontSize: 13 }}>Volver</Text>
        </TouchableOpacity>
      ) : null}
      {children}
    </>
  );
  return (
    <LinearGradient colors={[t.bg1, t.bg2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <View pointerEvents="none" style={[s.blob, { backgroundColor: t.primary, top: 80, left: -90 }]} />
      <View pointerEvents="none" style={[s.blob, { backgroundColor: t.purple, bottom: 120, right: -100 }]} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[{ flexGrow: 1 }, padding]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, padding]}>{content}</View>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

export function Glass({ children, style, blur = true, padded = true }) {
  const { theme: t, isDark } = useTheme();
  const inner = { padding: padded ? 16 : 0 };
  return (
    <View
      style={[
        {
          borderRadius: 22,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: t.border,
          backgroundColor: t.surface,
          shadowColor: t.shadow,
          shadowOpacity: isDark ? 0.12 : 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 4,
        },
        style,
      ]}
    >
      {blur ? (
        <BlurView intensity={isDark ? 18 : 28} tint={isDark ? 'dark' : 'light'} style={inner}>{children}</BlurView>
      ) : (
        <View style={inner}>{children}</View>
      )}
    </View>
  );
}

export function Txt({ children, size = 14, weight = '400', color, style, ...props }) {
  const { theme: t } = useTheme();
  return (
    <Text {...props} style={[{ fontSize: size, fontWeight: weight, color: color || t.text }, style]}>
      {children}
    </Text>
  );
}

export function Heading({ title, subtitle, right }) {
  const { theme: t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <View style={{ flex: 1 }}>
        <Txt size={25} weight="800">{title}</Txt>
        {subtitle ? <Txt color={t.muted} size={12} style={{ marginTop: 4 }}>{subtitle}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', icon, style, disabled = false, loading = false }) {
  const { theme: t } = useTheme();
  const bg = variant === 'primary' ? t.primary : variant === 'soft' ? t.surfaceStrong : 'transparent';
  const fg = variant === 'primary' ? ON_PRIMARY : t.text;
  const off = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={off ? 1 : 0.82}
      disabled={off}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: loading }}
      style={[
        {
          height: 52,
          borderRadius: 16,
          backgroundColor: bg,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: t.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          paddingHorizontal: 18,
          opacity: off ? 0.55 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} style={{ marginRight: 8 }} />
      ) : icon ? (
        <MaterialCommunityIcons name={icon} size={19} color={fg} style={{ marginRight: 8 }} />
      ) : null}
      <Txt weight="800" color={fg}>{title}</Txt>
    </TouchableOpacity>
  );
}

// Campo de texto. Acepta cualquier prop de TextInput (autoCapitalize, autoComplete, maxLength...).
export function Field({ label, icon, error, multiline, style, ...inputProps }) {
  const { theme: t } = useTheme();
  return (
    <View style={{ marginBottom: error ? 6 : 14 }}>
      {label ? <Txt size={12} weight="700" color={t.muted} style={{ marginBottom: 7 }}>{label}</Txt> : null}
      <View
        style={{
          minHeight: 52,
          borderRadius: 15,
          borderWidth: 1,
          borderColor: error ? t.red : t.border,
          backgroundColor: t.input,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          paddingHorizontal: 14,
        }}
      >
        {icon ? <MaterialCommunityIcons name={icon} size={19} color={t.muted} style={{ marginRight: 10, marginTop: multiline ? 14 : 0 }} /> : null}
        <TextInput
          placeholderTextColor={t.muted}
          multiline={multiline}
          accessibilityLabel={label}
          {...inputProps}
          style={[{ flex: 1, color: t.text, fontSize: 14, paddingVertical: 14, minHeight: multiline ? 90 : 50, textAlignVertical: multiline ? 'top' : 'center' }, style]}
        />
      </View>
      {error ? <Txt color={t.red} size={12} style={{ marginTop: 5, marginBottom: 8 }}>{error}</Txt> : null}
    </View>
  );
}

export function Pill({ label, active, onPress, color }) {
  const { theme: t } = useTheme();
  const bg = active ? color || t.primary : t.surface;
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={{ paddingHorizontal: 15, paddingVertical: 9, borderRadius: 30, backgroundColor: bg, borderWidth: 1, borderColor: active ? color || t.primary : t.border, marginRight: 8, marginBottom: 8 }}
    >
      <Txt size={12} weight="700" color={active ? ON_PRIMARY : t.muted}>{label}</Txt>
    </TouchableOpacity>
  );
}

// Fila de Pills que salta de línea (para listas largas: categorías, métodos, frecuencias).
export function PillRow({ children, style }) {
  return <View style={[{ flexDirection: 'row', flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function Section({ title, action, onAction, children }) {
  const { theme: t } = useTheme();
  return (
    <View style={{ marginTop: 22 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Txt size={16} weight="800">{title}</Txt>
        {action ? (
          <TouchableOpacity onPress={onAction}>
            <Txt color={t.primary} size={12} weight="700">{action}</Txt>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function Progress({ value, color }) {
  const { theme: t } = useTheme();
  const pct = Math.max(0, Math.min(100, Number.isFinite(Number(value)) ? Number(value) : 0));
  return (
    <View style={{ height: 8, borderRadius: 8, backgroundColor: t.track, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: 8, borderRadius: 8, backgroundColor: color || t.primary }} />
    </View>
  );
}

export function EmptyState({ icon = 'inbox-outline', title = 'Todavía no hay registros', subtitle = 'Cuando agregues información aparecerá aquí.' }) {
  const { theme: t } = useTheme();
  return (
    <Glass style={{ marginTop: 12 }}>
      <View style={{ alignItems: 'center' }}>
        <MaterialCommunityIcons name={icon} size={34} color={t.primary} />
        <Txt weight="800" style={{ marginTop: 10 }}>{title}</Txt>
        <Txt color={t.muted} size={12} style={{ textAlign: 'center', marginTop: 5 }}>{subtitle}</Txt>
      </View>
    </Glass>
  );
}

export function StatCard({ label, value, icon, color, caption }) {
  const { theme: t } = useTheme();
  return (
    <Glass style={{ flex: 1, minWidth: 145 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt color={t.muted} size={11} weight="700">{label}</Txt>
        <MaterialCommunityIcons name={icon} size={18} color={color || t.primary} />
      </View>
      <Txt size={20} weight="800" style={{ marginTop: 10 }}>{value}</Txt>
      {caption ? <Txt size={10} color={t.muted} style={{ marginTop: 5 }}>{caption}</Txt> : null}
    </Glass>
  );
}

const s = StyleSheet.create({
  blob: { position: 'absolute', width: 230, height: 230, borderRadius: 150, opacity: 0.12 },
});
