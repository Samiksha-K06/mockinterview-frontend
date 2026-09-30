import { useEffect, useRef, useState } from "react";
import VapiPackage from "@vapi-ai/web";
import api from "../api/axiosConfig.js";

/*
 * Your installed Vapi package is exposing:
 *
 * default -> default -> class Vapi
 *
 * So we safely unwrap it here.
 */
const Vapi = VapiPackage.default ?? VapiPackage;

function VoiceInterview({
                            interview,
                            conversation = [],
                            onTurn,
                            onCallStart,
                            onCallEnd,
                            onError,
                            stopCall,
                        }) {
    const vapiRef = useRef(null);
    const startedRef = useRef(false);

    /*
     * Vapi configuration
     */
    const [publicKey, setPublicKey] = useState(null);
    const [assistantId, setAssistantId] = useState(null);

    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [status, setStatus] = useState(
        "Loading voice interview..."
    );

    /*
     * Keep latest callbacks without recreating Vapi.
     */
    const onTurnRef = useRef(onTurn);
    const onCallStartRef = useRef(onCallStart);
    const onCallEndRef = useRef(onCallEnd);
    const onErrorRef = useRef(onError);
    const endingInterviewRef = useRef(false);
    /*
     * Keep latest interview data.
     */
    const interviewRef = useRef(interview);

    /*
     * ============================================================
     * TRANSCRIPT BUFFER
     * ============================================================
     *
     * Vapi can send one spoken sentence as several final
     * transcript events.
     *
     * Example:
     *
     * "My project is"
     * "Money"
     * "Manager"
     *
     * Instead of saving three turns, we temporarily store them
     * and combine them:
     *
     * "My project is Money Manager"
     *
     * We maintain separate buffers for AI and candidate.
     */
    const transcriptBuffersRef = useRef({
        AI: "",
        CANDIDATE: "",
    });

    /*
     * Timer used as a fallback for transcript flushing.
     */
    const transcriptTimersRef = useRef({
        AI: null,
        CANDIDATE: null,
    });

    /*
     * Used to prevent duplicate transcript fragments.
     */
    const lastTranscriptRef = useRef({
        AI: "",
        CANDIDATE: "",
    });

    /*
     * ============================================================
     * CALLBACK REFS
     * ============================================================
     */

    useEffect(() => {
        onTurnRef.current = onTurn;
    }, [onTurn]);

    useEffect(() => {
        onCallStartRef.current = onCallStart;
    }, [onCallStart]);

    useEffect(() => {
        onCallEndRef.current = onCallEnd;
    }, [onCallEnd]);

    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    useEffect(() => {
        interviewRef.current = interview;
    }, [interview]);

    useEffect(() => {
        if (!stopCall) {
            return;
        }

        console.log(
            "Manual end requested. Stopping Vapi call..."
        );

        if (vapiRef.current) {
            try {
                vapiRef.current.stop();
            } catch (error) {
                console.error(
                    "Failed to stop Vapi call:",
                    error
                );
            }
        }
    }, [stopCall]);

    /*
     * ============================================================
     * LOAD VAPI CONFIGURATION
     * ============================================================
     */

    useEffect(() => {
        const loadVapiConfig = async () => {
            try {
                console.log(
                    "Loading Vapi configuration..."
                );

                const response = await api.get(
                    "/api/vapi/config"
                );

                const data = response.data;

                console.log(
                    "Vapi configuration loaded successfully"
                );

                if (!data.publicKey) {
                    throw new Error(
                        "Vapi public key is missing from backend."
                    );
                }

                if (!data.assistantId) {
                    throw new Error(
                        "Vapi assistant ID is missing from backend."
                    );
                }

                setPublicKey(data.publicKey);
                setAssistantId(data.assistantId);
                setStatus("Ready");

            } catch (error) {
                console.error(
                    "Failed to load Vapi configuration:",
                    error
                );

                setStatus("Configuration error");

                if (error?.response?.status === 401) {
                    const authError = new Error(
                        "Your session has expired. Please log in again."
                    );

                    if (onErrorRef.current) {
                        onErrorRef.current(authError);
                    }

                    return;
                }

                if (error?.response?.status === 403) {
                    const authError = new Error(
                        "You are not authorized to load Vapi configuration."
                    );

                    if (onErrorRef.current) {
                        onErrorRef.current(authError);
                    }

                    return;
                }

                if (onErrorRef.current) {
                    onErrorRef.current(error);
                }
            }
        };

        loadVapiConfig();

    }, []);

    /*
     * ============================================================
     * TRANSCRIPT BUFFER HELPERS
     * ============================================================
     */

    /*
     * Add a transcript fragment to the correct speaker buffer.
     */
    const addTranscriptFragment = (
        speaker,
        transcript
    ) => {
        if (!speaker || !transcript) {
            return;
        }

        const cleanText = transcript
            .replace(/\s+/g, " ")
            .trim();

        if (!cleanText) {
            return;
        }

        /*
         * Ignore an exact duplicate event.
         */
        if (
            lastTranscriptRef.current[speaker] ===
            cleanText
        ) {
            return;
        }

        lastTranscriptRef.current[speaker] =
            cleanText;

        const currentBuffer =
            transcriptBuffersRef.current[speaker];

        if (!currentBuffer) {
            transcriptBuffersRef.current[speaker] =
                cleanText;
        } else {
            transcriptBuffersRef.current[speaker] =
                `${currentBuffer} ${cleanText}`;
        }

        console.log(
            `${speaker} buffered transcript:`,
            transcriptBuffersRef.current[speaker]
        );

        /*
         * Fallback flush.
         *
         * Normally AI turns are flushed when speech ends.
         * This timer protects us if Vapi does not emit the
         * expected speech-end event.
         */
        if (
            transcriptTimersRef.current[speaker]
        ) {
            clearTimeout(
                transcriptTimersRef.current[speaker]
            );
        }

        transcriptTimersRef.current[speaker] =
            setTimeout(() => {
                flushTranscript(speaker);
            }, 3500);
    };

    /*
     * Send the complete buffered turn to InterviewSession.
     */
    const flushTranscript = (speaker) => {
        const transcript =
            transcriptBuffersRef.current[speaker]
                ?.replace(/\s+/g, " ")
                .trim();

        /*
         * Clear buffer first.
         */
        transcriptBuffersRef.current[speaker] = "";

        /*
         * Clear fallback timer.
         */
        if (
            transcriptTimersRef.current[speaker]
        ) {
            clearTimeout(
                transcriptTimersRef.current[speaker]
            );

            transcriptTimersRef.current[speaker] =
                null;
        }

        /*
         * Reset duplicate protection.
         */
        lastTranscriptRef.current[speaker] = "";

        if (!transcript) {
            return;
        }

        console.log(
            `${speaker} COMPLETE transcript:`,
            transcript
        );

        /*
         * Save only the complete conversational turn.
         */
        if (onTurnRef.current) {
            onTurnRef.current({
                speaker,
                transcript,
            });
        }
    };

    /*
     * Flush every pending transcript.
     */
    const flushAllTranscripts = () => {
        flushTranscript("AI");
        flushTranscript("CANDIDATE");
    };

    /*
     * Clear transcript timers.
     */
    const clearTranscriptTimers = () => {
        Object.keys(
            transcriptTimersRef.current
        ).forEach((speaker) => {
            const timer =
                transcriptTimersRef.current[speaker];

            if (timer) {
                clearTimeout(timer);
            }

            transcriptTimersRef.current[speaker] =
                null;
        });
    };

    /*
     * ============================================================
     * INITIALIZE VAPI
     * ============================================================
     */

    useEffect(() => {
        if (!publicKey || !assistantId) {
            return;
        }

        if (vapiRef.current) {
            return;
        }

        console.log(
            "Initializing Vapi..."
        );

        try {
            const vapi = new Vapi(publicKey);

            vapiRef.current = vapi;

            console.log(
                "Vapi instance initialized successfully"
            );

            /*
             * ====================================================
             * CALL START
             * ====================================================
             */

            const handleCallStart = () => {
                console.log(
                    "Vapi interview started"
                );

                endingInterviewRef.current = false;

                /*
                 * Clear any leftover transcript data
                 * from a previous call.
                 */
                clearTranscriptTimers();

                transcriptBuffersRef.current = {
                    AI: "",
                    CANDIDATE: "",
                };

                lastTranscriptRef.current = {
                    AI: "",
                    CANDIDATE: "",
                };

                setIsConnected(true);
                setIsSpeaking(false);
                setStatus("Listening");

                if (onCallStartRef.current) {
                    onCallStartRef.current();
                }

            };

            /*
             * ====================================================
             * CALL END
             * ====================================================
             */

            const handleCallEnd = () => {
                console.log(
                    "Vapi interview ended"
                );

                /*
                 * IMPORTANT:
                 * Flush any transcript that arrived just before
                 * the call ended.
                 */
                flushAllTranscripts();

                clearTranscriptTimers();

                setIsConnected(false);
                setIsSpeaking(false);
                setStatus("Interview ended");

                startedRef.current = false;

                if (onCallEndRef.current) {
                    onCallEndRef.current();
                }
            };

            /*
             * ====================================================
             * AI STARTED SPEAKING
             * ====================================================
             */

            const handleSpeechStart = () => {
                console.log(
                    "AI started speaking"
                );

                setIsSpeaking(true);
                setStatus("AI is speaking");
            };

            /*
             * ====================================================
             * AI STOPPED SPEAKING
             * ====================================================
             *
             * This is the important part.
             *
             * All AI transcript fragments generated during
             * this speaking period are combined into ONE turn.
             */

            const handleSpeechEnd = () => {
                console.log(
                    "AI stopped speaking"
                );

                setIsSpeaking(false);

                /*
                 * Save the complete AI closing message first.
                 */
                flushTranscript("AI");

                /*
                 * If the AI just delivered the final closing,
                 * automatically end the Vapi call.
                 */
                if (endingInterviewRef.current) {
                    console.log(
                        "Interview completed by AI. Ending Vapi call..."
                    );

                    endingInterviewRef.current = false;

                    setStatus(
                        "Interview completed"
                    );

                    setTimeout(() => {
                        if (vapiRef.current) {
                            try {
                                vapiRef.current.stop();
                            } catch (error) {
                                console.error(
                                    "Failed to automatically stop Vapi:",
                                    error
                                );
                            }
                        }
                    }, 500);

                    return;
                }

                if (startedRef.current) {
                    setStatus("Listening");
                }
            };

            /*
             * ====================================================
             * VAPI MESSAGE
             * ====================================================
             */

            const handleMessage = (message) => {
                console.log(
                    "Vapi message:",
                    message
                );

                /*
                 * We only process FINAL transcript events.
                 */
                if (
                    message.type !== "transcript" ||
                    message.transcriptType !== "final"
                ) {
                    return;
                }

                const transcript =
                    message.transcript
                        ?.trim();

                if (!transcript) {
                    return;
                }

                let speaker = null;

                /*
                 * Vapi user = candidate.
                 */
                if (
                    message.role === "user"
                ) {
                    speaker = "CANDIDATE";
                }

                /*
                 * Vapi assistant = AI interviewer.
                 */
                if (
                    message.role === "assistant"
                ) {
                    speaker = "AI";
                }

                if (!speaker) {
                    return;
                }

                console.log(
                    `${speaker} final transcript fragment:`,
                    transcript
                );

                if (speaker === "AI") {
                    const lowerTranscript =
                        transcript.toLowerCase();

                    const closingIndicators = [
                        "that concludes",
                        "interview is now complete",
                        "interview is complete",
                        "concludes your interview",
                        "thank you for your time",
                        "thanks for your time",
                        "thank you for participating",
                        "this concludes",
                        "we're done with the interview",
                        "we are done with the interview",
                        "the interview has ended"
                    ];

                    const isClosingMessage =
                        closingIndicators.some(
                            (phrase) =>
                                lowerTranscript.includes(phrase)
                        );

                    if (isClosingMessage) {
                        console.log(
                            "Final interview closing detected."
                        );

                        endingInterviewRef.current = true;
                    }
                }

                /*
                 * Do NOT immediately call onTurn().
                 *
                 * Add it to the speaker buffer first.
                 */
                addTranscriptFragment(
                    speaker,
                    transcript
                );
            };

            /*
             * ====================================================
             * VAPI ERROR
             * ====================================================
             */

            const handleError = (error) => {
                console.error(
                    "Vapi error:",
                    error
                );

                /*
                 * Preserve any conversation data
                 * received before the error.
                 */
                flushAllTranscripts();

                setIsConnected(false);
                setIsSpeaking(false);
                setStatus("Connection error");

                startedRef.current = false;

                if (onErrorRef.current) {
                    onErrorRef.current(error);
                }
            };

            /*
             * ====================================================
             * REGISTER VAPI EVENTS
             * ====================================================
             */

            vapi.on(
                "call-start",
                handleCallStart
            );

            vapi.on(
                "call-end",
                handleCallEnd
            );

            vapi.on(
                "speech-start",
                handleSpeechStart
            );

            vapi.on(
                "speech-end",
                handleSpeechEnd
            );

            vapi.on(
                "message",
                handleMessage
            );

            vapi.on(
                "error",
                handleError
            );

            /*
             * ====================================================
             * CLEANUP
             * ====================================================
             */

            return () => {
                console.log(
                    "Destroying Vapi instance"
                );

                /*
                 * Save any remaining transcript fragments
                 * before destroying the instance.
                 */
                flushAllTranscripts();

                clearTranscriptTimers();

                try {
                    vapi.stop();
                } catch (error) {
                    console.warn(
                        "Vapi cleanup warning:",
                        error
                    );
                }

                vapi.removeAllListeners();

                vapiRef.current = null;
                startedRef.current = false;
            };

        } catch (error) {
            console.error(
                "Failed to initialize Vapi:",
                error
            );

            setStatus(
                "Vapi initialization error"
            );

            if (onErrorRef.current) {
                onErrorRef.current(error);
            }
        }

    }, [publicKey, assistantId]);

    const buildConversationContext = () => {
        if (!conversation || conversation.length === 0) {
            return "";
        }

        return conversation
            .map((turn) => {
                const speaker =
                    turn.speaker === "AI"
                        ? "AI INTERVIEWER"
                        : "CANDIDATE";

                return `${speaker}: ${turn.transcript}`;
            })
            .join("\n");
    };

    /*
     * ============================================================
     * START INTERVIEW
     * ============================================================
     */

    const startInterview = async () => {
        if (!vapiRef.current) {
            console.error(
                "Vapi is not initialized."
            );

            return;
        }

        if (!assistantId) {
            console.error(
                "Vapi assistant ID is missing."
            );

            return;
        }

        if (startedRef.current) {
            console.log(
                "Vapi interview is already running."
            );

            return;
        }

        try {
            startedRef.current = true;

            setStatus(
                "Connecting..."
            );

            const currentInterview =
                interviewRef.current;

            console.log(
                "Starting Vapi with interview:",
                currentInterview
            );

            const previousConversation =
                buildConversationContext();

            const isResuming =
                conversation &&
                conversation.length > 0;

            console.log(
                "Starting interview in mode:",
                isResuming
                    ? "RESUME"
                    : "NEW"
            );

            console.log(
                "Previous conversation:",
                previousConversation
            );

            await vapiRef.current.start(
                assistantId,
                {
                    variableValues: {
                        role:
                            currentInterview?.role || "",

                        experienceLevel:
                            currentInterview?.experienceLevel || "",

                        techStack:
                            currentInterview?.techStack || "",

                        interviewType:
                            currentInterview?.interviewType || "",

                        questionCount:
                            String(
                                currentInterview?.questionCount || 10
                            ),

                        interviewMode:
                            isResuming
                                ? "RESUME"
                                : "NEW",

                        previousConversation:
                        previousConversation,
                    },
                }
            );

        } catch (error) {
            console.error(
                "Failed to start Vapi interview:",
                error
            );

            startedRef.current = false;

            setIsConnected(false);
            setIsSpeaking(false);
            setStatus(
                "Unable to connect"
            );

            if (onErrorRef.current) {
                onErrorRef.current(error);
            }
        }
    };

    /*
     * ============================================================
     * END INTERVIEW
     * ============================================================
     */

    const endInterview = () => {
        if (!vapiRef.current) {
            return;
        }

        console.log(
            "Manually ending Vapi interview"
        );

        /*
         * Flush any pending transcript immediately.
         */
        flushAllTranscripts();

        try {
            vapiRef.current.stop();
        } catch (error) {
            console.error(
                "Failed to stop Vapi interview:",
                error
            );
        }
    };

    /*
     * ============================================================
     * UI
     * ============================================================
     */

    return (
        <div className="voice-interview">

            <div className="voice-interview-status">

                <div
                    className={`voice-indicator ${
    isSpeaking
        ? "speaking"
        : isConnected
            ? "listening"
            : ""
}`}
                >
                    <span />
                    <span />
                    <span />
                </div>

                <span>
                    {status}
                </span>

            </div>

            {!isConnected ? (
                <button
                    type="button"
                    className="voice-start-button"
                    onClick={startInterview}
                    disabled={
                        !publicKey ||
                        !assistantId
                    }
                >
                    Start Interview
                </button>
            ) : (
                <button
                    type="button"
                    className="voice-end-button"
                    onClick={endInterview}
                >
                    End Interview
                </button>
            )}

        </div>
    );
}

export default VoiceInterview;
