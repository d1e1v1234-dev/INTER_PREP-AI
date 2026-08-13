const API_BASE = "https://interprep-ai-production-38e4.up.railway.app";

let selectedType = null;
let selectedDifficulty = null;
let selectedMode = "Text";
let finalReport = null;
let interviewEnded = false;
let currentAudio = null;
let currentVoiceButton = null;

let timerInterval = null;
let timerStart = null;

let accessToken = localStorage.getItem("access_token");

// =========================
// ELEMENTS
// =========================

const authScreen = document.getElementById("auth-screen");
const loginTab = document.getElementById("login-tab");
const registerTab = document.getElementById("register-tab");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");

const registerName = document.getElementById("register-name");
const registerEmail = document.getElementById("register-email");
const registerPassword = document.getElementById("register-password");

const loginButton = document.getElementById("login-btn");
const registerButton = document.getElementById("register-btn");
const authMessage = document.getElementById("auth-message");
const logoutButton = document.getElementById("logout-btn");

const historyList =
    document.getElementById("interview-history-list");

const refreshHistoryButton =
    document.getElementById("refresh-history-btn");

const startScreen =
    document.getElementById("start-screen");

const chatScreen =
    document.getElementById("chat-screen");

const reportScreen =
    document.getElementById("report-screen");

const typeButtons =
    document.querySelectorAll(".type-btn");

const difficultyButtons =
    document.querySelectorAll(".difficulty-btn");

const modeButtons =
    document.querySelectorAll(".mode-btn");

const pdfSection =
    document.getElementById("pdf-section");

const pdfFile =
    document.getElementById("pdf-file");

const dropzone =
    document.getElementById("dropzone");

const dzFileLabel =
    document.getElementById("dz-file");

const customTypeSection =
    document.getElementById("custom-type-section");

const customTypeInput =
    document.getElementById("custom-type-input");

const startButton =
    document.getElementById("start-btn");

const errorMessage =
    document.getElementById("error-message");

const messages =
    document.getElementById("messages");

const textInputArea =
    document.getElementById("text-input-area");

const messageInput =
    document.getElementById("message-input");

const sendButton =
    document.getElementById("send-btn");

const voiceInputArea =
    document.getElementById("voice-input-area");

const voiceStatus =
    document.getElementById("voice-status");

const voiceRecordButton =
    document.getElementById("voice-record-btn");

// Mic button is kept in the UI for the upcoming
// Deep Learning STT integration.
// No browser SpeechRecognition is used here yet.
const micButton =
    document.getElementById("mic-btn");

// =========================
// DEEP LEARNING STT
// =========================
// Browser only records audio.
// Whisper/faster-whisper performs STT
// through the FastAPI backend.

let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

// =========================
// DEEP LEARNING TTS
// =========================



const endButton =
    document.getElementById("end-btn");

const interviewInfo =
    document.getElementById("interview-info");

const sessionTimer =
    document.getElementById("session-timer");

const reportContent =
    document.getElementById("report-content");

const viewChatButton =
    document.getElementById("view-chat-btn");

const viewReportButton =
    document.getElementById("view-report-btn");

const homeButton =
    document.getElementById("home-btn");

const newInterviewButton =
    document.getElementById("new-interview-btn");

// =========================
// SCREEN
// =========================

function showScreen(screen) {

    [
        authScreen,
        startScreen,
        chatScreen,
        reportScreen
    ].forEach(s => {

        if (s) {
            s.classList.add("hidden");
        }

    });

    screen.classList.remove("hidden");
}

showScreen(
    accessToken
        ? startScreen
        : authScreen
);

// Default to Text mode selected on the start screen
modeButtons.forEach(btn => {
    btn.classList.toggle(
        "selected",
        btn.dataset.mode === selectedMode
    );
});

if (accessToken) {
    loadPreviousInterviews();
}

// =========================
// AUTH TABS
// =========================

loginTab.addEventListener(
    "click",
    () => {

        loginTab.classList.add("active");
        registerTab.classList.remove("active");

        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");

        setAuthMessage("");

    }
);

registerTab.addEventListener(
    "click",
    () => {

        registerTab.classList.add("active");
        loginTab.classList.remove("active");

        registerForm.classList.remove("hidden");
        loginForm.classList.add("hidden");

        setAuthMessage("");

    }
);

function setAuthMessage(
    text,
    success = false
) {

    authMessage.textContent = text;

    authMessage.classList.toggle(
        "success",
        success
    );
}

// =========================
// REGISTER
// =========================

