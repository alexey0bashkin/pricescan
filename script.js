/**
 * PriceScan — Главный скрипт
 * Все функции: ручной ввод, OCR, бюджет, годность, история, сканер штрихкода
 */

// ============================================================
// 1. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================

let currentPrice = 0;
let currentWeight = 0;
let currentProductName = '';
let isOnSale = false;
let saleData = null;
let history = [];
let budgetData = { dailyBudget: 0, todaySpent: 0, lastReset: '' };
let cameraStream = null;
let isTorchOn = false;
let barcodeReader = null;

// DOM элементы
const DOM = {};

// ============================================================
// 2. ИНИЦИАЛИЗАЦИЯ
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Загружаем все DOM элементы
    DOM.priceInput = document.getElementById('priceInput');
    DOM.weightInput = document.getElementById('weightInput');
    DOM.productName = document.getElementById('productName');
    DOM.budgetInput = document.getElementById('budgetInput');
    DOM.progressBar = document.getElementById('progressBar');
    DOM.budgetStatus = document.getElementById('budgetStatus');
    DOM.pricePerGram = document.getElementById('pricePerGram');
    DOM.pricePer100g = document.getElementById('pricePer100g');
    DOM.pricePerKg = document.getElementById('pricePerKg');
    DOM.saleBlock = document.getElementById('saleBlock');
    DOM.oldPriceDisplay = document.getElementById('oldPriceDisplay');
    DOM.newPriceDisplay = document.getElementById('newPriceDisplay');
    DOM.savingsAmount = document.getElementById('savingsAmount');
    DOM.discountPercent = document.getElementById('discountPercent');
    DOM.addToHistoryBtn = document.getElementById('addToHistoryBtn');
    DOM.shareBtn = document.getElementById('shareBtn');
    DOM.historyList = document.getElementById('historyList');
    DOM.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    DOM.quantitySlider = document.getElementById('quantitySlider');
    DOM.quantityDisplay = document.getElementById('quantityDisplay');
    DOM.totalPrice = document.getElementById('totalPrice');
    DOM.expiryDate = document.getElementById('expiryDate');
    DOM.expiryDays = document.getElementById('expiryDays');
    DOM.expiryResult = document.getElementById('expiryResult');
    DOM.applyRecommendedBtn = document.getElementById('applyRecommendedBtn');
    DOM.themeToggle = document.getElementById('themeToggle');
    DOM.video = document.getElementById('video');
    DOM.canvas = document.getElementById('canvas');
    DOM.captureBtn = document.getElementById('captureBtn');
    DOM.startCameraBtn = document.getElementById('startCameraBtn');
    DOM.ocrStatus = document.getElementById('ocrStatus');
    DOM.clearBtn = document.getElementById('clearBtn');
    DOM.voiceBtn = document.getElementById('voiceBtn');
    DOM.voiceStatus = document.getElementById('voiceStatus');
    DOM.voiceResult = document.getElementById('voiceResult');
    DOM.historySummary = document.getElementById('historySummary');
    DOM.totalItems = document.getElementById('totalItems');
    DOM.totalSavings = document.getElementById('totalSavings');
    DOM.resultsSection = document.getElementById('resultsSection');
    DOM.quantitySection = document.getElementById('quantitySection');
    DOM.logoLink = document.getElementById('logoLink');
    DOM.torchBtn = document.getElementById('torchBtn');
    DOM.uploadBtn = document.getElementById('uploadBtn');
    DOM.fileInput = document.getElementById('fileInput');
    DOM.scanBarcodeBtn = document.getElementById('scanBarcodeBtn');

    // Устанавливаем сегодняшнюю дату
    const today = new Date().toISOString().split('T')[0];
    DOM.expiryDate.value = today;

    // Загружаем данные
    loadFromStorage();

    // Настройка обработчиков
    setupEventListeners();

    // Применяем тему
    applyTheme();

    // Обновляем интерфейс
    updateBudgetUI();
    updateHistoryUI();

    // Инициализируем сканер штрихкода
    initBarcodeScanner();
});

// ============================================================
// 3. ЗАГРУЗКА / СОХРАНЕНИЕ ДАННЫХ
// ============================================================

function loadFromStorage() {
    try {
        const savedHistory = localStorage.getItem('pricescan_history');
        if (savedHistory) {
            history = JSON.parse(savedHistory);
        }

        const savedBudget = localStorage.getItem('pricescan_budget');
        if (savedBudget) {
            budgetData = JSON.parse(savedBudget);
            const today = new Date().toISOString().split('T')[0];
            if (budgetData.lastReset !== today) {
                budgetData.todaySpent = 0;
                budgetData.lastReset = today;
                saveBudget();
            }
        } else {
            budgetData = {
                dailyBudget: 0,
                todaySpent: 0,
                lastReset: new Date().toISOString().split('T')[0]
            };
            saveBudget();
        }

        const savedSettings = localStorage.getItem('pricescan_settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (settings.theme) {
                document.documentElement.setAttribute('data-theme', settings.theme);
                DOM.themeToggle.textContent = settings.theme === 'dark' ? '☀️' : '🌙';
            }
            if (settings.budget) {
                DOM.budgetInput.value = settings.budget;
                budgetData.dailyBudget = parseFloat(settings.budget) || 0;
                saveBudget();
            }
        }

        DOM.budgetInput.value = budgetData.dailyBudget;
    } catch (e) {
        console.warn('Ошибка загрузки данных:', e);
    }
}

