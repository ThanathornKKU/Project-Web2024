import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';

export default function IndexScreen() {
  const { scannedData } = useLocalSearchParams(); // ดึงค่าที่ส่งมา
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login'); // กลับไปหน้า Login
    } catch (error: any) {
      console.log('🚨 Logout Error:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📌 ข้อมูลที่สแกน:</Text>
      <Text style={styles.data}>{scannedData || 'ยังไม่มีข้อมูล'}</Text>

      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={() => router.push('/scan')} style={styles.button}>
          ไปที่หน้าสแกน
        </Button>

        <Button mode="outlined" onPress={handleLogout} style={styles.button} color="red">
          ออกจากระบบ
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  data: { fontSize: 18, color: 'blue' },
  buttonContainer: { marginTop: 20, width: '100%', alignItems: 'center', gap: 10 },
  button: { width: '80%' },
});