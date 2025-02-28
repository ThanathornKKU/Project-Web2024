import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function IndexScreen() {
  const { scannedData } = useLocalSearchParams(); // ดึงค่าที่ส่งมา
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>1 ข้อมูลที่สแกน:</Text>
      <Text style={styles.data}>{scannedData || 'ยังไม่มีข้อมูล'}</Text>
      <Button title="ไปที่หน้าสแกน" onPress={() => router.push('/scan')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  data: {
    fontSize: 18,
    color: 'blue',
  },
});