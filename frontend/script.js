const API_BASE = "http://127.0.0.1:8000";

let selectedType = null;
let selectedDifficulty = null;

let finalReport = null;

let timerInterval = null;
let timerStart = null;


// =========================
// ELEMENTS
// =========================

const startScreen = document.getElementById("start-screen");
const chatScreen = document.getElementById("chat-screen");
const reportScreen = document.getElementById("report-screen");

const typeButtons = document.querySelectorAll(".type-btn");
const difficultyButtons = document.querySelectorAll(".difficulty-btn");

const pdfSection = document.getElementById("pdf-section");
const pdfFile = document.getElementById("pdf-file");
const dropzone = document.getElementById("dropzone");
const dzFileLabel = document.getElementById("dz-file");

const startButton = document.getElementById("start-btn");
const errorMessage = document.getElementById("error-message");

const messages = document.getElementById("messages");

const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-btn");

const endButton = document.getElementById("end-btn");

const interviewInfo = document.getElementById("interview-info");
const sessionTimer = document.getElementById("session-timer");

const reportContent = document.getElementById("report-content");

const viewChatButton = document.getElementById("view-chat-btn");
const viewReportButton = document.getElementById("view-report-btn");
const newInterviewButton = document.getElementById("new-interview-btn");


// =========================
// INTERVIEW TYPE
// =========================

typeButtons.forEach(button => {

    button.addEventListener("click", () => {

        typeButtons.forEach(btn => btn.classList.remove("selected"));
        button.classList.add("selected");

        selectedType = button.dataset.type;

        if (selectedType === "PDF Based") {
            pdfSection.classList.remove("hidden");
        } else {
            pdfSection.classList.add("hidden");
            pdfFile.value = "";
            dzFileLabel.textContent = "";
        }

    });

});


// =========================
// DIFFICULTY
// =========================

difficultyButtons.forEach(button => {

    button.addEventListener("click", () => {

        difficultyButtons.forEach(btn => btn.classList.remove("selected"));
        button.classList.add("selected");

        selectedDifficulty = button.dataset.difficulty;

    });

});


// =========================
// PDF DROPZONE (drag & drop + click-to-browse, browse still uses the real input)
// =========================

pdfFile.addEventListener("change", () => {
    if (pdfFile.files.length) {
        dzFileLabel.textContent = pdfFile.files[0].name;
    }
});

["dragenter", "dragover"].forEach(evt => {
    dropzone.addEventListener(evt, e => {
        e.preventDefault();
        dropzone.classList.add("drag-over");
    });
});

["dragleave", "drop"].forEach(evt => {
    dropzone.addEventListener(evt, e => {
        e.preventDefault();
        dropzone.classList.remove("drag-over");
    });
});

dropzone.addEventListener("drop", e => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
        pdfFile.files = e.dataTransfer.files;
        dzFileLabel.textContent = file.name;
    }
});


// =========================
// ERROR HELPER
// =========================

function showError(text) {
    errorMessage.textContent = text;
}

function clearError() {
    errorMessage.textContent = "";
}


// =========================
// ADD MESSAGE
// =========================

function addMessage(text, sender) {

    const message = document.createElement("div");
    message.classList.add("message", sender);

    const tag = document.createElement("div");
    tag.classList.add("message-tag");
    tag.textContent = sender === "ai" ? "[ INTER_PREP ]" : "[ YOU ]";

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");
    bubble.textContent = text;

    message.appendChild(tag);
    message.appendChild(bubble);

    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;

    return message;
}

function addTypingIndicator() {

    const message = document.createElement("div");
    message.classList.add("message", "ai");
    message.id = "thinking-message";

    const tag = document.createElement("div");
    tag.classList.add("message-tag");
    tag.textContent = "[ INTER_PREP ]";

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    const dots = document.createElement("span");
    dots.classList.add("typing-dots");
    dots.innerHTML = "<span></span><span></span><span></span>";

    bubble.appendChild(dots);
    message.appendChild(tag);
    message.appendChild(bubble);

    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;

    return message;
}


// =========================
// SESSION TIMER
// =========================

function startTimer() {
    timerStart = Date.now();
    sessionTimer.textContent = "00:00";

    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStart) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const secs = String(elapsed % 60).padStart(2, "0");
        sessionTimer.textContent = `${mins}:${secs}`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}


// =========================
// TEXTAREA AUTOSIZE
// =========================

messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + "px";
});


// =========================
// START INTERVIEW
// =========================

