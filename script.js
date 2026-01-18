// **WAŻNE: ZASTĄP PONIŻSZE DANE SWOIMI!**
const CHANNEL_ID = '2388907';       // Np. '1234567'
const READ_API_KEY = 'XGALLJCYEEU64ZMW';   // Np. 'ABCDEF1234567890'

// Zdefiniuj, które pola z ThingSpeak odpowiadają danym
// Sprawdź w swoim kanale ThingSpeak, które numery pól (field1, field2, itd.) przechowują konkretne dane.
const FIELD_TEMP_DOM = 'field4';    // Temperatura w domu
const FIELD_WILGOTNOSC_DOM = 'field5'; // Wilgotność w domu

const FIELD_TEMP_ZEW = 'field1';    // Temperatura na zewnątrz
const FIELD_WILGOTNOSC_ZEW = 'field2'; // Wilgotność na zewnątrz
const FIELD_CISNIENIE_ZEW = 'field3'; // Ciśnienie na zewnątrz

const URL_BASE = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=1`;

// Pobieranie referencji do elementów HTML
const tempDomElement = document.getElementById('tempDom');
const wilgotnoscDomElement = document.getElementById('wilgotnoscDom');

const tempZewElement = document.getElementById('tempZew');
const wilgotnoscZewElement = document.getElementById('wilgotnoscZew');
const cisnienieZewElement = document.getElementById('cisnienieZew');

const refreshButton = document.getElementById('refreshButton');

async function fetchWeatherData() {
    // Zmieniamy results=1 na results=10, aby mieć pewność, że złapiemy dane z obu urządzeń
    const URL_BULK = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=10`;

    try {
        const response = await fetch(URL_BULK);
        if (!response.ok) throw new Error(`Błąd sieci: ${response.status}`);
        
        const data = await response.json();
        const feeds = data.feeds;

        if (feeds && feeds.length > 0) {
            // Funkcja pomocnicza: szuka najnowszej niepustej wartości w ostatnich 10 odczytach
            const getLatestValue = (fieldName) => {
                for (let i = feeds.length - 1; i >= 0; i--) {
                    if (feeds[i][fieldName] !== null && feeds[i][fieldName] !== undefined && feeds[i][fieldName] !== "") {
                        return feeds[i][fieldName];
                    }
                }
                return null;
            };

            // Pobieramy najświeższe wartości dla każdego pola z osobna
            const tempDom = getLatestValue(FIELD_TEMP_DOM);
            const wilgDom = getLatestValue(FIELD_WILGOTNOSC_DOM);
            const tempZew = getLatestValue(FIELD_TEMP_ZEW);
            const wilgZew = getLatestValue(FIELD_WILGOTNOSC_ZEW);
            const cisnZew = getLatestValue(FIELD_CISNIENIE_ZEW);

            // Wyświetlanie danych Dom
            tempDomElement.textContent = tempDom ? `${parseFloat(tempDom).toFixed(1)} °C` : 'Brak danych';
            wilgotnoscDomElement.textContent = wilgDom ? `${parseFloat(wilgDom).toFixed(1)} %` : 'Brak danych';

            // Wyświetlanie danych Zewnątrz
            tempZewElement.textContent = tempZew ? `${parseFloat(tempZew).toFixed(1)} °C` : 'Brak danych';
            wilgotnoscZewElement.textContent = wilgZew ? `${parseFloat(wilgZew).toFixed(1)} %` : 'Brak danych';
            cisnienieZewElement.textContent = cisnZew ? `${parseFloat(cisnZew).toFixed(1)} hPa` : 'Brak danych';

        }
    } catch (error) {
        console.error('Błąd pobierania danych:', error);
        [tempDomElement, wilgotnoscDomElement, tempZewElement, wilgotnoscZewElement, cisnienieZewElement].forEach(el => {
            el.textContent = 'Błąd';
        });
    }
}

// Odśwież dane przy ładowaniu strony
fetchWeatherData();

// Ustawienie automatycznego odświeżania co 5 minut (300 000 milisekund)
// ThingSpeak ma ograniczenie na odczyty (domyślnie 15 sekund), więc 5 minut to bezpieczny interwał.
setInterval(fetchWeatherData, 300000); // 5 minut = 5 * 60 * 1000 ms

// Obsługa przycisku odświeżania (nadal działa dla ręcznego odświeżenia)

refreshButton.addEventListener('click', fetchWeatherData);
