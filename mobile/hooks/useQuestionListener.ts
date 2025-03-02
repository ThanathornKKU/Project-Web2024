import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "expo-router";

export const useQuestionListener = () => {
  const router = useRouter();
  const user = auth.currentUser;

  const [showAlert, setShowAlert] = useState(false);
  const [questionPath, setQuestionPath] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const userRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userRef, async (userSnap) => {
      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      const classrooms = userData.classroom || {};

      let allUnsubscribers: (() => void)[] = [];

      for (const cid of Object.keys(classrooms)) {
        const checkinRef = collection(db, `classroom/${cid}/checkin`);
        const unsubscribeCheckin = onSnapshot(checkinRef, async (checkinSnap) => {
          for (const checkinDoc of checkinSnap.docs) {
            const cno = checkinDoc.id;
            const questionRef = collection(db, `classroom/${cid}/checkin/${cno}/question`);
            
            const unsubscribeQuestion = onSnapshot(questionRef, (questionSnap) => {
              questionSnap.forEach((docSnap) => {
                const questionData = docSnap.data();
                if (questionData.question_show) {
                  console.log(`🔥 คำถามใหม่ถูกเปิดใน ${cid}, ${cno}`);
                  setQuestionPath(`/${docSnap.id}/question`);
                  setShowAlert(true);
                }
              });
            });

            allUnsubscribers.push(unsubscribeQuestion);
          }
        });

        allUnsubscribers.push(unsubscribeCheckin);
      }

      return () => {
        allUnsubscribers.forEach((unsub) => unsub());
      };
    });

    return () => unsubscribeUser();
  }, [user]);

  return { showAlert, setShowAlert, questionPath };
};