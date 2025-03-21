const MODES = ['story', 'quiz', 'facts', 'language', 'doubt'];
let currentMode = 'story';
let currentIndex = 0;

// Content Databases
const storyDB = [
    "In 2035, AR robots became teachers. Sarcos was the most advanced AI educator!",
    "Sarcos could project holographic lessons. Students learned about space through 3D simulations!",
    "The robot's knowledge database connected to all human knowledge through quantum networks!",
    "New Story: In 2040, robots started exploring Mars with humans!",
    "New Story: Sarcos helped scientists discover a new energy source!"
];

const quizDB = [
    {
        question: "What's the capital of France?",
        options: ["London", "Paris", "Berlin"],
        answer: 1 // Index of the correct answer (Paris is at index 1)
    },
    {
        question: "Which planet is known as the Red Planet?",
        options: ["Earth", "Mars", "Jupiter"],
        answer: 1 // Mars is at index 1
    },
    {
        question: "What is the largest mammal in the world?",
        options: ["Elephant", "Blue Whale", "Giraffe"],
        answer: 1 // Blue Whale is at index 1
    }
];

const factsDB = [
    "The Eiffel Tower can grow taller in summer due to thermal expansion!",
    "Octopuses have three hearts!",
    "Bananas are berries, but strawberries aren't!",
    "The shortest war in history lasted only 38 minutes!",
    "A day on Venus is longer than a year on Venus!"
];

const languageDB = {
    french: [
        "Hello = Bonjour",
        "Goodbye = Au revoir",
        "Thank you = Merci",
        "Yes = Oui",
        "No = Non"
    ],
    german: [
        "Hello = Hallo",
        "Goodbye = Auf Wiedersehen",
        "Thank you = Danke",
        "Yes = Ja",
        "No = Nein"
    ],
    spanish: [
        "Hello = Hola",
        "Goodbye = Adiós",
        "Thank you = Gracias",
        "Yes = Sí",
        "No = No"
    ]
};

// Text-to-Speech Function
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Set language
    utterance.rate = 1; // Speed of speech
    utterance.pitch = 1; // Pitch of speech
    window.speechSynthesis.speak(utterance);
}

// Mode Handlers
function setMode(mode) {
    currentMode = mode;
    currentIndex = 0;
    document.getElementById('mode').play();
    
    // Eye animations
    const eyes = document.querySelectorAll('.eye');
    eyes.forEach(eye => {
        eye.setAttribute('animation', 'property: opacity; from:1; to:0.2; dur:1000; loop:true');
    });

    updateDisplay();
}

function updateDisplay() {
    const display = document.getElementById('display');
    
    switch(currentMode) {
        case 'story':
            const story = storyDB[currentIndex % storyDB.length];
            display.setAttribute('value', story);
            speak(story); // Speak the story
            break;
            
        case 'quiz':
            const q = quizDB[currentIndex % quizDB.length];
            const quizText = `${q.question}\n${q.options.map((o,i) => `${i+1}. ${o}`).join('\n')}`;
            display.setAttribute('value', quizText);
            speak(`${q.question}. Options are: ${q.options.join(', ')}`); // Speak the question and options
            break;
            
        case 'facts':
            const fact = factsDB[currentIndex % factsDB.length];
            display.setAttribute('value', fact);
            speak(fact); // Speak the fact
            break;
            
        case 'language':
            const lang = currentIndex % 2 === 0 ? 'french' : 'german';
            const langText = `${lang.toUpperCase()}:\n${languageDB[lang].join('\n')}`;
            display.setAttribute('value', langText);
            speak(`Here are some ${lang} phrases: ${languageDB[lang].join(', ')}`); // Speak the phrases
            break;
            
        case 'doubt':
            display.setAttribute('value', "Ask your question...");
            break;
    }
}

// Voice Control
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.lang = 'en-US';

recognition.onresult = async (e) => {
    const transcript = e.results[e.results.length-1][0].transcript.toLowerCase();
    
    if(transcript.includes('mode')) {
        const mode = transcript.replace('mode', '').trim();
        if(MODES.includes(mode)) setMode(mode);
        return;
    }
    
    switch(currentMode) {
        case 'story':
        case 'facts':
        case 'language':
            currentIndex++;
            updateDisplay();
            break;
            
        case 'quiz':
            const answer = parseInt(transcript) - 1;
            const correct = answer === quizDB[currentIndex % quizDB.length].answer;
            showResult(correct ? "Correct! 🎉" : "Wrong! ❌", correct);
            if(correct) currentIndex++;
            break;
            
        case 'doubt':
            handleQuestion(transcript);
            break;
    }
};

// Question Answering System
async function handleQuestion(question) {
    try {
        // Try DuckDuckGo
        const ddgResponse = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(question)}&format=json`);
        const ddgData = await ddgResponse.json();
        
        if(ddgData.AbstractText) {
            showAnswer(ddgData.AbstractText);
        } else {
            // Try Wikipedia
            const wikiResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${question}&format=json`);
            const wikiData = await wikiResponse.json();
            const snippet = wikiData.query.search[0]?.snippet.replace(/<[^>]+>/g, '');
            showAnswer(snippet || "No answer found");
        }
    } catch {
        showAnswer("Connection error!");
    }
}

function showAnswer(text) {
    const display = document.getElementById('display');
    display.setAttribute('value', text);
    document.getElementById(text.includes('!') ? 'alert' : 'success').play();
    speak(text); // Speak the answer
}

// Initialize
setMode('story');
recognition.start();