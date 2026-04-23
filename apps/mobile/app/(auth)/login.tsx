import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/lib/auth-store'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور')
      return
    }
    setLoading(true)
    try {
      await signIn(email, password)
      router.replace('/(app)')
    } catch (err: any) {
      Alert.alert('خطأ في تسجيل الدخول', err.message ?? 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>F</Text>
        </View>
        <View>
          <Text style={styles.logoText}>FieldOps FTTH</Text>
          <Text style={styles.logoSub}>Afro Group · نظام الإدارة</Text>
        </View>
      </View>

      <Text style={styles.title}>تسجيل الدخول</Text>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>البريد الإلكتروني</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#6b7788"
            placeholder="name@afrogroup.com"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>كلمة المرور</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#6b7788"
            placeholder="••••••••"
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'جاري الدخول...' : 'دخول'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e14',
    padding: 24,
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
    justifyContent: 'center',
  },
  logoMark: {
    width: 40,
    height: 40,
    backgroundColor: '#ff7a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
  },
  logoText: {
    color: '#e8edf3',
    fontWeight: '700',
    fontSize: 16,
  },
  logoSub: {
    color: '#6b7788',
    fontSize: 11,
    marginTop: 2,
  },
  title: {
    color: '#e8edf3',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#6b7788',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: '#1a2028',
    borderWidth: 1,
    borderColor: '#2a3442',
    color: '#e8edf3',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    textAlign: 'right',
  },
  btn: {
    backgroundColor: '#ff7a1a',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    backgroundColor: '#242c38',
  },
  btnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
})
