// State variables
let monitoringInterval;
let alertCooldown = false;
let lastAlertTime = null;
let isMonitoring = false;
let settings = {
    emailNotification: 'enabled',
    smsNotification: 'enabled',
    alertFrequency: 3,
    emergencyContact: ''
};

// Normal value ranges
const NORMAL_VALUES = {
    heartRate: { min: 60, max: 100 },
    spo2: { min: 95, max: 100 },
    pulseRate: { min: 60, max: 100 },
    temperature: { min: 36.5, max: 37.5 },
    bp: { systolic: { min: 90, max: 120 }, diastolic: { min: 60, max: 80 } }
};

// DOM elements
const loginForm = document.getElementById("loginForm");
const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");
const statusMsg = document.getElementById("statusMsg");
const smsButton = document.getElementById("smsButton");
const lastAlertTimeElement = document.getElementById("lastAlertTime");
const monitorBtn = document.getElementById("monitorBtn");
const doseBtn = document.getElementById("doseBtn");
const videoBtn = document.getElementById("videoBtn");
const historyBtn = document.getElementById("historyBtn");
const settingsBtn = document.getElementById("settingsBtn");
const logoutBtn = document.getElementById("logoutBtn");
const headerTitle = document.getElementById("headerTitle");
const currentDate = document.getElementById("currentDate");
const todayReadings = document.getElementById("todayReadings");

// Initialize the app
function initApp() {
    // Set current date in history
    const today = new Date();
    currentDate.textContent = today.toLocaleDateString();
    
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem('healthMonitorSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
        updateSettingsForm();
    }
    
    // Initialize medication system
    initMedicationSystem();
    
    // Initialize video call system
    initVideoSystem();
    
    // Initialize time mode detection
    updatePageMode();
    setInterval(updatePageMode, 30000);
    
    // Initialize activity monitoring
    initActivityMonitoring();
}

// Show specific section and hide others
function showSection(sectionId) {
    // Hide all sections
    document.getElementById("mainDashboard").style.display = "none";
    document.getElementById("healthSection").style.display = "none";
    document.getElementById("doseSection").style.display = "none";
    document.getElementById("videoSection").style.display = "none";
    document.getElementById("historySection").style.display = "none";
    document.getElementById("settingsSection").style.display = "none";
    
    // Show requested section
    document.getElementById(sectionId).style.display = "block";
    
    // Update header title and active menu item
    switch(sectionId) {
        case "healthSection":
            headerTitle.innerHTML = '<i class="fas fa-heartbeat"></i> Health Monitor';
            setActiveMenuItem(monitorBtn);
            if (!isMonitoring) {
                startMonitoring();
                isMonitoring = true;
            }
            break;
        case "doseSection":
            headerTitle.innerHTML = '<i class="fas fa-pills"></i> Dose Dial';
            setActiveMenuItem(doseBtn);
            renderMedicineList();
            renderTodaySchedule();
            showDosePage('voiceTime');
            break;
        case "videoSection":
            headerTitle.innerHTML = '<i class="fas fa-video"></i> Video Call';
            setActiveMenuItem(videoBtn);
            break;
        case "historySection":
            headerTitle.innerHTML = '<i class="fas fa-history"></i> History';
            setActiveMenuItem(historyBtn);
            updateHistory();
            break;
        case "settingsSection":
            headerTitle.innerHTML = '<i class="fas fa-cog"></i> Settings';
            setActiveMenuItem(settingsBtn);
            break;
        default:
            headerTitle.textContent = "Dashboard";
            setActiveMenuItem(null);
    }
}

// Show specific dose page
function showDosePage(pageId) {
    document.getElementById('voiceTime').style.display = pageId === 'voiceTime' ? 'block' : 'none';
    document.getElementById('medications').style.display = pageId === 'medications' ? 'block' : 'none';
    document.getElementById('activity').style.display = pageId === 'activity' ? 'block' : 'none';
}