function saveHistory() {
    try {
        localStorage.setItem('pricescan_history', JSON.stringify(history));
    } catch (e) {
        console.warn('Ошибка сохранения истории:', e);
    }
}

function saveBudget() {
    try {
        localStorage.setItem('pricescan_budget', JSON.stringify(budgetData));
    } catch (e) {
        console.warn('Ошибка сохранения бюджета:', e);
    }
}

function saveSettings() {
    try {
        const settings = {
            theme: document.documentElement.getAttribute('data-theme') || 'light',
            budget: parseFloat(DOM.budgetInput.value) || 0
        };
        localStorage.setItem('pricescan_settings', JSON.stringify(settings));
    } catch (e) {
        console.warn('Ошибка сохранения настроек:', e);
    }
}

// ============================================================
// 4. ОСНОВНАЯ ЛОГИКА РАСЧЁТА
// ============================================================

function calculate() {
    const price = parseFloat(DOM.priceInput.value);
    const weight = parseFloat(DOM.weightInput.value);

    if (isNaN(price) || price <= 0 || isNaN(weight) || weight <= 0) {
        DOM.pricePerGram.textContent = '0.00 ₽';
        DOM.pricePer100g.textContent = '0.00 ₽';
        DOM.pricePerKg.textContent = '0.00 ₽';
        DOM.resultsSection.style.display = 'none';
        DOM.quantitySection.style.display = 'none';
        return;
    }

    currentPrice = price;
    currentWeight = weight;
    currentProductName = DOM.productName.value.trim() || 'Товар';

    const perGram = price / weight;
    const per100g = perGram * 100;
    const perKg = perGram * 1000;

    DOM.pricePerGram.textContent = `${perGram.toFixed(2)} ₽`;
    DOM.pricePer100g.textContent = `${per100g.toFixed(2)} ₽`;
    DOM.pricePerKg.textContent = `${perKg.toFixed(2)} ₽`;

    DOM.resultsSection.style.display = 'block';
    DOM.quantitySection.style.display = 'block';
    updateQuantity();
    checkExpiry();
}

// ============================================================
// 5. СЛАЙДЕР КОЛИЧЕСТВА
// ============================================================

function updateQuantity() {
    const quantity = parseInt(DOM.quantitySlider.value) || 1;
    DOM.quantityDisplay.textContent = quantity;

    const price = parseFloat(DOM.priceInput.value);
    const weight = parseFloat(DOM.weightInput.value);
    if (isNaN(price) || price <= 0 || isNaN(weight) || weight <= 0) {
        DOM.totalPrice.textContent = '0.00';
        return;
    }

    const perUnit = price / weight;
    const total = perUnit * weight * quantity;
    DOM.totalPrice.textContent = `${total.toFixed(2)} ₽`;
}

// ============================================================
// 6. КАЛЬКУЛЯТОР ГОДНОСТИ
// ============================================================

