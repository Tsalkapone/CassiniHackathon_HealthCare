<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wellness Companion 🤗</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="chat/style.css">
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <div class="bot-avatar"><i class="fas fa-user-md"></i></div>
            <div class="header-text">
                <h2>Wellness Companion</h2>
                <p>How can I help you today?</p>
            </div>
            <div class="status-indicator online"></div>
        </div>
        
        <div class="chat-messages" id="chat-messages">
            <!-- Messages will appear here -->
            <div class="message bot-message">
                <div class="message-time"><?= date('h:i A') ?></div>
            </div>
        </div>
        
        <div class="chat-input">
            <div class="emoji-picker-trigger" id="emoji-picker-trigger">😊</div>
            <input type="text" id="user-input" placeholder="Type your message here..." autocomplete="off" disabled>
            <button id="send-button" disabled><i class="fas fa-paper-plane"></i></button>
        </div>
    </div>


    <script src="https://cdn.jsdelivr.net/npm/emoji-mart@latest/dist/browser.js"></script>
    <script src="chat/script.js"></script>
</body>
</html>