// Switch Tabs
function switchTab(tabName) {
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
  document.getElementById(tabName).classList.add("active");
  event.target.classList.add("active");
}

// Start Feedback Session
async function startSession() {
  const subject = document.getElementById("subject").value;
  const teacher = document.getElementById("teacher").value;
  const topic = document.getElementById("topic").value;

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
      qrContainer.innerHTML = "";

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

// Student Feedback Functions
let currentRating = 0;

function setRating(rating) {
  currentRating = rating;
  // Remove selected class from all
  document.querySelectorAll('.rating-option').forEach(option => {
    option.classList.remove('selected');
  });
  // Add selected class to clicked one
  event.currentTarget.classList.add('selected');
}

function showFeedbackForm() {
  const sessionId = document.getElementById("sessionInput").value.trim();
  if (!sessionId) {
    alert("Please enter session ID!");
    return;
  }
  document.getElementById("feedbackSection").style.display = "block";
}

async function submitFeedback() {
  const sessionId = document.getElementById("sessionInput").value.trim();
  const comment = document.getElementById("comment").value;

  if (!sessionId) {
    alert("Please enter session ID!");
    return;
  }

  if (currentRating === 0) {
    alert("Please select a rating!");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/feedback/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        sessionId: sessionId, 
        rating: currentRating, 
        comment: comment 
      }),
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById("feedbackSection").style.display = "none";
      document.getElementById("thankYou").style.display = "block";
    } else {
      alert("Failed to submit feedback!");
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Error connecting to server.");
  }
}

// Analytics Functions
async function loadAnalytics() {
  const sessionId = document.getElementById("analyticsSessionId").value.trim();
  
  if (!sessionId) {
    alert("Please enter session ID!");
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/analytics/${sessionId}`);
    const data = await res.json();

    if (data.totalResponses !== undefined) {
      document.getElementById("totalStudentResponses").textContent = data.totalResponses;
      document.getElementById("avgSessionRating").textContent = data.avgRating.toFixed(1);
      alert("Analytics loaded! Check the stats above.");
    } else {
      alert("No data found for this session ID!");
    }

  } catch (err) {
    console.error("Error:", err);
    alert("Error loading analytics.");
  }
}

// Auto-load feedback form if sessionId in URL
window.onload = function() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('sessionId');
  if (sessionId) {
    document.getElementById("sessionInput").value = sessionId;
    switchTab('student');
    showFeedbackForm();
  }
};