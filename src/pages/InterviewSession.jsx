import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Clock3,
    Mic,
    MicOff,
    PhoneOff,
    Radio,
    Sparkles,
    User,
} from "lucide-react";

import api from "../api/axiosConfig";
import VoiceInterview from "../components/VoiceInterview";

function InterviewSession() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [interview, setInterview] = useState(null);
    const [conversation, setConversation] = useState([]);

    const [loading, setLoading] = useState(true);
    const [savingTurn, setSavingTurn] = useState(false);
    const [ending, setEnding] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);

    const [error, setError] = useState("");
    const [voiceError, setVoiceError] = useState("");

    const [callStarted, setCallStarted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState("Ready");

    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const conversationEndRef = useRef(null);

    /*
     * Prevent duplicate completion/report generation.
     */
    const endingRef = useRef(false);

    /*
     * Track all conversation-save requests that are currently
     * running. This is important because Vapi can end immediately
     * after the final transcript.
     */
    const pendingTurnRequestsRef = useRef(new Set());

    /*
     * ---------------------------------------------------------
     * Load interview
     * ---------------------------------------------------------
     */

    useEffect(() => {
        const loadInterview = async () => {
            try {
                setLoading(true);
                setError("");

                const [interviewResponse, conversationResponse] =
                    await Promise.all([
                        api.get(`/api/interviews/${id}`),
                        api.get(
                            `/api/interviews/${id}/conversation`
),
]);

setInterview(interviewResponse.data);

setConversation(
    conversationResponse.data || []
);

/*
 * Resume the interview as IN_PROGRESS.
 */
await api.patch(
    `/api/interviews/${id}/status?status=IN_PROGRESS`
);

} catch (err) {
    console.error(
        "Failed to load interview:",
        err
    );

    setError(
        err?.response?.data?.message ||
        "Unable to load the interview."
    );

} finally {
    setLoading(false);
}
};

loadInterview();
}, [id]);

/*
 * ---------------------------------------------------------
 * Timer
 * ---------------------------------------------------------
 */

useEffect(() => {
    if (!callStarted || callEnded) {
        return;
    }

    const timer = setInterval(() => {
        setElapsedSeconds(
            (previous) => previous + 1
        );
    }, 1000);

    return () => clearInterval(timer);
}, [callStarted, callEnded]);

/*
 * ---------------------------------------------------------
 * Auto scroll conversation
 * ---------------------------------------------------------
 */

useEffect(() => {
    conversationEndRef.current?.scrollIntoView({
        behavior: "smooth",
    });
}, [conversation]);

/*
 * ---------------------------------------------------------
 * Format timer
 * ---------------------------------------------------------
 */

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);

    const remainingSeconds =
        seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
};

/*
 * ---------------------------------------------------------
 * Save conversation turn
 * ---------------------------------------------------------
 */

const handleTurn = useCallback(
    async ({ speaker, transcript }) => {

        if (!transcript?.trim()) {
            return;
        }

        const cleanTranscript =
            transcript.trim();

        const temporaryTurn = {
            id: `temp-${Date.now()}-${Math.random()}`,
            turnNumber:
                conversation.length + 1,
            speaker,
            transcript: cleanTranscript,
            temporary: true,
        };

        /*
         * Show immediately in the UI.
         */
        setConversation((previous) => [
            ...previous,
            temporaryTurn,
        ]);

        /*
         * Create the API request.
         */
        const savePromise = api.post(
            `/api/interviews/${id}/conversation/turns`,
            {
                speaker,
                transcript: cleanTranscript,
            }
        );

        /*
         * Track this request so that when Vapi ends,
         * we can wait for it before generating the report.
         */
        pendingTurnRequestsRef.current.add(
            savePromise
        );

        try {
            setSavingTurn(true);

            const response =
                await savePromise;

            /*
             * Replace temporary UI turn with
             * the real database record.
             */
            setConversation((previous) =>
                previous.map((turn) =>
                    turn.id === temporaryTurn.id
                        ? response.data
                        : turn
                )
            );

        } catch (err) {
            console.error(
                "Failed to save conversation turn:",
                err
            );

            setError(
                "A conversation message could not be saved."
            );

        } finally {

            pendingTurnRequestsRef.current.delete(
                savePromise
            );

            setSavingTurn(
                pendingTurnRequestsRef.current.size > 0
            );
        }
    },
    [id, conversation.length]
);

