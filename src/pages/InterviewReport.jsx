import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Award,
    Brain,
    CheckCircle,
    MessageCircle,
    Target,
    TrendingUp,
    BarChart3,
    Sparkles,
    Loader2,
} from "lucide-react";
import api from "../api/axiosConfig";

export default function InterviewReport() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");
    const [generateError, setGenerateError] = useState("");

    useEffect(() => {
        const loadReport = async () => {
            try {
                setLoading(true);
                setError("");

                console.log(
                    "Loading AI interview report for:",
                    id
                );

                const response = await api.get(
                    `/api/interviews/${id}/report`
                );

                console.log(
                    "AI interview report loaded:",
                    response.data
                );

                setReport(response.data);

            } catch (error) {

            console.error(
                "Failed to load interview report:",
                error
            );

            if (error?.response?.status === 404) {

                setReport(null);
                setError("");

            } else {

                setError(
                    "Interview report could not be loaded."
                );
            }

        } finally {

            setLoading(false);
        }
        };

        if (id) {
            loadReport();
        }
    }, [id]);

    /*
     * ============================================================
     * GENERATE REPORT
     * ============================================================
     */

    const handleGenerateReport = async () => {
        try {
            setGenerating(true);
            setGenerateError("");

            console.log(
                "Generating conversation report for interview:",
                id
            );

            const response = await api.post(
                `/api/interviews/${id}/report/conversation/generate`
            );

            console.log(
                "Report generated:",
                response.data
            );

            setReport(response.data);

        } catch (error) {
            console.error(
                "Report generation failed:",
                error
            );

            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Report generation failed. Please try again.";

            setGenerateError(message);

        } finally {
            setGenerating(false);
        }
    };

    /*
     * ============================================================
     * LOADING
     * ============================================================
     */

    if (loading) {
        return (
            <div className="report-loading">

                <div className="report-loading-icon">
                    <Brain size={32} />
                </div>

                <h2>
                    Loading your AI interview report...
                </h2>

                <p>
                    Checking your interview analysis.
                </p>

            </div>
        );
    }

    /*
     * ============================================================
     * ERROR
     * ============================================================
     */

    if (error) {
        return (
            <div className="report-error">

                <div className="report-error-icon">
                    <Brain size={32} />
                </div>

                <h2>
                    Report Unavailable
                </h2>

                <p>
                    {error}
                </p>

                <button
                    onClick={() =>
                        navigate("/interviews")
                    }
                >
                    <ArrowLeft size={18} />
                    Back to Interviews
                </button>

            </div>
        );
    }

    /*
     * ============================================================
     * REPORT NOT GENERATED
     * ============================================================
     */

    if (!report) {
        return (
            <div className="report-error">

                <div className="report-error-icon">
                    <Sparkles size={32} />
                </div>

                <h2>
                    AI Report Not Generated
                </h2>

                <p>
                    Your interview is completed, but the AI
                    performance report has not been generated yet.
                </p>

                {generateError && (
                    <p>
                        {generateError}
                    </p>
                )}

                <button
                    onClick={handleGenerateReport}
                    disabled={generating}
                >
                    {generating ? (
                        <>
                            <Loader2
                                size={18}
                                className="spin"
                            />
                            Generating Report...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Generate Report
                        </>
                    )}
                </button>

                <button
                    onClick={() =>
                        navigate("/interviews")
                    }
                >
                    <ArrowLeft size={18} />
                    Back to Interviews
                </button>

            </div>
        );
    }

    /*
     * ============================================================
     * SCORE FORMATTER
     * ============================================================
     */

    const formatScore = (score) => {
        const numericScore = Number(score);

        if (Number.isNaN(numericScore)) {
            return "0.0";
        }

        return numericScore.toFixed(1);
    };

    /*
     * ============================================================
     * RENDER REPORT
     * ============================================================
     */

    return (
        <div className="interview-report-page">

            {/* HEADER */}

            <div className="report-header">

                <button
                    className="back-button"
                    onClick={() =>
                        navigate("/interviews")
                    }
                >
                    <ArrowLeft size={18} />
                    Back to Interviews
                </button>

                <div className="report-title-icon">
                    <BarChart3 size={28} />
                </div>

                <h1>
                    AI Interview Report
                </h1>

                <p>
                    Detailed analysis of your voice interview
                    performance.
                </p>

            </div>

            {/* OVERALL SCORE */}

            <div className="overall-score-card">

                <div className="score-icon">
                    <Award size={32} />
                </div>

                <div className="overall-score">

                    <span className="score-number">
                        {formatScore(
                            report.overallScore
                        )}
                    </span>

                    <span className="score-total">
                        /100
                    </span>

                </div>

                <h2>
                    Overall Performance
                </h2>

                <p>
                    {report.overallFeedback}
                </p>

            </div>

            {/* CATEGORY SCORES */}

            <div className="score-grid">

                <ScoreCard
                    icon={<Brain size={22} />}
                    title="Technical Knowledge"
                    score={report.technicalScore}
                />

                <ScoreCard
                    icon={<MessageCircle size={22} />}
                    title="Communication"
                    score={report.communicationScore}
                />

                <ScoreCard
                    icon={<Target size={22} />}
                    title="Problem Solving"
                    score={report.problemSolvingScore}
                />

            </div>

            {/* AI ANALYSIS */}

            <div className="report-sections">

                <FeedbackCard
                    icon={<CheckCircle size={22} />}
                    title="Strengths"
                    content={report.strengths}
                />

                <FeedbackCard
                    icon={<TrendingUp size={22} />}
                    title="Areas to Improve"
                    content={report.weaknesses}
                />

                <FeedbackCard
                    icon={<Target size={22} />}
                    title="Recommendations"
                    content={report.recommendations}
                />

            </div>

            {/* OVERALL FEEDBACK */}

            <section className="overall-feedback-section">

                <div className="section-heading">

                    <h2>
                        Overall AI Feedback
                    </h2>

                    <p>
                        Summary of your performance based on
                        the complete interview conversation.
                    </p>

                </div>

                <div className="overall-feedback-card">

                    <MessageCircle size={24} />

                    <p>
                        {report.overallFeedback}
                    </p>

                </div>

            </section>

            {/* PERFORMANCE SUMMARY */}

            <section className="report-summary-section">

                <div className="section-heading">

                    <h2>
                        Performance Summary
                    </h2>

                    <p>
                        Your AI-generated interview assessment.
                    </p>

                </div>

                <div className="summary-grid">

                    <SummaryItem
                        label="Overall Score"
                        value={`${formatScore(
                            report.overallScore
                        )}/100`}
                    />

                    <SummaryItem
                        label="Technical"
                        value={`${formatScore(
                            report.technicalScore
                        )}/100`}
                    />

                    <SummaryItem
                        label="Communication"
                        value={`${formatScore(
                            report.communicationScore
                        )}/100`}
                    />

                    <SummaryItem
                        label="Problem Solving"
                        value={`${formatScore(
                            report.problemSolvingScore
                        )}/100`}
                    />

                </div>

            </section>

            {/* ACTIONS */}

            <div className="report-actions">

                <button
                    onClick={() =>
                        navigate("/interviews")
                    }
                >
                    <ArrowLeft size={18} />
                    View Interview History
                </button>

            </div>

        </div>
    );
}


