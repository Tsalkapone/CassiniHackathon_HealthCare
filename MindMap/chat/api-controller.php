<?php
header('Content-Type: application/json');

// Validate request
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['message'])) {
    echo json_encode(['success' => false, 'response' => 'Invalid request']);
    exit;
}

// Configuration
$apiKey = 'Enter a valid API HERE'; // Replace with your actual API key
$model = "gemini-2.0-flash";
$systemPromptBasic = "You are a licensed psychologist AI specialized in Cognitive Behavioral Therapy (CBT), ACT, and other evidence-based methods. 
Always greet the user warmly, identify their emotional state or mental issue quickly, and propose short, practical techniques or exercises tailored to their situation. 
Be deeply empathetic, supportive, and solution-oriented. Limit your responses to no more than 2 sentences. Focus on helping the patient make progress with each message.";

// Initialize or continue session
session_start();
if (!isset($_SESSION['conversation'])) {
    $_SESSION['conversation'] = [
        ['role' => 'system', 'content' => $systemPromptBasic],
        ['role' => 'model', 'content' => "Hello. What would you like to talk about today?"]
    ];
}

// Add user message to conversation
$userMessage = trim($_POST['message']);
$_SESSION['conversation'][] = ['role' => 'user', 'content' => $userMessage];

// Prepare messages for API
$messages = [];
foreach ($_SESSION['conversation'] as $msg) {
    $messages[] = [
        'role' => $msg['role'] === 'system' ? 'user' : $msg['role'],
        'parts' => [['text' => $msg['content']]]
    ];
}

// Call Gemini API
$response = callGeminiAPI($messages, $apiKey, $model);

// Process response
if ($response && isset($response['candidates'][0]['content']['parts'][0]['text'])) {
    $aiResponse = $response['candidates'][0]['content']['parts'][0]['text'];
    $_SESSION['conversation'][] = ['role' => 'model', 'content' => $aiResponse];
    echo json_encode(['success' => true, 'response' => $aiResponse]);
} else {
    echo json_encode([
        'success' => false,
        'response' => "I'm having difficulty processing that. Could you rephrase or tell me more?"
    ]);
}

function callGeminiAPI($messages, $apiKey, $model) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
    
    $data = ['contents' => $messages];
    
    $options = [
        'http' => [
            'header'  => "Content-type: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($data),
            'timeout' => 30 // 30 seconds timeout
        ],
    ];
    
    try {
        $context = stream_context_create($options);
        $response = file_get_contents($url, false, $context);
        return json_decode($response, true);
    } catch (Exception $e) {
        error_log("Gemini API Error: " . $e->getMessage());
        return false;
    }
}
?>