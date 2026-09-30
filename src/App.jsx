
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateInterview from "./pages/CreateInterview";
import InterviewHistory from "./pages/InterviewHistory";
import InterviewSession from "./pages/InterviewSession";
import InterviewReport from "./pages/InterviewReport";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/interviews/new" element={<CreateInterview />} />
                        <Route path="/interviews" element={<InterviewHistory />} />
                        <Route path="/interviews/:id/session" element={<InterviewSession />} />
                        <Route
                            path="/interviews/:id/report"
                            element={<InterviewReport />}
                        />
                    </Route>

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}