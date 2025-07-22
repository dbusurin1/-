document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const LOGOS = [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/LUK_OIL_Logo.svg/769px-LUK_OIL_Logo.svg.png',
        'https://avertoni.ru/wp-content/uploads/2020/07/rzd-red-white-logo.png',
        'https://cdn1.flamp.ru/cb26766cf0184bdd70c8edb36e417877_300_300.png',
        'https://i-p.rmcdn.net/5c922d0a2e00dd784ad09d60/4123188/image-14b05602-b4ae-48bc-8179-76a2647ca4b5.png?w=302&e=webp&nll=true',
        'https://ads.apple.com/adsdam/app-store/us/en_us/images/success-stories/lamoda/lp/icon_lms/ss_lamoda_chicklet_LP_160px_LMS_2x.png'
    ];
    
    const CATEGORIES = [
        { name: "", color: "#FF6384", cashback: "10%", icon: "🛒" },
        { name: "", color: "#36A2EB", cashback: "15%", icon: "👕" },
        { name: "", color: "#FFCE56", cashback: "5%", icon: "📱" },
        { name: "", color: "#4BC0C0", cashback: "20%", icon: "🍽️" },
        { name: "", color: "#9966FF", cashback: "7%", icon: "✈️" },
        { name: "", color: "#FF9F40", cashback: "12%", icon: "💄" },
    ];

    const PHRASES = [
        "Ура!",
        "Круто!",
        "Вот это покупка!",
        "Отлично!",
        "Супер!",
        "Еще одна покупка!",
        "Выгодно!",
        "Молодец!",
        "Продолжай в том же духе!",
        "СБП - это выгодно!"
    ];

    const INTRO_MESSAGES = [
        { text: "Привет! Меня зовут КэшБэсик. Я помогаю отслеживать твою выгоду вместе с СБП!", position: "top" },
        { text: "Выполняй покупки через СБП, а я буду отмечать их в своем календаре!", position: "top" },
        { text: "Сохраняй непрерывную серию и получай дополнительный бонусы от СПБ!", position: "bottom" },
        { text: "Вперед к выгоде!", position: "bottom" }
    ];

    // DOM elements
    const dotsContainer = document.getElementById('dots-container');
    const payButton = document.getElementById('pay-button');
    const mascot = document.getElementById('mascot');
    const flame = document.getElementById('flame');
    const counter = document.getElementById('counter');
    const profitCounter = document.getElementById('profit-counter');
    const congratsModal = document.getElementById('congrats-modal');
    const resultModal = document.getElementById('result-modal');
    const spinButton = document.getElementById('spin-button');
    const spinAgainButton = document.getElementById('spin-again-button');
    const closeButton = document.getElementById('close-button');
    const wheel = document.getElementById('wheel');
    const resultTitle = document.getElementById('result-title');
    const resultText = document.getElementById('result-text');
    const speechBubble = document.getElementById('speech-bubble');
    const currentCategory = document.getElementById('current-category');
    const connectButton = document.querySelector('.connect-button');

    // State
    let currentPurchase = 0;
    let totalSeries = 0;
    let totalProfit = 0;
    let isSpinning = false;
    let currentPrize = CATEGORIES[0];
    let hasCompletedSeries = false;
    let currentIntroMessage = 0;

    // Initialize dots
    function initializeDots() {
        dotsContainer.innerHTML = '';
        
        // First row (4 dots)
        for (let i = 0; i < 4; i++) {
            createDot(i + 1);
        }
        
        // Second row (3 dots)
        const secondRow = document.createElement('div');
        secondRow.style.width = '100%';
        secondRow.style.display = 'flex';
        secondRow.style.justifyContent = 'center';
        secondRow.style.gap = '15px';
        secondRow.style.marginTop = '15px';
        
        for (let i = 4; i < 7; i++) {
            const dot = createDot(i + 1);
            secondRow.appendChild(dot);
        }
        
        dotsContainer.appendChild(secondRow);
        currentPurchase = 0;
    }

    function createDot(number) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.dataset.filled = 'false';
        dot.dataset.number = number;
        
        const numberSpan = document.createElement('span');
        numberSpan.className = 'dot-number';
        numberSpan.textContent = number;
        
        dot.appendChild(numberSpan);
        dotsContainer.appendChild(dot);
        return dot;
    }

    // Initialize wheel
    function initializeWheel() {
        wheel.innerHTML = '';
        const sectionAngle = 360 / CATEGORIES.length;
        
        CATEGORIES.forEach((category, index) => {
            const section = document.createElement('div');
            section.className = 'wheel-section';
            section.style.backgroundColor = category.color;
            section.style.transform = `rotate(${index * sectionAngle}deg)`;
            
            const categoryName = document.createElement('span');
            categoryName.textContent = category.name;
            
            section.appendChild(categoryName);
            wheel.appendChild(section);
        });
    }

    // Update current category display
    function updateCurrentCategory(category) {
        currentPrize = category;
        currentCategory.querySelector('.category-icon').textContent = category.icon;
        currentCategory.querySelector('.category-name').textContent = category.name;
        currentCategory.querySelector('.category-cashback').textContent = `${category.cashback} кэшбэк`;
    }

    // Show speech bubble
    function showSpeechBubble(text, position) {
        speechBubble.textContent = text;
        speechBubble.className = 'speech-bubble';
        speechBubble.style.display = 'block';
        
        const mascotRect = mascot.getBoundingClientRect();
        
        if (position === 'top') {
            speechBubble.style.left = `${mascotRect.left + mascotRect.width/2 - speechBubble.offsetWidth/2}px`;
            speechBubble.style.top = `${mascotRect.top - speechBubble.offsetHeight - 10}px`;
        } else {
            speechBubble.style.left = `${mascotRect.left + mascotRect.width/2 - speechBubble.offsetWidth/2}px`;
            speechBubble.style.top = `${mascotRect.bottom + 10}px`;
        }
        
        // Ensure bubble stays within viewport
        const bubbleRect = speechBubble.getBoundingClientRect();
        if (bubbleRect.left < 10) {
            speechBubble.style.left = '10px';
        }
        if (bubbleRect.right > window.innerWidth - 10) {
            speechBubble.style.left = `${window.innerWidth - speechBubble.offsetWidth - 10}px`;
        }
        if (bubbleRect.top < 10) {
            speechBubble.style.top = '10px';
        }
        if (bubbleRect.bottom > window.innerHeight - 10) {
            speechBubble.style.top = `${window.innerHeight - speechBubble.offsetHeight - 10}px`;
        }
    }

    // Show random phrase
    function showRandomPhrase() {
        const randomPhrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
        const position = Math.random() > 0.5 ? 'top' : 'bottom';
        
        showSpeechBubble(randomPhrase, position);
        
        setTimeout(() => {
            speechBubble.style.display = 'none';
        }, 2000);
    }

    // Show intro messages
    function showNextIntroMessage() {
        if (currentIntroMessage >= INTRO_MESSAGES.length) {
            speechBubble.style.display = 'none';
            return;
        }
        
        const message = INTRO_MESSAGES[currentIntroMessage];
        showSpeechBubble(message.text, message.position);
        currentIntroMessage++;
        
        // Wait for click to show next message
        document.addEventListener('click', function onClick() {
            document.removeEventListener('click', onClick);
            showNextIntroMessage();
        }, { once: true });
    }

    // Fill next dot
    function fillNextDot() {
        if (currentPurchase >= 7) {
            initializeDots();
            celebrateCompleteSeries();
            return;
        }
        
        const dot = document.querySelector(`.dot[data-number="${currentPurchase + 1}"]`);
        if (!dot || dot.dataset.filled === 'true') return;
        
        const randomLogo = LOGOS[Math.floor(Math.random() * LOGOS.length)];
        const randomRotation = Math.floor(Math.random() * 360) - 180;
        
        const logoImg = document.createElement('img');
        logoImg.className = 'dot-logo';
        logoImg.src = randomLogo;
        logoImg.style.setProperty('--random-rotate', `${randomRotation}deg`);
        dot.innerHTML = '';
        dot.appendChild(logoImg);
        
        // Add number back (behind logo)
        const numberSpan = document.createElement('span');
        numberSpan.className = 'dot-number';
        numberSpan.textContent = currentPurchase + 1;
        numberSpan.style.opacity = '0.3';
        dot.appendChild(numberSpan);
        
        dot.dataset.filled = 'true';
        
        // Trigger stick animation
        setTimeout(() => {
            logoImg.classList.add('stick');
        }, 10);
        
        currentPurchase++;
        totalSeries++;
        totalProfit += 5;
        counter.textContent = `Серия: ${totalSeries}`;
        profitCounter.textContent = `Выгода: ${totalProfit}₽`;
        
        // Activate flame when series completes
        if (totalSeries % 7 === 0) {
            flame.classList.add('active');
        }
        
        // Random animation
        if (Math.random() > 0.5) {
            celebratePurchase();
        } else {
            jumpAnimation();
        }
        
        showRandomPhrase();
        
        if (currentPurchase === 7) {
            hasCompletedSeries = true;
            setTimeout(() => {
                congratsModal.style.display = 'flex';
            }, 500);
        }
    }

    // Celebrate purchase
    function celebratePurchase() {
        // Spin animation
        mascot.style.animation = 'none';
        void mascot.offsetWidth;
        mascot.style.animation = 'flipX 0.5s ease-in-out, bounce 2s infinite';
    }

    // Jump animation
    function jumpAnimation() {
        mascot.style.animation = 'none';
        void mascot.offsetWidth;
        mascot.style.animation = 'happyJump 0.5s ease-in-out, bounce 2s infinite';
    }

    // Celebrate complete series
    function celebrateCompleteSeries() {
        if (!hasCompletedSeries) {
            flame.classList.add('active');
            hasCompletedSeries = true;
        }
        
        mascot.style.animation = 'none';
        void mascot.offsetWidth;
        mascot.style.animation = 'happyJump 0.5s ease-in-out 3, bounce 2s infinite';
    }

    // Spin the wheel
    function spinWheel() {
        if (isSpinning) return;
        
        isSpinning = true;
        const spins = 3 + Math.random();
        const randomAngle = Math.floor(Math.random() * 360);
        const totalRotation = spins * 360 + randomAngle;
        
        wheel.style.transform = `rotate(${-totalRotation}deg)`;
        
        setTimeout(() => {
            isSpinning = false;
            
            // Calculate prize
            const normalizedAngle = (totalRotation % 360);
            const sectionAngle = 360 / CATEGORIES.length;
            const winningIndex = Math.floor(normalizedAngle / sectionAngle);
            const prize = CATEGORIES[winningIndex];
            updateCurrentCategory(prize);
            
            // Show result
            congratsModal.style.display = 'none';
            resultTitle.textContent = 'Ваш выигрыш!';
            resultText.textContent = `Вы выиграли повышенный кэшбэк ${prize.cashback} в категории "${prize.name}"!`;
            resultModal.style.display = 'flex';
        }, 4000);
    }

    // Event listeners
    payButton.addEventListener('click', fillNextDot);
    
    spinButton.addEventListener('click', spinWheel);
    
    spinAgainButton.addEventListener('click', function() {
        resultModal.style.display = 'none';
        setTimeout(() => {
            congratsModal.style.display = 'flex';
        }, 300);
    });
    
    closeButton.addEventListener('click', function() {
        resultModal.style.display = 'none';
    });

    connectButton.addEventListener('click', function() {
        alert('Функция подключения "Привет!" будет реализована позже');
    });

    // Initialize
    initializeDots();
    initializeWheel();
    updateCurrentCategory(currentPrize);
    
    // Show intro messages after a short delay
    setTimeout(() => {
        showNextIntroMessage();
    }, 1000);
});