import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    BriefcaseBusiness,
    ChevronRight,
    Clock3,
    LogOut,
    Plus,
    Sparkles,
    Target,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosConfig";

export default function Dashboard() {
    const { user, logout } = useAuth();

    const [interviews, setInterviews] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadInterviews() {
            try {
                const response = await api.get("/api/interviews");
                setInterviews(response.data);
            } catch (err) {
                setError(
                    err.response?.status === 401 ||
                    err.response?.status === 403
                        ? "Your session may have expired. Please log in again."
                        : "Could not load your interviews. Check that the backend is running."
                );
            } finally {
                setLoading(false);
            }
        }

        loadInterviews();
    }, []);

    return (
        <div className="app-page dashboard-page">

            {/* ================= TOP NAVBAR ================= */}

            <header className="topbar">
                <Link className="brand" to="/dashboard">
                    <span className="brand-mark">
                        <Sparkles size={17} />
                    </span>
                    MockMate
                </Link>

                <div className="topbar-right">
                    <div className="user-profile">
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
                        title="Log out"
                    >
                        <LogOut size={17} />
                        <span>Log out</span>
                    </button>
                </div>
            </header>

            {/* ================= MAIN ================= */}

            <main className="dashboard">

                {/* Hero */}

                <section className="dashboard-hero">

                    <div className="hero-copy">

                        <div className="hero-eyebrow">
                            <span className="eyebrow-dot" />
                            AI INTERVIEW WORKSPACE
                        </div>

                        <h1>
                            Welcome
                            {user?.name
                                ? `, ${user.name.split(" ")[0]}`
                                : ""}
                            <span>.</span>
                        </h1>

                        <p>
                            Practice interviews, review your sessions,
                            and build confidence with AI-powered feedback.
                        </p>
                    </div>

                    <Link
                        className="create-interview-button"
                        to="/interviews/new"
                    >
                        <span className="button-icon">
                            <Plus size={18} />
                        </span>

                        Create interview

                        <ArrowRight size={17} />
                    </Link>
                </section>

                {/* ================= STATS ================= */}

                <section className="stats-grid">

                    <article className="stat-card dashboard-stat">

                        <div className="stat-icon">
                            <BriefcaseBusiness size={20} />
                        </div>

                        <div className="stat-content">
                            <span>Total interviews</span>
                            <strong>{interviews.length}</strong>
                            <small>
                                Your completed practice sessions
                            </small>
                        </div>

                        <div className="stat-glow" />
                    </article>

                    <article className="stat-card dashboard-stat">

                        <div className="stat-icon">
                            <Target size={20} />
                        </div>

                        <div className="stat-content">
                            <span>Practice anytime</span>
                            <strong>One step</strong>
                            <small>
                                Keep improving with every session
                            </small>
                        </div>

                        <div className="stat-glow" />
                    </article>
                </section>

                {/* ================= RECENT INTERVIEWS ================= */}

                <section className="panel recent-interviews-panel">

                    <div className="panel-heading dashboard-panel-heading">

                        <div>
                            <div className="section-eyebrow">
                                YOUR SESSIONS
                            </div>

                            <h2>Recent interviews</h2>

                            <p>
                                Your saved interview sessions
                            </p>
                        </div>

                        <Link
                            className="history-link"
                            to="/interviews"
                        >
                            View history
                            <ChevronRight size={16} />
                        </Link>
                    </div>

                    {loading && (
                        <div className="dashboard-loading">
                            <div className="loading-orb">
                                <Sparkles size={18} />
                            </div>

                            <div>
                                <strong>Loading your workspace</strong>
                                <span>
                                    Fetching your interview sessions...
                                </span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="dashboard-error">
                            <div>
                                <strong>Something went wrong</strong>
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {!loading &&
                        !error &&
                        interviews.length === 0 && (
                            <div className="empty-state dashboard-empty">

                                <div className="empty-icon">
                                    <Sparkles size={25} />
                                </div>

                                <h3>No interviews yet</h3>

                                <p>
                                    Create your first mock interview
                                    to get started.
                                </p>

                                <Link
                                    className="button-link empty-create-button"
                                    to="/interviews/new"
                                >
                                    <Plus size={17} />
                                    Create your first interview
                                </Link>
                            </div>
                        )}

                    {!loading &&
                        interviews.length > 0 && (
                            <div className="interview-list">

                                {interviews
                                    .slice(0, 5)
                                    .map((interview, index) => (
                                        <article
                                            className="interview-row dashboard-interview-row"
                                            key={interview.id}
                                        >

                                            <div className="interview-main">

                                                <div className="interview-number">
                                                    {String(index + 1).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </div>

                                                <div className="interview-details">

                                                    <h3>
                                                        {interview.title}
                                                    </h3>

                                                    <div className="interview-meta">

                                                        <span>
                                                            <BriefcaseBusiness
                                                                size={13}
                                                            />
                                                            {interview.role}
                                                        </span>

                                                        <span>
                                                            <Target size={13} />
                                                            {
                                                                interview.experienceLevel
                                                            }
                                                        </span>

                                                        <span>
                                                            <Clock3 size={13} />
                                                            {
                                                                interview.questionCount
                                                            }{" "}
                                                            questions
                                                        </span>

                                                    </div>
                                                </div>
                                            </div>

                                            <div className="interview-right">

                                                <span className="status">
                                                    {interview.status}
                                                </span>

                                                <ChevronRight
                                                    className="interview-arrow"
                                                    size={18}
                                                />
                                            </div>

                                        </article>
                                    ))}

                            </div>
                        )}
                </section>

                {/* ================= FOOTER LABEL ================= */}

                <div className="dashboard-footer-note">
                    <Sparkles size={14} />
                    <span>
                        MockMate · AI-powered interview practice
                    </span>
                </div>

            </main>
        </div>
    );
}