registerButton.addEventListener(
    "click",
    async () => {

        setAuthMessage("");

        const name =
            registerName.value.trim();

        const email =
            registerEmail.value.trim();

        const password =
            registerPassword.value;

        if (!name || !email || !password) {

            setAuthMessage(
                "Please fill all fields."
            );

            return;
        }

        if (password.length < 6) {

            setAuthMessage(
                "Password must be at least 6 characters."
            );

            return;
        }

        try {

            registerButton.disabled = true;

            registerButton.querySelector(
                ".btn-label"
            ).textContent = "Creating...";

            const response =
                await fetch(
                    `${API_BASE}/auth/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            name,
                            email,
                            password
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Registration failed."
                );
            }

            setAuthMessage(
                "Account created! Please login.",
                true
            );

            registerName.value = "";
            registerEmail.value = "";
            registerPassword.value = "";

            loginTab.click();

            loginEmail.value = email;

        } catch (error) {

            console.error(error);

            setAuthMessage(
                error.message ||
                "Could not create account."
            );

        } finally {

            registerButton.disabled = false;

            registerButton.querySelector(
                ".btn-label"
            ).textContent =
                "Create Account";

        }

    }
);

// =========================
// LOGIN
// =========================

loginButton.addEventListener(
    "click",
    async () => {

        setAuthMessage("");

        const email =
            loginEmail.value.trim();

        const password =
            loginPassword.value;

        if (!email || !password) {

            setAuthMessage(
                "Please enter email and password."
            );

            return;
        }

        try {

            loginButton.disabled = true;

            loginButton.querySelector(
                ".btn-label"
            ).textContent =
                "Logging in...";

            const response =
                await fetch(
                    `${API_BASE}/auth/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email,
                            password
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Invalid email or password."
                );
            }

            accessToken =
                data.access_token;

            localStorage.setItem(
                "access_token",
                accessToken
            );

            loginPassword.value = "";

            showScreen(startScreen);

            loadPreviousInterviews();

        } catch (error) {

            console.error(error);

            setAuthMessage(
                error.message ||
                "Login failed."
            );

        } finally {

            loginButton.disabled = false;

            loginButton.querySelector(
                ".btn-label"
            ).textContent = "Login";

        }

    }
);

// =========================
// LOGOUT
// =========================

logoutButton.addEventListener(
    "click",
    () => {
accessToken = null;

        localStorage.removeItem(
            "access_token"
        );

        selectedType = null;
        selectedDifficulty = null;
        finalReport = null;

        typeButtons.forEach(
            btn =>
                btn.classList.remove(
                    "selected"
                )
        );

        difficultyButtons.forEach(
            btn =>
                btn.classList.remove(
                    "selected"
                )
        );

        pdfSection.classList.add(
            "hidden"
        );

        pdfFile.value = "";

        dzFileLabel.textContent = "";

        customTypeSection.classList.add(
            "hidden"
        );

        customTypeInput.value = "";

        loginForm.classList.remove(
            "hidden"
        );

        registerForm.classList.add(
            "hidden"
        );

        loginTab.classList.add(
            "active"
        );

        registerTab.classList.remove(
            "active"
        );

        showScreen(authScreen);

    }
);

// =========================
// PREVIOUS INTERVIEWS
// =========================