// Set active menu item
function setActiveMenuItem(activeItem) {
    const menuItems = document.querySelectorAll('.side-menu a');
    menuItems.forEach(item => item.classList.remove('active'));
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Toggle side menu
function toggleMenu() {
    const menu = document.getElementById("sideMenu");
    menu.classList.toggle("open");
}

// Initialize monitoring system
function initializeMonitoring() {
    updateReadings(false);
    updateStatus(false);
}

// Generate random normal reading
function generateNormalReading(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random abnormal reading
function generateAbnormalReading(parameter) {
    switch(parameter) {
        case 'heartRate':
            return Math.floor(Math.random() * 30) + 110; // 110-140
        case 'spo2':
            return Math.floor(Math.random() * 5) + 85; // 85-90
        case 'pulseRate':
            return Math.floor(Math.random() * 30) + 110; // 110-140
        case 'temperature':
            return (Math.random() * 2) + 38.5; // 38.5-40.5
        case 'bpSystolic':
            return Math.floor(Math.random() * 30) + 140; // 140-170
        case 'bpDiastolic':
            return Math.floor(Math.random() * 20) + 90; // 90-110
        default:
            return 0;
    }
}

// Update readings display
function updateReadings(abnormal = false) {
    const readings = {
        heartRate: abnormal ? generateAbnormalReading('heartRate') : generateNormalReading(NORMAL_VALUES.heartRate.min, NORMAL_VALUES.heartRate.max),
        spo2: abnormal ? generateAbnormalReading('spo2') : generateNormalReading(NORMAL_VALUES.spo2.min, NORMAL_VALUES.spo2.max),
        pulseRate: abnormal ? generateAbnormalReading('pulseRate') : generateNormalReading(NORMAL_VALUES.pulseRate.min, NORMAL_VALUES.pulseRate.max),
        temperature: abnormal ? generateAbnormalReading('temperature') : (Math.random() * 1) + 36.5, // 36.5-37.5
        bp: {
            systolic: abnormal ? generateAbnormalReading('bpSystolic') : generateNormalReading(NORMAL_VALUES.bp.systolic.min, NORMAL_VALUES.bp.systolic.max),
            diastolic: abnormal ? generateAbnormalReading('bpDiastolic') : generateNormalReading(NORMAL_VALUES.bp.diastolic.min, NORMAL_VALUES.bp.diastolic.max),
            timestamp: new Date()
        }
    };

    // Update DOM
    document.getElementById("heartRate").textContent = readings.heartRate;
    document.getElementById("spo2").textContent = readings.spo2;
    document.getElementById("pulseRate").textContent = readings.pulseRate;
    document.getElementById("temperature").textContent = readings.temperature.toFixed(1);
    document.getElementById("bp").textContent = `${readings.bp.systolic}/${readings.bp.diastolic}`;

    // Save to history
    saveReading(readings);

    return readings;
}

// Save reading to localStorage
function saveReading(readings) {
    let history = JSON.parse(localStorage.getItem('healthHistory') || '[]');
    history.push(readings);
    
    // Keep only the last 100 readings
    if (history.length > 100) {
        history = history.slice(history.length - 100);
    }
    
    localStorage.setItem('healthHistory', JSON.stringify(history));
}

// Update history display
function updateHistory() {
    const history = JSON.parse(localStorage.getItem('healthHistory') || '[]');
    
    if (history.length > 0) {
        const latest = history[history.length - 1];
        todayReadings.innerHTML = `
            SpO₂: ${latest.spo2}% | 
            Pulse: ${latest.pulseRate} bpm | 
            Temp: ${latest.temperature.toFixed(1)}°C | 
            BP: ${latest.bp.systolic}/${latest.bp.diastolic} mmHg
        `;
    }
}

// Check if any readings are abnormal
function checkAbnormal(readings) {
    return (
        readings.heartRate > NORMAL_VALUES.heartRate.max ||
        readings.spo2 < NORMAL_VALUES.spo2.min ||
        readings.pulseRate > NORMAL_VALUES.pulseRate.max ||
        readings.temperature > NORMAL_VALUES.temperature.max ||
        readings.bp.systolic > NORMAL_VALUES.bp.systolic.max ||
        readings.bp.diastolic > NORMAL_VALUES.bp.diastolic.max
    );
}

// Update status display
function updateStatus(abnormal) {
    if (abnormal) {
        statusMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Abnormal Readings Detected';
        statusMsg.className = 'status alert';
        return true;
    } else {
        statusMsg.innerHTML = '<i class="fas fa-check-circle"></i> All Readings Normal';
        statusMsg.className = 'status';
        return false;
    }
}

// Start monitoring with random readings
function startMonitoring() {
    // Initial normal readings
    let readings = updateReadings();
    let isAbnormal = updateStatus(checkAbnormal(readings));
    
    // Change readings at the configured interval (default 3 minutes)
    monitoringInterval = setInterval(() => {
        const makeAbnormal = Math.random() < 0.3; // 30% chance
        
        readings = updateReadings(makeAbnormal);
        isAbnormal = updateStatus(checkAbnormal(readings));
        
        // Auto-send alert if abnormal and not in cooldown
        if (isAbnormal && !alertCooldown) {
            if (sendAlert(readings)) {
                console.log('Automatic alert sent for abnormal readings');
            }
        }
    }, settings.alertFrequency * 60 * 1000); // Convert minutes to milliseconds
}

// Send alert to backend (simulated)
function sendAlert(readings) {
    if (alertCooldown) {
        console.log('Alert cooldown active');
        return false;
    }
    
    // Update last alert time
    lastAlertTime = new Date();
    lastAlertTimeElement.textContent = lastAlertTime.toLocaleTimeString();
    
    // Start cooldown period (5 minutes)
    alertCooldown = true;
    setTimeout(() => {
        alertCooldown = false;
        console.log('Alert cooldown ended');
    }, 300000); // 5 minute cooldown
    
    // Send notifications based on settings
    if (settings.emailNotification === 'enabled' && settings.emergencyContact) {
        sendEmailAlert(readings);
    }
    
    if (settings.smsNotification === 'enabled') {
        sendSMSAlert(readings);
    }
    
    // Show alert to user
    alert(`Emergency alert sent!\n\nAbnormal values detected at ${lastAlertTime.toLocaleTimeString()}`);
    
    return true;
}

// Simulate email alert
function sendEmailAlert(readings) {
    console.log(`Sending email to ${settings.emergencyContact} with readings:`, readings);
    // In a real app, this would make an API call to your email service
}

// Simulate SMS alert
function sendSMSAlert(readings) {
    console.log('Sending SMS alert with readings:', readings);
    // In a real app, this would make an API call to your SMS service
}

// Manual notification button
function sendNotification() {
    const heartRate = parseInt(document.getElementById("heartRate").textContent);
    const spo2 = parseInt(document.getElementById("spo2").textContent);
    const bpParts = document.getElementById("bp").textContent.split('/');
    
    const currentReadings = {
        heartRate: heartRate,
        spo2: spo2,
        bp: {
            systolic: parseInt(bpParts[0]),
            diastolic: parseInt(bpParts[1])
        }
    };
    
    if (checkAbnormal(currentReadings)) {
        if (sendAlert(currentReadings)) {
            alert('Emergency alert sent to caretaker!');
        } else {
            alert('Alert is in cooldown period. Please wait before sending again.');
        }
    } else {
        alert('All readings are normal. No need to send alert.');
    }
}

// Update settings form with current values
function updateSettingsForm() {
    document.getElementById("emailNotification").value = settings.emailNotification;
    document.getElementById("smsNotification").value = settings.smsNotification;
    document.getElementById("alertFrequency").value = settings.alertFrequency;
    document.getElementById("emergencyContact").value = settings.emergencyContact;
}

// Save settings
function saveSettings() {
    settings = {
        emailNotification: document.getElementById("emailNotification").value,
        smsNotification: document.getElementById("smsNotification").value,
        alertFrequency: parseInt(document.getElementById("alertFrequency").value),
        emergencyContact: document.getElementById("emergencyContact").value
    };
    
    localStorage.setItem('healthMonitorSettings', JSON.stringify(settings));
    
    // Restart monitoring with new interval if needed
    if (isMonitoring) {
        clearInterval(monitoringInterval);
        startMonitoring();
    }
    
    alert('Settings saved successfully!');
}

/* ===== Voice Stress Detection ===== */
let recognition;
let isListening = false;

function startListening() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Browser does not support speech recognition.");
        return;
    }
    
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    
    recognition.onstart = () => {
        isListening = true;
        document.getElementById("voiceStatus").textContent = "Listening...";
        document.getElementById("voiceStatus").className = "voice-status listening";
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length-1][0].transcript;
        document.getElementById("transcript").textContent = transcript;
        analyseStress(transcript);
    };
    
    recognition.onerror = (event) => {
        document.getElementById("voiceStatus").textContent = "Error: " + event.error;
        document.getElementById("voiceStatus").className = "voice-status error";
    };
    
    recognition.onend = () => {
        isListening = false;
        document.getElementById("voiceStatus").textContent = "Stopped listening.";
        document.getElementById("voiceStatus").className = "voice-status idle";
    };
    
    recognition.start();
}