function checkExpiry() {
    const expiryDate = DOM.expiryDate.value;
    const expiryDays = parseInt(DOM.expiryDays.value);

    if (!expiryDate || !expiryDays || expiryDays <= 0) {
        DOM.expiryResult.textContent = '📅 Введите дату и срок годности для расчёта';
        DOM.expiryResult.className = 'expiry-result';
        DOM.applyRecommendedBtn.style.display = 'none';
        return;
    }

    const today = new Date();
    const prodDate = new Date(expiryDate);
    const expiryDateObj = new Date(prodDate);
    expiryDateObj.setDate(expiryDateObj.getDate() + expiryDays);

    const daysLeft = Math.max(0, Math.ceil((expiryDateObj - today) / (1000 * 60 * 60 * 24)));
    const isExpired = daysLeft <= 0;

    let html = '';
    let className = 'expiry-result';

    if (isExpired) {
        className = 'expiry-result danger';
        html = `<strong>⛔ Товар просрочен!</strong> Срок годности истёк ${Math.abs(daysLeft)} дней назад.<br>`;
        html += `📅 Дата производства: ${prodDate.toLocaleDateString()}<br>`;
        html += `📅 Годен до: ${expiryDateObj.toLocaleDateString()}`;
        DOM.applyRecommendedBtn.style.display = 'none';
    } else {
        html += `<strong>📅 Дата производства:</strong> ${prodDate.toLocaleDateString()}<br>`;
        html += `<strong>📅 Годен до:</strong> ${expiryDateObj.toLocaleDateString()}<br>`;
        html += `<strong>⏳ Осталось дней:</strong> ${daysLeft} дн.`;

        if (currentWeight > 0) {
            const dailyConsumption = 100;
            const maxCanEat = daysLeft * dailyConsumption;
            const willSpoil = currentWeight > maxCanEat;
            const waste = Math.max(0, currentWeight - maxCanEat);
            const wasteCost = (waste / currentWeight) * currentPrice;

            html += `<br><strong>📊 Максимум:</strong> ${maxCanEat.toFixed(0)} г (при 100г в день)`;

            if (willSpoil) {
                className = 'expiry-result danger';
                html += `<br><strong>⚠️ НЕ УСПЕТЕ!</strong> Выбросите <strong>${waste.toFixed(0)} г</strong> = <strong>${wasteCost.toFixed(2)} ₽</strong>`;

                let recommendedWeight = Math.floor(maxCanEat / 100) * 100;
                if (recommendedWeight < 100) recommendedWeight = 100;
                if (recommendedWeight > currentWeight) recommendedWeight = currentWeight;

                const recommendedPrice = (recommendedWeight / currentWeight) * currentPrice;
                html += `<br><strong>💡 Рекомендация:</strong> возьмите <strong>${recommendedWeight} г</strong>`;
                html += ` за <strong>${recommendedPrice.toFixed(2)} ₽</strong>`;
                html += ` (сэкономите <strong>${(currentPrice - recommendedPrice).toFixed(2)} ₽</strong>)`;

                DOM.applyRecommendedBtn.style.display = 'inline-block';
                DOM.applyRecommendedBtn.dataset.weight = recommendedWeight;
                DOM.applyRecommendedBtn.dataset.price = recommendedPrice;
            } else {
                className = 'expiry-result success';
                html += `<br><strong>✅ Успеете съесть!</strong> Останется запас ${(maxCanEat - currentWeight).toFixed(0)} г`;
                DOM.applyRecommendedBtn.style.display = 'none';
            }
        } else {
            html += `<br><span style="color: var(--text-secondary);">ℹ️ Добавьте вес товара для расчёта</span>`;
            DOM.applyRecommendedBtn.style.display = 'none';
        }
    }

    DOM.expiryResult.innerHTML = html;
    DOM.expiryResult.className = className;
}

// ============================================================
// 7. БЮДЖЕТНЫЙ ПЛАНИРОВЩИК
// ============================================================

function updateBudgetUI() {
    const budget = budgetData.dailyBudget || 0;
    const spent = budgetData.todaySpent || 0;
    const remaining = budget - spent;
    const percent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

    DOM.progressBar.style.width = `${Math.min(100, percent)}%`;

    let status = '💰';
    let color = '#22C55E';

    if (budget === 0) {
        status = '💰';
        color = '#64748B';
    } else if (remaining < 0) {
        status = '🚨';
        color = '#EF4444';
    } else if (percent > 90) {
        status = '⚠️';
        color = '#EF4444';
    } else if (percent > 70) {
        status = '⚡';
        color = '#EAB308';
    } else if (percent > 30) {
        status = '✅';
        color = '#22C55E';
    } else if (percent > 0) {
        status = '💪';
        color = '#22C55E';
    }

    DOM.budgetStatus.textContent = status;
    DOM.progressBar.style.background = color;
    DOM.budgetInput.value = budget;
}

function addToBudget(price) {
    if (budgetData.dailyBudget === 0) return true;

    const newSpent = budgetData.todaySpent + price;
    const remaining = budgetData.dailyBudget - newSpent;

    if (remaining < 0) {
        const confirm = window.confirm(
            `⚠️ Этот товар превысит ваш бюджет на ${Math.abs(remaining).toFixed(2)} ₽!\n\n` +
            `Бюджет: ${budgetData.dailyBudget} ₽\n` +
            `Потрачено: ${budgetData.todaySpent.toFixed(2)} ₽\n` +
            `Товар: ${price.toFixed(2)} ₽\n\n` +
            `Всё равно добавить?`
        );
        if (!confirm) return false;
    }

    budgetData.todaySpent = newSpent;
    saveBudget();
    updateBudgetUI();
    return true;
}

// ============================================================
// 8. ИСТОРИЯ
// ============================================================