async function loadPreviousInterviews() {

    if (
        !accessToken ||
        !historyList
    ) {

        return;
    }

    historyList.innerHTML =
        `<p class="history-empty">
            Loading your interviews...
        </p>`;

    try {

        const response =
            await fetch(
                `${API_BASE}/interviews`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${accessToken}`
                    }
                }
            );

        if (response.status === 401) {

            logoutButton.click();

            return;
        }

        if (!response.ok) {

            throw new Error(
                "Could not load interview history"
            );
        }

        const interviews =
            await response.json();

        historyList.innerHTML = "";

        if (!interviews.length) {

            historyList.innerHTML =
                `<p class="history-empty">
                    No previous interviews yet.
                </p>`;

            return;
        }

        interviews.forEach(
            interview => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "history-card";

                const date =
                    formatInterviewDate(
                        interview.created_at
                    );

                card.innerHTML = `
                    <div class="history-card-info">

                        <div class="history-title">
                            ${escapeHtml(
                                interview.interview_type
                            )}
                        </div>

                        <div class="history-meta">
                            ${escapeHtml(
                                interview.difficulty
                            )}
                            •
                            ${escapeHtml(date)}
                        </div>

                    </div>

                    <div class="history-card-actions">

                        <button
                            class="ghost-btn continue-history-btn"
                            type="button"
                            data-id="${interview.id}"
                        >
                            Continue
                        </button>

                        <button
                            class="ghost-btn view-history-btn"
                            type="button"
                            data-id="${interview.id}"
                        >
                            View
                        </button>

                    </div>
                `;

                historyList.appendChild(
                    card
                );

            }
        );

        historyList
            .querySelectorAll(
                ".view-history-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        viewPreviousInterview(
                            button.dataset.id
                        );

                    }
                );

            });

        historyList
            .querySelectorAll(
                ".continue-history-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        continuePreviousInterview(
                            button.dataset.id
                        );

                    }
                );

            });

    } catch (error) {

        console.error(error);

        historyList.innerHTML =
            `<p class="history-empty">
                Could not load interview history.
            </p>`;

    }

}

function formatInterviewDate(value) {

    if (!value) {
        return "";
    }

    // The backend stores timestamps in UTC but sends them without a
    // timezone marker (e.g. "2026-08-12T18:25:32"). JS treats a bare
    // string like that as LOCAL time, not UTC, which shows the wrong
    // clock time. If there's no "Z" or +/-offset already, treat it as
    // UTC explicitly by appending "Z" before parsing.
    const hasTimezone =
        /Z$|[+-]\d\d:?\d\d$/.test(value);

    const isoValue =
        hasTimezone
            ? value
            : `${value}Z`;

    const parsed =
        new Date(isoValue);

    if (isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString();

}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

// =========================
// INTERVIEW TYPE
// =========================

typeButtons.forEach(button => {

    button.addEventListener("click", () => {

        typeButtons.forEach(btn =>
            btn.classList.remove("selected")
        );

        button.classList.add("selected");

        selectedType =
            button.dataset.type;


        if (selectedType === "PDF Based") {

            pdfSection.classList.remove(
                "hidden"
            );

        } else {

            pdfSection.classList.add(
                "hidden"
            );

            pdfFile.value = "";

            dzFileLabel.textContent = "";
        }


        if (selectedType === "Custom") {

            customTypeSection.classList.remove(
                "hidden"
            );

            customTypeInput.focus();

        } else {

            customTypeSection.classList.add(
                "hidden"
            );

            customTypeInput.value = "";

        }

    });

});


// =========================
// DIFFICULTY
// =========================

difficultyButtons.forEach(button => {

    button.addEventListener("click", () => {

        difficultyButtons.forEach(btn =>
            btn.classList.remove("selected")
        );

        button.classList.add("selected");

        selectedDifficulty =
            button.dataset.difficulty;

    });

});


// =========================
// INTERVIEW MODE (TEXT / VOICE)
// =========================

modeButtons.forEach(button => {

    button.addEventListener("click", () => {

        modeButtons.forEach(btn =>
            btn.classList.remove("selected")
        );

        button.classList.add("selected");

        selectedMode =
            button.dataset.mode;

    });

});


// =========================
// PDF DROPZONE
// =========================

pdfFile.addEventListener(
    "change",
    () => {

        if (pdfFile.files.length) {

            dzFileLabel.textContent =
                pdfFile.files[0].name;
        }

    }
);


["dragenter", "dragover"].forEach(
    eventName => {

        dropzone.addEventListener(
            eventName,
            event => {

                event.preventDefault();

                dropzone.classList.add(
                    "drag-over"
                );

            }
        );

    }
);


["dragleave", "drop"].forEach(
    eventName => {

        dropzone.addEventListener(
            eventName,
            event => {

                event.preventDefault();

                dropzone.classList.remove(
                    "drag-over"
                );

            }
        );

    }
);


dropzone.addEventListener(
    "drop",
    event => {

        const file =
            event.dataTransfer.files &&
            event.dataTransfer.files[0];


        if (
            file &&
            file.type === "application/pdf"
        ) {

            pdfFile.files =
                event.dataTransfer.files;

            dzFileLabel.textContent =
                file.name;
        }

    }
);


// =========================
// ERROR HELPERS
// =========================

function showError(text) {

    errorMessage.textContent =
        text;
}


function clearError() {

    errorMessage.textContent =
        "";
}


// =========================
// MESSAGES
// =========================

function addMessage(text, sender, speak = false) {

    const message = document.createElement("div");
    message.classList.add("message", sender);

    const tag = document.createElement("div");
    tag.classList.add("message-tag");
    tag.textContent = sender === "ai" ? "[ INTER_PREP ]" : "[ YOU ]";

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    const textSpan = document.createElement("span");
    textSpan.classList.add("message-text");
    textSpan.textContent = text;
    bubble.appendChild(textSpan);

    if (sender === "ai") {
        const voiceButton = document.createElement("button");
        voiceButton.type = "button";
        voiceButton.className = "voice-btn";
        voiceButton.textContent = "🔊";
        voiceButton.title = "Play AI response";
        voiceButton.addEventListener("click", () => playTTS(text, voiceButton));
        bubble.appendChild(voiceButton);
    }

    message.appendChild(tag);
    message.appendChild(bubble);
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;

    if (sender === "ai" && speak && selectedMode === "Voice") {

        if (voiceStatus && !interviewEnded) {
            voiceStatus.textContent = "🔊 Speaking...";
            if (voiceRecordButton) {
                voiceRecordButton.classList.add("speaking");
            }
        }

        // Try automatic playback. If the browser blocks autoplay,
        // the 🔊 button remains available and works from a user click.
        // NOTE: recording is never auto-started — the candidate taps
        // the mic themselves whenever they're ready to answer.
        setTimeout(
            () => playTTS(text, null, () => {

                if (selectedMode === "Voice" && !interviewEnded) {
                    setRecordingButtonsState("idle");
                }

            }),
            100
        );
    }

    return message;
}

// =========================
// DEEP LEARNING TTS
// =========================

// Bumped whenever stopTTS() is called, so an in-flight stream/queue
// from a previous call knows to abandon itself instead of playing on.
let ttsPlaybackToken = 0;

async function playTTS(text, button = null, onEnd = null) {
    if (!text || !accessToken) {
        if (onEnd) onEnd();
        return;
    }

    stopTTS();
    const myToken = ++ttsPlaybackToken;

    if (button) {
        button.textContent = "⏳";
        currentVoiceButton = button;
    }

    const audioQueue = [];       // decoded object URLs waiting to play
    let isPlayingQueue = false;
    let streamDone = false;
    let chunkCount = 0;

    const finishUp = () => {
        if (button) button.textContent = "🔊";
        if (currentVoiceButton === button) currentVoiceButton = null;
        if (voiceRecordButton) voiceRecordButton.classList.remove("speaking");
        if (onEnd) onEnd();
    };

    const playNextInQueue = () => {
        if (myToken !== ttsPlaybackToken) return; // stopped/superseded
        if (audioQueue.length === 0) {
            isPlayingQueue = false;
            if (streamDone && currentAudio === null) finishUp();
            return;
        }

        isPlayingQueue = true;
        const url = audioQueue.shift();
        const audio = new Audio(url);
        currentAudio = audio;
        if (button) button.textContent = "⏹️";

        const cleanupAndAdvance = () => {
            URL.revokeObjectURL(url);
            if (currentAudio === audio) currentAudio = null;
            if (myToken !== ttsPlaybackToken) return;
            playNextInQueue();
        };

        audio.onended = cleanupAndAdvance;
        audio.onerror = () => {
            console.error("TTS chunk playback failed");
            cleanupAndAdvance();
        };

        audio.play().catch((err) => {
            console.error("TTS play() blocked/failed:", err);
            cleanupAndAdvance();
        });
    };

    try {
        const response = await fetch(`${API_BASE}/voice/synthesize-stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({ text })
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "TTS failed.");
        }

        const reader = response.body.getReader();
        let buffer = new Uint8Array(0);

        const appendBuffer = (chunk) => {
            const merged = new Uint8Array(buffer.length + chunk.length);
            merged.set(buffer, 0);
            merged.set(chunk, buffer.length);
            buffer = merged;
        };

        while (true) {
            const { done, value } = await reader.read();
            if (myToken !== ttsPlaybackToken) return; // stopped mid-stream

            if (value) appendBuffer(value);

            // Peel off as many complete [4-byte length][wav bytes] frames
            // as are currently available in the buffer.
            while (buffer.length >= 4) {
                const len =
                    (buffer[0] << 24) |
                    (buffer[1] << 16) |
                    (buffer[2] << 8) |
                    buffer[3];

                if (buffer.length < 4 + len) break; // wait for more data

                const wavBytes = buffer.slice(4, 4 + len);
                buffer = buffer.slice(4 + len);

                const blob = new Blob([wavBytes], { type: "audio/wav" });
                audioQueue.push(URL.createObjectURL(blob));
                chunkCount++;

                if (!isPlayingQueue) playNextInQueue();
            }

            if (done) break;
        }

        streamDone = true;
        if (chunkCount === 0) throw new Error("TTS returned no audio.");
        if (!isPlayingQueue && audioQueue.length === 0 && currentAudio === null) {
            finishUp();
        }

    } catch (error) {
        console.error("TTS error:", error);
        if (myToken === ttsPlaybackToken) finishUp();
    }
}