startButton.addEventListener("click", async () => {

    clearError();

    if (!selectedType) {
        showError("Please select an interview type.");
        return;
    }

    if (!selectedDifficulty) {
        showError("Please select a difficulty.");
        return;
    }

    if (selectedType === "PDF Based" && !pdfFile.files.length) {
        showError("Please upload a PDF.");
        return;
    }

    try {

        startButton.disabled = true;
        startButton.querySelector(".btn-label").textContent = "Starting...";

        // PDF UPLOAD

        if (selectedType === "PDF Based") {

            const formData = new FormData();
            formData.append("file", pdfFile.files[0]);

            const uploadResponse = await fetch(`${API_BASE}/upload-pdf`, {
                method: "POST",
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error("PDF upload failed");
            }

        }

        // START INTERVIEW

        const response = await fetch(`${API_BASE}/start-interview`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                interview_type: selectedType,
                difficulty: selectedDifficulty
            })
        });

        if (!response.ok) {
            throw new Error("Failed to start interview");
        }

        const data = await response.json();

        // SHOW CHAT

        startScreen.classList.add("hidden");
        chatScreen.classList.remove("hidden");

        interviewInfo.textContent = `${selectedType} • ${selectedDifficulty}`;

        messages.innerHTML = "";
        addMessage(data.response, "ai");

        startTimer();

        messageInput.focus();

    } catch (error) {

        console.error(error);
        showError("Could not start interview. Is the server running?");

    } finally {

        startButton.disabled = false;
        startButton.querySelector(".btn-label").textContent = "Start Interview";
    }

});


// =========================
// SEND MESSAGE
// =========================

async function sendMessage() {

    const message = messageInput.value.trim();

    if (!message) {
        return;
    }

    addMessage(message, "user");

    messageInput.value = "";
    messageInput.style.height = "auto";

    const thinkingMessage = addTypingIndicator();

    try {

        sendButton.disabled = true;
        messageInput.disabled = true;

        const response = await fetch(`${API_BASE}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message })
        });

        if (!response.ok) {
            throw new Error("Chat request failed");
        }

        const data = await response.json();

        thinkingMessage.remove();
        addMessage(data.response, "ai");

    } catch (error) {

        console.error(error);
        thinkingMessage.remove();
        addMessage("Sorry, something went wrong.", "ai");

    } finally {

        sendButton.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
    }

}


// =========================
// SEND BUTTON / ENTER KEY
// =========================

sendButton.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});


// =========================
// REPORT FORMATTING
// Turns the plain-text report into lightly structured HTML
// (headings for "Label:" lines, bullets for "-"/"*" lines)
// without assuming a fixed backend format.
// =========================

function renderReport(text) {

    reportContent.innerHTML = "";

    if (!text) {
        const p = document.createElement("p");
        p.textContent = "No report available.";
        reportContent.appendChild(p);
        return;
    }

    const lines = text.split("\n");
    let listEl = null;
    let paraLines = [];

    function flushParagraph() {
        if (paraLines.length) {
            const p = document.createElement("p");
            p.textContent = paraLines.join("\n");
            reportContent.appendChild(p);
            paraLines = [];
        }
    }

    const headingPattern = /^([A-Za-z][A-Za-z0-9 /_-]{2,40}):\s*$/;
    const bulletPattern = /^\s*[-*•]\s+(.*)$/;

    lines.forEach(rawLine => {
        const line = rawLine.trimEnd();

        if (headingPattern.test(line)) {
            flushParagraph();
            listEl = null;
            const h = document.createElement("div");
            h.classList.add("report-heading");
            h.textContent = line.replace(/:\s*$/, "");
            reportContent.appendChild(h);
            return;
        }

        const bulletMatch = line.match(bulletPattern);
        if (bulletMatch) {
            flushParagraph();
            if (!listEl) {
                listEl = document.createElement("ul");
                reportContent.appendChild(listEl);
            }
            const li = document.createElement("li");
            li.textContent = bulletMatch[1];
            listEl.appendChild(li);
            return;
        }

        listEl = null;

        if (line.trim() === "") {
            flushParagraph();
        } else {
            paraLines.push(line);
        }
    });

    flushParagraph();
}


// =========================
// END INTERVIEW
// =========================

endButton.addEventListener("click", async () => {

    try {

        endButton.disabled = true;
        endButton.textContent = "Generating...";

        const response = await fetch(`${API_BASE}/end-interview`, {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error("Failed to end interview");
        }

        const data = await response.json();

        // SAVE REPORT

        finalReport = data.report;
        renderReport(finalReport);

        stopTimer();

        // HIDE CHAT / SHOW REPORT

        chatScreen.classList.add("hidden");
        reportScreen.classList.remove("hidden");

    } catch (error) {

        console.error(error);

        addMessage("Could not generate the final report.", "ai");

        endButton.disabled = false;
        endButton.textContent = "End Interview";
    }

});


// =========================
// VIEW CONVERSATION
// =========================

viewChatButton.addEventListener("click", () => {

    reportScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");

    endButton.disabled = true;
    endButton.textContent = "Interview Ended";

    sendButton.disabled = true;
    messageInput.disabled = true;

    viewReportButton.classList.remove("hidden");

    messages.scrollTop = messages.scrollHeight;
});


// =========================
// VIEW REPORT
// =========================

viewReportButton.addEventListener("click", () => {

    if (finalReport) {
        renderReport(finalReport);
    }

    chatScreen.classList.add("hidden");
    reportScreen.classList.remove("hidden");

});


// =========================
// NEW INTERVIEW
// =========================

newInterviewButton.addEventListener("click", () => {
    window.location.reload();
});
