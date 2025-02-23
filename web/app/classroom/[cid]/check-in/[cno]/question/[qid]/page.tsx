"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import Navbar from "@/app/components/navbar";

interface Answer {
  text: string;
  time: string;
}

interface Question {
  id: string;
  question_no: number;
  question_text: string;
  question_show: boolean;
  answers?: Record<string, Answer>; // ✅ ใช้ `?` เพื่อป้องกัน undefined
}

export default function CheckinQuestions() {
  const { cid, cno, qid } = useParams<{ cid: string; cno: string; qid: string }>(); // ✅ ดึงค่าจาก URL
  const [question, setQuestion] = useState<Question | null>(null);
  const [checkinDate, setCheckinDate] = useState<string>("");

  useEffect(() => {
    if (cid && cno && qid) {
      fetchCheckinData(cid, cno);
      fetchQuestion(cid, cno, qid);
    }
  }, [cid, cno, qid]);

  // ✅ ดึงข้อมูล Check-in (วันที่)
  const fetchCheckinData = (classroomId: string, checkinNo: string) => {
    const checkinRef = doc(db, `classroom/${classroomId}/checkin`, checkinNo);
    onSnapshot(checkinRef, (snapshot) => {
      if (snapshot.exists()) {
        setCheckinDate(snapshot.data().date);
      }
    });
  };

  // ✅ ดึงข้อมูลคำถามเฉพาะ `qid`
  const fetchQuestion = (classroomId: string, checkinNo: string, questionId: string) => {
    const questionRef = doc(db, `classroom/${classroomId}/checkin/${checkinNo}/question`, questionId);

    onSnapshot(questionRef, (snapshot) => {
      if (snapshot.exists()) {
        setQuestion({ id: snapshot.id, ...snapshot.data() } as Question);
      }
    });
  };

  return (
    <>
      <title>Check-in Question</title>
      <div className="min-h-screen bg-gray-100 p-6">
        <Navbar />

        <div className="max-w-5xl mx-auto bg-white p-6 shadow-lg rounded-lg">
          {/* ✅ Breadcrumb */}
          <div className="text-lg font-semibold mb-4">
            <Link href={`/classroom/${cid}`} className="text-blue-600 hover:underline">
              Check-in
            </Link>
            {" > "}
            <span className="text-black font-bold">{checkinDate}</span>
          </div>

          <h2 className="text-2xl font-bold mb-4">คำถามที่ได้รับ</h2>

          {question ? (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">
                คำถามที่ {question.question_no}: {question.question_text}
              </h3>

              <div className="bg-gray-100 p-4 rounded-lg shadow">
                <h4 className="text-lg font-semibold">คำตอบจากนักเรียน:</h4>
                {question.answers && Object.keys(question.answers).length > 0 ? (
                  <ul className="list-disc ml-6">
                    {Object.entries(question.answers).map(([stdid, answer]) => (
                      <li key={stdid} className="mt-2">
                        <span className="font-semibold">{stdid}: </span>
                        {answer.text} <span className="text-sm text-gray-500">({answer.time})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">ยังไม่มีนักเรียนตอบ</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">ไม่มีคำถามนี้</p>
          )}
        </div>
      </div>
    </>
  );
}