function addToHistory() {
    const price = parseFloat(DOM.priceInput.value);
    const weight = parseFloat(DOM.weightInput.value);
    const name = DOM.productName.value.trim() || `Товар ${history.length + 1}`;

    if (isNaN(price) || price <= 0 || isNaN(weight) || weight <= 0) {
        alert('⚠️ Заполните цену и вес корректно!');
        return;
    }

    if (!addToBudget(price)) return;

    const perKg = (price / weight) * 1000;

    const item = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        name: name,
        price: price,
        weight: weight,
        pricePerKg: perKg,
        pricePer100g: perKg / 10,
        date: new Date().toISOString(),
        isOnSale: isOnSale,
        oldPrice: isOnSale ? saleData?.oldPrice : null,
        discount: isOnSale ? saleData?.discount : 0
    };

    history.push(item);
    saveHistory();
    updateHistoryUI();

    DOM.addToHistoryBtn.textContent = '✅ Добавлено!';
    setTimeout(() => {
        DOM.addToHistoryBtn.textContent = '➕ Добавить в сравнение';
    }, 1500);
}

function updateHistoryUI() {
    const list = DOM.historyList;

    if (history.length === 0) {
        list.innerHTML = '<div class="empty-history">🛒 Добавьте первый товар для сравнения</div>';
        DOM.historySummary.style.display = 'none';
        return;
    }

    DOM.historySummary.style.display = 'flex';

    const sorted = [...history].filter(item => item.pricePerKg > 0);
    const cheapest = sorted.length > 0 ? sorted.reduce((a, b) => a.pricePerKg < b.pricePerKg ? a : b) : null;
    const mostExpensive = sorted.length > 0 ? sorted.reduce((a, b) => a.pricePerKg > b.pricePerKg ? a : b) : null;

    let html = '';
    let totalSavings = 0;

    history.forEach((item) => {
        const isCheapest = cheapest && item.id === cheapest.id && history.length > 1;
        const isMostExpensive = mostExpensive && item.id === mostExpensive.id && history.length > 1;

        let classes = 'history-item';
        if (isCheapest) classes += ' cheapest';
        if (isMostExpensive) classes += ' most-expensive';
        if (item.isOnSale) classes += ' on-sale';

        const saleTag = item.isOnSale ? '🏷️ ' : '';

        if (item.isOnSale && item.oldPrice) {
            const savings = (item.oldPrice - item.price) / item.weight * 1000;
            totalSavings += savings;
        }

        html += `
            <div class="${classes}">
                <div class="history-info">
                    <div class="history-name">${saleTag}${item.name}</div>
                    <div class="history-details">
                        ${item.price.toFixed(2)} ₽ / ${item.weight.toFixed(0)} г
                        ${item.isOnSale && item.oldPrice ? ` (было ${item.oldPrice.toFixed(2)} ₽)` : ''}
                    </div>
                </div>
                <div class="history-price">${item.pricePerKg.toFixed(2)} ₽/кг</div>
                <button class="history-delete" data-id="${item.id}">×</button>
            </div>
        `;
    });

    list.innerHTML = html;

    const shareHistoryBtn = document.createElement('button');
    shareHistoryBtn.className = 'btn btn-secondary mt-10';
    shareHistoryBtn.textContent = '📤 Поделиться историей';
    shareHistoryBtn.style.width = '100%';
    shareHistoryBtn.onclick = shareHistory;
    list.appendChild(shareHistoryBtn);

    document.querySelectorAll('.history-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            history = history.filter(item => item.id !== id);
            saveHistory();
            updateHistoryUI();
        });
    });

    DOM.totalItems.textContent = history.length;
    DOM.totalSavings.textContent = totalSavings.toFixed(2);
}

function clearHistory() {
    if (history.length === 0) return;
    if (confirm('🗑️ Удалить всю историю?')) {
        history = [];
        saveHistory();
        updateHistoryUI();
        budgetData.todaySpent = 0;
        saveBudget();
        updateBudgetUI();
    }
}

function shareHistory() {
    if (history.length === 0) {
        alert('Нет товаров для публикации');
        return;
    }

    let text = '🛒 Мой список сравнения цен:\n\n';
    history.forEach((item, index) => {
        text += `${index + 1}. ${item.name}\n`;
        text += `   💰 ${item.price.toFixed(2)} ₽ / ${item.weight.toFixed(0)} г\n`;
        text += `   📊 ${item.pricePerKg.toFixed(2)} ₽/кг\n`;
        if (item.isOnSale) {
            text += `   🏷️ Акция! Экономия ${((item.oldPrice - item.price) / item.weight * 1000).toFixed(2)} ₽/кг\n`;
        }
        text += '\n';
    });

    const sorted = [...history].sort((a, b) => a.pricePerKg - b.pricePerKg);
    text += `🏆 Самый выгодный: ${sorted[0].name} — ${sorted[0].pricePerKg.toFixed(2)} ₽/кг\n`;
    text += `💎 Самый дорогой: ${sorted[sorted.length - 1].name} — ${sorted[sorted.length - 1].pricePerKg.toFixed(2)} ₽/кг`;

    if (navigator.share) {
        navigator.share({
            title: 'PriceScan - мои сравнения цен',
            text: text
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('✅ История скопирована в буфер обмена!\n\n' + text);
        }).catch(() => {
            alert('Скопируйте текст:\n\n' + text);
        });
    }
}

