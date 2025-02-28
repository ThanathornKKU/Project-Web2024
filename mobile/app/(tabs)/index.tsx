import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from "react-native";
import { Button } from "react-native-paper";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

interface Classroom {
  id: string;
  code: string;
  name: string;
  photo: string;
}

export default function IndexScreen() {
  const { scannedData } = useLocalSearchParams(); // ดึงค่าที่ส่งมา
  const router = useRouter();
  const user = auth.currentUser;

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClassrooms();
    }
  }, [user, scannedData]); // ✅ โหลดใหม่เมื่อมีการสแกน QR Code

  const fetchClassrooms = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        console.error("User not found");
        setLoading(false);
        return;
      }

      const classroomList: Classroom[] = [];
      const userClassrooms = userSnapshot.data()?.classroom || {};

      for (const cid of Object.keys(userClassrooms)) {
        const classRef = doc(db, "classroom", cid);
        const classSnapshot = await getDoc(classRef);

        if (classSnapshot.exists()) {
          const classData = classSnapshot.data();
          classroomList.push({
            id: cid,
            code: classData.info.code,
            name: classData.info.name,
            photo: classData.info.photo || "https://via.placeholder.com/150",
          });
        }
      }

      setClassrooms(classroomList);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
    }

    setLoading(false);
  };

  // ✅ เมื่อนักเรียนสแกน QR Code ให้เพิ่มห้องเรียนเข้าไปที่ Firebase
  const addClassroom = async (cid: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          classroom: {
            [cid]: { status: 2 }, // นักเรียน (status = 2)
          },
        },
        { merge: true }
      );

      await fetchClassrooms(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error("Error adding classroom:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error: any) {
      console.log("🚨 Logout Error:", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>คลาสเรียนของฉัน</Text>
      </View>

      {/* แสดงรายวิชา */}
      {loading ? (
        <Text style={styles.loadingText}>กำลังโหลด...</Text>
      ) : classrooms.length > 0 ? (
        <FlatList
          data={classrooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.photo }} style={styles.image} />
              <Text style={styles.classCode}>{item.code} {item.name}</Text>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noDataText}>ไม่มีคลาสเรียน</Text>
      )}

      {/* ปุ่ม */}
      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={() => router.push("/scan")} style={styles.button}>
          สแกน QR Code
        </Button>
        <Button mode="outlined" onPress={handleLogout} style={styles.button} color="red">
          ออกจากระบบ
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: { backgroundColor: "#4CAF50", padding: 15, alignItems: "center" },
  headerText: { fontSize: 18, fontWeight: "bold", color: "white" },
  loadingText: { textAlign: "center", marginTop: 20 },
  noDataText: { textAlign: "center", marginTop: 20, color: "gray" },
  card: {
    backgroundColor: "white",
    margin: 10,
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  image: { width: "100%", height: 120, borderRadius: 10 },
  classCode: { fontSize: 16, fontWeight: "bold", marginTop: 5, textAlign: "center" },
  buttonContainer: { padding: 20, alignItems: "center" },
  button: { width: "80%", marginVertical: 5 },
});
