import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { Text } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as StoreReview from 'expo-store-review'
import { ScanScreen } from './src/screens/ScanScreen'
import { ResultScreen } from './src/screens/ResultScreen'
import { HistoryScreen } from './src/screens/HistoryScreen'
import { SettingsScreen } from './src/screens/SettingsScreen'
import { searchPrices } from './src/services/priceSearch'
import { useStore } from './src/store/useStore'
import type { FullSearchResult } from './src/services/priceSearch'
import type { KakakuResult } from './src/services/kakakuScraper'

const Tab = createBottomTabNavigator()
const queryClient = new QueryClient()

const REVIEW_TRIGGER_COUNT = 10

function useSearchWithKakaku() {
  const [result, setResult] = useState<FullSearchResult | null>(null)
  const incrementScan = useStore((s) => s.incrementScan)
  const markReviewShown = useStore((s) => s.markReviewShown)
  const scanCount = useStore((s) => s.scanCount)
  const reviewShown = useStore((s) => s.reviewShown)

  const search = async (query: string, queryType: 'barcode' | 'text') => {
    const r = await searchPrices(query, queryType, (kakaku: KakakuResult) => {
      setResult((prev) => {
        if (!prev) return prev
        const cheapest = (name: string) => {
          const list = kakaku.stores.filter((s) => s.storeName === name)
          return list.length > 0 ? list.reduce((a, b) => (a.price < b.price ? a : b)) : undefined
        }
        const kakakuRakuten = cheapest('楽天市場')
        const kakakuYahoo = cheapest('Yahoo!ショッピング')
        let prices = prev.prices
        if (kakakuRakuten || kakakuYahoo) {
          prices = prev.prices.map((p) => {
            if (p.platform === 'rakuten' && kakakuRakuten) {
              if (p.price === null || kakakuRakuten.price < p.price) {
                return { ...p, price: kakakuRakuten.price, url: kakakuRakuten.url, label: undefined }
              }
            }
            if (p.platform === 'yahoo' && kakakuYahoo) {
              if (p.price === null || kakakuYahoo.price < p.price) {
                return { ...p, price: kakakuYahoo.price, url: kakakuYahoo.url, label: undefined }
              }
            }
            return p
          })
        }
        return { ...prev, kakaku, kakakuLoading: false, prices }
      })
    })
    setResult(r)
    incrementScan()
    const newCount = scanCount + 1
    if (newCount >= REVIEW_TRIGGER_COUNT && !reviewShown) {
      markReviewShown()
      if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview()
      }
    }
  }

  return { result, setResult, search }
}

function ScanTab() {
  const { result, setResult, search } = useSearchWithKakaku()
  if (result) return <ResultScreen result={result} onBack={() => setResult(null)} />
  return <ScanScreen onQuery={search} />
}

function HistoryTab() {
  const { result, setResult, search } = useSearchWithKakaku()
  if (result) return <ResultScreen result={result} onBack={() => setResult(null)} />
  return <HistoryScreen onSelectItem={search} />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: '#2563EB',
              tabBarInactiveTintColor: '#9CA3AF',
              tabBarStyle: { borderTopColor: '#E5E7EB' },
            }}
          >
            <Tab.Screen
              name="スキャン"
              component={ScanTab}
              options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📷</Text> }}
            />
            <Tab.Screen
              name="履歴"
              component={HistoryTab}
              options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text> }}
            />
            <Tab.Screen
              name="設定"
              component={SettingsScreen}
              options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text> }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
