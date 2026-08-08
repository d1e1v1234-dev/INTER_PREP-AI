const API_BASE = "http://127.0.0.1:8000";

let selectedType = null;
let selectedDifficulty = null;
let finalReport = null;

let timerInterval = null;
let timerStart = null;

let accessToken = localStorage.getItem("access_token");


// =========================
// ELEMENTS
// =========================

// Auth
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

// Interview
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
// SCREEN HELPERS
// =========================

function showScreen(screen) {
    [authScreen, startScreen, chatScreen, reportScreen].forEach(s => s.classList.add("hidden"));
    screen.classList.remove("hidden");
}

// Show the right screen on load, based on whether we already have a token.
showScreen(accessToken ? startScreen : authScreen);


// =========================
// AUTH — TABS
// =========================

loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    setAuthMessage("");
});

registerTab.addEventListener("click", () => {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    setAuthMessage("");
});

function setAuthMessage(text, success = false) {
    authMessage.textContent = text;
    authMessage.classList.toggle("success", success);
}


// =========================
// AUTH — REGISTER
// =========================

registerButton.addEventListener("click", async () => {

    setAuthMessage("");

    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;

    if (!name || !email || !password) {
        setAuthMessage("Please fill all fields.");
        return;
    }

    if (password.length < 6) {
        setAuthMessage("Password must be at least 6 characters.");
        return;
    }

    try {
        registerButton.disabled = true;
        registerButton.querySelector(".btn-label").textContent = "Creating...";

        const response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Registration failed.");
        }

        setAuthMessage("Account created! Please login.", true);

        registerName.value = "";
        registerEmail.value = "";
        registerPassword.value = "";

        loginTab.click();
        loginEmail.value = email;

    } catch (error) {
        console.error(error);
        setAuthMessage(error.message || "Could not create account.");

    } finally {
        registerButton.disabled = false;
        registerButton.querySelector(".btn-label").textContent = "Create Account";
    }

});


// =========================
// AUTH — LOGIN
// =========================

loginButton.addEventListener("click", async () => {

    setAuthMessage("");

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
        setAuthMessage("Please enter email and password.");
        return;
    }

    try {
        loginButton.disabled = true;
        loginButton.querySelector(".btn-label").textContent = "Logging in...";

        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Invalid email or password.");
        }

        accessToken = data.access_token;
        localStorage.setItem("access_token", accessToken);

        loginPassword.value = "";
        showScreen(startScreen);

    } catch (error) {
        console.error(error);
        setAuthMessage(error.message || "Login failed.");

    } finally {
        loginButton.disabled = false;
        loginButton.querySelector(".btn-label").textContent = "Login";
    }

});


// =========================
// AUTH — LOGOUT
// =========================

logoutButton.addEventListener("click", () => {
    accessToken = null;
    localStorage.removeItem("access_token");

    // reset interview state so a re-login starts clean
    selectedType = null;
    selectedDifficulty = null;
    finalReport = null;
    typeButtons.forEach(btn => btn.classList.remove("selected"));
    difficultyButtons.forEach(btn => btn.classList.remove("selected"));
    pdfSection.classList.add("hidden");
    pdfFile.value = "";
    dzFileLabel.textContent = "";

    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    loginTab.classList.add("active");
    registerTab.classList.remove("active");

    showScreen(authScreen);
});


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
// PDF DROPZONE (drag & drop + click-to-browse)
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
// ERROR HELPER (start screen)
// =========================

function showError(text) {
    errorMessage.textContent = text;
}

function clearError() {
    errorMessage.textContent = "";
}


// =========================
// MESSAGES
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

    if (!accessToken) {
        showError("Please login again.");
        return;
    }

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

        if (selectedType === "PDF Based") {
            const formData = new FormData();
            formData.append("file", pdfFile.files[0]);

            const uploadResponse = await fetch(`${API_BASE}/upload-pdf`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${accessToken}` },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error("PDF upload failed");
            }
        }

        const response = await fetch(`${API_BASE}/start-interview`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                interview_type: selectedType,
                difficulty: selectedDifficulty
            })
        });

        if (!response.ok) {
            throw new Error("Failed to start interview");
        }

        const data = await response.json();

        showScreen(chatScreen);
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
    if (!message) return;

    if (!accessToken) {
        addMessage("Please login again.", "ai");
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
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({ message })
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
    const headingPattern = /^([A-Za-z][A-Za-z0-9 /_-]{2,40}):\s*$/;
    const bulletPattern = /^\s*[-*•]\s+(.*)$/;

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
            method: "POST",
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            throw new Error("Failed to end interview");
        }

        const data = await response.json();

        finalReport = data.report;
        renderReport(finalReport);
        stopTimer();

        showScreen(reportScreen);

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
    showScreen(chatScreen);

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
    showScreen(reportScreen);
});


// =========================
// NEW INTERVIEW
// =========================

newInterviewButton.addEventListener("click", () => {
    window.location.reload();
});