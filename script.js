// Global variables
let currentSession = null;
let feedbackData = [];
let selectedRating = 0;
let pieChart = null;
let timelineChart = null;
let weeklyChart = null;
let subjectChart = null;
let updateInterval = null;

// Initialize demo data when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDemoData();
    setupEventListeners();
});

// Initialize demo data for analytics
function initializeDemoData() {
    feedbackData = [
        { sessionId: 'SESS001', subject: 'Mathematics', rating: 4, comment: 'Great explanation!', timestamp: new Date(Date.now() - 86400000) },
        { sessionId: 'SESS001', subject: 'Mathematics', rating: 5, comment: 'Very clear', timestamp: new Date(Date.now() - 86400000) },
        { sessionId: 'SESS002', subject: 'Physics', rating: 3, comment: 'Need more examples', timestamp: new Date(Date.now() - 172800000) },
        { sessionId: 'SESS002', subject: 'Physics', rating: 4, comment: 'Good pace', timestamp: new Date(Date.now() - 172800000) },
        { sessionId: 'SESS003', subject: 'Chemistry', rating: 5, comment: 'Excellent!', timestamp: new Date(Date.now() - 259200000) }
    ];
}

// Setup event listeners
function setupEventListeners() {
    // Session input handler
    const sessionInput = document.getElementById('sessionInput');
    if (sessionInput) {
        sessionInput.addEventListener('input', handleSessionInput);
    }

    // Rating option handlers
    const ratingOptions = document.querySelectorAll('.rating-option');
    ratingOptions.forEach(option => {
        option.addEventListener('click', handleRatingSelection);
    });

    // Check for session ID in URL parameters
    checkUrlParams();
}

// Check URL parameters for session ID
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get('session');
    if (sessionParam) {
        document.getElementById('sessionInput').value = sessionParam;
        handleSessionInput({ target: { value: sessionParam } });
        // Switch to student tab
        switchTab('student');
    }
}

// Tab switching functionality
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    const clickedButton = Array.from(document.querySelectorAll('.tab-button')).find(btn => 
        btn.textContent.includes(tabName === 'teacher' ? 'Teacher' : 
                                 tabName === 'student' ? 'Student' : 'Analytics')
    );
    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    // Initialize analytics charts if analytics tab is selected
    if (tabName === 'analytics') {
        setTimeout(initializeAnalyticsCharts, 100);
    }
}

