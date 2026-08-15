import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { PriceResult } from '../types'

const PLATFORM_CONFIG = {
  amazon: { name: 'Amazon', color: '#FF9900', bg: '#FFF8F0' },
  rakuten: { name: '楽天市場', color: '#BF0000', bg: '#FFF5F5' },
  yahoo: { name: 'Yahoo!ショッピング', color: '#6C0EAD', bg: '#FAF5FF' },
  mercari: { name: 'メルカリ', color: '#FF4A6B', bg: '#FFF5F8' },
  yahuoku: { name: 'ヤフオク！', color: '#E01010', bg: '#FFF5F5' },
}

interface Props {
  result: PriceResult
}

export function PriceCard({ result }: Props) {
  const config = PLATFORM_CONFIG[result.platform]
  const hasRealPrice = result.price !== null && !result.isMock

  const handlePress = () => {
    if (result.url) Linking.openURL(result.url)
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: config.bg }]}
      onPress={result.url ? handlePress : undefined}
      activeOpacity={result.url ? 0.7 : 1}
    >
      <View style={styles.left}>
        <Text style={[styles.platformName, { color: config.color }]}>{config.name}</Text>
        {hasRealPrice ? (
          <Text style={styles.price}>¥{result.price!.toLocaleString()}</Text>
        ) : (
          <Text style={styles.noPrice}>{result.label ?? '取扱なし'}</Text>
        )}
      </View>
      {result.url && (
        <View style={[styles.badge, { backgroundColor: config.color }]}>
          <Text style={styles.badgeText}>{hasRealPrice ? '最安値で買う' : '検索する →'}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  left: {
    flex: 1,
  },
  platformName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  noPrice: {
    fontSize: 14,
    color: '#888',
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginLeft: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
})
