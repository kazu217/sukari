import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const VERSION = '1.0.0'
const CONTACT_EMAIL = '1sukari.app@gmail.com'
const PRIVACY_URL = 'https://kazu217.github.io/sukari/'

function Row({ label, value, onPress, last }: {
  label: string; value?: string; onPress?: () => void; last?: boolean
}) {
  return (
    <TouchableOpacity
      style={[styles.row, last && styles.rowLast]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <Text style={styles.rowArrow}>›</Text>}
    </TouchableOpacity>
  )
}

export function SettingsScreen() {
  const handleContact = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('スキャリ お問い合わせ')}`)
  }

  const handlePrivacy = () => {
    Linking.openURL(PRIVACY_URL)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>設定</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>アプリについて</Text>
        <View style={styles.section}>
          <Row label="バージョン" value={VERSION} />
          <Row label="プライバシーポリシー" onPress={handlePrivacy} />
          <Row label="お問い合わせ" value={CONTACT_EMAIL} onPress={handleContact} last />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.5,
    marginTop: 20, marginBottom: 8, marginLeft: 4,
  },
  section: {
    backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  rowValue: { fontSize: 14, color: '#888' },
  rowArrow: { fontSize: 20, color: '#C0C0C0', marginLeft: 8 },
})