// Generate unique session ID
function generateSessionId() {
    return 'SESS' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Start feedback session
function startSession() {
    const subject = document.getElementById('subject').value.trim();
    const teacher = document.getElementById('teacher').value.trim();
    const topic = document.getElementById('topic').value.trim();

    if (!subject || !teacher || !topic) {
        alert('Please fill in all fields');
        return;
    }

    currentSession = {
        id: generateSessionId(),
        subject: subject,
        teacher: teacher,
        topic: topic,
        startTime: new Date(),
        responses: []
    };

    // Generate QR code
    generateQR();

    // Show active session UI
    document.getElementById('activeSession').style.display = 'block';
    document.getElementById('sessionId').textContent = currentSession.id;
    document.getElementById('sessionDetails').textContent = `${subject} - ${topic} by ${teacher}`;

    // Initialize charts
    initializeCharts();

    // Start live updates
    startLiveUpdates();

    // Auto-populate session ID in student form
    document.getElementById('sessionInput').value = currentSession.id;
    
    // Clear form
    document.getElementById('subject').value = '';
    document.getElementById('teacher').value = '';
    document.getElementById('topic').value = '';
}

// Generate QR code
function generateQR() {
    const qrDisplay = document.getElementById('qrDisplay');
    qrDisplay.innerHTML = '';

    const url = `${window.location.origin}${window.location.pathname}?session=${currentSession.id}`;
    
    QRCode.toCanvas(qrDisplay, url, {
        width: 250,
        margin: 2,
        color: {
            dark: '#667eea',
            light: '#ffffff'
        }
    }, function(error) {
        if (error) {
            console.error('QR Code generation failed:', error);
            qrDisplay.innerHTML = `
                <div class="empty-state">
                    <div class="emoji">❌</div>
                    <p>QR Code generation failed</p>
                </div>
            `;
            return;
        }

        // Add URL below QR code
        const urlDiv = document.createElement('div');
        urlDiv.style.marginTop = '15px';
        urlDiv.style.fontSize = '0.9rem';
        urlDiv.style.color = '#666';
        urlDiv.style.wordBreak = 'break-all';
        urlDiv.innerHTML = `<strong>URL:</strong> ${url}`;
        qrDisplay.appendChild(urlDiv);
    });
}

// Initialize real-time charts
function initializeCharts() {
    // Pie chart for understanding levels
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ['Perfect (5)', 'Good (4)', 'Okay (3)', 'Confused (2)', 'Very Confused (1)'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#4CAF50',
                    '#8BC34A',
                    '#FFC107',
                    '#FF9800',
                    '#F44336'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Timeline chart for response tracking
    const timelineCtx = document.getElementById('timelineChart').getContext('2d');
    timelineChart = new Chart(timelineCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Average Rating',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Initialize analytics charts
function initializeAnalyticsCharts() {
    // Weekly performance trends
    const weeklyCtx = document.getElementById('weeklyChart');
    if (weeklyCtx && !weeklyChart) {
        weeklyChart = new Chart(weeklyCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                datasets: [{
                    label: 'Average Understanding',
                    data: [3.2, 3.5, 3.8, 4.1, 4.3, 4.2],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Subject-wise understanding
    const subjectCtx = document.getElementById('subjectChart');
    if (subjectCtx && !subjectChart) {
        subjectChart = new Chart(subjectCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'],
                datasets: [{
                    label: 'Average Rating',
                    data: [4.2, 3.8, 4.5, 4.1, 4.3],
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(233, 30, 99, 0.8)'
                    ],
                    borderColor: [
                        '#667eea',
                        '#764ba2',
                        '#4CAF50',
                        '#FFC107',
                        '#E91E63'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

// Handle session input
function handleSessionInput(event) {
    const sessionId = event.target.value.trim();
    const feedbackSection = document.getElementById('feedbackSection');
    
    if (sessionId) {
        feedbackSection.style.display = 'block';
    } else {
        feedbackSection.style.display = 'none';
    }
}

// Handle rating selection
function handleRatingSelection(event) {
    // Remove selection from all options
    document.querySelectorAll('.rating-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Add selection to clicked option
    event.currentTarget.classList.add('selected');
    selectedRating = parseInt(event.currentTarget.dataset.rating);
}

// Submit feedback
function submitFeedback() {
    const sessionId = document.getElementById('sessionInput').value.trim();
    const comment = document.getElementById('comment').value.trim();

    if (!sessionId) {
        alert('Please enter a session ID');
        return;
    }

    if (selectedRating === 0) {
        alert('Please select your understanding level');
        return;
    }

    const feedback = {
        sessionId: sessionId,
        rating: selectedRating,
        comment: comment,
        timestamp: new Date()
    };

    // Add to current session if it matches
    if (currentSession && currentSession.id === sessionId) {
        currentSession.responses.push(feedback);
        updateCharts();
        updateStats();
        updateFeedbackList();
    }

    // Add to global feedback data
    feedbackData.push(feedback);

    // Show thank you message
    document.getElementById('feedbackSection').style.display = 'none';
    document.getElementById('thankYou').style.display = 'block';

    // Reset form after 3 seconds
    setTimeout(() => {
        resetStudentForm();
    }, 3000);
}

// Reset student form
function resetStudentForm() {
    document.getElementById('thankYou').style.display = 'none';
    document.getElementById('feedbackSection').style.display = 'block';
    document.querySelectorAll('.rating-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.getElementById('comment').value = '';
    selectedRating = 0;
}

// Update charts with new data
function updateCharts() {
    if (!currentSession || !pieChart || !timelineChart) return;

    const responses = currentSession.responses;
    const ratingCounts = [0, 0, 0, 0, 0];
    
    responses.forEach(response => {
        ratingCounts[5 - response.rating]++;
    });

    // Update pie chart
    pieChart.data.datasets[0].data = ratingCounts;
    pieChart.update('none');

    // Update timeline chart (show last 10 responses)
    const recentResponses = responses.slice(-10);
    const timeLabels = recentResponses.map((r, index) => `R${responses.length - 9 + index}`);
    const ratings = recentResponses.map(r => r.rating);

    timelineChart.data.labels = timeLabels;
    timelineChart.data.datasets[0].data = ratings;
    timelineChart.update('none');
}

// Update statistics
function updateStats() {
    if (!currentSession) return;

    const responses = currentSession.responses;
    const totalResponses = responses.length;
    
    document.getElementById('totalResponses').textContent = totalResponses;
    
    if (totalResponses > 0) {
        const avgRating = (responses.reduce((sum, r) => sum + r.rating, 0) / totalResponses).toFixed(1);
        document.getElementById('avgRating').textContent = avgRating;
        document.getElementById('responseRate').textContent = Math.min(100, Math.round(totalResponses * 3.33)) + '%';
    }
}

// Update feedback list
function updateFeedbackList() {
    const feedbackList = document.getElementById('feedbackList');
    
    if (!currentSession || currentSession.responses.length === 0) {
        feedbackList.innerHTML = `
            <div class="empty-state">
                <div class="emoji">💭</div>
                <p>No feedback received yet</p>
            </div>
        `;
        return;
    }

    const recentFeedback = currentSession.responses.slice(-5).reverse();
    feedbackList.innerHTML = recentFeedback.map(feedback => {
        const ratingText = [
            '😵 Very Confused', 
            '😕 Somewhat Confused', 
            '🙂 Partially Clear', 
            '😊 Well Understood', 
            '😍 Perfectly Clear'
        ][feedback.rating - 1];
        
        return `
            <div class="feedback-item">
                <div class="feedback-time">${feedback.timestamp.toLocaleTimeString()}</div>
                <div class="feedback-rating">${ratingText}</div>
                ${feedback.comment ? `<div class="feedback-comment">"${feedback.comment}"</div>` : ''}
            </div>
        `;
    }).join('');
}

// Start live updates
function startLiveUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    updateInterval = setInterval(() => {
        // Simulate receiving new feedback (for demo purposes)
        if (currentSession && Math.random() < 0.1) { // 10% chance every 5 seconds
            const demoFeedback = {
                sessionId: currentSession.id,
                rating: Math.floor(Math.random() * 5) + 1,
                comment: ['Great!', 'Very helpful', 'Need more examples', 'Excellent explanation', ''][Math.floor(Math.random() * 5)],
                timestamp: new Date()
            };
            
            currentSession.responses.push(demoFeedback);
            updateCharts();
            updateStats();
            updateFeedbackList();
        }
    }, 5000);
}

// Export feedback data
function exportFeedback() {
    if (!currentSession || currentSession.responses.length === 0) {
        alert('No feedback data to export');
        return;
    }

    const csvContent = generateCSV(currentSession);
    downloadCSV(csvContent, `feedback_${currentSession.id}.csv`);
}

// Generate CSV content
function generateCSV(session) {
    const headers = ['Session ID', 'Subject', 'Teacher', 'Topic', 'Rating', 'Comment', 'Timestamp'];
    const rows = session.responses.map(response => [
        session.id,
        session.subject,
        session.teacher,
        session.topic,
        response.rating,
        `"${response.comment.replace(/"/g, '""')}"`, // Escape quotes in comments
        response.timestamp.toISOString()
    ]);

    return [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
}

// Download CSV file
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// End session
function endSession() {
    if (!currentSession) return;

    const confirmEnd = confirm(`Are you sure you want to end the session "${currentSession.id}"?`);
    if (!confirmEnd) return;

    // Stop live updates
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }

    // Hide active session UI
    document.getElementById('activeSession').style.display = 'none';

    // Reset QR display
    document.getElementById('qrDisplay').innerHTML = `
        <div class="empty-state">
            <div class="emoji">📱</div>
            <p>Click "Start Feedback Session" to generate QR code</p>
        </div>
    `;

    // Clear session input
    document.getElementById('sessionInput').value = '';
    document.getElementById('feedbackSection').style.display = 'none';

    // Archive session data
    if (currentSession.responses.length > 0) {
        feedbackData.push(...currentSession.responses.map(r => ({
            ...r,
            subject: currentSession.subject,
            teacher: currentSession.teacher,
            topic: currentSession.topic
        })));
    }

    // Clear current session
    currentSession = null;

    alert('Session ended successfully!');
}

// Utility function to add demo feedback (for testing)
function addDemoFeedback() {
    if (!currentSession) return;

    const demoComments = [
        'Great explanation!',
        'Very clear and helpful',
        'Could use more examples',
        'Perfect pace',
        'Need more time for questions',
        'Excellent session!',
        'A bit fast for me',
        'Love the interactive approach'
    ];

    const feedback = {
        sessionId: currentSession.id,
        rating: Math.floor(Math.random() * 5) + 1,
        comment: demoComments[Math.floor(Math.random() * demoComments.length)],
        timestamp: new Date()
    };

    currentSession.responses.push(feedback);
    updateCharts();
    updateStats();
    updateFeedbackList();
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Alt + 1, 2, 3 to switch tabs
    if (event.altKey) {
        switch(event.key) {
            case '1':
                switchTab('teacher');
                break;
            case '2':
                switchTab('student');
                break;
            case '3':
                switchTab('analytics');
                break;
        }
    }
    
    // Ctrl + Enter to start session (when in teacher tab)
    if (event.ctrlKey && event.key === 'Enter') {
        const activeTab = document.querySelector('.tab-pane.active');
        if (activeTab && activeTab.id === 'teacher') {
            startSession();
        }
    }
});

// Handle window resize for charts
window.addEventListener('resize', function() {
    if (pieChart) pieChart.resize();
    if (timelineChart) timelineChart.resize();
    if (weeklyChart) weeklyChart.resize();
    if (subjectChart) subjectChart.resize();
});

// Handle page visibility change (pause updates when tab is not active)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
    } else {
        if (currentSession) {
            startLiveUpdates();
        }
    }
});

// Console helper functions for development
window.feedbackSystem = {
    addDemo: addDemoFeedback,
    getCurrentSession: () => currentSession,
    getFeedbackData: () => feedbackData,
    switchTab: switchTab
};