import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db, auth } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Button } from "react-native-paper";

interface AttendanceRecord {
  date: string;
  status: string;
  score: number;
  remark: string;
}

export default function AttendanceHistoryScreen() {
  const { cid } = useLocalSearchParams(); // รับค่า `cid` (รหัสวิชา) ที่ถูกส่งมา
  const router = useRouter();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    if (user && cid) {
      fetchAttendanceData(cid as string, user.uid);
    }
  }, [user, cid]);

  const fetchAttendanceData = async (classroomId: string, userId: string) => {
    setLoading(true);

    try {
      // ✅ ดึงข้อมูลชื่อวิชา
      const classRef = doc(db, "classroom", classroomId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        setCourseName(`${classSnap.data().info.code} ${classSnap.data().info.name}`);
      }

      // ✅ ดึงข้อมูลการเช็คชื่อของนักเรียน
      const checkinRef = collection(db, `classroom/${classroomId}/checkin`);
      const checkinSnap = await getDocs(checkinRef);

      let records: AttendanceRecord[] = [];
      let total = 0;

      checkinSnap.forEach((doc) => {
        const checkinData = doc.data();
        if (checkinData.students?.[userId]) {
          const studentData = checkinData.students[userId];
          records.push({
            date: checkinData.date,
            status: getStatusText(studentData.status),
            score: studentData.score,
            remark: studentData.remark || "-",
          });
          total += studentData.score;
        }
      });

      setAttendanceRecords(records);
      setTotalScore(total);
    } catch (error) {
      console.error("🔥 Error fetching attendance data:", error);
    }

    setLoading(false);
  };

  const getStatusText = (status: number) => {
    if (status === 1) return "มา";
    if (status === 2) return "มาสาย";
    return "ขาด";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{courseName}</Text>
      </View>

      {/* คะแนนรวม */}
      <Text style={styles.totalScore}>คะแนนเช็คชื่อรวม {totalScore} คะแนน</Text>

      {/* ตารางแสดงข้อมูล */}
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <FlatList
          data={attendanceRecords}
          keyExtractor={(item, index) => index.toString()}
          ListHeaderComponent={() => (
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Date</Text>
              <Text style={styles.tableHeaderText}>Status</Text>
              <Text style={styles.tableHeaderText}>Score</Text>
              <Text style={styles.tableHeaderText}>Remark</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.date}</Text>
              <Text style={styles.tableCell}>{item.status}</Text>
              <Text style={styles.tableCell}>{item.score}</Text>
              <Text style={styles.tableCell}>{item.remark}</Text>
            </View>
          )}
        />
      )}

      {/* ปุ่มย้อนกลับ */}
      <Button mode="outlined" onPress={() => router.back()} style={styles.backButton}>
        กลับไปหน้าหลัก
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5", padding: 10 },
  header: { backgroundColor: "#4CAF50", padding: 15, alignItems: "center" },
  headerText: { fontSize: 18, fontWeight: "bold", color: "white" },
  totalScore: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginVertical: 10 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E0E0E0",
    padding: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderText: { flex: 1, fontWeight: "bold", textAlign: "center" },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#FFF",
  },
  tableCell: { flex: 1, textAlign: "center" },
  backButton: { marginTop: 20, alignSelf: "center" },
});