/*
 * ---------------------------------------------------------
 * Wait for final transcript saves
 * ---------------------------------------------------------
 */

const waitForPendingTurnRequests =
    async () => {

        const pendingRequests = Array.from(
            pendingTurnRequestsRef.current
        );

        if (pendingRequests.length === 0) {
            return;
        }

        console.log(
            "Waiting for pending conversation saves:",
            pendingRequests.length
        );

        await Promise.allSettled(
            pendingRequests
        );
    };

/*
 * ---------------------------------------------------------
 * COMPLETE INTERVIEW
 *
 * This is the single place responsible for:
 *
 * 1. Waiting for transcript saves
 * 2. Marking interview completed
 * 3. Generating Gemini report
 * 4. Opening report page
 * ---------------------------------------------------------
 */

    const finalizeInterview = async () => {
        if (endingRef.current) {
            return;
        }

        endingRef.current = true;

        try {
            setEnding(true);
            setGeneratingReport(false);

            console.log("========== FINALIZING INTERVIEW ==========");

            // 1. Wait for all conversation turns to finish saving
            console.log("Waiting for pending conversation saves...");
            await waitForPendingTurnRequests();

            // Small delay to make sure the final turn is committed
            await new Promise((resolve) => setTimeout(resolve, 500));

            // 2. ALWAYS mark interview as COMPLETED first
            console.log("Marking interview as COMPLETED...");

            await api.patch(
                `/api/interviews/${id}/status?status=COMPLETED`
            );

            console.log("Interview status changed to COMPLETED");

            // 3. Now try to generate the AI report
            setGeneratingReport(true);

            console.log("Generating AI interview report...");

            try {
                await api.post(
                    `/api/interviews/${id}/report/conversation/generate`
                );

                console.log("AI report generated successfully");

                navigate(`/interviews/${id}/report`);
            } catch (reportError) {
                console.error(
                    "Report generation failed:",
                    reportError
                );

                // IMPORTANT:
                // Interview is already COMPLETED.
                // Gemini failure must NOT change it back to IN_PROGRESS.

                alert(
                    "Interview completed successfully, but the AI report could not be generated right now. Please try generating the report again later."
                );

                navigate("/interviews");
            }

        } catch (error) {
            console.error(
                "Failed to finalize interview:",
                error
            );

            alert(
                "Failed to complete the interview. Please try again."
            );

            endingRef.current = false;
        } finally {
            setEnding(false);
            setGeneratingReport(false);
        }
    };

/*
 * ---------------------------------------------------------
 * Vapi callbacks
 * ---------------------------------------------------------
 */

const handleCallStart =
    useCallback(() => {

        setCallStarted(true);
        setCallEnded(false);
        setVoiceError("");
        setVoiceStatus(
            "Interview started"
        );

    }, []);

/*
 * This is now VERY important.
 *
 * Both:
 *
 * - automatic AI completion
 * - manual Vapi stop
 *
 * eventually reach this callback.
 */

const handleCallEnd =
    useCallback(() => {

        console.log(
            "Vapi call ended."
        );

        setCallStarted(false);
        setCallEnded(true);
        setIsSpeaking(false);

        setVoiceStatus(
            "Finishing interview..."
        );

        /*
         * Generate report after Vapi ends.
         */
        finalizeInterview();

    }, [finalizeInterview]);

const handleVoiceError =
    useCallback((err) => {

        console.error(
            "Voice interview error:",
            err
        );

        setVoiceError(
            err?.message ||
            "There was a problem with the voice interview."
        );

        setVoiceStatus(
            "Connection problem"
        );

    }, []);

/*
 * ---------------------------------------------------------
 * Manual end request
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 *
 * We do NOT mark the interview completed here.
 *
 * We ask VoiceInterview to stop the Vapi call.
 *
 * Vapi then triggers onCallEnd().
 *
 * onCallEnd() calls finalizeInterview().
 * ---------------------------------------------------------
 */

const [stopVoiceCall, setStopVoiceCall] =
    useState(false);

