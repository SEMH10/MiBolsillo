import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Txt } from './UI';
import { useTheme } from '../context/ThemeContext';
import { money, formatDateEs } from '../utils/format';

export default function TransactionRow({ item, onPress }) {
  const { theme: t } = useTheme();
  const positive = item.type === 'income';
  const tint = item.color || t.primary;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} accessibilityRole="button">
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.7, borderBottomColor: t.border }}>
        <View style={{ width: 43, height: 43, borderRadius: 15, backgroundColor: tint + '22', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <MaterialCommunityIcons name={item.icon || 'tag-outline'} size={21} color={tint} />
        </View>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Txt weight="700" numberOfLines={1}>{item.title}</Txt>
          <Txt size={11} color={t.muted} style={{ marginTop: 3 }} numberOfLines={1}>
            {item.category} · {item.person || 'Tú'}{item.visibility === 'Personal' ? ' · Personal' : ''}
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt weight="800" color={positive ? t.green : t.red}>{positive ? '+' : '−'} Bs {money(item.amount)}</Txt>
          <Txt size={10} color={t.muted} style={{ marginTop: 4 }}>{formatDateEs(item.date)}</Txt>
        </View>
      </View>
    </TouchableOpacity>
  );
}