// ============================================================
// 9. ФУНКЦИЯ "ПОДЕЛИТЬСЯ"
// ============================================================

function shareResult() {
    const price = parseFloat(DOM.priceInput.value);
    const weight = parseFloat(DOM.weightInput.value);
    const name = DOM.productName.value.trim() || 'Товар';

    if (isNaN(price) || price <= 0 || isNaN(weight) || weight <= 0) {
        alert('⚠️ Сначала рассчитайте товар!');
        return;
    }

    const perKg = (price / weight) * 1000;
    const per100g = perKg / 10;

    let text = `🛒 ${name}\n`;
    text += `💰 ${price.toFixed(2)} ₽ / ${weight.toFixed(0)} г\n`;
    text += `📊 ${perKg.toFixed(2)} ₽/кг\n`;
    text += `📊 ${per100g.toFixed(2)} ₽/100г`;

    if (isOnSale && saleData) {
        text += `\n🏷️ АКЦИЯ! Было ${saleData.oldPrice.toFixed(2)} ₽ → ${saleData.newPrice.toFixed(2)} ₽`;
        text += `\n💰 Экономия ${(saleData.oldPrice - saleData.newPrice).toFixed(2)} ₽ (${saleData.discount}%)`;
    }

    if (navigator.share) {
        navigator.share({
            title: 'PriceScan - сравнение цен',
            text: text
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('✅ Данные скопированы в буфер обмена!\n\n' + text);
        }).catch(() => {
            const copyText = prompt('Скопируйте текст:', text);
            if (copyText !== null) {
                // Текст уже в поле ввода
            }
        });
    }
}

// ============================================================
// 10. КАМЕРА + OCR + ШТРИХКОД
// ============================================================

// 10.1. Инициализация сканера штрихкода
function initBarcodeScanner() {
    try {
        barcodeReader = new ZXing.BrowserMultiFormatReader();
        console.log('✅ Сканер штрихкода инициализирован');
    } catch (e) {
        console.warn('⚠️ Ошибка инициализации сканера:', e);
    }
}

// 10.2. Запуск камеры
async function startCamera() {
    try {
        DOM.ocrStatus.textContent = '📷 Запрос доступа к камере...';
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        cameraStream = stream;
        DOM.video.srcObject = stream;
        await DOM.video.play();

        DOM.ocrStatus.textContent = '📸 Наведите на ценник или штрихкод';
        DOM.startCameraBtn.textContent = '🔄 Перезапустить камеру';
        DOM.captureBtn.style.display = 'block';
        DOM.scanBarcodeBtn.style.display = 'inline-block';
        DOM.torchBtn.style.display = 'inline-block';
        DOM.uploadBtn.style.display = 'inline-block';
    } catch (err) {
        console.error('Ошибка камеры:', err);
        DOM.ocrStatus.textContent = '❌ Не удалось получить доступ к камере. Используйте загрузку фото.';
        DOM.startCameraBtn.textContent = '📷 Попробовать снова';
    }
}

// 10.3. Сделать снимок (OCR)
function captureAndScan() {
    if (!cameraStream) {
        alert('Сначала включите камеру или загрузите фото');
        return;
    }

    DOM.ocrStatus.textContent = '🔄 Распознаём ценник...';

    const canvas = DOM.canvas;
    const video = DOM.video;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Предобработка для OCR
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const threshold = 128;
        const val = avg > threshold ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
    }
    ctx.putImageData(imageData, 0, 0);

    Tesseract.recognize(
        canvas,
        'rus+eng',
        {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    DOM.ocrStatus.textContent = `🔄 Распознавание: ${Math.round(m.progress * 100)}%`;
                }
            }
        }
    ).then(({ data: { text } }) => {
        DOM.ocrStatus.textContent = '✅ Распознано!';
        parseOCRText(text);
        switchTab('manual');
    }).catch((err) => {
        console.error('OCR ошибка:', err);
        DOM.ocrStatus.textContent = '❌ Ошибка распознавания. Попробуйте снова или введите вручную.';
    });
}

