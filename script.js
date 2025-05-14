// Конфигурация модели
const CONFIG = {
    FIXED_BUDGET: 20000, // 20 млн рублей
    MAX_CHART_BUDGET: 40000, // 40 млн рублей для графика
    TARGET_REACH: 44.4, // Целевой охват
    CHANNELS: {
        video: {
            maxPercent: 100,
            maxReach: 25,
            curve: 'exponential',
            tooltip: 'Быстрый рост охвата на малых бюджетах, затем насыщение',
            optimal: 25
        },
        social: {
            maxPercent: 100,
            maxReach: 10,
            curve: 'linear',
            tooltip: 'Линейный рост охвата с увеличением бюджета',
            optimal: 10
        },
        banner: {
            maxPercent: 100,
            maxReach: 40,
            curve: 'exponential',
            tooltip: 'Быстрый начальный рост, затем плавное насыщение',
            optimal: 40
        },
        retail: {
            maxPercent: 100,
            maxReach: 15,
            curve: 'sqrt',
            tooltip: 'Медленный рост на малых бюджетах, ускоряется с увеличением',
            optimal: 15
        },
        influencer: {
            maxPercent: 100,
            maxReach: 10,
            curve: 'linear',
            efficiency: 0.85,
            tooltip: 'Линейная зависимость с поправкой на эффективность',
            optimal: 10
        }
    }
};

// Инициализация состояния
let state = {
    channelPercents: {
        video: 0,
        social: 0,
        banner: 0,
        retail: 0,
        influencer: 0
    },
    reachCurveChart: null
};

// Функции для расчета охвата
function calculateChannelReach(budget, channel) {
    const config = CONFIG.CHANNELS[channel];
    const maxBudget = CONFIG.FIXED_BUDGET * (config.maxPercent / 100);
    
    if (budget === 0) return 0;
    
    const normalizedBudget = Math.min(1, budget / maxBudget);
    let reach = 0;
    
    switch(config.curve) {
        case 'exponential':
            reach = config.maxReach * (1 - Math.exp(-3 * normalizedBudget));
            break;
        case 'linear':
            const efficiency = config.efficiency || 1.0;
            reach = config.maxReach * normalizedBudget * efficiency;
            break;
        case 'sqrt':
            reach = config.maxReach * Math.sqrt(normalizedBudget);
            break;
    }
    
    return Math.min(config.maxReach, Math.round(reach * 10) / 10);
}

function calculateTotalReach(budget = null) {
    const currentBudget = budget !== null ? budget : CONFIG.FIXED_BUDGET;
    const reaches = {};
    
    // Рассчитываем охваты для каждого канала на основе текущего бюджета
    Object.keys(state.channelPercents).forEach(channel => {
        const channelBudget = currentBudget * (state.channelPercents[channel] / 100);
        reaches[channel] = calculateChannelReach(channelBudget, channel);
    });
    
    // Проверяем оптимальную комбинацию (25,10,40,15,10)
    const isOptimal = Math.abs(state.channelPercents.video - 25) < 2 &&
                      Math.abs(state.channelPercents.social - 10) < 2 &&
                      Math.abs(state.channelPercents.banner - 40) < 2 &&
                      Math.abs(state.channelPercents.retail - 15) < 2 &&
                      Math.abs(state.channelPercents.influencer - 10) < 2;
    
    // Рассчитываем общий охват
    const product = Object.values(reaches).reduce((acc, reach) => {
        return acc * (1 - reach / 100);
    }, 1);
    
    let totalReach = (1 - product) * 100;
    
    // Корректируем охват для оптимальной комбинации
    if (isOptimal && budget === null) {
        totalReach = Math.min(100, totalReach * 1.05);
    }
    
    return {
        total: Math.round(totalReach * 10) / 10,
        isOptimal,
        reaches
    };
}

function generateReachCurve() {
    const data = [];
    const steps = 20;
    
    // Сохраняем текущее распределение
    const originalPercents = {...state.channelPercents};
    
    // Устанавливаем оптимальное распределение для расчета
    state.channelPercents = {
        video: 25,
        social: 10,
        banner: 40,
        retail: 15,
        influencer: 10
    };
    
    for (let i = 0; i <= steps; i++) {
        const budget = (CONFIG.MAX_CHART_BUDGET / steps) * i;
        const reach = calculateTotalReach(budget).total;
        data.push({
            x: budget,
            y: reach
        });
    }
    
    // Восстанавливаем исходное распределение
    state.channelPercents = originalPercents;
    
    return data;
}

function generateCurrentReachCurve() {
    const data = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
        const budget = (CONFIG.MAX_CHART_BUDGET / steps) * i;
        const reach = calculateTotalReach(budget).total;
        data.push({
            x: budget,
            y: reach
        });
    }
    
    return data;
}