function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
    }
}

function analyseStress(text) {
    const stressKeywords = ["angry", "frustrated", "stressed", "upset", "tired", "hate", "scared", "worried"];
    const lowerText = text.toLowerCase();
    
    if (stressKeywords.some(word => lowerText.includes(word))) {
        document.getElementById("voiceResult").innerHTML = `<div class="alert-message">High Stress Detected!</div>`;
        alertCaregiver(text);
    } else {
        document.getElementById("voiceResult").innerHTML = `<div class="success-message">Normal Stress Level</div>`;
    }
}

function alertCaregiver(speech) {
    const alertDiv = document.getElementById("voiceAlerts");
    alertDiv.innerHTML += `<div>Caregiver Alert! High stress detected: "${speech}"</div>`;
}

/* ===== Time Mode Detection ===== */
function getCurrentModeAndTime() {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const mode = (hour >= 20 || hour < 6) ? "NIGHT" : "DAY";
    return { mode, time: `${hour}:${minutes}` };
}

function updatePageMode() {
    const { mode } = getCurrentModeAndTime();
    const modeBox = document.getElementById("modeBox");
    
    if (mode === "NIGHT") {
        modeBox.textContent = "🌙 Night Mode (8PM - 6AM)";
        modeBox.className = "mode-box night";
    } else {
        modeBox.textContent = "☀ Day Mode (6AM - 8PM)";
        modeBox.className = "mode-box day";
    }
}

