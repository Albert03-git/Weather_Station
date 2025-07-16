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
    try {
        const response = await fetch(URL_BASE);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data && data.feeds && data.feeds.length > 0) {
            const latestFeed = data.feeds[0]; // Bierzemy najnowszy odczyt

            // Aktualizowanie danych z domu
            const tempDom = latestFeed[FIELD_TEMP_DOM];
            const wilgotnoscDom = latestFeed[FIELD_WILGOTNOSC_DOM];

            tempDomElement.textContent = tempDom ? `${parseFloat(tempDom).toFixed(1)} °C` : 'Brak danych';
            wilgotnoscDomElement.textContent = wilgotnoscDom ? `${parseFloat(wilgotnoscDom).toFixed(1)} %` : 'Brak danych';

            // Aktualizowanie danych na zewnątrz
            const tempZew = latestFeed[FIELD_TEMP_ZEW];
            const wilgotnoscZew = latestFeed[FIELD_WILGOTNOSC_ZEW];
            const cisnienieZew = latestFeed[FIELD_CISNIENIE_ZEW];

            tempZewElement.textContent = tempZew ? `${parseFloat(tempZew).toFixed(1)} °C` : 'Brak danych';
            wilgotnoscZewElement.textContent = wilgotnoscZew ? `${parseFloat(wilgotnoscZew).toFixed(1)} %` : 'Brak danych';
            cisnienieZewElement.textContent = cisnienieZew ? `${parseFloat(cisnienieZew).toFixed(1)} hPa` : 'Brak danych';

        } else {
            console.warn('Brak odczytów w kanale ThingSpeak lub niepoprawne dane.');
            // Ustawiamy brak danych, jeśli nie ma odczytów
            tempDomElement.textContent = 'Brak danych';
            wilgotnoscDomElement.textContent = 'Brak danych';
            tempZewElement.textContent = 'Brak danych';
            wilgotnoscZewElement.textContent = 'Brak danych';
            cisnienieZewElement.textContent = 'Brak danych';
        }
    } catch (error) {
        console.error('Błąd podczas pobierania danych z ThingSpeak:', error);
        // Ustawiamy błąd, jeśli wystąpi problem z połączeniem
        tempDomElement.textContent = 'Błąd';
        wilgotnoscDomElement.textContent = 'Błąd';
        tempZewElement.textContent = 'Błąd';
        wilgotnoscZewElement.textContent = 'Błąd';
        cisnienieZewElement.textContent = 'Błąd';
    }
}

// Odśwież dane przy ładowaniu strony
fetchWeatherData();

// Ustawienie automatycznego odświeżania co 5 minut (300 000 milisekund)
// ThingSpeak ma ograniczenie na odczyty (domyślnie 15 sekund), więc 5 minut to bezpieczny interwał.
setInterval(fetchWeatherData, 300000); // 5 minut = 5 * 60 * 1000 ms

// Obsługa przycisku odświeżania (nadal działa dla ręcznego odświeżenia)
refreshButton.addEventListener('click', fetchWeatherData);