function stopTTS() {
    ttsPlaybackToken++; // invalidates any in-flight stream/queue
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    if (currentVoiceButton) {
        currentVoiceButton.textContent = "🔊";
        currentVoiceButton = null;
    }
    if (voiceRecordButton) {
        voiceRecordButton.classList.remove("speaking");
    }
}


// =========================
// TYPING INDICATOR
// =========================

function addTypingIndicator() {

    const message =
        document.createElement("div");


    message.classList.add(
        "message",
        "ai"
    );


    message.id =
        "thinking-message";


    const tag =
        document.createElement("div");


    tag.classList.add(
        "message-tag"
    );


    tag.textContent =
        "[ INTER_PREP ]";


    const bubble =
        document.createElement("div");


    bubble.classList.add(
        "message-bubble"
    );


    const dots =
        document.createElement("span");


    dots.classList.add(
        "typing-dots"
    );


    dots.innerHTML =
        "<span></span><span></span><span></span>";


    bubble.appendChild(
        dots
    );


    message.appendChild(
        tag
    );

    message.appendChild(
        bubble
    );


    messages.appendChild(
        message
    );


    messages.scrollTop =
        messages.scrollHeight;


    return message;
}


// =========================
// DEEP LEARNING STT FUNCTIONS
// =========================

function setRecordingButtonsState(state) {
    // state: "idle" | "listening" | "transcribing"

    if (micButton) {
        micButton.classList.toggle("listening", state === "listening");
        micButton.disabled = state === "transcribing";
        micButton.textContent =
            state === "listening" ? "⏹️" :
            state === "transcribing" ? "⏳" :
            "🎙️";
        micButton.title =
            state === "listening" ? "Stop recording" :
            state === "transcribing" ? "Transcribing..." :
            "Speak";
    }

    if (voiceRecordButton) {
        voiceRecordButton.classList.toggle("recording", state === "listening");
        voiceRecordButton.classList.remove("speaking");
        voiceRecordButton.disabled = state === "transcribing";
        voiceRecordButton.querySelector(".voice-record-icon").textContent =
            state === "listening" ? "⏹️" :
            state === "transcribing" ? "⏳" :
            "🎙️";
    }

    if (voiceStatus && selectedMode === "Voice") {
        voiceStatus.textContent =
            state === "listening" ? "🎙️ Listening... tap to stop" :
            state === "transcribing" ? "⏳ Transcribing your answer..." :
            "Your turn — tap the mic to answer";
    }
}