const handleEndInterview =
    () => {

        if (endingRef.current) {
            return;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to end the interview?"
            );

        if (!confirmed) {
            return;
        }

        setEnding(true);
        setVoiceStatus(
            "Ending interview..."
        );

        /*
         * Tell VoiceInterview to stop Vapi.
         */
        setStopVoiceCall(true);

        setTimeout(() => {
            setStopVoiceCall(false);
        }, 500);
    };

/*
 * Reset the stop signal after VoiceInterview
 * receives it.
 */
useEffect(() => {

    if (!stopVoiceCall) {
        return;
    }

    const timer =
        setTimeout(() => {
            setStopVoiceCall(false);
        }, 500);

    return () => clearTimeout(timer);

}, [stopVoiceCall]);

/*
 * ---------------------------------------------------------
 * Loading state
 * ---------------------------------------------------------
 */

if (loading) {
    return (
        <div className="interview-room-page">
            <div className="interview-loading">

                <div className="loading-orb">
                    <Sparkles size={24} />
                </div>

                <h2>
                    Preparing your interview...
                </h2>

                <p>
                    Setting up your AI interviewer.
                </p>

            </div>
        </div>
    );
}

/*
 * ---------------------------------------------------------
 * Error state
 * ---------------------------------------------------------
 */

if (error && !interview) {
    return (
        <div className="interview-room-page">
            <div className="interview-error">

                <h2>
                    Unable to load interview
                </h2>

                <p>{error}</p>

                <button
                    type="button"
                    onClick={() =>
                        navigate("/interviews")
                    }
                >
                    Back to interviews
                </button>

            </div>
        </div>
    );
}

if (!interview) {
    return null;
}

