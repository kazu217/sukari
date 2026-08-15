import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useStore } from '../store/useStore'
import type { HistoryItem } from '../types'

interface Props {
  onSelectItem: (query: string, queryType: 'barcode' | 'text') => void
}

function HistoryRow({ item, onPress, onDelete }: { item: HistoryItem; onPress: () => void; onDelete: () => void }) {
  const date = new Date(item.searchedAt)
  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`

  const profitInfo = item.purchasePrice && item.lowestPrice
    ? (() => {
        const profit = item.lowestPrice - item.purchasePrice
        const rate = (profit / item.purchasePrice) * 100
        return { profit, rate }
      })()
    : null

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} onLongPress={onDelete}>
      {item.productImage ? (
        <Image source={{ uri: item.productImage }} style={styles.thumb} resizeMode="contain" />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbText}>{item.queryType === 'barcode' ? '🔍' : '🔤'}</Text>
        </View>
      )}
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.productName ?? item.query}
        </Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowDate}>{dateStr}</Text>
          {item.lowestPrice && (
            <Text style={styles.rowPrice}>楽天 ¥{item.lowestPrice.toLocaleString()}</Text>
          )}
        </View>
        {profitInfo && (
          <Text style={[styles.profitText, { color: profitInfo.profit >= 0 ? '#16A34A' : '#DC2626' }]}>
            利益 {profitInfo.profit >= 0 ? '+' : ''}¥{profitInfo.profit.toLocaleString()} ({profitInfo.rate.toFixed(1)}%)
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

export function HistoryScreen({ onSelectItem }: Props) {
  const history = useStore((s) => s.history)
  const removeHistory = useStore((s) => s.removeHistory)
  const clearHistory = useStore((s) => s.clearHistory)

  const handleClearAll = () => {
    Alert.alert('履歴を削除', '全ての履歴を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: clearHistory },
    ])
  }

  const handleDelete = (id: string, name: string | null) => {
    Alert.alert('削除', `「${name ?? ''}」を履歴から削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => removeHistory(id) },
    ])
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>スキャン履歴</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearText}>全削除</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>履歴がありません</Text>
          <Text style={styles.emptyText}>バーコードをスキャンすると{'\n'}ここに表示されます</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryRow
              item={item}
              onPress={() => onSelectItem(item.query, item.queryType)}
              onDelete={() => handleDelete(item.id, item.productName)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  clearText: { fontSize: 14, color: '#DC2626' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },

  row: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#fff',
    gap: 12,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  thumbText: { fontSize: 24 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', lineHeight: 20, marginBottom: 4 },
  rowMeta: { flexDirection: 'row', gap: 12 },
  rowDate: { fontSize: 12, color: '#888' },
  rowPrice: { fontSize: 12, color: '#BF0000', fontWeight: '600' },
  profitText: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#F1F5F9' },
})