async function startVoiceRecording() {

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {

        alert(
            "Audio recording is not supported in this browser."
        );
        return;
    }

    if (isRecording) {
        return;
    }

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        recordedChunks = [];

        mediaRecorder =
            new MediaRecorder(stream);

        isRecording = true;

        setRecordingButtonsState("listening");

        mediaRecorder.ondataavailable =
            event => {
                if (event.data &&
                    event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

        mediaRecorder.onstop =
            async () => {

                stream.getTracks().forEach(
                    track => track.stop()
                );

                isRecording = false;

                if (!recordedChunks.length) {
                    setRecordingButtonsState("idle");
                    return;
                }

                const mimeType =
                    mediaRecorder.mimeType ||
                    "audio/webm";

                const audioBlob =
                    new Blob(
                        recordedChunks,
                        { type: mimeType }
                    );

                await transcribeAudio(audioBlob);
            };

        mediaRecorder.start();

    } catch (error) {

        console.error("Microphone error:", error);

        isRecording = false;

        setRecordingButtonsState("idle");

        if (error.name === "NotAllowedError") {
            alert(
                "Microphone permission was denied. Please allow microphone access."
            );
        } else {
            alert("Could not access the microphone.");
        }
    }
}


function stopVoiceRecording() {

    if (
        mediaRecorder &&
        mediaRecorder.state !== "inactive"
    ) {
        mediaRecorder.stop();
    }
}


async function transcribeAudio(audioBlob) {

    if (!accessToken) {
        alert("Please login again.");
        return;
    }

    try {

        setRecordingButtonsState("transcribing");

        messageInput.disabled = true;
        messageInput.placeholder =
            "Transcribing your answer...";

        const extension =
            audioBlob.type.includes("mp4")
                ? "mp4"
                : "webm";

        const audioFile =
            new File(
                [audioBlob],
                `voice-answer.${extension}`,
                {
                    type:
                        audioBlob.type ||
                        "audio/webm"
                }
            );

        const formData =
            new FormData();

        formData.append(
            "file",
            audioFile
        );

        const response =
            await fetch(
                `${API_BASE}/voice/transcribe`,
                {
                    method: "POST",
                    headers: {
                        "Authorization":
                            `Bearer ${accessToken}`
                    },
                    body: formData
                }
            );

        if (!response.ok) {

            if (response.status === 401) {
                logoutButton.click();
                return;
            }

            const errorData =
                await response.json()
                    .catch(() => ({}));

            throw new Error(
                errorData.detail ||
                "Transcription failed."
            );
        }

        const data =
            await response.json();

        const transcribedText =
            (data.text || "").trim();

        if (!transcribedText) {

            if (selectedMode === "Voice" && voiceStatus) {
                voiceStatus.textContent =
                    "Couldn't hear that clearly — tap to try again";
            } else {
                alert(
                    "I couldn't understand the audio. Please try again."
                );
            }

            return;
        }

        messageInput.value =
            `${messageInput.value} ${transcribedText}`
            .trim();

        messageInput.dispatchEvent(
            new Event("input")
        );

        if (selectedMode === "Voice" && !interviewEnded) {
            // Real interview feel: submit the spoken answer automatically.
            await sendMessage();
        } else {
            messageInput.focus();
        }

    } catch (error) {

        console.error(
            "STT error:",
            error
        );

        if (selectedMode === "Voice" && voiceStatus) {
            voiceStatus.textContent =
                "Transcription failed — tap to try again";
        } else {
            alert(
                error.message ||
                "Could not transcribe your voice."
            );
        }

    } finally {

        messageInput.disabled = false;
        messageInput.placeholder =
            "Type your answer...";

        setRecordingButtonsState("idle");

        if (selectedMode !== "Voice") {
            messageInput.focus();
        }
    }
}


// =========================
// MIC BUTTON - DL STT
// =========================

if (micButton) {

    micButton.addEventListener(
        "click",
        () => {

            if (isRecording) {
                stopVoiceRecording();
            } else {
                startVoiceRecording();
            }

        }
    );

}

if (voiceRecordButton) {

    voiceRecordButton.addEventListener(
        "click",
        () => {

            if (interviewEnded) {
                return;
            }

            if (isRecording) {
                stopVoiceRecording();
            } else {
                startVoiceRecording();
            }

        }
    );

}


// =========================
// CHAT MODE (TEXT / VOICE) UI
// =========================

function applyChatMode() {

    const isVoice =
        selectedMode === "Voice";

    if (textInputArea) {
        textInputArea.classList.toggle("hidden", isVoice);
    }

    if (voiceInputArea) {
        voiceInputArea.classList.toggle("hidden", !isVoice);
    }

    if (isVoice) {
        setRecordingButtonsState("idle");
    }

}


// =========================
// SESSION TIMER
// =========================

function startTimer() {

    timerStart =
        Date.now();


    sessionTimer.textContent =
        "00:00";


    timerInterval =
        setInterval(
            () => {

                const elapsed =
                    Math.floor(
                        (
                            Date.now() -
                            timerStart
                        ) / 1000
                    );


                const mins =
                    String(
                        Math.floor(
                            elapsed / 60
                        )
                    ).padStart(
                        2,
                        "0"
                    );


                const secs =
                    String(
                        elapsed % 60
                    ).padStart(
                        2,
                        "0"
                    );


                sessionTimer.textContent =
                    `${mins}:${secs}`;

            },
            1000
        );

}


function stopTimer() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;

    }

}


