import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'

interface Props {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  maxPhotos?: number
}

export function PhotoGrid({ photos, onPhotosChange, maxPhotos = 6 }: Props) {
  async function capturePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'يحتاج التطبيق إذن الكاميرا')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      exif: true,
    })

    if (result.canceled || !result.assets[0]) return

    // Compress to 1200px max width, 80% quality
    const compressed = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    )

    onPhotosChange([...photos, compressed.uri])
  }

  function removePhoto(index: number) {
    Alert.alert('حذف الصورة', 'هل تريد حذف هذه الصورة؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => onPhotosChange(photos.filter((_, i) => i !== index)),
      },
    ])
  }

  return (
    <View style={styles.grid}>
      {photos.map((uri, i) => (
        <TouchableOpacity key={i} style={styles.slot} onLongPress={() => removePhoto(i)}>
          <Image source={{ uri }} style={styles.img} resizeMode="cover" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{i === 0 ? 'قبل' : i === 1 ? 'بعد' : `${i + 1}`}</Text>
          </View>
        </TouchableOpacity>
      ))}
      {photos.length < maxPhotos && (
        <TouchableOpacity style={styles.addSlot} onPress={capturePhoto}>
          <Text style={styles.addIcon}>📷</Text>
          <Text style={styles.addText}>
            {photos.length === 0 ? 'قبل' : photos.length === 1 ? 'بعد' : '+'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  slot: {
    width: '31%',
    aspectRatio: 1,
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: 4,
    start: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#ff7a1a',
    fontSize: 9,
    fontWeight: '700',
  },
  addSlot: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#1a2028',
    borderWidth: 1,
    borderColor: '#2a3442',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addIcon: { fontSize: 20, color: '#6b7788' },
  addText: { color: '#6b7788', fontSize: 10 },
})
