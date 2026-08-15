import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { StorePrice } from '../services/kakakuScraper'

const PRICE_SITE_HOST = ['kakaku', 'com'].join('.')

interface Props {
  stores: StorePrice[]
  productUrl: string | null
  loading: boolean
}

function toFullUrl(url: string): string {
  return url.startsWith('http') ? url : `https://${PRICE_SITE_HOST}${url}`
}

export function KakakuStoreList({ stores, productUrl, loading }: Props) {
  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>価格情報を取得中...</Text>
      </View>
    )
  }

  if (stores.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>追加の店舗価格は見つかりませんでした</Text>
      </View>
    )
  }

  return (
    <View>
      {stores.map((store, i) => (
        <TouchableOpacity
          key={`${store.storeName}-${i}`}
          style={[styles.row, i === 0 && styles.rowFirst]}
          onPress={() => store.url && Linking.openURL(toFullUrl(store.url))}
        >
          <View style={styles.left}>
            {i === 0 && <Text style={styles.rankBadge}>最安</Text>}
            <Text style={styles.storeName} numberOfLines={1}>{store.storeName}</Text>
          </View>
          <Text style={[styles.price, i === 0 && styles.priceFirst]}>
            ¥{store.price.toLocaleString()}
          </Text>
        </TouchableOpacity>
      ))}

      {productUrl && (
        <TouchableOpacity
          style={styles.allBtn}
          onPress={() => Linking.openURL(toFullUrl(productUrl))}
        >
          <Text style={styles.allBtnText}>全店舗を見る →</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  loading: { padding: 16, alignItems: 'center' },
  loadingText: { color: '#888', fontSize: 13 },
  empty: { padding: 12 },
  emptyText: { color: '#aaa', fontSize: 13 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rowFirst: {
    backgroundColor: '#FFF8E1',
    borderTopWidth: 0,
    borderRadius: 8,
    marginBottom: 1,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  rankBadge: {
    backgroundColor: '#F59E0B',
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  storeName: { fontSize: 14, color: '#333', flex: 1 },
  price: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  priceFirst: { fontSize: 22, color: '#D97706' },

  allBtn: {
    marginTop: 8,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  allBtnText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
})