return (
    <div className="interview-room-page">

        {/* -------------------------------------------------
                Top navigation
            -------------------------------------------------- */}

        <header className="interview-room-header">

            <button
                type="button"
                className="interview-back-button"
                onClick={() =>
                    navigate("/interviews")
                }
                disabled={
                    callStarted ||
                    ending ||
                    generatingReport
                }
            >
                <ArrowLeft size={18} />

                <span>Exit</span>
            </button>

            <div className="interview-brand">

                <div className="brand-mark">
                    <Sparkles size={17} />
                </div>

                <span>
                        MockMate
                    </span>

            </div>

            <div className="interview-header-right">

                <div className="interview-live-status">

                        <span
                            className={
                                callStarted
                                    ? "status-dot active"
                                    : "status-dot"
                            }
                        />

                    {callStarted
                        ? "Live interview"
                        : "Interview room"}

                </div>

                <div className="interview-timer">

                    <Clock3 size={16} />

                    {formatTime(
                        elapsedSeconds
                    )}

                </div>

            </div>

        </header>

        {/* -------------------------------------------------
                Main room
            -------------------------------------------------- */}

        <main className="interview-room">

            {/* Left: AI interviewer */}

            <section className="ai-interviewer-panel">

                <div className="panel-top-row">

                    <div>

                        <p className="eyebrow">
                            AI INTERVIEWER
                        </p>

                        <h1>
                            {interview.role}
                        </h1>

                    </div>

                    <div className="interview-type-pill">
                        {interview.interviewType ||
                            "Technical"}
                    </div>

                </div>

                <div className="ai-visual-area">

                    <div
                        className={`ai-orb ${
                            isSpeaking
                                ? "ai-orb-speaking"
                                : callStarted
                                    ? "ai-orb-listening"
                                    : ""
                        }`}
                    >
                        <div className="ai-orb-inner">
                            <Sparkles size={42} />
                        </div>
                    </div>

                    <div className="ai-name">
                        MockMate AI
                    </div>

                    <div className="ai-role">
                        Your technical interviewer
                    </div>

                    <div
                        className={`ai-status ${
                            callStarted
                                ? "connected"
                                : ""
                        }`}
                    >
                        <Radio size={14} />

                        <span>
                                {voiceStatus}
                            </span>
                    </div>

                </div>

                <div className="interview-details">

                    <div className="detail-item">

                            <span className="detail-label">
                                Role
                            </span>

                        <strong>
                            {interview.role}
                        </strong>

                    </div>

                    <div className="detail-item">

                            <span className="detail-label">
                                Experience
                            </span>

                        <strong>
                            {interview.experienceLevel}
                        </strong>

                    </div>

                    <div className="detail-item">

                            <span className="detail-label">
                                Focus
                            </span>

                        <strong>
                            {interview.techStack}
                        </strong>

                    </div>

                </div>

            </section>

            {/* Right: conversation */}

            <section className="conversation-panel">

                <div className="conversation-header">

                    <div>

                        <p className="eyebrow">
                            LIVE CONVERSATION
                        </p>

                        <h2>
                            Interview transcript
                        </h2>

                    </div>

                    <div className="conversation-count">
                        {conversation.length}{" "}
                        {conversation.length === 1
                            ? "turn"
                            : "turns"}
                    </div>

                </div>

                <div className="conversation-list">

                    {conversation.length === 0 ? (
                        <div className="conversation-empty">

                            <div className="empty-icon">
                                <Mic size={24} />
                            </div>

                            <h3>
                                Your interview is ready
                            </h3>

                            <p>
                                Start the interview and
                                speak naturally with your
                                AI interviewer.
                            </p>

                        </div>
                    ) : (
                        conversation.map((turn) => {

                            const isAI =
                                turn.speaker === "AI";

                            return (
                                <div
                                    key={turn.id}
                                    className={`conversation-message ${
                                        isAI
                                            ? "ai-message"
                                            : "candidate-message"
                                    }`}
                                >

                                    <div className="message-avatar">

                                        {isAI ? (
                                            <Sparkles
                                                size={16}
                                            />
                                        ) : (
                                            <User
                                                size={16}
                                            />
                                        )}

                                    </div>

                                    <div className="message-content">

                                        <div className="message-meta">

                                                <span>
                                                    {isAI
                                                        ? "MockMate AI"
                                                        : "You"}
                                                </span>

                                            {turn.temporary && (
                                                <small>
                                                    Saving...
                                                </small>
                                            )}

                                        </div>

                                        <p>
                                            {
                                                turn.transcript
                                            }
                                        </p>

                                    </div>

                                </div>
                            );
                        })
                    )}

                    <div
                        ref={conversationEndRef}
                    />

                </div>

                <div className="voice-control-area">

                    {voiceError && (
                        <div className="voice-error">
                            {voiceError}
                        </div>
                    )}

                    {error && (
                        <div className="voice-error">
                            {error}
                        </div>
                    )}

                    {generatingReport && (
                        <div className="voice-error">
                            Your interview is complete.
                            Generating your AI report...
                        </div>
                    )}

                    <div className="voice-control-main">

                        <div className="voice-state">

                            <div
                                className={`mic-visual ${
                                    callStarted
                                        ? "mic-active"
                                        : ""
                                }`}
                            >
                                {callStarted ? (
                                    <Mic size={22} />
                                ) : (
                                    <MicOff size={22} />
                                )}
                            </div>

                            <div>

                                <strong>
                                    {callStarted
                                        ? "You're live"
                                        : generatingReport
                                            ? "Generating your report"
                                            : "Ready to begin"}
                                </strong>

                                <span>
                                        {callStarted
                                            ? "Speak naturally. The AI will guide the conversation."
                                            : generatingReport
                                                ? "Please wait while MockMate evaluates your interview."
                                                : "Start the interview when you're ready."}
                                    </span>

                            </div>

                        </div>

                        {callStarted && (
                            <button
                                type="button"
                                className="end-interview-button"
                                onClick={
                                    handleEndInterview
                                }
                                disabled={
                                    ending ||
                                    generatingReport
                                }
                            >
                                <PhoneOff size={18} />

                                {ending
                                    ? "Ending..."
                                    : "End Interview"}
                            </button>
                        )}

                    </div>

                    <VoiceInterview
                        interview={interview}
                        conversation={conversation}
                        onTurn={handleTurn}
                        onCallStart={
                            handleCallStart
                        }
                        onCallEnd={
                            handleCallEnd
                        }
                        onError={
                            handleVoiceError
                        }
                        stopCall={
                            stopVoiceCall
                        }
                    />

                    {savingTurn && (
                        <div className="saving-indicator">
                            Saving conversation...
                        </div>
                    )}

                </div>

            </section>

        </main>

    </div>
);
}

export default InterviewSession;
