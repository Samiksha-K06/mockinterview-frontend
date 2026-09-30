import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    BriefcaseBusiness,
    CheckCircle2,
    Clock3,
    FileText,
    Layers3,
    ListChecks,
    Loader2,
    LogOut,
    Plus,
    Sparkles,
    Target,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosConfig";

export default function InterviewHistory() {
    const { user, logout } = useAuth();

    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadInterviews() {
            try {
                setLoading(true);
                const response = await api.get("/api/interviews");
                setInterviews(response.data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Could not load your interview sessions."
                );
            } finally {
                setLoading(false);
            }
        }

        loadInterviews();
    }, []);

    function getStatusClass(status) {
        if (status === "COMPLETED") {
            return "session-status completed";
        }

        if (status === "IN_PROGRESS") {
            return "session-status in-progress";
        }

        return "session-status";
    }

    function getStatusLabel(status) {
        if (status === "COMPLETED") {
            return "Completed";
        }

        if (status === "IN_PROGRESS") {
            return "In progress";
        }

        return status || "Not started";
    }

    return (
        <div className="app-page history-page">

            {/* ================= NAVBAR ================= */}

            <header className="topbar history-topbar">

                <Link
                    className="brand"
                    to="/dashboard"
                >
                    <span className="brand-mark">
                        <Sparkles size={17} />
                    </span>

                    MockMate
                </Link>

                <div className="history-nav-right">

                    <div className="history-user">

                        <div className="user-avatar">
                            {(user?.name || user?.email || "C")
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="user-info">
                            <strong>
                                {user?.name || "Candidate"}
                            </strong>

                            <span>
                                {user?.email || ""}
                            </span>
                        </div>

                    </div>

                    <button
                        className="logout-button"
                        onClick={logout}
                    >
                        <LogOut size={16} />
                        <span>Log out</span>
                    </button>

                </div>

            </header>

            {/* ================= MAIN ================= */}

            <main className="history-container">

                {/* Heading */}

                <section className="history-heading">

                    <div>

                        <Link
                            className="history-back-link"
                            to="/dashboard"
                        >
                            <ArrowLeft size={15} />
                            Back to dashboard
                        </Link>

                        <div className="history-eyebrow">
                            <span />
                            INTERVIEW LIBRARY
                        </div>

                        <h1>
                            Your
                            <span> sessions.</span>
                        </h1>

                        <p>
                            Review your interview practice sessions
                            and continue where you left off.
                        </p>

                    </div>

                    <Link
                        className="history-create-button"
                        to="/interviews/new"
                    >
                        <Plus size={17} />
                        New interview
                        <ArrowRight size={16} />
                    </Link>

                </section>

                {/* ================= SUMMARY ================= */}

                {!loading && !error && (
                    <section className="history-summary">

                        <div className="history-summary-item">

                            <div className="summary-icon">
                                <FileText size={18} />
                            </div>

                            <div>
                                <span>Total sessions</span>
                                <strong>
                                    {interviews.length}
                                </strong>
                            </div>

                        </div>

                        <div className="history-summary-item">

                            <div className="summary-icon completed-icon">
                                <CheckCircle2 size={18} />
                            </div>

                            <div>
                                <span>Completed</span>
                                <strong>
                                    {
                                        interviews.filter(
                                            (interview) =>
                                                interview.status ===
                                                "COMPLETED"
                                        ).length
                                    }
                                </strong>
                            </div>

                        </div>

                        <div className="history-summary-item">

                            <div className="summary-icon active-icon">
                                <Clock3 size={18} />
                            </div>

                            <div>
                                <span>In progress</span>
                                <strong>
                                    {
                                        interviews.filter(
                                            (interview) =>
                                                interview.status ===
                                                "IN_PROGRESS"
                                        ).length
                                    }
                                </strong>
                            </div>

                        </div>

                    </section>
                )}

                {/* ================= CONTENT ================= */}

                <section className="history-content">

                    <div className="history-section-header">

                        <div>
                            <span>ALL SESSIONS</span>
                            <h2>Interview history</h2>
                        </div>

                        {!loading && !error && (
                            <span className="session-count">
                                {interviews.length}{" "}
                                {interviews.length === 1
                                    ? "session"
                                    : "sessions"}
                            </span>
                        )}

                    </div>

                    {/* Loading */}

                    {loading && (
                        <div className="history-loading">

                            <div className="history-loading-icon">
                                <Loader2
                                    size={21}
                                    className="spin"
                                />
                            </div>

                            <div>
                                <strong>
                                    Loading interview library
                                </strong>

                                <span>
                                    Fetching your saved sessions...
                                </span>
                            </div>

                        </div>
                    )}

                    {/* Error */}

                    {!loading && error && (
                        <div className="history-error">

                            <div className="history-error-icon">
                                !
                            </div>

                            <div>
                                <strong>
                                    Unable to load sessions
                                </strong>

                                <span>
                                    {error}
                                </span>
                            </div>

                        </div>
                    )}

                    {/* Empty */}

                    {!loading &&
                        !error &&
                        interviews.length === 0 && (
                            <div className="history-empty">

                                <div className="history-empty-icon">
                                    <Sparkles size={27} />
                                </div>

                                <h3>
                                    Your interview library is empty
                                </h3>

                                <p>
                                    Start your first AI-powered mock
                                    interview and your sessions will
                                    appear here.
                                </p>

                                <Link
                                    className="history-empty-button"
                                    to="/interviews/new"
                                >
                                    <Plus size={17} />
                                    Create interview
                                </Link>

                            </div>
                        )}

                    {/* Sessions */}

                    {!loading &&
                        !error &&
                        interviews.length > 0 && (
                            <div className="session-library">

                                {interviews.map(
                                    (interview, index) => (
                                        <article
                                            className="session-card"
                                            key={interview.id}
                                        >

                                            {/* Card top */}

                                            <div className="session-card-top">

                                                <div className="session-index">
                                                    {String(
                                                        index + 1
                                                    ).padStart(2, "0")}
                                                </div>

                                                <div className="session-title-area">

                                                    <div className="session-title-row">

                                                        <h3>
                                                            {
                                                                interview.title
                                                            }
                                                        </h3>

                                                        <span
                                                            className={getStatusClass(
                                                                interview.status
                                                            )}
                                                        >
                                                            <span className="status-dot" />

                                                            {getStatusLabel(
                                                                interview.status
                                                            )}
                                                        </span>

                                                    </div>

                                                    <p>
                                                        {interview.role}
                                                    </p>

                                                </div>

                                            </div>

                                            {/* Metadata */}

                                            <div className="session-meta-grid">

                                                <div className="session-meta-item">

                                                    <BriefcaseBusiness
                                                        size={15}
                                                    />

                                                    <div>
                                                        <span>
                                                            Role
                                                        </span>

                                                        <strong>
                                                            {
                                                                interview.role
                                                            }
                                                        </strong>
                                                    </div>

                                                </div>

                                                <div className="session-meta-item">

                                                    <Target size={15} />

                                                    <div>
                                                        <span>
                                                            Experience
                                                        </span>

                                                        <strong>
                                                            {
                                                                interview.experienceLevel
                                                            }
                                                        </strong>
                                                    </div>

                                                </div>

                                                <div className="session-meta-item">

                                                    <Layers3 size={15} />

                                                    <div>
                                                        <span>
                                                            Interview
                                                        </span>

                                                        <strong>
                                                            {
                                                                interview.interviewType
                                                            }
                                                        </strong>
                                                    </div>

                                                </div>

                                                <div className="session-meta-item">

                                                    <ListChecks
                                                        size={15}
                                                    />

                                                    <div>
                                                        <span>
                                                            Questions
                                                        </span>

                                                        <strong>
                                                            {
                                                                interview.questionCount
                                                            }
                                                        </strong>
                                                    </div>

                                                </div>

                                            </div>

                                            {/* Tech stack */}

                                            <div className="session-stack">

                                                <span>
                                                    TECH STACK
                                                </span>

                                                <p>
                                                    {
                                                        interview.techStack
                                                    }
                                                </p>

                                            </div>

                                            {/* Bottom */}

                                            <div className="session-card-footer">

                                                <span className="session-ready">
                                                    <Sparkles size={13} />
                                                    AI interview session
                                                </span>

                                                {interview.status === "COMPLETED" ? (
                                                    <Link
                                                        className="open-session-button"
                                                        to={`/interviews/${interview.id}/report`}
                                                    >
                                                        View Report
                                                        <ArrowRight size={15} />
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        className="open-session-button"
                                                        to={`/interviews/${interview.id}/session`}
                                                    >
                                                        {interview.status === "IN_PROGRESS"
                                                            ? "Continue Interview"
                                                            : "Start Interview"}
                                                        <ArrowRight size={15} />
                                                    </Link>
                                                )}

                                            </div>

                                        </article>
                                    )
                                )}

                            </div>
                        )}

                </section>

                <div className="history-footer-note">
                    <Sparkles size={13} />
                    MockMate · Practice smarter with AI
                </div>

            </main>

        </div>
    );
}