// Обновление интерфейса
function updateUI() {
    // Обновляем значения процентов и бюджетов
    Object.keys(state.channelPercents).forEach(channel => {
        const percentElement = document.getElementById(`${channel}Percent`);
        const budgetElement = document.getElementById(`${channel}Budget`);
        
        if (percentElement) percentElement.textContent = state.channelPercents[channel];
        if (budgetElement) {
            const budget = Math.round(CONFIG.FIXED_BUDGET * state.channelPercents[channel] / 100);
            budgetElement.textContent = budget.toLocaleString();
        }
    });

    // Рассчитываем и отображаем охват
    const reachData = calculateTotalReach();
    const reachElement = document.getElementById('totalReach');
    if (reachElement) {
        reachElement.textContent = reachData.total;
        
        // Подсвечиваем достижение цели
        reachElement.classList.toggle('success', reachData.total >= CONFIG.TARGET_REACH);
        reachElement.classList.toggle('warning', 
            reachData.total >= CONFIG.TARGET_REACH * 0.8 && 
            reachData.total < CONFIG.TARGET_REACH
        );
    }
    
    // Обновляем график
    updateChart();
}

// Управление графиком
function initChart() {
    const ctx = document.getElementById('reachCurveChart')?.getContext('2d');
    if (!ctx) {
        console.error('Canvas element not found');
        return;
    }

    state.reachCurveChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Оптимальный охват',
                    data: generateReachCurve(),
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 0
                },
                {
                    label: 'Целевой охват',
                    data: [{x: 0, y: CONFIG.TARGET_REACH}, {x: CONFIG.MAX_CHART_BUDGET, y: CONFIG.TARGET_REACH}],
                    borderColor: 'rgba(75, 192, 192, 0.7)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0
                },
                {
                    label: 'Текущий охват',
                    data: generateCurrentReachCurve(),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Текущая точка',
                    data: generateCurrentReachCurve().filter(point => Math.abs(point.x - CONFIG.FIXED_BUDGET) < 100),
                    backgroundColor: 'rgba(255, 99, 132, 1)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Бюджет (тыс. руб)',
                        font: {
                            weight: 'bold'
                        }
                    },
                    min: 0,
                    max: CONFIG.MAX_CHART_BUDGET,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Охват (%)',
                        font: {
                            weight: 'bold'
                        }
                    },
                    min: 0,
                    max: 100
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Зависимость охвата от бюджета',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `Оптимальный охват: ${context.parsed.y}% при бюджете ${context.parsed.x.toLocaleString()} тыс. руб`;
                            }
                            if (context.datasetIndex === 2) {
                                return `Текущий охват: ${context.parsed.y}% при бюджете ${context.parsed.x.toLocaleString()} тыс. руб`;
                            }
                            return context.dataset.label;
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateChart() {
    if (!state.reachCurveChart) return;
    
    try {
        state.reachCurveChart.data.datasets[2].data = generateCurrentReachCurve();
        state.reachCurveChart.data.datasets[3].data = generateCurrentReachCurve().filter(point => Math.abs(point.x - CONFIG.FIXED_BUDGET) < 100);
        state.reachCurveChart.update();
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

// Обработка изменений слайдеров
function handleSliderChange(channel, value) {
    try {
        const intValue = parseInt(value);
        const otherChannels = Object.keys(state.channelPercents).filter(ch => ch !== channel);
        const sumOther = otherChannels.reduce((sum, ch) => sum + state.channelPercents[ch], 0);
        
        if (intValue + sumOther > 100) {
            const maxAllowed = 100 - sumOther;
            state.channelPercents[channel] = Math.max(0, maxAllowed);
            document.getElementById(`${channel}Slider`).value = state.channelPercents[channel];
        } else {
            state.channelPercents[channel] = intValue;
        }
        
        updateUI();
    } catch (error) {
        console.error('Error handling slider change:', error);
    }
}

// Установка оптимального значения для канала
function setOptimalValue(channel) {
    const optimalValue = CONFIG.CHANNELS[channel].optimal;
    const slider = document.getElementById(`${channel}Slider`);
    
    if (slider) {
        slider.value = optimalValue;
        handleSliderChange(channel, optimalValue);
    }
}

// Инициализация событий
function initEvents() {
    Object.keys(state.channelPercents).forEach(channel => {
        const slider = document.getElementById(`${channel}Slider`);
        if (slider) {
            slider.addEventListener('input', (e) => {
                handleSliderChange(channel, e.target.value);
            });
        }
    });

    // Обработчики для кнопок подсказок
    document.querySelectorAll('.hint-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const channel = button.dataset.channel;
            
            // Переключаем активное состояние
            button.classList.toggle('active');
            
            // Показываем/скрываем процент
            const percentSpan = button.querySelector('.hint-percent');
            if (percentSpan) {
                percentSpan.classList.toggle('d-none');
            }
            
            // Устанавливаем оптимальное значение только при первом нажатии
            if (!button.classList.contains('clicked')) {
                setOptimalValue(channel);
                button.classList.add('clicked');
            }
        });
    });
}

// Инициализация при загрузке
window.addEventListener('DOMContentLoaded', () => {
    const fixedBudgetElement = document.getElementById('fixedBudget');
    if (fixedBudgetElement) {
        fixedBudgetElement.textContent = CONFIG.FIXED_BUDGET.toLocaleString();
    }
    
    const targetReachElement = document.getElementById('targetReach');
    if (targetReachElement) {
        targetReachElement.textContent = CONFIG.TARGET_REACH;
    }
    
    initChart();
    initEvents();
    updateUI();
});