// =========================
// TEXTAREA AUTOSIZE
// =========================

messageInput.addEventListener(
    "input",
    () => {

        messageInput.style.height =
            "auto";


        messageInput.style.height =
            Math.min(
                messageInput.scrollHeight,
                140
            ) + "px";

    }
);


// =========================
// START INTERVIEW
// =========================

startButton.addEventListener(
    "click",
    async () => {

        clearError();


        if (!accessToken) {

            showError(
                "Please login again."
            );

            return;
        }


        if (!selectedType) {

            showError(
                "Please select an interview type."
            );

            return;
        }


        if (selectedType === "Custom") {

            const customTopic =
                customTypeInput.value.trim();

            if (!customTopic) {

                showError(
                    "Please type the topic you want to be interviewed on."
                );

                customTypeInput.focus();

                return;
            }

            // From here on, treat the typed topic as the interview type.
            selectedType = customTopic;

        }


        if (!selectedDifficulty) {

            showError(
                "Please select a difficulty."
            );

            return;
        }


        if (
            selectedType === "PDF Based" &&
            !pdfFile.files.length
        ) {

            showError(
                "Please upload a PDF."
            );

            return;
        }


        try {

            startButton.disabled =
                true;


            startButton.querySelector(
                ".btn-label"
            ).textContent =
                "Starting...";


            // =========================
            // PDF UPLOAD
            // =========================

            if (
                selectedType ===
                "PDF Based"
            ) {

                const formData =
                    new FormData();


                formData.append(
                    "file",
                    pdfFile.files[0]
                );


                const uploadResponse =
                    await fetch(
                        `${API_BASE}/upload-pdf`,
                        {
                            method: "POST",

                            headers: {
                                "Authorization":
                                    `Bearer ${accessToken}`
                            },

                            body: formData
                        }
                    );


                if (
                    !uploadResponse.ok
                ) {

                    throw new Error(
                        "PDF upload failed"
                    );

                }

            }


            // =========================
            // START API
            // =========================

            const response =
                await fetch(
                    `${API_BASE}/start-interview`,
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${accessToken}`

                        },

                        body: JSON.stringify({

                            interview_type:
                                selectedType,

                            difficulty:
                                selectedDifficulty

                        })

                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to start interview"
                );

            }


            const data =
                await response.json();

            interviewEnded = false;
            finalReport = null;
            viewReportButton.classList.add("hidden");
            if (homeButton) homeButton.classList.add("hidden");
            messageInput.disabled = false;
            sendButton.disabled = false;
            micButton.disabled = false;
            endButton.disabled = false;
            endButton.textContent = "End Interview";

            // =========================
            // OPEN CHAT
            // =========================

            showScreen(
                chatScreen
            );


            applyChatMode();


            interviewInfo.textContent =
                `${selectedType} • ${selectedDifficulty} • ${selectedMode}`;


            messages.innerHTML =
                "";


            // AI first message + voice

            addMessage(
                data.response,
                "ai",
                true
            );


            startTimer();


            if (selectedMode !== "Voice") {
                messageInput.focus();
            }


        } catch (error) {

            console.error(
                error
            );


            showError(
                "Could not start interview. Is the server running?"
            );


        } finally {

            startButton.disabled =
                false;


            startButton.querySelector(
                ".btn-label"
            ).textContent =
                "Start Interview";

        }

    }
);

// =========================
// SEND MESSAGE
// =========================

async function sendMessage() {

    if (interviewEnded) {
        return;
    }

    const text =
        messageInput.value.trim();


    if (!text) {
        return;
    }


    if (!accessToken) {

        alert(
            "Please login again."
        );

        return;
    }


    // Show user's message immediately

    addMessage(
        text,
        "user"
    );


    messageInput.value = "";

    messageInput.style.height =
        "auto";


    sendButton.disabled =
        true;


    messageInput.disabled =
        true;


    // Show AI thinking

    const typing =
        addTypingIndicator();


    try {

        const response =
            await fetch(
                `${API_BASE}/chat`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${accessToken}`

                    },

                    body: JSON.stringify({

                        message: text

                    })

                }
            );


        if (!response.ok) {

            if (
                response.status === 401
            ) {

                logoutButton.click();

                return;
            }


            const errorData =
                await response.json()
                    .catch(() => ({}));


            throw new Error(
                errorData.detail ||
                "Failed to send message"
            );

        }


        const data =
            await response.json();


        // Remove typing indicator

        if (typing) {
            typing.remove();
        }


        // AI response + automatic voice

        addMessage(
            data.response,
            "ai",
            true
        );


    } catch (error) {

        console.error(
            error
        );


        if (typing) {
            typing.remove();
        }


        addMessage(
            "Sorry, I couldn't connect to the AI. Please try again.",
            "ai"
        );


    } finally {

        sendButton.disabled =
            false;


        messageInput.disabled =
            false;


        messageInput.focus();

    }

}


