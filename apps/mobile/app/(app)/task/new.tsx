import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { v4 as uuidv4 } from 'uuid'
import { GpsPill } from '@/components/GpsPill'
import { PhotoGrid } from '@/components/PhotoGrid'
import { useGps } from '@/hooks/useGps'
import { useSyncStore } from '@/lib/sync-store'
import { isWithinProximity } from '@ftth/shared'

type TaskType = 'route' | 'node'

export default function NewTaskScreen() {
  const router = useRouter()
  const { location, accuracy, loading: gpsLoading } = useGps()
  const { addTask } = useSyncStore()

  const [taskType, setTaskType] = useState<TaskType>('route')
  const [routeLengthM, setRouteLengthM] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (photos.length < 2) {
      Alert.alert('صور ناقصة', 'يجب إضافة صورتين على الأقل (قبل وبعد)')
      return
    }

    if (taskType === 'route' && (!routeLengthM || parseFloat(routeLengthM) <= 0)) {
      Alert.alert('خطأ', 'يجب إدخال الطول بالمتر')
      return
    }

    if (taskType === 'node' && (!quantity || parseInt(quantity) <= 0)) {
      Alert.alert('خطأ', 'يجب إدخال الكمية')
      return
    }

    setSubmitting(true)

    const clientId = uuidv4()

    await addTask({
      clientId,
      taskType,
      routeLengthM: taskType === 'route' ? parseFloat(routeLengthM) : undefined,
      quantity: taskType === 'node' ? parseInt(quantity) : undefined,
      gpsLat: location?.coords.latitude,
      gpsLng: location?.coords.longitude,
      gpsAccuracyM: accuracy ?? undefined,
      notes: notes || undefined,
      photos,
      taskDate: new Date().toISOString().split('T')[0]!,
    })

    setSubmitting(false)
    Alert.alert('تم الحفظ', 'تم حفظ التاسك وسيتم رفعه عند توافر الاتصال', [
      { text: 'حسناً', onPress: () => router.back() },
    ])
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>تاسك جديد</Text>
          <Text style={styles.headerSub}>فريق 2 · م. يوسف أحمد</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* GPS */}
        <GpsPill location={location} accuracy={accuracy} loading={gpsLoading} />

        {/* Task type segment */}
        <View>
          <Text style={styles.label}>نوع التاسك</Text>
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segBtn, taskType === 'route' && styles.segBtnActive]}
              onPress={() => setTaskType('route')}
            >
              <Text style={[styles.segBtnText, taskType === 'route' && styles.segBtnTextActive]}>
                Route (مسار)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segBtn, taskType === 'node' && styles.segBtnActive]}
              onPress={() => setTaskType('node')}
            >
              <Text style={[styles.segBtnText, taskType === 'node' && styles.segBtnTextActive]}>
                Node (نود)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Route fields */}
        {taskType === 'route' && (
          <View>
            <Text style={styles.label}>الطول (متر)</Text>
            <TextInput
              style={styles.input}
              value={routeLengthM}
              onChangeText={setRouteLengthM}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#6b7788"
            />
          </View>
        )}

        {/* Node fields */}
        {taskType === 'node' && (
          <View>
            <Text style={styles.label}>الكمية</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#6b7788"
            />
          </View>
        )}

        {/* Photos */}
        <View>
          <Text style={styles.label}>الصور (min 2)</Text>
          <PhotoGrid photos={photos} onPhotosChange={setPhotos} maxPhotos={6} />
        </View>

        {/* Notes */}
        <View>
          <Text style={styles.label}>ملاحظات (اختياري)</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="ملاحظات..."
            placeholderTextColor="#6b7788"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? 'جاري الحفظ...' : 'حفظ التاسك ✓'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e14' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3442',
    backgroundColor: '#11161d',
  },
  backBtn: { color: '#e8edf3', fontSize: 20, paddingEnd: 4 },
  headerTitle: { color: '#e8edf3', fontSize: 14, fontWeight: '600' },
  headerSub: { color: '#6b7788', fontSize: 10, marginTop: 1 },
  scroll: { flex: 1 },
  label: {
    color: '#6b7788',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#1a2028',
    borderWidth: 1,
    borderColor: '#2a3442',
    color: '#e8edf3',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#2a3442',
    overflow: 'hidden',
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#1a2028',
  },
  segBtnActive: { backgroundColor: '#ff7a1a' },
  segBtnText: { color: '#a8b4c4', fontSize: 12 },
  segBtnTextActive: { color: '#000', fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#ff7a1a',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: '#242c38' },
  submitBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
})
