import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Keyboard } from 'react-native';
import { TextInput, Button, Avatar, ActivityIndicator, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const resizedImage = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      setImage(resizedImage.uri);
      setImageBase64(resizedImage.base64 || null);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('❌ ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('❌ ข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('❌ ข้อผิดพลาด', 'กรุณากรอกอีเมลให้ถูกต้อง เช่น example@gmail.com');
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, 'users', uid), {
        name: name.trim(),
        email: email.trim(),
        photo: imageBase64 || null,
        stdid: '',
        classroom: {},
      });

      setLoading(false);
      Alert.alert('✅ สำเร็จ', 'สมัครสมาชิกสำเร็จ');
      router.replace('/login');
    } catch (error: any) {
      setLoading(false);
      let errorMessage = "เกิดข้อผิดพลาดในการสมัครสมาชิก";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "❌ อีเมลนี้ถูกใช้งานแล้ว";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "❌ รูปแบบอีเมลไม่ถูกต้อง";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
      }

      Alert.alert('❌ ข้อผิดพลาด', errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          <Avatar.Image size={100} source={image ? { uri: image } : require('@/assets/default-profile.png')} />
        </TouchableOpacity>

        <TextInput label="ชื่อ" value={name} onChangeText={setName} style={styles.input} mode="outlined" />
        <TextInput label="อีเมล" value={email} onChangeText={setEmail} style={styles.input} mode="outlined" keyboardType="email-address" />
        <TextInput label="รหัสผ่าน" value={password} onChangeText={setPassword} style={styles.input} mode="outlined" secureTextEntry />
        <TextInput label="ยืนยันรหัสผ่าน" value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} mode="outlined" secureTextEntry />

        {loading ? (
          <ActivityIndicator animating={true} color="blue" />
        ) : (
          <Button mode="contained" onPress={handleRegister} style={styles.button}>
            สมัครสมาชิก
          </Button>
        )}

        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.link}>มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  input: {
    width: '100%',
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
    width: '100%',
  },
  link: {
    marginTop: 15,
    color: '#007bff',
    fontSize: 16,
  },
});