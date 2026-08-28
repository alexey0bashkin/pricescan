<div align="center">
  <h1>🛒 PriceScan</h1>
  <p><strong>Умный калькулятор цены за грамм с OCR и бюджетом</strong></p>
  
  [![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/alexey0bashkin/pricescan)
  [![PWA](https://img.shields.io/badge/PWA-Compatible-purple.svg)](https://developer.mozilla.org/ru/docs/Web/Progressive_web_apps)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  [![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com/alexey0bashkin)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/alexey0bashkin/pricescan/pulls)
  
  <a href="https://alexey0bashkin.github.io/pricescan">
    <img src="https://img.shields.io/badge/🚀_Демо-Открыть-4A6CF7?style=for-the-badge" alt="Демо">
  </a>
</div>

---

## 📋 Описание

**PriceScan** — это прогрессивное веб-приложение (PWA), которое помогает экономить деньги в магазине. Сравнивайте цены на товары, сканируйте ценники камерой, контролируйте бюджет и получайте рекомендации по сроку годности.

### 🎯 Ключевые возможности

| Функция | Описание |
|---------|----------|
| 📱 **PWA** | Работает как нативное приложение на любом устройстве |
| 📷 **Сканер ценников** | Распознавание текста с фото через Tesseract.js OCR |
| 🎙️ **Голосовой ввод** | Добавляйте товары голосом (Web Speech API) |
| 💰 **Бюджет** | Ежедневный контроль расходов с визуальным прогресс-баром |
| 📊 **Сравнение** | История товаров с сортировкой по выгодности |
| 🏷️ **Акции** | Автоматическое определение скидок на ценнике |
| 📅 **Срок годности** | Расчет и рекомендации по оптимальному весу |
| 🌙 **Темная тема** | Комфортное использование в любое время |
| 📤 **Поделиться** | Экспорт результатов в соцсети или буфер обмена |

---

## 🖥️ Скриншоты

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="docs/screenshots/main.png" width="200" alt="Главный экран"/>
        <p><em>Главный экран</em></p>
      </td>
      <td align="center">
        <img src="docs/screenshots/camera.png" width="200" alt="Камера"/>
        <p><em>Сканер ценника</em></p>
      </td>
      <td align="center">
        <img src="docs/screenshots/voice.png" width="200" alt="Голос"/>
        <p><em>Голосовой ввод</em></p>
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="docs/screenshots/history.png" width="200" alt="История"/>
        <p><em>История сравнений</em></p>
      </td>
      <td align="center">
        <img src="docs/screenshots/dark_theme.png" width="200" alt="Темная тема"/>
        <p><em>Темная тема</em></p>
      </td>
      <td align="center">
        <img src="docs/screenshots/sale.png" width="200" alt="Акция"/>
        <p><em>Автоопределение акций</em></p>
      </td>
    </tr>
  </table>
</div>

---

## 🚀 Демо

**[Открыть демо-версию](https://alexey0bashkin.github.io/pricescan)**

---

## 🛠️ Технологии

<div align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"/>
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA"/>
</div>

### Библиотеки и API

- **[Tesseract.js](https://github.com/naptha/tesseract.js)** — OCR распознавание текста
- **[ZXing](https://github.com/zxing-js/library)** — Сканирование штрихкодов
- **Web Speech API** — Голосовой ввод
- **MediaDevices API** — Работа с камерой
- **LocalStorage** — Хранение данных
- **Service Worker** — Офлайн-режим

---

## 📦 Установка

### Быстрая установка

```bash
# Клонировать репозиторий
git clone https://github.com/alexey0bashkin/pricescan.git

# Перейти в папку
cd pricescan

# Открыть в браузере
open index.html
