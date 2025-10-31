// Switch Tabs
function switchTab(tabName) {
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
  document.getElementById(tabName).classList.add("active");
  event.target.classList.add("active");
}

// Start Feedback Session - SIMPLE VERSION
async function startSession() {
  // Get values directly - no trim, just basic
  const subject = document.getElementById("subject").value;
  const teacher = document.getElementById("teacher").value;
  const topic = document.getElementById("topic").value;

  // Simple check
  if (subject === "" || teacher === "" || topic === "") {
    alert("Please fill all fields!");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/session/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, teacher, topic }),
    });

    const data = await res.json();
    
    if (data.success) {
      const sessionId = data.sessionId;
      const qrContainer = document.getElementById("qrDisplay");
      qrContainer.innerHTML = ""; // Clear previous

      // Generate QR code
      new QRCode(qrContainer, {
        text: `http://localhost:3000?sessionId=${sessionId}`,
        width: 200,
        height: 200,
      });

      alert("Session started! Session ID: " + sessionId);
    } else {
      alert("Failed to start session!");
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Error connecting to server.");
  }
}

// Other functions (keep them simple)
let currentRating = 0;

function setRating(rating) {
  currentRating = rating;
}

function showFeedbackForm() {
  document.getElementById("feedbackSection").style.display = "block";
}

function submitFeedback() {
  alert("Feedback submitted!");
  document.getElementById("feedbackSection").style.display = "none";
  document.getElementById("thankYou").style.display = "block";
}

function loadAnalytics() {
  alert("Analytics loaded!");
}