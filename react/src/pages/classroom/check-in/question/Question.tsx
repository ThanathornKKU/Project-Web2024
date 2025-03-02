import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../../../../lib/firebase";
import { doc, onSnapshot, collection, getDocs } from "firebase/firestore";

interface Answer {
  stdid: string;
  text: string;
  time: string;
}

interface Question {
  id: string;
  question_no: number;
  question_text: string;
  question_show: boolean;
  answers?: Record<string, Answer>;
}

export default function CheckinQuestions() {
  const { cid, cno, qid } = useParams();
  const [question, setQuestion] = useState<Question | null>(null);
  const [checkinDate, setCheckinDate] = useState<string>("");
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(true);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [studentProfiles, setStudentProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cid && cno && qid) {
      fetchCheckinData(cid, cno);
      fetchQuestion(cid, cno, qid);
      fetchAnswers(cid, cno, qid);
    }
  }, [cid, cno, qid]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [question?.answers]);

  useEffect(() => {
    if (cid) {
      fetchStudentProfiles(cid);
    }
  }, [cid]);

  const fetchCheckinData = (classroomId: string, checkinNo: string) => {
    const checkinRef = doc(db, `classroom/${classroomId}/checkin`, checkinNo);
    onSnapshot(checkinRef, (snapshot) => {
      if (snapshot.exists()) {
        setCheckinDate(snapshot.data().date);
      }
    });
  };

  const fetchQuestion = (classroomId: string, checkinNo: string, questionId: string) => {
    const questionRef = doc(db, `classroom/${classroomId}/checkin/${checkinNo}/question`, questionId);
    onSnapshot(questionRef, (snapshot) => {
      if (snapshot.exists()) {
        setQuestion({ id: snapshot.id, ...snapshot.data() } as Question);
      }
    });
  };

  const fetchAnswers = (classroomId: string, checkinNo: string, questionId: string) => {
    const answersRef = collection(db, `classroom/${classroomId}/checkin/${checkinNo}/question/${questionId}/answers`);

    onSnapshot(answersRef, (answersSnapshot) => {
      const allAnswers: Record<string, Answer> = {};

      answersSnapshot.forEach((docSnap) => {
        const answerData = docSnap.data();
        allAnswers[docSnap.id] = {
          stdid: answerData.stdid,
          text: answerData.text,
          time: answerData.time,
        };
      });

      setQuestion((prev) => (prev ? { ...prev, answers: allAnswers } : null));
    });
  };

  const fetchStudentProfiles = async (classroomId: string) => {
    try {
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      const profiles: Record<string, string> = {};

      usersSnapshot.forEach((docSnap) => {
        const userData = docSnap.data();
        const stdid = userData.stdid;
        let photo = userData.photo;

        if (stdid) {
          if (photo && !photo.startsWith("http")) {
            photo = `data:image/jpeg;base64,${photo}`;
          }
          profiles[stdid] = photo || getRandomProfile(stdid, profileMap);
        }
      });

      setStudentProfiles(profiles);
    } catch (error) {
      console.error("Error fetching student profiles:", error);
    }
  };

  const getRandomProfile = (stdid: string, profileMap: Record<string, string>): string => {
    if (!profileMap[stdid]) {
      const randomProfile = Math.floor(Math.random() * 12) + 1;
      profileMap[stdid] = `/emoji/${randomProfile}.svg`;
    }
    return profileMap[stdid];
  };

  return (
    <div className="bg-gray-100 p-6 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white p-6 shadow-lg rounded-lg">
        <div className="text-lg font-semibold mb-4">
          <Link to={`/classroom/${cid}`} className="text-black">Dashboard</Link> {" > "}
          <Link to={`/classroom/${cid}/check-in/${cno}`} className="text-black">Check-in</Link> {" > "}
          <span className="text-black">{question?.question_text || "Loading..."}</span>
        </div>

        {question ? (
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-black">คำถามที่ {question.question_no}</h3>
              <div className="flex items-center">
                <span className="text-black mr-3">Guest Mode</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isGuestMode} onChange={() => setIsGuestMode((prev) => !prev)} />
                  <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-600 rounded-full"></div>
                </label>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-4 text-black">คำถาม : {question.question_text}</h3>

            <div className="bg-gray-100 p-4 rounded-lg shadow text-black">
              <h4 className="text-lg font-semibold mb-4">คำตอบจากนักเรียน:</h4>
              <div className="max-h-96 overflow-y-auto flex flex-col-reverse space-y-4 p-2 bg-white rounded-lg shadow-inner" ref={chatBoxRef}>
                {question.answers && Object.keys(question.answers).length > 0 ? (
                  <ul className="space-y-4">
                    {Object.entries(question.answers).map(([qno, answer]) => (
                      <li key={qno} className="flex items-start space-x-3">
                        <img src={getRandomProfile(answer.stdid, profileMap)} alt="Profile" className="w-10 h-10 rounded-full" />
                        <div className="bg-gray-200 text-black p-3 rounded-lg w-fit max-w-xl overflow-hidden break-words">
                          <span className="font-semibold text-black">{answer.stdid}</span>
                          <p className="text-black text-base">{answer.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">ยังไม่มีนักเรียนตอบ</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">ไม่มีคำถามนี้</p>
        )}
      </div>
    </div>
  );
}