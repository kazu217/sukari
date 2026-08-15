import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { calcProfit } from '../services/priceSearch'

const VERDICT_CONFIG = {
  buy: { label: '買い！', color: '#16A34A', bg: '#F0FDF4' },
  maybe: { label: '微妙', color: '#D97706', bg: '#FFFBEB' },
  skip: { label: 'スルー', color: '#DC2626', bg: '#FEF2F2' },
}

interface Props {
  visible: boolean
  onClose: () => void
  onSave: (purchasePrice: number) => void
  sellPrice: number | null
}

export function ProfitModal({ visible, onClose, onSave, sellPrice }: Props) {
  const [input, setInput] = useState('')

  const purchasePrice = parseInt(input.replace(/[^0-9]/g, ''), 10)
  const calc = sellPrice && purchasePrice > 0 ? calcProfit(purchasePrice, sellPrice) : null
  const verdict = calc ? VERDICT_CONFIG[calc.verdict] : null

  const handleSave = () => {
    if (purchasePrice > 0) {
      onSave(purchasePrice)
      setInput('')
      onClose()
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>利益を計算する</Text>

          <Text style={styles.label}>仕入れ値（円）</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            keyboardType="number-pad"
            placeholder="例: 500"
            placeholderTextColor="#aaa"
            autoFocus
          />

          {sellPrice && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>EC最安値（楽天/Yahoo）</Text>
              <Text style={styles.rowValue}>¥{sellPrice.toLocaleString()}</Text>
            </View>
          )}

          {calc && verdict && (
            <View style={[styles.result, { backgroundColor: verdict.bg }]}>
              <Text style={[styles.verdictLabel, { color: verdict.color }]}>{verdict.label}</Text>
              <View style={styles.calcRows}>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>利益額</Text>
                  <Text style={[styles.rowValue, { color: calc.profit >= 0 ? '#16A34A' : '#DC2626' }]}>
                    {calc.profit >= 0 ? '+' : ''}¥{calc.profit.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>利益率</Text>
                  <Text style={[styles.rowValue, { color: verdict.color }]}>
                    {calc.profitRate.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !purchasePrice && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!purchasePrice}
            >
              <Text style={styles.saveText}>履歴に保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 14,
    color: '#666',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  result: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  verdictLabel: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  calcRows: {},
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
  },
})