// 10.4. Парсинг OCR текста
function parseOCRText(text) {
    console.log('Распознанный текст:', text);

    const lines = text.split('\n').filter(line => line.trim().length > 0);
    for (const line of lines) {
        const clean = line.trim();
        if (clean.length > 2 && !/\d/.test(clean) && clean.length < 30) {
            DOM.productName.value = clean;
            break;
        }
    }

    const priceRegex = /(\d+[\.,]?\d*)\s*(?:₽|руб|р\.|rub)/i;
    const priceMatch = text.match(priceRegex);

    const weightRegex = /(\d+[\.,]?\d*)\s*(?:г|гр|грамм|кг|килограмм)/i;
    const weightMatch = text.match(weightRegex);

    const saleRegex = /(?:акция|скидка|sale)/i;
    const isSale = saleRegex.test(text);

    const allPrices = text.match(/\d+[\.,]?\d*/g);
    let oldPrice = null;
    let newPrice = null;
    let discount = 0;

    let isSaleDetected = isSale;
    if (isSaleDetected && allPrices && allPrices.length >= 2) {
        const prices = allPrices.map(Number).sort((a, b) => b - a);
        if (prices.length >= 2) {
            oldPrice = prices[0];
            newPrice = prices[1];
            discount = ((oldPrice - newPrice) / oldPrice * 100);
            if (discount < 5) {
                isSaleDetected = false;
                oldPrice = null;
                newPrice = null;
            }
        }
    }

    if (priceMatch) {
        let price = parseFloat(priceMatch[1].replace(',', '.'));
        if (price > 0) DOM.priceInput.value = price;
    }

    if (weightMatch) {
        let weight = parseFloat(weightMatch[1].replace(',', '.'));
        if (weight > 0) {
            const isKg = /кг|килограмм/i.test(weightMatch[0]);
            if (isKg) weight = weight * 1000;
            DOM.weightInput.value = weight;
        }
    }

    if (isSaleDetected && oldPrice && newPrice) {
        isOnSale = true;
        saleData = { oldPrice, newPrice, discount: Math.round(discount) };
        showSaleBlock(oldPrice, newPrice, discount);
    } else {
        isOnSale = false;
        saleData = null;
        DOM.saleBlock.style.display = 'none';
    }

    calculate();

    if (priceMatch && weightMatch) {
        DOM.ocrStatus.textContent = '✅ Ценник распознан! Проверьте данные';
        DOM.ocrStatus.style.color = '#22C55E';
    } else {
        DOM.ocrStatus.textContent = '⚠️ Частичное распознавание. Проверьте поля вручную.';
        DOM.ocrStatus.style.color = '#EAB308';
    }
}

// 10.5. Сканирование штрихкода
async function scanBarcode() {
    if (!cameraStream) {
        alert('Сначала включите камеру');
        return;
    }

    DOM.ocrStatus.textContent = '📊 Сканируем штрихкод...';

    try {
        const result = await barcodeReader.decodeFromVideoElement(DOM.video);
        const barcode = result.getText();
        console.log('Штрихкод:', barcode);
        
        DOM.ocrStatus.textContent = `✅ Найден штрихкод: ${barcode}`;
        DOM.ocrStatus.style.color = '#22C55E';
        
        // Ищем товар по штрихкоду
        await searchProductByBarcode(barcode);
        
    } catch (err) {
        console.error('Ошибка сканирования:', err);
        DOM.ocrStatus.textContent = '❌ Не удалось распознать штрихкод. Попробуйте снова.';
        DOM.ocrStatus.style.color = '#EF4444';
    }
}

// 10.6. Поиск товара по штрихкоду (Роскачество + Open Food Facts)
async function searchProductByBarcode(barcode) {
    DOM.ocrStatus.textContent = '🔍 Ищем товар...';
    
    let product = null;
    
    // 1. Пробуем Роскачество
    try {
        const response = await fetch(`https://roscontrol.com/api/search?barcode=${barcode}`);
        if (response.ok) {
            const data = await response.json();
            if (data && data.name) {
                product = data;
                DOM.ocrStatus.textContent = `✅ Найдено через Роскачество: ${product.name}`;
            }
        }
    } catch (e) {
        console.warn('Роскачество не отвечает');
    }
    
    // 2. Пробуем Open Food Facts
    if (!product) {
        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.product) {
                    product = {
                        name: data.product.product_name_ru || data.product.product_name || 'Товар',
                        brand: data.product.brands || '',
                        weight: data.product.quantity ? parseFloat(data.product.quantity) : null
                    };
                    DOM.ocrStatus.textContent = `✅ Найдено через Open Food Facts: ${product.name}`;
                }
            }
        } catch (e) {
            console.warn('Open Food Facts не отвечает');
        }
    }
    
    // 3. Если нашли - заполняем поля
    if (product) {
        if (product.name) DOM.productName.value = product.name;
        if (product.brand && !DOM.productName.value) DOM.productName.value = product.brand;
        if (product.weight) DOM.weightInput.value = product.weight;
        
        DOM.ocrStatus.textContent = `✅ Товар найден: ${DOM.productName.value}. Введите цену.`;
        DOM.ocrStatus.style.color = '#22C55E';
        switchTab('manual');
    } else {
        DOM.ocrStatus.textContent = `❌ Товар по штрихкоду ${barcode} не найден. Введите вручную.`;
        DOM.ocrStatus.style.color = '#EAB308';
        // Переключаемся на ручной ввод
        switchTab('manual');
    }
}

