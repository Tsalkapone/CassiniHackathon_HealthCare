// script.js - Wellness Companion Chat
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const emojiTrigger = document.getElementById('emoji-picker-trigger');
    const emojiContainer = document.getElementById('emoji-picker-container');

    // Conversation State
    let currentState = 'initial'; // 'initial', 'followup', or 'freechat'
    let userFeeling = '';
    let userHelpPreference = '';
    let emojiPicker = null;

    // Initialize chat with welcome message
    //showWelcomeMessage();

    // Event Listeners
    sendButton.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleSendMessage();
    });
    emojiTrigger.addEventListener('click', toggleEmojiPicker);

    // Initialize Emoji Picker
   // initEmojiPicker();

    // ==================== CORE FUNCTIONS ====================

    function showWelcomeMessage() {
        addMessage({
            text: "Hello there! 👋 I'm here to support your mental wellbeing. How are you feeling today?",
            sender: 'bot',
            options: [
                "I have been feeling stressed or anxious lately",
                "I am feeling emotionally drained today",
                "I need help relaxing and finding calm",
                "I have been feeling down or depressed",
                "I am feeling lonely or isolated"
            ]
        });
        
        // Lock input until initial steps are completed
        toggleInputState(false);
    }
    window.showWelcomeMessage = showWelcomeMessage;

    function handleSendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        if (currentState !== 'freechat') {
            showSystemMessage("Please complete the conversation steps first");
            return;
        }
        
        sendMessageToAPI(message);
        userInput.value = '';
    }

    function selectOption(selectedText) {
        if (currentState === 'startchat' || currentState === "freechat"){
            return false;
        }
        addMessage({ text: selectedText, sender: 'user' });

        if (currentState === 'initial') {
            userFeeling = selectedText;
            currentState = 'followup';
            
            showTypingIndicator(() => {
                addMessage({
                    text: `I understand. The way you feel can be challenging. How would you like me to help?`,
                    sender: 'bot',
                    options: getFollowupOptions(selectedText)
                });
            });
            
        } else if (currentState === 'followup') {
            userHelpPreference = selectedText;
            currentState = 'startchat';
            
            const combinedPrompt = formatPromptForAI(userFeeling, userHelpPreference);
            
            showTypingIndicator(() => {
                sendMessageToAPI(combinedPrompt);
                toggleInputState(true);
            });
        }
    }

    // ==================== EMOJI PICKER ====================

    function initEmojiPicker() {
        // Load emoji-mart resources dynamically
        Promise.all([
            loadScript('https://cdn.jsdelivr.net/npm/emoji-mart@5.6.0/dist/browser.min.js'),
           // loadStyle('https://cdn.jsdelivr.net/npm/@emoji-mart/css')
        ]).then(() => {
            // Initialize picker but don't show it yet
            emojiPicker = new EmojiMart.Picker({
                data: async () => {
                    const response = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data@1.2/+esm');
                    return response.json();
                },
                onEmojiSelect: (emoji) => {
                    if (currentState === 'freechat') {
                        userInput.value += emoji.native;
                        userInput.focus();
                    }
                    emojiContainer.style.display = 'none';
                },
                previewPosition: 'none',
                dynamicWidth: true
            });
            
            emojiContainer.appendChild(emojiPicker);
        }).catch(error => {
            console.error("Error loading emoji picker:", error);
            emojiTrigger.style.display = 'none';
        });
    }

    function toggleEmojiPicker(e) {
        e.stopPropagation();
        if (!emojiPicker || currentState !== 'freechat') return;
        
        if (emojiContainer.style.display === 'block') {
            emojiContainer.style.display = 'none';
        } else {
            emojiContainer.style.display = 'block';
            emojiContainer.style.bottom = '70px';
            emojiContainer.style.right = '20px';
        }
    }

    // ==================== MESSAGE HANDLING ====================

    function addMessage({ text, sender, options = [] }) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const timeString = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        if (options.length > 0) {
            const optionsHTML = options.map(option => 
                `<div class="option-row" onclick="window.selectOption('${escapeHtml(option)}')">
                    <div class="option-bubble">${option}</div>
                </div>`
            ).join('');
            
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${text}
                    <div class="options-wrapper">${optionsHTML}</div>
                </div>
                <div class="message-time">${timeString}</div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">${text}</div>
                <div class="message-time">${timeString}</div>
            `;
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator(callback) {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot-message typing-indicator-container';
        typingIndicator.innerHTML = `
            <div class="message-content typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        setTimeout(() => {
            typingIndicator.remove();
            if (callback) callback();
        }, 1000 + Math.random() * 1000);
    }

    function showSystemMessage(text) {
        const systemMsg = document.createElement('div');
        systemMsg.className = 'system-message';
        systemMsg.textContent = text;
        chatMessages.appendChild(systemMsg);
        setTimeout(() => systemMsg.remove(), 3000);
    }

    // ==================== API COMMUNICATION ====================

    function sendMessageToAPI(message) {
        if(currentState !== 'startchat'){
        addMessage({ text: message, sender: 'user' });
        }
        showTypingIndicator();
        
        // Include context for follow-up messages
        const prompt = currentState === 'startchat' 
            ? formatFollowupPrompt(message)
            : message;
            //formatPromptForAI(userFeeling, userHelpPreference);
        if(currentState=="startchat"){
            currentState = "freechat";
        }
        fetch('chat/api-controller.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `message=${encodeURIComponent(prompt)}&state=${currentState}`
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.response) {
                addMessage({ text: data.response, sender: 'bot' });
            } else {
                throw new Error('Empty response from server');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            addMessage({ 
                text: "I'm having trouble responding. Could you try again?", 
                sender: 'bot' 
            });
        });
    }

    // ==================== HELPER FUNCTIONS ====================

    function formatPromptForAI(feeling, helpPreference) {
        return `User is feeling: ${feeling}. They would like help with: ${helpPreference}. 
                Please provide compassionate, professional guidance.`;
    }

    function formatFollowupPrompt(message) {
        return `Context: User feeling is: ${userFeeling}, wants help with: ${userHelpPreference}. 
                Current message: ${message}`;
    }

    function getFollowupOptions(selectedText) {
        const optionsMap = {
            'stressed': [
                "Talk about what is causing this",
                "Learn breathing techniques",
                "Try a guided meditation",
                "Get stress management tips"
            ],
            'anxious': [
                "Talk about what is causing this",
                "Learn breathing techniques",
                "Try a guided meditation",
                "Get stress management tips"
            ],
            'drained': [
                "Identify what is draining me",
                "Get self-care suggestions",
                "Learn energy management",
                "Find motivation boosters"
            ],
            'relax': [
                "Try a relaxation exercise",
                "Listen to calming sounds",
                "Learn mindfulness techniques",
                "Get sleep improvement tips"
            ],
            'calm': [
                "Try a relaxation exercise",
                "Listen to calming sounds",
                "Learn mindfulness techniques",
                "Get sleep improvement tips"
            ],
            'down': [
                "Share what is troubling me",
                "Get mood-boosting activities",
                "Find professional resources",
                "Learn coping strategies"
            ],
            'depressed': [
                "Share what is troubling me",
                "Get mood-boosting activities",
                "Find professional resources",
                "Learn coping strategies"
            ],
            'lonely': [
                "Talk about my feelings",
                "Find ways to connect",
                "Discover community resources",
                "Get social anxiety tips"
            ],
            'isolated': [
                "Talk about my feelings",
                "Find ways to connect",
                "Discover community resources",
                "Get social anxiety tips"
            ]
        };
        const key = selectedText.toLowerCase().match(/(stressed|anxious|drained|relax|calm|down|depressed|lonely|isolated)/)?.[0];
        return key ? optionsMap[key] : optionsMap['stressed'];
    }

    function toggleInputState(enabled) {
        userInput.disabled = !enabled;
        sendButton.disabled = !enabled;
        emojiTrigger.style.opacity = enabled ? '1' : '0.5';
        emojiTrigger.style.pointerEvents = enabled ? 'auto' : 'none';
        userInput.placeholder = enabled 
            ? "Type your message here..." 
            : "Please complete the conversation steps first";
    }

    function escapeHtml(text) {
        return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function loadStyle(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    // Expose selectOption to global scope
    window.selectOption = selectOption;
});