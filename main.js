const MODES = ['story', 'quiz', 'facts', 'language', 'doubt'];
let currentMode = 'story';
let currentIndex = 0;

// Content Databases
const storyDB = [
    "In 2035, AR robots became teachers. Sarcos was the most advanced AI educator!",
    "Sarcos could project holographic lessons. Students learned about space through 3D simulations!",
    "The robot's knowledge database connected to all human knowledge through quantum networks!"
];

const quizDB = [{
    question: "What's the capital of France?",
    options: ["London", "Paris", "Berlin"],
    answer: 1
}];

const factsDB = [
    "The Eiffel Tower can grow taller in summer due to thermal expansion!",
    "Octopuses have three hearts!",
    "Bananas are berries, but strawberries aren't!"
];

const languageDB = {
    french: ["Hello = Bonjour", "Goodbye = Au revoir", "Thank you = Merci"],
    german: ["Hello = Hallo", "Goodbye = Auf Wiedersehen", "Thank you = Danke"]
};

// Text-to-Speech Function
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
}

// Mode Handlers
function setMode(mode) {
    console.log("Switching to mode:", mode);
    currentMode = mode;
    currentIndex = 0;
    document.getElementById('mode').play();
    updateDisplay();
}

function updateDisplay() {
    const display = document.getElementById('display');
    
    switch(currentMode) {
        case 'story':
            const story = storyDB[currentIndex % storyDB.length];
            display.setAttribute('value', story);
            speak(story);
            break;
            
        case 'quiz':
            const q = quizDB[currentIndex % quizDB.length];
            const quizText = `${q.question}\n${q.options.map((o,i) => `${i+1}. ${o}`).join('\n')}`;
            display.setAttribute('value', quizText);
            speak(`${q.question}. Options are: ${q.options.join(', ')}`);
            break;
            
        case 'facts':
            const fact = factsDB[currentIndex % factsDB.length];
            display.setAttribute('value', fact);
            speak(fact);
            break;
            
        case 'language':
            const lang = currentIndex % 2 === 0 ? 'french' : 'german';
            const langText = `${lang.toUpperCase()}:\n${languageDB[lang].join('\n')}`;
            display.setAttribute('value', langText);
            speak(`Here are some ${lang} phrases: ${languageDB[lang].join(', ')}`);
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
    console.log("Voice input detected:", transcript);
    
    if(transcript.includes('mode')) {
        const mode = transcript.replace('mode', '').trim();
        if(MODES.includes(mode)) {
            console.log("Switching to mode:", mode);
            setMode(mode);
        }
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
        const ddgResponse = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(question)}&format=json`);
        const ddgData = await ddgResponse.json();
        
        if(ddgData.AbstractText) {
            showAnswer(ddgData.AbstractText);
        } else {
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
    speak(text);
}

// Initialize
setMode('story');
recognition.start();
