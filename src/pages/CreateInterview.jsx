import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    BriefcaseBusiness,
    FileText,
    Layers3,
    ListChecks,
    Loader2,
    Sparkles,
    Target,
} from "lucide-react";
import api from "../api/axiosConfig";

export default function CreateInterview() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: "",
        role: "",
        experienceLevel: "Fresher",
        techStack: "",
        interviewType: "Technical",
        questionCount: 10,
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm({
            ...form,
            [name]:
                name === "questionCount"
                    ? Number(value)
                    : value,
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await api.post("/api/interviews", form);

            navigate("/interviews");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not create the interview."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="app-page create-interview-page">

            {/* ================= NAVBAR ================= */}

            <header className="topbar">

                <Link
                    className="brand"
                    to="/dashboard"
                >
                    <span className="brand-mark">
                        <Sparkles size={17} />
                    </span>

                    MockMate
                </Link>

                <Link
                    className="setup-back-link"
                    to="/dashboard"
                >
                    <ArrowLeft size={16} />
                    Dashboard
                </Link>

            </header>

            {/* ================= PAGE ================= */}

            <main className="create-interview-container">

                <div className="create-page-heading">

                    <div className="create-eyebrow">
                        <span />
                        AI INTERVIEW SETUP
                    </div>

                    <h1>
                        Build your
                        <span> interview.</span>
                    </h1>

                    <p>
                        Configure your role, technology stack and
                        interview style. MockMate will generate
                        questions tailored to your session.
                    </p>

                </div>

                <div className="create-layout">

                    {/* ================= FORM ================= */}

                    <form
                        className="create-interview-card"
                        onSubmit={handleSubmit}
                    >

                        <div className="form-card-header">

                            <div className="form-step-icon">
                                <Sparkles size={19} />
                            </div>

                            <div>
                                <span>SESSION CONFIGURATION</span>
                                <h2>Interview details</h2>
                            </div>

                        </div>

                        {error && (
                            <div className="create-error">
                                <strong>Unable to create interview</strong>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Title */}

                        <div className="form-field">

                            <label htmlFor="title">
                                Interview title
                            </label>

                            <div className="input-wrapper">
                                <FileText size={17} />

                                <input
                                    id="title"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="Java Developer Mock Interview"
                                />
                            </div>

                        </div>

                        {/* Role */}

                        <div className="form-field">

                            <label htmlFor="role">
                                Job role
                            </label>

                            <div className="input-wrapper">
                                <BriefcaseBusiness size={17} />

                                <input
                                    id="role"
                                    name="role"
                                    value={form.role}
                                    onChange={handleChange}
                                    required
                                    placeholder="Java Full Stack Developer"
                                />
                            </div>

                        </div>

                        {/* Experience + Type */}

                        <div className="form-row">

                            <div className="form-field">

                                <label htmlFor="experienceLevel">
                                    Experience level
                                </label>

                                <div className="select-wrapper">

                                    <Target size={17} />

                                    <select
                                        id="experienceLevel"
                                        name="experienceLevel"
                                        value={
                                            form.experienceLevel
                                        }
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="Fresher">
                                            Fresher
                                        </option>

                                        <option value="Entry Level">
                                            Entry Level
                                        </option>

                                        <option value="Intermediate">
                                            Intermediate
                                        </option>

                                        <option value="Experienced">
                                            Experienced
                                        </option>
                                    </select>

                                </div>

                            </div>

                            <div className="form-field">

                                <label htmlFor="interviewType">
                                    Interview type
                                </label>

                                <div className="select-wrapper">

                                    <Layers3 size={17} />

                                    <select
                                        id="interviewType"
                                        name="interviewType"
                                        value={
                                            form.interviewType
                                        }
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="Technical">
                                            Technical
                                        </option>

                                        <option value="Behavioral">
                                            Behavioral
                                        </option>

                                        <option value="HR">
                                            HR
                                        </option>

                                        <option value="Mixed">
                                            Mixed
                                        </option>
                                    </select>

                                </div>

                            </div>

                        </div>

                        {/* Tech stack */}

                        <div className="form-field">

                            <div className="field-heading">

                                <label htmlFor="techStack">
                                    Tech stack / topics
                                </label>

                                <span>
                                    Used by AI to generate questions
                                </span>

                            </div>

                            <div className="textarea-wrapper">

                                <Layers3 size={17} />

                                <textarea
                                    id="techStack"
                                    name="techStack"
                                    value={form.techStack}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    placeholder="Java, Spring Boot, React, MySQL"
                                />

                            </div>

                        </div>

                        {/* Question count */}

                        <div className="question-count-section">

                            <div className="question-count-heading">

                                <div>

                                    <label htmlFor="questionCount">
                                        Number of questions
                                    </label>

                                    <span>
                                        Choose between 5 and 30
                                    </span>

                                </div>

                                <strong>
                                    {form.questionCount}
                                </strong>

                            </div>

                            <input
                                id="questionCount"
                                className="question-range"
                                name="questionCount"
                                type="range"
                                min="5"
                                max="30"
                                value={form.questionCount}
                                onChange={handleChange}
                            />

                            <div className="range-labels">
                                <span>5 questions</span>
                                <span>30 questions</span>
                            </div>

                        </div>

                        {/* Actions */}

                        <div className="create-actions">

                            <Link
                                className="cancel-create-button"
                                to="/dashboard"
                            >
                                Cancel
                            </Link>

                            <button
                                className="create-submit-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2
                                            className="spin"
                                            size={17}
                                        />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Create interview
                                        <ArrowRight size={17} />
                                    </>
                                )}
                            </button>

                        </div>

                    </form>

                    {/* ================= PREVIEW ================= */}

                    <aside className="interview-preview">

                        <div className="preview-glow" />

                        <div className="preview-header">

                            <div className="preview-icon">
                                <Sparkles size={20} />
                            </div>

                            <div>
                                <span>AI SESSION</span>
                                <h3>Interview preview</h3>
                            </div>

                        </div>

                        <div className="preview-question">

                            <div className="preview-question-label">
                                <span className="preview-live-dot" />
                                AI GENERATED
                            </div>

                            <p>
                                Your questions will be generated
                                based on your selected role,
                                experience and technology stack.
                            </p>

                        </div>

                        <div className="preview-details">

                            <div className="preview-detail">

                                <div>
                                    <BriefcaseBusiness
                                        size={15}
                                    />
                                </div>

                                <span>
                                    Role
                                    <strong>
                                        {form.role ||
                                            "Your target role"}
                                    </strong>
                                </span>

                            </div>

                            <div className="preview-detail">

                                <div>
                                    <Layers3 size={15} />
                                </div>

                                <span>
                                    Interview
                                    <strong>
                                        {form.interviewType}
                                    </strong>
                                </span>

                            </div>

                            <div className="preview-detail">

                                <div>
                                    <ListChecks size={15} />
                                </div>

                                <span>
                                    Questions
                                    <strong>
                                        {form.questionCount}
                                    </strong>
                                </span>

                            </div>

                        </div>



                    </aside>

                </div>

            </main>
        </div>
    );
}