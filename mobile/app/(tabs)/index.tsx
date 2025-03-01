import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from "react-native";
import { Button } from "react-native-paper";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";

interface Classroom {
  id: string;
  code: string;
  name: string;
  photo: string;
}

export default function IndexScreen() {
  const { scannedData } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ ตรวจสอบการล็อกอินของ User แบบ Real-time
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("🟢 Firebase Auth State Changed:", currentUser?.email);
      setUser(currentUser);
      if (currentUser) {
        subscribeToClassrooms(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Subscribe ดึงข้อมูลคลาสเรียนแบบเรียลไทม์
  const subscribeToClassrooms = (uid: string) => {
    setLoading(true);

    const userRef = doc(db, "users", uid);
    const unsubscribe = onSnapshot(userRef, async (userSnap) => {
      if (!userSnap.exists()) {
        console.error("User not found");
        setClassrooms([]);
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      let classroomList: Classroom[] = [];

      for (const cid of Object.keys(userData.classroom || {})) {
        const classRef = doc(db, "classroom", cid);
        const classSnap = await getDoc(classRef);

        if (!classSnap.exists()) {
          continue; // ห้องเรียนไม่มีอยู่แล้ว
        }

        const studentRef = doc(db, `classroom/${cid}/students/${uid}`);
        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) {
          // ✅ ลบนักเรียนออกจาก `/users/{uid}/classroom/{cid}`
          console.log(`🔥 Removing ${cid} from user classroom list`);
          await removeClassroomFromUser(uid, cid);
          continue;
        }

        // ✅ ถ้ายังอยู่ในห้องเรียน ให้เพิ่มลงในรายการแสดงผล
        const classData = classSnap.data();
        classroomList.push({
          id: cid,
          code: classData.info.code,
          name: classData.info.name,
          photo: classData.info.photo || "https://via.placeholder.com/150",
        });
      }

      setClassrooms(classroomList);
      setLoading(false);
    });

    return unsubscribe;
  };

  // ✅ ฟังก์ชันลบ classroom ออกจาก `/users/{uid}/classroom`
  const removeClassroomFromUser = async (uid: string, cid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const updatedClassroom = { ...userData.classroom };
        delete updatedClassroom[cid];

        await updateDoc(userRef, { classroom: updatedClassroom });
        console.log(`✅ Removed classroom ${cid} from user ${uid}`);
      }
    } catch (error) {
      console.error("❌ Error removing classroom from user:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.replace("/login");
    } catch (error: any) {
      console.log("🚨 Logout Error:", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>คลาสเรียนของฉัน</Text>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>กำลังโหลด...</Text>
      ) : classrooms.length > 0 ? (
        <FlatList
          data={classrooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/${item.id}/attendance`)}>
              <View style={styles.card}>
                <Image source={{ uri: item.photo }} style={styles.image} />
                <Text style={styles.classCode}>{item.code} {item.name}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={styles.noDataText}>ไม่มีคลาสเรียน</Text>
      )}

      <View style={styles.buttonContainer}>
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