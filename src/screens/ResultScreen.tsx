import { useState } from 'react'
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PriceCard } from '../components/PriceCard'
import { KakakuStoreList } from '../components/KakakuStoreList'
import { ProfitModal } from '../components/ProfitModal'
import { useStore } from '../store/useStore'
import type { FullSearchResult } from '../services/priceSearch'

interface Props {
  result: FullSearchResult
  onBack: () => void
}

export function ResultScreen({ result, onBack }: Props) {
  const [profitModalVisible, setProfitModalVisible] = useState(false)
  const addHistory = useStore((s) => s.addHistory)

  const kakaku = result.kakaku
  const kakakuLoading = result.kakakuLoading

  // 楽天・Yahoo 最安値を利益計算の基準に使う
  const rakutenPrice = result.prices.find((p) => p.platform === 'rakuten' && !p.isMock)?.price ?? null
  const yahooPrice = result.prices.find((p) => p.platform === 'yahoo' && !p.isMock)?.price ?? null
  const kakakuLowest = kakaku?.stores[0]?.price ?? null
  const allRealPrices = [rakutenPrice, yahooPrice, kakakuLowest].filter((p): p is number => p !== null)
  const lowestRealPrice = allRealPrices.length > 0 ? Math.min(...allRealPrices) : null

  const handleSaveHistory = (purchasePrice: number) => {
    addHistory({
      id: Date.now().toString(),
      query: result.query,
      queryType: result.queryType,
      productName: result.productName ?? kakaku?.productName ?? null,
      productImage: result.productImage,
      lowestPrice: lowestRealPrice,
      purchasePrice,
      searchedAt: result.searchedAt,
    })
  }

  const handleSaveWithoutCalc = () => {
    addHistory({
      id: Date.now().toString(),
      query: result.query,
      queryType: result.queryType,
      productName: result.productName ?? kakaku?.productName ?? null,
      productImage: result.productImage,
      lowestPrice: lowestRealPrice,
      purchasePrice: null,
      searchedAt: result.searchedAt,
    })
  }

  const displayName = result.productName ?? kakaku?.productName ?? result.query

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSaveWithoutCalc} style={styles.saveBtn}>
          <Text style={styles.saveText}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {result.productImage && (
          <Image source={{ uri: result.productImage }} style={styles.productImage} resizeMode="contain" />
        )}

        <Text style={styles.productName} numberOfLines={3}>{displayName}</Text>
        <Text style={styles.queryBadge}>
          {result.queryType === 'barcode' ? '🔍 バーコード' : '🔤 テキスト'}: {result.query}
        </Text>

        {/* 公式EC価格 — 常に表示 */}
        <Text style={styles.sectionTitle}>公式EC価格</Text>
        {result.prices
          .filter((p) => p.platform === 'rakuten' || p.platform === 'yahoo')
          .map((price) => (
            <PriceCard key={price.platform} result={price} />
          ))}

        {/* 追加の店舗価格 */}
        {kakakuLoading ? (
          <View style={styles.kakakuSection}>
            <View style={styles.kakakuHeader}>
              <Text style={styles.liveTag}>追加の価格情報を取得中...</Text>
            </View>
          </View>
        ) : (kakaku?.stores.length ?? 0) > 0 ? (
          <View style={styles.kakakuSection}>
            <KakakuStoreList
              stores={kakaku!.stores}
              productUrl={kakaku!.productUrl}
              loading={false}
            />
          </View>
        ) : null}

        {/* Amazon・メルカリ・ヤフオク */}
        <Text style={styles.sectionTitle}>その他で探す</Text>
        {result.prices
          .filter((p) => p.platform === 'amazon' || p.platform === 'mercari' || p.platform === 'yahuoku')
          .map((price) => (
            <PriceCard key={price.platform} result={price} />
          ))}

        <TouchableOpacity style={styles.rescanBtn} onPress={onBack}>
          <Text style={styles.rescanBtnText}>📷 もう一度スキャンする</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.calcBtn}
          onPress={() => setProfitModalVisible(true)}
        >
          <Text style={styles.calcBtnText}>💰 利益を計算する</Text>
        </TouchableOpacity>
      </ScrollView>

      <ProfitModal
        visible={profitModalVisible}
        onClose={() => setProfitModalVisible(false)}
        onSave={handleSaveHistory}
        sellPrice={lowestRealPrice}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, color: '#2563EB', fontWeight: '600' },
  saveBtn: { padding: 4 },
  saveText: { fontSize: 16, color: '#2563EB', fontWeight: '600' },

  content: { padding: 16, paddingBottom: 40 },

  productImage: {
    width: '100%',
    height: 160,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  productName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 24,
  },
  queryBadge: { fontSize: 12, color: '#888', marginBottom: 20 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },

  kakakuSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    overflow: 'hidden',
  },
  kakakuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  liveTag: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },

  calcBtn: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  rescanBtn: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  rescanBtnText: { color: '#2563EB', fontSize: 16, fontWeight: '700' },
})
