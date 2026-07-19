feather.replace();

const INTERNAL_CHANNEL_ID = "3430900";
const INTERNAL_READ_API_KEY = "U9PYHWD8FPNHMW2Y";
const EXTERNAL_CHANNEL_ID = "3430899";
const EXTERNAL_READ_API_KEY = "PK3IW32U0L3OVMEL";

const internalUrlLast = `https://api.thingspeak.com/channels/${INTERNAL_CHANNEL_ID}/feeds.json?api_key=${INTERNAL_READ_API_KEY}&results=1`;
const externalUrlHistory = `https://api.thingspeak.com/channels/${EXTERNAL_CHANNEL_ID}/feeds.json?api_key=${EXTERNAL_READ_API_KEY}&minutes=1440`;

let minBatteryLimit = 3.3;
let currentBatteryVoltage = 4.2;

if (localStorage.getItem('minBatteryLimit')) {
    minBatteryLimit = parseFloat(localStorage.getItem('minBatteryLimit'));
    document.getElementById('min-battery').value = minBatteryLimit;
    document.getElementById('min-battery-val').innerText = minBatteryLimit.toFixed(1) + " V";
}

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('live-time').innerText = `${hours}:${minutes}:${seconds}`;
    
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById('live-date').innerText = now.toLocaleDateString('pl-PL', options);
}
setInterval(updateClock, 1000);
updateClock();

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    if (tabId === 'home') {
        document.getElementById('tab-home').classList.add('active');
        document.querySelector('.nav-item:nth-child(1)').classList.add('active');
        document.getElementById('header-title').innerText = "W domu";
    } else if (tabId === 'outdoor') {
        document.getElementById('tab-outdoor').classList.add('active');
        document.querySelector('.nav-item:nth-child(2)').classList.add('active');
        document.getElementById('header-title').innerText = "Na zewnątrz";
    } else if (tabId === 'settings') {
        document.getElementById('tab-settings').classList.add('active');
        document.querySelector('.nav-item:nth-child(3)').classList.add('active');
        document.getElementById('header-title').innerText = "Ustawienia";
    }
}

const slider = document.getElementById('min-battery');
const sliderValueText = document.getElementById('min-battery-val');

slider.addEventListener('input', function() {
    minBatteryLimit = parseFloat(this.value);
    sliderValueText.innerText = minBatteryLimit.toFixed(1) + " V";
    localStorage.setItem('minBatteryLimit', minBatteryLimit);
    checkBatteryStatus();
});

function checkBatteryStatus() {
    const batteryCard = document.getElementById('battery-card');
    if (currentBatteryVoltage < minBatteryLimit) {
        batteryCard.classList.add('battery-low');
    } else {
        batteryCard.classList.remove('battery-low');
    }
}

function translateADCToCompass(adc) {
    adc = parseInt(adc);
    if (isNaN(adc)) return "--";
    if (adc > 900) return "N (Północny)";
    if (adc > 700) return "NE (Pn-Wsch)";
    if (adc > 500) return "E (Wschodni)";
    if (adc > 300) return "SE (Pd-Wsch)";
    if (adc > 150) return "S (Południowy)";
    if (adc > 80)  return "SW (Pd-Zach)";
    if (adc > 40)  return "W (Zachodni)";
    return "NW (Pn-Zach)";
}

async function fetchWeatherData() {
    try {
        // 1. DANE Z DOMU
        const resInternal = await fetch(internalUrlLast);
        const dataInternal = await resInternal.json();
        
        if (dataInternal.feeds && dataInternal.feeds.length > 0) {
            const latestInternal = dataInternal.feeds[0];
            if (latestInternal.field1 !== null) document.getElementById('home-temp').innerText = parseFloat(latestInternal.field1).toFixed(1) + " °C";
            if (latestInternal.field2 !== null) document.getElementById('home-hum').innerText = parseFloat(latestInternal.field2).toFixed(1) + " %";
            if (latestInternal.field3 !== null) document.getElementById('out-temp').innerText = parseFloat(latestInternal.field3).toFixed(1) + " °C";
            if (latestInternal.field4 !== null) document.getElementById('out-hum').innerText = parseFloat(latestInternal.field4).toFixed(1) + " %";
            if (latestInternal.field5 !== null) document.getElementById('out-press').innerText = parseFloat(latestInternal.field5).toFixed(1) + " hPa";
        }

        // 2. HISTORIA I BIEŻĄCE Z ZEWNĄTRZ
        const resExternal = await fetch(externalUrlHistory);
        const dataExternal = await resExternal.json();
        
        if (dataExternal.feeds && dataExternal.feeds.length > 0) {
            const feeds = dataExternal.feeds;
            const latestExternal = feeds[feeds.length - 1];
            
            // Bieżące chwilowe wartości
            if (latestExternal.field1 !== null) document.getElementById('out-wind').innerText = parseFloat(latestExternal.field1).toFixed(1) + " km/h";
            if (latestExternal.field2 !== null) document.getElementById('out-dir').innerText = translateADCToCompass(latestExternal.field2);
            if (latestExternal.field3 !== null) document.getElementById('out-rain-1h').innerText = parseFloat(latestExternal.field3).toFixed(1) + " mm";
            if (latestExternal.field4 !== null) {
                currentBatteryVoltage = parseFloat(latestExternal.field4);
                document.getElementById('out-bat').innerText = currentBatteryVoltage.toFixed(2) + " V";
                checkBatteryStatus();
            }

            // Logika odporna na częstotliwość próbkowania (1 min vs 1 godzina)
            let windSum = 0;
            let windCount = 0;
            let hourlyRainSamples = {};

            feeds.forEach(feed => {
                // Wiatr 24h: Prawidłowe sumowanie próbek do średniej
                if (feed.field1 !== null && !isNaN(parseFloat(feed.field1))) {
                    windSum += parseFloat(feed.field1);
                    windCount++;
                }

                // Opad 24h: Filtrowanie po unikalnym kluczu godziny (blokuje minutowy spam)
                if (feed.field3 !== null && !isNaN(parseFloat(feed.field3))) {
                    const feedTime = new Date(feed.created_at);
                    const hourKey = `${feedTime.getFullYear()}-${feedTime.getMonth()}-${feedTime.getDate()}-${feedTime.getHours()}`;
                    hourlyRainSamples[hourKey] = parseFloat(feed.field3);
                }
            });

            // Średnia prędkość wiatru z 24h
            const windAvg = windCount > 0 ? (windSum / windCount) : 0;
            document.getElementById('out-wind-avg').innerText = windAvg.toFixed(1) + " km/h";

            // Prawidłowa suma opadów z unikalnych bloków godzinowych
            let rain24h = 0;
            Object.values(hourlyRainSamples).forEach(val => {
                rain24h += val;
            });
            document.getElementById('out-rain-24h').innerText = rain24h.toFixed(1) + " mm";
        }

        const timeNow = new Date();
        document.getElementById('last-update').innerText = `Aktualne dane z: ${timeNow.toLocaleTimeString('pl-PL')}`;

    } catch (error) {
        console.error("Błąd podczas pobierania danych lub obliczeń:", error);
        document.getElementById('last-update').innerText = "Błąd aktualizacji danych.";
    }
}

fetchWeatherData();
setInterval(fetchWeatherData, 30000);