// =========================
// SEND BUTTON
// =========================

sendButton.addEventListener(
    "click",
    sendMessage
);


// =========================
// ENTER TO SEND
// =========================

messageInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();
            sendMessage();
        }

    }
);


// =========================
// END INTERVIEW
// =========================

endButton.addEventListener(
    "click",
    async () => {

        if (interviewEnded) {
            return;
        }

        stopVoiceRecording();
        stopTTS();
        stopTimer();

        endButton.disabled = true;
        endButton.textContent = "Ending...";

        try {

            const response =
                await fetch(
                    `${API_BASE}/end-interview`,
                    {
                        method: "POST",

                        headers: {
                            "Authorization":
                                `Bearer ${accessToken}`
                        }
                    }
                );

            if (!response.ok) {

                const errorData =
                    await response.json()
                        .catch(() => ({}));

                throw new Error(
                    errorData.detail ||
                    "Could not end interview"
                );
            }

            const data =
                await response.json();

            finalReport =
                data.report ||
                "No report generated.";

            interviewEnded = true;

            messageInput.disabled = true;
            sendButton.disabled = true;

            if (micButton) {
                micButton.disabled = true;
            }

            endButton.disabled = true;
            endButton.textContent =
                "Interview Ended";

            viewReportButton.classList.remove(
                "hidden"
            );

            reportContent.textContent =
                finalReport;

            showScreen(
                reportScreen
            );

            await loadPreviousInterviews();

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Could not end interview."
            );

            endButton.disabled = false;
            endButton.textContent =
                "End Interview";
        }

    }
);


// =========================
// VIEW REPORT
// =========================

viewReportButton.addEventListener(
    "click",
    () => {
        if (!finalReport) {

            alert(
                "Report is not available."
            );

            return;
        }


        reportContent.textContent =
            finalReport;


        showScreen(
            reportScreen
        );

    }
);


// =========================
// VIEW CONVERSATION
// =========================

viewChatButton.addEventListener(
    "click",
    () => {

        showScreen(chatScreen);

        if (interviewEnded) {
            viewReportButton.classList.remove("hidden");
            if (homeButton) homeButton.classList.remove("hidden");
            messageInput.disabled = true;
            sendButton.disabled = true;
            micButton.disabled = true;
            endButton.disabled = true;
            endButton.textContent = "Interview Ended";
        }

        messages.scrollTop = messages.scrollHeight;
    }
);


// =========================
// VIEW PREVIOUS INTERVIEW
// =========================