// 10.7. Фонарик
function toggleTorch() {
    if (!cameraStream) {
        alert('Сначала включите камеру');
        return;
    }
    
    isTorchOn = !isTorchOn;
    const track = cameraStream.getVideoTracks()[0];
    if (track) {
        try {
            track.applyConstraints({
                advanced: [{ torch: isTorchOn }]
            });
            DOM.torchBtn.textContent = isTorchOn ? '🔦' : '🔦';
            DOM.torchBtn.style.background = isTorchOn ? 'rgba(255,255,0,0.3)' : 'rgba(255,255,255,0.2)';
        } catch (e) {
            console.warn('Фонарик не поддерживается');
            alert('Фонарик не поддерживается на этом устройстве');
            isTorchOn = false;
        }
    }
}

// 10.8. Загрузка фото
function uploadPhoto() {
    DOM.fileInput.click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Рисуем на canvas для OCR
            const canvas = DOM.canvas;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            DOM.ocrStatus.textContent = '🔄 Распознаём загруженное фото...';
            
            // OCR с загруженного фото
            Tesseract.recognize(
                canvas,
                'rus+eng',
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            DOM.ocrStatus.textContent = `🔄 Распознавание: ${Math.round(m.progress * 100)}%`;
                        }
                    }
                }
            ).then(({ data: { text } }) => {
                DOM.ocrStatus.textContent = '✅ Распознано с фото!';
                parseOCRText(text);
                switchTab('manual');
            }).catch((err) => {
                console.error('OCR ошибка:', err);
                DOM.ocrStatus.textContent = '❌ Ошибка распознавания. Введите вручную.';
            });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // Сбрасываем input
    DOM.fileInput.value = '';
}

// 10.9. Блок акции
function showSaleBlock(oldPrice, newPrice, discount) {
    DOM.saleBlock.style.display = 'block';
    DOM.oldPriceDisplay.textContent = `${oldPrice.toFixed(2)} ₽`;
    DOM.newPriceDisplay.textContent = `${newPrice.toFixed(2)} ₽`;
    DOM.savingsAmount.textContent = (oldPrice - newPrice).toFixed(2);
    DOM.discountPercent.textContent = discount.toFixed(0);
}

// ============================================================
// 11. ГОЛОСОВОЙ ВВОД
// ============================================================

let isListening = false;

function startVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        DOM.voiceStatus.textContent = '❌ Голосовой ввод не поддерживается';
        return;
    }

    if (isListening) {
        DOM.voiceStatus.textContent = '⏹️ Запись остановлена';
        DOM.voiceBtn.textContent = '🎙️ Начать запись';
        isListening = false;
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;

    DOM.voiceStatus.textContent = '🎤 Слушаю...';
    DOM.voiceBtn.textContent = '⏹️ Остановить';
    isListening = true;

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.toLowerCase();
        DOM.voiceResult.textContent = `📝 Распознано: "${transcript}"`;
        DOM.voiceStatus.textContent = '✅ Обработка...';

        const numbers = transcript.match(/\d+[\.,]?\d*/g);
        if (!numbers || numbers.length < 2) {
            DOM.voiceStatus.textContent = '⚠️ Не найдены цена и вес. Пример: "Молоко 150 рублей 500 грамм"';
            DOM.voiceBtn.textContent = '🎙️ Начать запись';
            isListening = false;
            return;
        }

        let name = transcript.replace(/\d+[\.,]?\d*/g, '')
            .replace(/руб|р|грамм|г|кг|килограмм|за|цена|вес|рублей|стоит/g, '')
            .trim();
        if (name.length > 0) {
            DOM.productName.value = name.charAt(0).toUpperCase() + name.slice(1);
        }

        let price = null;
        let weight = null;

        for (let i = 0; i < numbers.length; i++) {
            const num = parseFloat(numbers[i].replace(',', '.'));
            const beforeIndex = transcript.indexOf(numbers[i]);
            const afterIndex = beforeIndex + numbers[i].length;
            const context = transcript.substring(Math.max(0, beforeIndex - 10), Math.min(transcript.length, afterIndex + 10));

            if (context.includes('руб') || context.includes('р')) {
                price = num;
            } else if (context.includes('кг') || context.includes('килограмм')) {
                weight = num * 1000;
            } else if (context.includes('г') || context.includes('грамм')) {
                weight = num;
            }
        }

        if (price === null && numbers.length >= 2) {
            price = parseFloat(numbers[0].replace(',', '.'));
            weight = parseFloat(numbers[1].replace(',', '.'));
            if (transcript.includes('кг') || transcript.includes('килограмм')) {
                weight = weight * 1000;
            }
        }

        if (price && price > 0) DOM.priceInput.value = price;
        if (weight && weight > 0) DOM.weightInput.value = weight;

        DOM.voiceStatus.textContent = '✅ Данные вставлены! Проверьте и нажмите "Добавить"';
        DOM.voiceBtn.textContent = '🎙️ Начать запись';
        isListening = false;
        calculate();
        switchTab('manual');
    };

    recognition.onerror = function(event) {
        DOM.voiceStatus.textContent = `❌ Ошибка: ${event.error}`;
        DOM.voiceBtn.textContent = '🎙️ Начать запись';
        isListening = false;
    };

    recognition.onend = function() {
        DOM.voiceBtn.textContent = '🎙️ Начать запись';
        if (DOM.voiceStatus.textContent === '🎤 Слушаю...') {
            DOM.voiceStatus.textContent = '⏹️ Запись завершена';
        }
        isListening = false;
    };

    recognition.start();
}

