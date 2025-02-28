import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { useRouter } from 'expo-router';
import AwesomeAlert from 'react-native-awesome-alerts'; // ✅ ใช้ sweetalert

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);

  const showAlert = (message: string, success: boolean = false) => {
    setAlertMessage(message);
    setAlertSuccess(success);
    setAlertVisible(true);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('❌ กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showAlert('✅ เข้าสู่ระบบสำเร็จ', true);
    } catch (error: any) {
      showAlert('❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* หัวข้อ Login */}
        <Text style={styles.title}>Login</Text>

        {/* ฟอร์มกรอกอีเมลและรหัสผ่าน */}
        <TextInput label="อีเมล" value={email} onChangeText={setEmail} style={styles.input} mode="outlined" keyboardType="email-address" />
        <TextInput label="รหัสผ่าน" value={password} onChangeText={setPassword} style={styles.input} mode="outlined" secureTextEntry />

        {/* ปุ่มเข้าสู่ระบบ */}
        {loading ? (
          <ActivityIndicator animating={true} color="blue" />
        ) : (
          <Button mode="contained" onPress={handleLogin} style={styles.button}>
            เข้าสู่ระบบ
          </Button>
        )}

        {/* ลิงก์สมัครสมาชิก */}
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.link}>ยังไม่มีบัญชี? สมัครสมาชิก</Text>
        </TouchableOpacity>

        {/* SweetAlert แสดงผลแจ้งเตือน */}
        <AwesomeAlert
          show={alertVisible}
          showProgress={false}
          title={alertSuccess ? "✅ สำเร็จ" : "❌ ข้อผิดพลาด"}
          message={alertMessage}
          closeOnTouchOutside={true}
          closeOnHardwareBackPress={false}
          showCancelButton={false}
          showConfirmButton={true}
          confirmText="ตกลง"
          confirmButtonColor={alertSuccess ? "#28a745" : "#dc3545"}
          onConfirmPressed={() => {
            setAlertVisible(false);
            if (alertSuccess) {
              router.replace('/');
            }
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '100%', marginBottom: 10 },
  button: { marginTop: 10, width: '100%' },
  link: { marginTop: 15, color: '#007bff', fontSize: 16 },
});