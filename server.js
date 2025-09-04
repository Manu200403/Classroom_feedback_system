console.log("🔧 Starting server...");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/classroom_feedback", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Error:", err));

// Schema for Feedback Session
const sessionSchema = new mongoose.Schema({
    subject: String,
    teacher: String,
    topic: String,
    createdAt: { type: Date, default: Date.now }
});

const feedbackSchema = new mongoose.Schema({
    sessionId: mongoose.Schema.Types.ObjectId,
    rating: Number,
    createdAt: { type: Date, default: Date.now }
});

const Session = mongoose.model("Session", sessionSchema);
const Feedback = mongoose.model("Feedback", feedbackSchema);

// Routes
app.post("/create-session", async (req, res) => {
    const { subject, teacher, topic } = req.body;
    const newSession = new Session({ subject, teacher, topic });
    await newSession.save();
    res.json(newSession);
});

app.post("/submit-feedback", async (req, res) => {
    const { sessionId, rating } = req.body;
    const newFeedback = new Feedback({ sessionId, rating });
    await newFeedback.save();
    res.json(newFeedback);
});

app.get("/analytics/:sessionId", async (req, res) => {
    const { sessionId } = req.params;
    const feedbacks = await Feedback.find({ sessionId });
    const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length || 0;
    res.json({ totalResponses: feedbacks.length, avgRating });
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