async function viewPreviousInterview(
    interviewId
) {

    if (!accessToken) {
        return;
    }

    stopVoiceRecording();
    stopTTS();

    try {

        const response =
            await fetch(
                `${API_BASE}/interviews/${interviewId}`,
                {
                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${accessToken}`

                    }

                }
            );


        if (!response.ok) {

            if (
                response.status === 401
            ) {

                logoutButton.click();

                return;
            }


            const errorData =
                await response.json()
                    .catch(() => ({}));


            throw new Error(
                errorData.detail ||
                "Could not load interview"
            );

        }


        const interview =
            await response.json();


        // Stop current voice
        // Clear chat

        messages.innerHTML =
            "";


        // =========================
        // OLD CONVERSATION
        // =========================

        const conversation =
            interview.conversation || [];


        conversation.forEach(
            item => {

                // Depending on your memory
                // format, role can be:
                // "user" / "human"
                // "assistant" / "ai"

                const role =
                    item.role ||
                    item.sender ||
                    "";


                const content =
                    item.content ||
                    item.message ||
                    "";


                if (!content) {
                    return;
                }


                const sender =
                    (
                        role === "assistant" ||
                        role === "ai"
                    )
                        ? "ai"
                        : "user";


                // IMPORTANT:
                // Don't automatically speak
                // old messages.

                addMessage(
                    content,
                    sender,
                    false
                );

            }
        );


        // =========================
        // INTERVIEW INFO
        // =========================

        interviewInfo.textContent =
            `${interview.interview_type} • ${interview.difficulty}`;


        // =========================
        // OLD REPORT
        // =========================

        finalReport =
            interview.report || null;

        interviewEnded = true;

        if (homeButton) {
            homeButton.classList.remove("hidden");
        }

        if (finalReport) {

            viewReportButton.classList.remove(
                "hidden"
            );

        } else {

            viewReportButton.classList.add(
                "hidden"
            );

        }


        // =========================
        // PAST INTERVIEW MODE
        // =========================

        // Always render past interviews in the text layout,
        // regardless of current mode selection.
        if (textInputArea) {
            textInputArea.classList.remove("hidden");
        }

        if (voiceInputArea) {
            voiceInputArea.classList.add("hidden");
        }

        messageInput.disabled =
            true;


        sendButton.disabled =
            true;


        if (micButton) {

            micButton.disabled =
                true;

        }


        endButton.disabled =
            true;


        endButton.textContent =
            "Past Interview";


        // Hide timer for old interview

        sessionTimer.textContent =
            "PAST";


        showScreen(
            chatScreen
        );


        messages.scrollTop =
            messages.scrollHeight;


    } catch (error) {

        console.error(
            error
        );


        alert(
            error.message ||
            "Could not load previous interview."
        );

    }

}


// =========================
// CONTINUE PREVIOUS INTERVIEW
// =========================

async function continuePreviousInterview(
    interviewId
) {

    if (!accessToken) {
        return;
    }

    stopVoiceRecording();
    stopTTS();
    stopTimer();

    try {

        const response =
            await fetch(
                `${API_BASE}/interviews/${interviewId}/resume`,
                {
                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${accessToken}`

                    }

                }
            );


        if (!response.ok) {

            if (
                response.status === 401
            ) {

                logoutButton.click();

                return;
            }


            const errorData =
                await response.json()
                    .catch(() => ({}));


            throw new Error(
                errorData.detail ||
                "Could not continue this interview"
            );

        }


        const interview =
            await response.json();


        selectedType =
            interview.interview_type;

        selectedDifficulty =
            interview.difficulty;

        // Resumed sessions always come back in Text mode — the original
        // interview didn't record which mode it was started in.
        selectedMode = "Text";

        applyChatMode();


        messages.innerHTML =
            "";


        const conversation =
            interview.conversation || [];


        conversation.forEach(
            item => {

                const role =
                    item.role ||
                    item.sender ||
                    "";


                const content =
                    item.content ||
                    item.message ||
                    "";


                if (!content) {
                    return;
                }


                const sender =
                    (
                        role === "assistant" ||
                        role === "ai"
                    )
                        ? "ai"
                        : "user";


                // Don't replay old messages out loud.

                addMessage(
                    content,
                    sender,
                    false
                );

            }
        );


        interviewEnded = false;
        finalReport = null;

        viewReportButton.classList.add(
            "hidden"
        );

        if (homeButton) {
            homeButton.classList.add(
                "hidden"
            );
        }

        messageInput.disabled =
            false;

        sendButton.disabled =
            false;

        if (micButton) {
            micButton.disabled =
                false;
        }

        endButton.disabled =
            false;

        endButton.textContent =
            "End Interview";

        interviewInfo.textContent =
            `${interview.interview_type} • ${interview.difficulty} • Continued`;


        showScreen(
            chatScreen
        );

        startTimer();

        messageInput.focus();

        messages.scrollTop =
            messages.scrollHeight;

        await loadPreviousInterviews();


    } catch (error) {

        console.error(
            error
        );


        alert(
            error.message ||
            "Could not continue this interview."
        );

    }

}


// =========================
// NEW INTERVIEW
// =========================

newInterviewButton.addEventListener(
    "click",
    resetToStartScreen
);

if (homeButton) {

    homeButton.addEventListener(
        "click",
        resetToStartScreen
    );

}

function resetToStartScreen() {

        stopVoiceRecording();
        stopTTS();
        stopTimer();


        // Reset interview state

        selectedType =
            null;

        selectedDifficulty =
            null;

        finalReport =
            null;

        interviewEnded = false;


        // Reset buttons

        typeButtons.forEach(
            button => {

                button.classList.remove(
                    "selected"
                );

            }
        );


        difficultyButtons.forEach(
            button => {

                button.classList.remove(
                    "selected"
                );

            }
        );


        // Reset PDF

        pdfSection.classList.add(
            "hidden"
        );


        pdfFile.value =
            "";


        dzFileLabel.textContent =
            "";


        // Reset custom type

        customTypeSection.classList.add(
            "hidden"
        );

        customTypeInput.value =
            "";


        // Reset chat

        messages.innerHTML =
            "";


        messageInput.value =
            "";


        messageInput.disabled =
            false;


        sendButton.disabled =
            false;


        if (micButton) {

            micButton.disabled =
                false;

        }


        endButton.disabled =
            false;


        endButton.textContent =
            "End Interview";


        viewReportButton.classList.add(
            "hidden"
        );

        if (homeButton) {
            homeButton.classList.add(
                "hidden"
            );
        }


        sessionTimer.textContent =
            "00:00";


        interviewInfo.textContent =
            "";


        showScreen(
            startScreen
        );


        loadPreviousInterviews();

}


// =========================
// REFRESH HISTORY
// =========================

if (refreshHistoryButton) {

    refreshHistoryButton.addEventListener(
        "click",
        () => {

            loadPreviousInterviews();

        }
    );

}


// =========================
// BEFORE LEAVING PAGE
// =========================

window.addEventListener(
    "beforeunload",
    () => {

        stopVoiceRecording();
        stopTTS();
        stopTimer();

    }
);


// =========================
// INITIAL HISTORY LOAD
// =========================

if (accessToken) {

    loadPreviousInterviews();

}