import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { db, auth } from "@/lib/firebaseConfig";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";

interface OpenQuestion {
  cid: string;
  cno: string;
  qid: string;
  courseName: string;
  questionText: string;
}

export default function QuestionScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [openQuestions, setOpenQuestions] = useState<OpenQuestion[]>([]);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToQuestions(user.uid);
      return () => unsubscribe(); // Cleanup เมื่อออกจากหน้า
    }
  }, [user]);

  const subscribeToQuestions = (userId: string) => {
    setLoading(true);

    return onSnapshot(doc(db, "users", userId), async (userSnap) => {
      if (!userSnap.exists()) {
        console.error("❌ ไม่พบข้อมูลนักเรียน");
        return;
      }

      const userData = userSnap.data();
      const classrooms = userData.classroom || {};

      let allUnsubscribers: (() => void)[] = [];
      let questionsList: OpenQuestion[] = [];

      for (const cid of Object.keys(classrooms)) {
        const classRef = doc(db, "classroom", cid);
        const classSnap = await getDoc(classRef);
        if (!classSnap.exists()) continue;

        const courseName = `${classSnap.data().info.code} ${classSnap.data().info.name}`;
        const checkinRef = collection(db, `classroom/${cid}/checkin`);

        const unsubscribeCheckin = onSnapshot(checkinRef, (checkinSnap) => {
          checkinSnap.forEach((checkinDoc) => {
            const cno = checkinDoc.id;
            const questionsRef = collection(db, `classroom/${cid}/checkin/${cno}/question`);

            const unsubscribeQuestions = onSnapshot(questionsRef, (questionsSnap) => {
              let updatedQuestions: OpenQuestion[] = [];

              questionsSnap.forEach((docSnap) => {
                const questionData = docSnap.data();
                if (questionData.question_show) {
                  updatedQuestions.push({
                    cid,
                    cno,
                    qid: docSnap.id,
                    courseName,
                    questionText: questionData.question_text,
                  });
                }
              });

              setOpenQuestions((prevQuestions) => {
                // ✅ ลบคำถามที่ถูกปิดไปแล้ว
                const filtered = prevQuestions.filter(
                  (q) =>
                    q.cid !== cid ||
                    q.cno !== cno ||
                    updatedQuestions.some((uq) => uq.qid === q.qid)
                );

                return [...filtered, ...updatedQuestions];
              });

              setLoading(false);
            });

            allUnsubscribers.push(unsubscribeQuestions);
          });
        });

        allUnsubscribers.push(unsubscribeCheckin);
      }

      return () => {
        allUnsubscribers.forEach((unsub) => unsub());
      };
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>คำถามที่เปิดอยู่</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : openQuestions.length > 0 ? (
        <FlatList
          data={openQuestions}
          keyExtractor={(item) => item.qid}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.courseText}>{item.courseName}</Text>
              <Text style={styles.courseText}>{item.questionText}</Text>
              <TouchableOpacity
                style={styles.answerButton}
                onPress={() =>
                  router.push(`/${item.qid}/question`)
                }
              >
                <Text style={styles.answerText}>ตอบคำถาม</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noDataText}>ไม่มีคำถามที่เปิดอยู่</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5", padding: 10 },
  header: { backgroundColor: "#4CAF50", padding: 15, alignItems: "center" },
  headerText: { fontSize: 18, fontWeight: "bold", color: "white" },
  row: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 15,
    marginVertical: 5,
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  courseText: { fontSize: 16, fontWeight: "bold" },
  answerButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  answerText: { color: "white", fontWeight: "bold" },
  noDataText: { textAlign: "center", marginTop: 20, color: "gray" },
});