// ============================================================
// 12. ТЕМА
// ============================================================

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    DOM.themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    saveSettings();
}

function applyTheme() {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    DOM.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ============================================================
// 13. ВКЛАДКИ
// ============================================================

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    const target = document.getElementById(tabName + 'Tab');
    if (target) target.classList.add('active');

    const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (btn) btn.classList.add('active');
}

// ============================================================
// 14. НАСТРОЙКА ОБРАБОТЧИКОВ
// ============================================================

function setupEventListeners() {
    // --- Логотип ---
    DOM.logoLink.addEventListener('click', function() {
        location.reload();
    });

    // --- Расчет ---
    DOM.priceInput.addEventListener('input', calculate);
    DOM.weightInput.addEventListener('input', calculate);
    DOM.productName.addEventListener('input', calculate);

    // --- Бюджет ---
    DOM.budgetInput.addEventListener('change', function() {
        const val = parseFloat(this.value) || 0;
        budgetData.dailyBudget = val;
        if (budgetData.todaySpent > val) {
            budgetData.todaySpent = val;
        }
        saveBudget();
        updateBudgetUI();
        saveSettings();
    });

    // --- Слайдер ---
    DOM.quantitySlider.addEventListener('input', updateQuantity);

    // --- Годность ---
    DOM.expiryDate.addEventListener('input', checkExpiry);
    DOM.expiryDays.addEventListener('input', checkExpiry);

    // --- Применить рекомендованный вес ---
    DOM.applyRecommendedBtn.addEventListener('click', function() {
        const weight = parseFloat(this.dataset.weight);
        const price = parseFloat(this.dataset.price);
        if (weight && price) {
            DOM.weightInput.value = weight;
            DOM.priceInput.value = price;
            calculate();
            this.style.display = 'none';
            DOM.expiryResult.className = 'expiry-result success';
            DOM.expiryResult.innerHTML = '✅ Вес оптимизирован!';
        }
    });

    // --- История ---
    DOM.addToHistoryBtn.addEventListener('click', addToHistory);
    DOM.clearHistoryBtn.addEventListener('click', clearHistory);

    // --- Поделиться ---
    DOM.shareBtn.addEventListener('click', shareResult);

    // --- Камера ---
    DOM.startCameraBtn.addEventListener('click', function() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        startCamera();
    });
    DOM.captureBtn.addEventListener('click', captureAndScan);
    DOM.scanBarcodeBtn.addEventListener('click', scanBarcode);
    DOM.torchBtn.addEventListener('click', toggleTorch);
    DOM.uploadBtn.addEventListener('click', uploadPhoto);
    DOM.fileInput.addEventListener('change', handleFileUpload);

    // --- Очистка ---
    DOM.clearBtn.addEventListener('click', function() {
        DOM.priceInput.value = '';
        DOM.weightInput.value = '';
        DOM.productName.value = '';
        DOM.saleBlock.style.display = 'none';
        isOnSale = false;
        saleData = null;
        DOM.pricePerGram.textContent = '0.00 ₽';
        DOM.pricePer100g.textContent = '0.00 ₽';
        DOM.pricePerKg.textContent = '0.00 ₽';
        DOM.totalPrice.textContent = '0.00 ₽';
        DOM.resultsSection.style.display = 'none';
        DOM.quantitySection.style.display = 'none';
        DOM.expiryResult.textContent = '📅 Введите дату и срок годности для расчёта';
        DOM.expiryResult.className = 'expiry-result';
        DOM.applyRecommendedBtn.style.display = 'none';
        currentPrice = 0;
        currentWeight = 0;
    });

    // --- Тема ---
    DOM.themeToggle.addEventListener('click', toggleTheme);

    // --- Вкладки ---
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // --- Голос ---
    DOM.voiceBtn.addEventListener('click', startVoiceRecognition);

    // --- Скрыть камеру ---
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.dataset.tab !== 'camera' && cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                cameraStream = null;
                DOM.startCameraBtn.textContent = '📷 Включить камеру';
                DOM.ocrStatus.textContent = 'Камера отключена';
                DOM.captureBtn.style.display = 'none';
                DOM.scanBarcodeBtn.style.display = 'none';
                DOM.torchBtn.style.display = 'none';
                DOM.uploadBtn.style.display = 'none';
            }
        });
    });

    // --- Горячие клавиши ---
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            DOM.addToHistoryBtn.click();
        }
    });

    if (DOM.priceInput.value && DOM.weightInput.value) {
        calculate();
    }
}