function showTimeDialog() {
    const { mode, time } = getCurrentModeAndTime();
    alert(`Current Mode: ${mode}\nCurrent Time: ${time}`);
}

/* ===== Medication System ===== */
let medicines = JSON.parse(localStorage.getItem('medicines')) || [];

function initMedicationSystem() {
    const medForm = document.getElementById('medForm');
    const medList = document.getElementById('medList');
    const todaySchedule = document.getElementById('todaySchedule');
    const emptyList = document.getElementById('emptyList');
    const emptySchedule = document.getElementById('emptySchedule');
    
    // Form submission handler
    medForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('medName').value.trim();
        const dose = document.getElementById('dose').value.trim();
        const notes = document.getElementById('notes').value.trim();
        
        // Get times (only include non-empty values)
        const times = [];
        for (let i = 1; i <= 4; i++) {
            const timeValue = document.getElementById(`time${i}`).value;
            if (timeValue) times.push(timeValue);
        }
        
        // Validate
        if (!name) {
            alert('Please enter a medicine name');
            return;
        }
        
        if (times.length === 0) {
            alert('Please add at least one time');
            return;
        }
        
        // Create new medicine object
        const newMedicine = {
            id: Date.now(), // Simple unique ID
            name,
            dose,
            notes,
            times
        };
        
        // Add to medicines array
        medicines.push(newMedicine);
        
        // Save to localStorage
        localStorage.setItem('medicines', JSON.stringify(medicines));
        
        // Reset form
        medForm.reset();
        
        // Update displays
        renderMedicineList();
        renderTodaySchedule();
        
        // Show success message
        alert(`${name} has been added successfully!`);
    });
    
    // Clear form button
    document.getElementById('btnClear').addEventListener('click', function() {
        medForm.reset();
    });
}

