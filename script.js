document.getElementById('city').addEventListener('input', function () {
    const city = this.value.trim();
    if (city) {
        getWeather(city);
    }
});

let isCelsius = true; // Default unit is Celsius
let map; // Map instance for display

// Display Map using OpenStreetMap and Leaflet.js, with OpenWeatherMap layers
function displayMap(lat, lon) {
    // Base OpenStreetMap layer
    const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    });

    // OpenWeatherMap layers
    const cloudsLayer = L.tileLayer(
        'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=4edd934f3020205641711d98869a91ff',
        {
            attribution: 'Weather data © <a href="https://openweathermap.org/">OpenWeatherMap</a>',
            maxZoom: 18,
        }
    );

    const temperatureLayer = L.tileLayer(
        'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=4edd934f3020205641711d98869a91ff',
        {
            attribution: 'Weather data © <a href="https://openweathermap.org/">OpenWeatherMap</a>',
            maxZoom: 18,
        }
    );

    const precipitationLayer = L.tileLayer(
        'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=4edd934f3020205641711d98869a91ff',
        {
            attribution: 'Weather data © <a href="https://openweathermap.org/">OpenWeatherMap</a>',
            maxZoom: 18,
        }
    );

    // Initialize the map
    if (!map) {
        map = L.map('map').setView([lat, lon], 10);

        // Add the base OpenStreetMap layer
        baseLayer.addTo(map);

        // Add a marker for the current location
        L.marker([lat, lon]).addTo(map);

        // Layer switcher
        const layers = {
            'Clouds': cloudsLayer,
            'Temperature': temperatureLayer,
            'Precipitation': precipitationLayer,
        };

        L.control.layers(null, layers).addTo(map); // Add the layer control
    } else {
        // Update map view to the new coordinates
        map.setView([lat, lon], 10);

        // Add a marker for the updated location
        L.marker([lat, lon]).addTo(map);
    }
}


async function getWeather(city) {
    try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
            params: {
                q: city,
                appid: '54a57bc234ad752a4f59e59cd372201d',
                units: 'metric', // Default unit: Celsius
            },
        });

        const weatherData = response.data;
        const currentTemp = weatherData.list[0].main.temp;
        const feelsLike = weatherData.list[0].main.feels_like;
        const humidity = weatherData.list[0].main.humidity;
        const windSpeed = weatherData.list[0].wind.speed; // m/s
        const forecastData = weatherData.list;
        const { lat, lon } = weatherData.city.coord;

        // Update UI and display map
        updateCurrentWeather(
            weatherData.city.name,
            currentTemp,
            feelsLike,
            forecastData[0].weather[0],
            humidity,
            windSpeed
        );
        updateForecast(forecastData);
        displayMap(lat, lon); // Update map with weather overlay
    } catch (error) {
        console.error('Error fetching data:', error.message);
        document.querySelector('.error-message').textContent = 'City not found or API error!';
    }
}

function updateCurrentWeather(city, temp, feelsLike, weather, humidity, windSpeed) {
    document.querySelector('.location').textContent = city;
    document.querySelector('.weather-temp').textContent = `${Math.round(temp)}°${isCelsius ? 'C' : 'F'}`;
    document.querySelector('.feels-like-temp').textContent = `Feels Like: ${Math.round(feelsLike)}°${isCelsius ? 'C' : 'F'}`;
    document.querySelector('.weather-desc').textContent = weather.description
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
    document.querySelector('.weather-icon').innerHTML = `<img src="${iconUrl}" alt="${weather.description}">`;

    // Update Humidity and Wind Speed
    document.querySelector('.humidity p').textContent = `${humidity}%`;
    document.querySelector('.wind-speed p').textContent = `${Math.round(windSpeed * 3.6)} km/h`; // Convert m/s to km/h

    // Set the background image based on weather condition
    const currentWeatherElement = document.querySelector('.current-weather');
    let backgroundImage;

    switch (weather.main.toLowerCase()) {
        case 'clear':
            backgroundImage = 'url("https://c0.wallpaperflare.com/preview/913/700/937/sky-clouds-blue-skies.jpg")'; // Replace with your image path
            break;
        case 'clouds':
            backgroundImage = 'url("https://st4.depositphotos.com/15207528/29007/i/450/depositphotos_290074544-stock-photo-heavenly-dramatic-landscape-background-bad.jpg")'; // Replace with your image path
            break;
        case 'rain':
            backgroundImage = 'url("https://img.freepik.com/premium-photo/rainy-day-city-with-car-road-blurry-background_81048-11362.jpg")'; // Replace with your image path
            break;
        case 'snow':
            backgroundImage = 'url("https://c02.purpledshub.com/uploads/sites/77/2024/07/1ef49110-fbca-637c-a4d8-81a2ebe9b37b.jpeg")'; // Replace with your image path
            break;
        case 'thunderstorm':
            backgroundImage = 'url("https://14daypilot.com/themes/site_themes/agile_records/images/uploads/51/hazards_of_thunderstorms__large.jpg")'; // Replace with your image path
            break;
        default:
            backgroundImage = 'url("images/default.jpg")'; // Replace with your image path
    }

    currentWeatherElement.style.backgroundImage = backgroundImage;
}



