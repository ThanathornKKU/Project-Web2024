import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom"; // ✅ ใช้ `react-router-dom`
import { db } from "../../../lib/firebase"; // ✅ แก้ path Firebase
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import Swal from "sweetalert2";
import { FaEye, FaTrash, FaRegQuestionCircle } from "react-icons/fa";

export default function QuestionManager() {
  const { cid, cno } = useParams(); // ✅ ดึงพารามิเตอร์จาก URL
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (cid && cno) {
      fetchQuestions();
    }
  }, [cid, cno]);

  const fetchQuestions = async () => {
    const qRef = collection(db, `classroom/${cid}/checkin/${cno}/question`);
    const snapshot = await getDocs(query(qRef, orderBy("question_no", "asc")));
    const data = snapshot.docs.map((doc) => ({
      qid: doc.id,
      ...doc.data(),
      question_no: Number(doc.data().question_no) || 0,
    }));

    setQuestions(data.sort((a, b) => a.question_no - b.question_no));
  };

  const handleAddQuestion = async () => {
    const { value: newQuestion } = await Swal.fire({
      title: "สร้างคำถามใหม่",
      input: "textarea",
      inputPlaceholder: "กรอกคำถามที่ต้องการ...",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      inputValidator: (value) => {
        if (!value.trim()) return "กรุณากรอกคำถาม!";
      }
    });

    if (newQuestion) {
      try {
        const lastQuestionNo = questions.length > 0 ? Math.max(...questions.map(q => Number(q.question_no) || 0)) : 0;
        const newQuestionNo = lastQuestionNo + 1;

        const qRef = collection(db, `classroom/${cid}/checkin/${cno}/question`);
        const docRef = await addDoc(qRef, {
          question_no: newQuestionNo,
          question_text: newQuestion,
          question_show: false
        });

        setQuestions(prev => [...prev, {
          qid: docRef.id,
          question_no: newQuestionNo,
          question_text: newQuestion,
          question_show: false
        }].sort((a, b) => a.question_no - b.question_no));

      } catch (error) {
        console.error("Error adding question:", error);
        Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถเพิ่มคำถามได้", "error");
      }
    }
  };

  const handleToggleVisibility = async (qid: string, visible: boolean) => {
    const qCollection = collection(db, `classroom/${cid}/checkin/${cno}/question`);
    const snapshot = await getDocs(qCollection);
    let allQuestions = snapshot.docs.map((doc) => ({
      qid: doc.id,
      ...doc.data(),
      question_no: Number(doc.data().question_no) || 0,
    }));

    allQuestions = allQuestions.filter(q => q.question_no !== 0);

    const updatePromises = allQuestions.map(async (q) => {
      const qRef = doc(db, `classroom/${cid}/checkin/${cno}/question`, q.qid);
      return updateDoc(qRef, { question_show: false });
    });

    if (visible) {
      const selectedQRef = doc(db, `classroom/${cid}/checkin/${cno}/question`, qid);
      updatePromises.push(updateDoc(selectedQRef, { question_show: true }));
    }

    await Promise.all(updatePromises);

    setQuestions(
      allQuestions
        .map(q => ({
          ...q,
          question_show: q.qid === qid ? visible : false,
        }))
        .sort((a, b) => a.question_no - b.question_no)
    );
  };

  const handleDelete = async (qid: string) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ",
      text: "คุณแน่ใจหรือไม่ว่าต้องการลบคำถามนี้?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "ลบเลย",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      const qRef = doc(db, `classroom/${cid}/checkin/${cno}/question/${qid}`);
      await deleteDoc(qRef);

      let updatedQuestions = questions.filter(q => q.qid !== qid);

      const updatePromises = updatedQuestions.map(async (q, index) => {
        const newQuestionNo = index + 1;
        const qDocRef = doc(db, `classroom/${cid}/checkin/${cno}/question/${q.qid}`);
        await updateDoc(qDocRef, { question_no: newQuestionNo });

        return { ...q, question_no: newQuestionNo };
      });

      updatedQuestions = await Promise.all(updatePromises);
      setQuestions(updatedQuestions.sort((a, b) => a.question_no - b.question_no));

    } catch (error) {
      console.error("Error deleting question:", error);
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถลบคำถามได้", "error");
    }
  };

  return (
    <div className="mt-6 p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Q&A</h2>
        <button className="bg-green-500 text-white px-4 py-2 rounded shadow-md hover:bg-green-600 transition"
          onClick={handleAddQuestion}>
          + Add Question
        </button>
      </div>

      {questions.length > 0 ? (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-500">
              <th className="p-1 text-left text-black">Question_No</th>
              <th className="p-3 text-black">คำถาม</th>
              <th className="p-3 text-center text-black">Show</th>
              <th className="p-3 text-center text-black">Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.qid} className="even:bg-gray-100">
                <td className="p-3 text-left text-black">{q.question_no}</td>
                <td className="p-3 text-black">{q.question_text}</td>
                <td className="p-3 text-center text-black">
                  <input
                    type="checkbox"
                    checked={q.question_show}
                    onChange={() => handleToggleVisibility(q.qid, !q.question_show)}
                    className="w-5 h-5 cursor-pointer"
                  />
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-x-6">
                    <Link to={`/classroom/${cid}/check-in/${cno}/question/${q.qid}`}>
                      <button className="text-blue-500 hover:text-blue-700 transition px-3">
                        <FaEye size={18} />
                      </button>
                    </Link>
                    <button onClick={() => handleDelete(q.qid)}
                      className="text-gray-400 hover:text-red-700 transition px-3">
                      <FaTrash size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="flex flex-col items-center bg-gray-100 rounded-lg py-10 shadow-inner">
          <FaRegQuestionCircle className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">ยังไม่มีคำถาม</p>
        </div>
      )}
    </div>
  );
}