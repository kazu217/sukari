import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width: SCREEN_W } = Dimensions.get('window')
const FRAME_W = Math.round(SCREEN_W * 0.84)
const FRAME_H = Math.round(FRAME_W * 0.72)
interface Props {
  onQuery: (query: string, queryType: 'barcode' | 'text') => Promise<void>
}

function validateBarcode(raw: string): { barcode: string | null; warning: string | null } {
  // Code39などの英字スタート/ストップ文字を除去
  const digits = raw.replace(/[^0-9]/g, '')

  // インストアコード（先頭2、13桁）
  if (digits.length === 13 && digits.startsWith('2')) {
    return { barcode: null, warning: '店舗の価格シールです\n商品本体のバーコードをスキャンしてください' }
  }

  // 有効な桁数（6〜14桁）でなければ無効
  if (digits.length < 6 || digits.length > 14) {
    return { barcode: null, warning: 'バーコードを正しく読み取れませんでした' }
  }

  // 英字混じりだった場合は数字のみで再検索
  return { barcode: digits !== raw ? digits : raw, warning: null }
}

export function ScanScreen({ onQuery }: Props) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanning, setScanning] = useState(true)
  const [loading, setLoading] = useState(false)
  const [textQuery, setTextQuery] = useState('')
  const [warning, setWarning] = useState<string | null>(null)
  const lastScanned = useRef<string | null>(null)
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showWarning = (msg: string) => {
    setWarning(msg)
    if (warningTimer.current) clearTimeout(warningTimer.current)
    warningTimer.current = setTimeout(() => setWarning(null), 3000)
  }

  const handleBarcode = async ({ data }: { data: string }) => {
    if (loading || data === lastScanned.current) return
    lastScanned.current = data

    const { barcode, warning: warn } = validateBarcode(data)
    if (warn || !barcode) {
      showWarning(warn ?? 'バーコードを読み取れませんでした')
      setTimeout(() => { lastScanned.current = null }, 2000)
      return
    }

    setLoading(true)
    setScanning(false)
    try {
      await onQuery(barcode, 'barcode')
    } finally {
      setLoading(false)
      setTimeout(() => {
        setScanning(true)
        lastScanned.current = null
      }, 2000)
    }
  }

  const handleTextSearch = async () => {
    const q = textQuery.trim()
    if (!q) return
    setLoading(true)
    try {
      await onQuery(q, 'text')
      setTextQuery('')
    } finally {
      setLoading(false)
    }
  }

  if (!permission) return <View style={styles.center}><ActivityIndicator /></View>

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permText}>バーコードをスキャンするにはカメラが必要です</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>続行</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanning && !loading ? handleBarcode : undefined}
      />

      {/* インストアコード警告バナー */}
      {warning && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>{warning}</Text>
        </View>
      )}

      {/* 暗いオーバーレイ（スキャン枠以外） */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* ヘッダー */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <Text style={styles.headerTitle}>スキャリ</Text>
        <Text style={styles.headerSub}>バーコードを枠内に合わせてください</Text>
      </SafeAreaView>

      {/* ローディング */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>価格を検索中...</Text>
        </View>
      )}

      {/* テキスト入力 */}
      <View style={styles.bottom}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={textQuery}
            onChangeText={setTextQuery}
            placeholder="商品名を入力して検索"
            placeholderTextColor="#aaa"
            returnKeyType="search"
            onSubmitEditing={handleTextSearch}
          />
          <TouchableOpacity
            style={[styles.searchBtn, !textQuery.trim() && styles.searchBtnDisabled]}
            onPress={handleTextSearch}
            disabled={!textQuery.trim() || loading}
          >
            <Text style={styles.searchBtnText}>検索</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const CORNER = 24

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', gap: 16 },
  permText: { fontSize: 16, color: '#333', textAlign: 'center', marginHorizontal: 32 },
  permBtn: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  permBtnText: { color: '#fff', fontWeight: '700' },

  overlay: { ...StyleSheet.absoluteFill },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row', height: FRAME_H },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanFrame: { width: FRAME_W, height: FRAME_H },

  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  header: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { color: '#fff', fontSize: 16 },

  warningBanner: {
    position: 'absolute',
    top: 120,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(239,68,68,0.93)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    zIndex: 100,
    alignItems: 'center',
  },
  warningText: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 22 },

  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
  },
  searchBtnDisabled: { backgroundColor: '#3B5998' },
  searchBtnText: { color: '#fff', fontWeight: '700' },
})