// Update 5-Day Forecast
function updateForecast(forecastData) {
    const dailyForecast = getDailyForecast(forecastData);
    const forecastContainer = document.querySelector('.forecast-container');
    forecastContainer.innerHTML = ''; // Clear any existing forecast data

    // Loop through dailyForecast to display 8 days
    Object.keys(dailyForecast).forEach(day => {
        const data = dailyForecast[day];
        const unit = isCelsius ? '°C' : '°F';

        const dayCard = document.createElement('div');
        dayCard.classList.add('day-card');
        dayCard.innerHTML = `
            <h3 class="day-name">${day}</h3>
            <p class="day-temp">${Math.round(data.minTemp)}${unit} / ${Math.round(data.maxTemp)}${unit}</p>
            <img class="day-icon" src="https://openweathermap.org/img/wn/${data.icon}@2x.png" alt="${data.description}">
            <p class="day-description">${data.description}</p>
        `;

        // Add click event to toggle hourly forecast for the day
        dayCard.addEventListener('click', () => {
            const hourlyData = forecastData.filter(f => new Date(f.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' }) === day);
            toggleHourlyForecast(dayCard, hourlyData);
        });

        forecastContainer.appendChild(dayCard);
    });
}


function getDailyForecast(forecastData) {
    const dailyForecast = {};
    let count = 0; // Track the number of days added

    forecastData.forEach(data => {
        const date = new Date(data.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

        if (!dailyForecast[dayName]) {
            dailyForecast[dayName] = {
                minTemp: data.main.temp_min,
                maxTemp: data.main.temp_max,
                description: data.weather[0].description,
                icon: data.weather[0].icon,
            };
            count++;
        } else {
            dailyForecast[dayName].minTemp = Math.min(dailyForecast[dayName].minTemp, data.main.temp_min);
            dailyForecast[dayName].maxTemp = Math.max(dailyForecast[dayName].maxTemp, data.main.temp_max);
        }

        // Stop after 8 days
        if (count === 8) return;
    });

    return dailyForecast;
}



// Unit Toggle Event
document.getElementById('unit-toggle').addEventListener('click', () => {
    isCelsius = !isCelsius;
    const city = document.getElementById('city').value.trim();
    if (city) getWeather(city); // Refresh weather data
});

// Populate Hourly Forecast for the Selected Day
function populateHourlyForecast(dayCard, hourlyData) {
    const hourlyContainer = document.createElement('div');
    hourlyContainer.classList.add('hourly-forecast');

    hourlyData.forEach(hour => {
        const hourCard = document.createElement('div');
        hourCard.classList.add('hour-card');

        const time = new Date(hour.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const temp = `${Math.round(hour.main.temp)}°${isCelsius ? 'C' : 'F'}`;
        const description = hour.weather[0].description;
        const iconUrl = `https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`;

        hourCard.innerHTML = `
            <span>${time}</span>
            <img src="${iconUrl}" alt="${description}" />
            <span>${temp}</span>
        `;
        hourlyContainer.appendChild(hourCard);
    });

    dayCard.appendChild(hourlyContainer);
}

// Toggle the Hourly Forecast
function toggleHourlyForecast(dayCard, hourlyData) {
    const isActive = dayCard.classList.contains('active');

    // Collapse other cards
    document.querySelectorAll('.day-card').forEach(card => {
        card.classList.remove('active');
        const hourlyForecast = card.querySelector('.hourly-forecast');
        if (hourlyForecast) card.removeChild(hourlyForecast);
    });

    // Expand the clicked card
    if (!isActive) {
        dayCard.classList.add('active');
        populateHourlyForecast(dayCard, hourlyData);
    }
}

// Update 7-Day Forecast
function updateForecast(forecastData) {
    const dailyForecast = getDailyForecast(forecastData);
    const forecastContainer = document.querySelector('.forecast-container');
    forecastContainer.innerHTML = '';

    Object.keys(dailyForecast).forEach(day => {
        const data = dailyForecast[day];
        const unit = isCelsius ? '°C' : '°F';

        // Create Day Card
        const dayCard = document.createElement('div');
        dayCard.classList.add('day-card');
        dayCard.innerHTML = `
            <h3 class="day-name">${day}</h3>
            <p class="day-temp">${Math.round(data.minTemp)}${unit} / ${Math.round(data.maxTemp)}${unit}</p>
            <img class="day-icon" src="https://openweathermap.org/img/wn/${data.icon}@2x.png" alt="${data.description}">
            <p class="day-description">${data.description}</p>
        `;

        // Add Click Listener for Hourly Forecast
        dayCard.addEventListener('click', () => {
            const hourlyData = forecastData.filter(f => new Date(f.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' }) === day);
            toggleHourlyForecast(dayCard, hourlyData);
        });

        forecastContainer.appendChild(dayCard);
    });
}

// Select the dark mode toggle button
const darkModeToggle = document.getElementById('dark-mode-toggle');

// Add event listener for the button
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode'); // Toggle the 'dark-mode' class

    // Update the button text
    if (document.body.classList.contains('dark-mode')) {
        darkModeToggle.textContent = 'Light Mode';
    } else {
        darkModeToggle.textContent = 'Dark Mode';
    }
});

//updates background 
function updateBackground() {
    const body = document.querySelector('body');
    
    // Remove any previous background
    body.style.backgroundImage = '';

    const currentHour = new Date().getHours();

    let backgroundImage = '';

    if (currentHour >= 6 && currentHour < 12) {
        // Morning (6 AM to 12 PM)
        backgroundImage = "url('photos/morning.jpg')";
    } else if (currentHour >= 12 && currentHour < 18) {
        // Afternoon (12 PM to 6 PM)
        backgroundImage = "url('photos/afternoon.jpg')";
    } else if (currentHour >= 18 && currentHour < 21) {
        // Evening (6 PM to 9 PM)
        backgroundImage = "url('photos/evening.jpg')";
    } else {
        // Night (9 PM to 6 AM)
        backgroundImage = "url('photos/night.jpg')";
    }

    // Apply the background image
    body.style.backgroundImage = backgroundImage;
    body.style.transition = "background-image 1s ease-in-out";
}

document.addEventListener('DOMContentLoaded', updateBackground);

