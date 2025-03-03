import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import CreateClassroom from "./pages/CreateClassroom";
import Classroom from "./pages/classroom/Classroom"; // ✅ เพิ่มเส้นทาง Classroom
import StudentScore from "./pages/classroom/StudentScore";
import ShowStudents from "./pages/classroom/ShowStudents";
import CreateCheckin from "./pages/classroom/create-checkin/CreateCheckin";
import CheckinPage from "./pages/classroom/check-in/Checkin";
import EditProfile from "./pages/edit-profile/EditProfile";
import EditClassroom from "./pages/edit-classroom/EditClassroom";
import CheckinQuestions from "./pages/classroom/check-in/question/Question";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router basename="/deleteMe">
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-classroom" element={<CreateClassroom />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/classroom/:cid" element={<Classroom />} />
          <Route path="/edit-classroom/:cid" element={<EditClassroom />} />
          <Route path="/classroom/:cid/student-score" element={<StudentScore />} />
          <Route path="/classroom/:cid/show-student" element={<ShowStudents />} />
          <Route path="/classroom/:cid/create-checkin" element={<CreateCheckin />} />
          <Route path="/classroom/:cid/check-in/:cno" element={<CheckinPage />} />
          <Route path="/classroom/:cid/check-in/:cno/question/:qid" element={<CheckinQuestions />} />
          <Route path="*" element={<NotFound />} /> {/* ✅ หน้า 404 */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;