/*
 * ================================================================
 * SCORE CARD
 * ================================================================
 */

function ScoreCard({
                       icon,
                       title,
                       score
                   }) {
    const numericScore = Number(score || 0);

    const percentage = Math.max(
        0,
        Math.min(
            100,
            numericScore
        )
    );

    return (
        <div className="score-card">

            <div className="score-card-top">

                <div className="score-card-icon">
                    {icon}
                </div>

                <div>

                    <h3>
                        {title}
                    </h3>

                    <strong>
                        {numericScore.toFixed(1)}
                        <span>/100</span>
                    </strong>

                </div>

            </div>

            <div className="score-progress">

                <div
                    className="score-progress-fill"
                    style={{
                        width:
                            `${percentage}%`
                    }}
                />

            </div>

        </div>
    );
}


/*
 * ================================================================
 * FEEDBACK CARD
 * ================================================================
 */

function FeedbackCard({
                          icon,
                          title,
                          content
                      }) {
    return (
        <div className="feedback-card">

            <div className="feedback-card-header">

                <div className="feedback-icon">
                    {icon}
                </div>

                <h2>
                    {title}
                </h2>

            </div>

            <p>
                {content ||
                    "No information available."}
            </p>

        </div>
    );
}


/*
 * ================================================================
 * SUMMARY ITEM
 * ================================================================
 */

function SummaryItem({
                         label,
                         value
                     }) {
    return (
        <div className="summary-item">

            <span>
                {label}
            </span>

            <strong>
                {value}
            </strong>

        </div>
    );
}