import React, { useState } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'เข้าสู่ระบบสำเร็จ');
      router.replace('/'); // ไปที่หน้าหลัก
    } catch (error) {
      Alert.alert('Error', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="อีเมล" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />
      <TextInput placeholder="รหัสผ่าน" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <Button title={loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"} onPress={handleLogin} disabled={loading} />
      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.link}>ยังไม่มีบัญชี? สมัครสมาชิก</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  input: { width: '100%', padding: 10, borderWidth: 1, borderRadius: 8, marginVertical: 5 },
  link: { marginTop: 10, color: 'blue' },
});