const API_URL = 'http://localhost:5000/api';
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval;

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/questions`, {
            headers: { 'x-auth-token': token }
        });
        questions = await res.json();
        document.getElementById('loading').style.display = 'none';

        if (questions.length > 0) {
            document.getElementById('test-container').style.display = 'block';
            document.getElementById('total-q-num').textContent = questions.length;
            startTimer(30 * 60); // 30 minutes
            showQuestion(0);
        } else {
            document.getElementById('no-questions').style.display = 'block';
        }
    } catch (err) {
        console.error('Error fetching questions', err);
    }

    document.getElementById('next-btn').addEventListener('click', () => {
        saveAnswer();
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        }
    });

    document.getElementById('prev-btn').addEventListener('click', () => {
        saveAnswer();
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
        }
    });

    document.getElementById('submit-btn').addEventListener('click', submitTest);
});

function showQuestion(index) {
    const q = questions[index];
    document.getElementById('current-q-num').textContent = index + 1;
    document.getElementById('question-text').textContent = q.question;
    
    const optionsContainer = document.getElementById('options-form');
    optionsContainer.innerHTML = '';

    q.options.forEach((opt, i) => {
        const label = document.createElement('label');
        label.className = 'option-label';
        
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'option';
        input.value = opt;
        if (userAnswers[q._id] === opt) {
            input.checked = true;
        }

        label.appendChild(input);
        label.appendChild(document.createTextNode(opt));
        optionsContainer.appendChild(label);
    });

    document.getElementById('prev-btn').disabled = index === 0;
    
    if (index === questions.length - 1) {
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('submit-btn').style.display = 'inline-block';
    } else {
        document.getElementById('next-btn').style.display = 'inline-block';
        document.getElementById('submit-btn').style.display = 'none';
    }
}

function saveAnswer() {
    const qId = questions[currentQuestionIndex]._id;
    const selected = document.querySelector('input[name="option"]:checked');
    if (selected) {
        userAnswers[qId] = selected.value;
    }
}

async function submitTest() {
    saveAnswer();
    clearInterval(timerInterval);
    
    const token = localStorage.getItem('token');
    const urlParams = new URLSearchParams(window.location.search);
    const examName = urlParams.get('examName') || 'Mock Test';
    
    try {
        // Submit answers for evaluation
        const res = await fetch(`${API_URL}/questions/submit`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': token 
            },
            body: JSON.stringify({ answers: userAnswers })
        });
        
        const data = await res.json();
        
        // Save the result with examName
        await fetch(`${API_URL}/result`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': token 
            },
            body: JSON.stringify({ 
                score: data.score, 
                total: data.total,
                examName: examName
            })
        });

        window.location.href = `result.html?score=${data.score}&total=${data.total}`;
    } catch (err) {
        console.error('Error submitting test', err);
        alert('Error submitting test. Please try again.');
    }
}

function startTimer(duration) {
    let timer = duration, minutes, seconds;
    const display = document.getElementById('timer');
    
    timerInterval = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = `Time Left: ${minutes}:${seconds}`;

        if (--timer < 0) {
            clearInterval(timerInterval);
            alert("Time's up! Submitting your test automatically.");
            submitTest();
        }
    }, 1000);
}