// Render medicine list
function renderMedicineList() {
    const medList = document.getElementById('medList');
    const emptyList = document.getElementById('emptyList');
    
    medList.innerHTML = '';
    
    if (medicines.length === 0) {
        emptyList.style.display = 'block';
        return;
    }
    
    emptyList.style.display = 'none';
    
    medicines.forEach(medicine => {
        const medElement = document.createElement('div');
        medElement.className = 'medicine-item';
        
        medElement.innerHTML = `
            <div>
                <div class="medicine-name">${medicine.name}</div>
                ${medicine.dose ? `<div style="color: var(--dark); font-size: 0.9em;">${medicine.dose}</div>` : ''}
                ${medicine.notes ? `<div style="color: var(--dark); font-size: 0.9em;">${medicine.notes}</div>` : ''}
                <div class="medicine-times">
                    ${medicine.times.map(time => `
                        <span class="time-badge">${time}</span>
                    `).join('')}
                </div>
            </div>
            <button class="delete-btn">Delete</button>
        `;
        
        // Add delete functionality
        const deleteBtn = medElement.querySelector('button');
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Delete ${medicine.name}?`)) {
                medicines = medicines.filter(m => m.id !== medicine.id);
                localStorage.setItem('medicines', JSON.stringify(medicines));
                renderMedicineList();
                renderTodaySchedule();
            }
        });
        
        medList.appendChild(medElement);
    });
}

// Render today's schedule
function renderTodaySchedule() {
    const todaySchedule = document.getElementById('todaySchedule');
    const emptySchedule = document.getElementById('emptySchedule');
    
    todaySchedule.innerHTML = '';
    
    if (medicines.length === 0) {
        emptySchedule.style.display = 'block';
        return;
    }
    
    emptySchedule.style.display = 'none';
    
    // Get all doses for today
    const allDoses = [];
    medicines.forEach(medicine => {
        medicine.times.forEach(time => {
            allDoses.push({
                id: `${medicine.id}-${time}`,
                name: medicine.name,
                dose: medicine.dose,
                time: time
            });
        });
    });
    
    // Sort by time
    allDoses.sort((a, b) => a.time.localeCompare(b.time));
    
    // Display each dose
    allDoses.forEach(dose => {
        const doseElement = document.createElement('div');
        doseElement.className = 'schedule-item';
        
        doseElement.innerHTML = `
            <div>
                <div class="schedule-time">${dose.time}</div>
                <div>${dose.name}</div>
                ${dose.dose ? `<div style="color: var(--dark); font-size: 0.9em;">${dose.dose}</div>` : ''}
            </div>
            <button class="mark-btn">Mark Taken</button>
        `;
        
        // Add mark as taken functionality
        const markBtn = doseElement.querySelector('button');
        markBtn.addEventListener('click', () => {
            markBtn.textContent = '✓ Taken';
            markBtn.className = 'mark-btn';
            markBtn.style.backgroundColor = '#10ac84';
        });
        
        todaySchedule.appendChild(doseElement);
    });
}

/* ===== Activity Monitoring ===== */
let steps = 0;
let heartbeat = 70;

function initActivityMonitoring() {
    setInterval(() => {
        steps += Math.floor(Math.random() * 10);
        heartbeat = 55 + Math.floor(Math.random() * 50);
        
        document.getElementById("healthData").innerText =
            `Steps: ${steps} | Heartbeat: ${heartbeat} bpm`;
        
        generateStoryFromData();
    }, 3000);
}

function generateStoryFromData() {
    let activityMsg = "";
    if (heartbeat < 60) {
        activityMsg = "Elder is resting peacefully.";
    } else if (heartbeat <= 90) {
        activityMsg = "Elder is having light to moderate activity.";
    } else {
        activityMsg = "Elder seems to be highly active or stressed.";
    }
    
    let stepMsg = "";
    if (steps < 1000) {
        stepMsg = "Movement is minimal today.";
    } else if (steps <= 5000) {
        stepMsg = "Elder has been walking moderately.";
    } else {
        stepMsg = "Elder has had a very active day.";
    }
    
    let story = `${activityMsg} ${stepMsg} Current stats — Steps: ${steps}, Heartbeat: ${heartbeat} bpm.`;
    document.getElementById("storyOutput").innerText = story;
}

/* ===== Video Call System ===== */
let localStream;
let peerConnection;
let currentUser;

function initVideoSystem() {
    // DOM elements
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const startButton = document.getElementById('startButton');
    const endButton = document.getElementById('endButton');
    const connectButton = document.getElementById('connectButton');
    const targetUserId = document.getElementById('targetUserId');
    const currentUserId = document.getElementById('currentUserId');
    const connectionState = document.getElementById('connectionState');
    
    // Generate a random user ID
    currentUser = 'user-' + Math.floor(Math.random() * 10000);
    currentUserId.textContent = currentUser;
    
    // Set up button event listeners
    startButton.addEventListener('click', startCall);
    endButton.addEventListener('click', endCall);
    connectButton.addEventListener('click', connectToUser);
    
    // Get user media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = stream;
        })
        .catch(error => {
            console.error('Error accessing media devices:', error);
        });
    
    function startCall() {
        startButton.disabled = true;
        endButton.disabled = false;
        connectionState.textContent = 'Calling...';
        
        // Create peer connection
        const configuration = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };
        
        peerConnection = new RTCPeerConnection(configuration);
        
        // Add local stream to connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        // Set up remote stream
        const remoteStream = new MediaStream();
        remoteVideo.srcObject = remoteStream;
        
        // Handle ICE candidates
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                console.log('ICE candidate:', event.candidate);
            }
        };
        
        // Handle remote stream
        peerConnection.ontrack = event => {
            event.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track);
            });
            connectionState.textContent = 'Connected';
        };
        
        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            connectionState.textContent = peerConnection.connectionState;
            
            if (peerConnection.connectionState === 'disconnected' || 
                peerConnection.connectionState === 'failed') {
                endCall();
            }
        };
        
        // Create offer
        peerConnection.createOffer()
            .then(offer => {
                return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
                console.log('Offer created:', peerConnection.localDescription);
            })
            .catch(error => {
                console.error('Error creating offer:', error);
                connectionState.textContent = 'Error';
            });
    }
    
    function endCall() {
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        
        if (remoteVideo.srcObject) {
            remoteVideo.srcObject.getTracks().forEach(track => track.stop());
            remoteVideo.srcObject = null;
        }
        
        connectionState.textContent = 'Disconnected';
        startButton.disabled = false;
        endButton.disabled = true;
    }
    
    function connectToUser() {
        const targetUser = targetUserId.value.trim();
        if (!targetUser) {
            alert('Please enter a target user ID');
            return;
        }
        
        connectionState.textContent = 'Connecting...';
        
        // Simulate connection
        setTimeout(() => {
            connectionState.textContent = 'Ready to call';
            startButton.disabled = false;
        }, 1500);
    }
}

// Login form submission
loginForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
    if (username && password) {
        loginPage.style.display = "none";
        dashboard.style.display = "block";
        showSection('mainDashboard');
        initializeMonitoring();
        initApp();
    } else {
        alert("Please enter both username and password");
    }
});

// Side menu button functionality
monitorBtn.addEventListener("click", function(e) {
    e.preventDefault();
    showSection('healthSection');
    toggleMenu();
});

doseBtn.addEventListener("click", function(e) {
    e.preventDefault();
    showSection('doseSection');
    toggleMenu();
});

videoBtn.addEventListener("click", function(e) {
    e.preventDefault();
    showSection('videoSection');
    toggleMenu();
});

historyBtn.addEventListener("click", function(e) {
    e.preventDefault();
    showSection('historySection');
    toggleMenu();
});

settingsBtn.addEventListener("click", function(e) {
    e.preventDefault();
    showSection('settingsSection');
    toggleMenu();
});

logoutBtn.addEventListener("click", function(e) {
    e.preventDefault();
    if (confirm("Are you sure you want to logout?")) {
        // Reset UI
        dashboard.style.display = "none";
        loginPage.style.display = "flex";
        
        // Stop monitoring
        clearInterval(monitoringInterval);
        isMonitoring = false;
        
        // Reset form
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        
        // Reset sections
        showSection('mainDashboard');
    }
});