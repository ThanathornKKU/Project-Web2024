import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useQuestionListener } from '@/hooks/useQuestionListener'; // ✅ Import Hook
import AwesomeAlert from 'react-native-awesome-alerts';

// ป้องกัน Splash Screen หายไปก่อนโหลดข้อมูล
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [user, setUser] = useState<any>(null);

  // ✅ ใช้ Hook เพื่อตรวจจับคำถามที่เปิดใหม่
  const { showAlert, setShowAlert, questionPath } = useQuestionListener();

  useEffect(() => {
    // ตรวจสอบสถานะการเข้าสู่ระบบ
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        router.replace('/login'); // ถ้ายังไม่ได้ login ให้ไปที่หน้า Login
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="index" options={{ title: 'หน้าแรก' }} />
            <Stack.Screen name="scan" options={{ title: 'สแกน QR' }} />
            <Stack.Screen name="+not-found" options={{ title: 'ไม่พบหน้า' }} />
          </>
        ) : (
          <Stack.Screen name="login" options={{ title: 'เข้าสู่ระบบ' }} />
        )}
      </Stack>

      {/* ✅ Alert แจ้งเตือนคำถาม */}
      <AwesomeAlert
        show={showAlert}
        showProgress={false}
        title="คำถามใหม่ถูกเปิด"
        message="คุณต้องการไปตอบคำถามหรือไม่?"
        closeOnTouchOutside={false}
        closeOnHardwareBackPress={false}
        showCancelButton={true}
        showConfirmButton={true}
        cancelText="ไม่ใช่ตอนนี้"
        confirmText="ไปตอบคำถาม"
        confirmButtonColor="#4CAF50"
        onCancelPressed={() => setShowAlert(false)}
        onConfirmPressed={() => {
          if (questionPath) {
            router.push(questionPath);
          }
          setShowAlert(false);
        }}
      />

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}