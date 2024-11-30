document.getElementById('city').addEventListener('input', function () {
    var city = this.value;
    getWeather(city);
});

let isCelsius = true; // Default unit is Celsius
let currentTemperature = null; // Stores current temperature
let feelsLikeTemperature = null; // Stores "Feels Like" temperature
let forecastData = []; // Stores the forecast data
let map; // Declare the map globally

function displayMap(lat, lon) {
    if (map) {
        map.setView([lat, lon], 10);
        L.marker([lat, lon]).addTo(map);
    } else {
        map = L.map('map').setView([lat, lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        }).addTo(map);
        L.marker([lat, lon]).addTo(map);
    }
}

async function getWeather() {
    try {
        var city = document.getElementById('city').value;
        console.log('City Name:', city);

        const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
            params: {
                q: city,
                appid: '54a57bc234ad752a4f59e59cd372201d',
                units: 'metric' 
            },
        });

        currentTemperature = response.data.list[0].main.temp;
        feelsLikeTemperature = response.data.list[0].main.feels_like;

        updateTemperatureDisplay();

        forecastData = response.data.list;

        const dailyForecast = {};
        forecastData.forEach((data) => {
            const day = new Date(data.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' });
            if (!dailyForecast[day]) {
                dailyForecast[day] = {
                    minTemp: data.main.temp_min,
                    maxTemp: data.main.temp_max,
                    description: data.weather[0].description,
                    humidity: data.main.humidity,
                    windSpeed: data.wind.speed,
                    icon: data.weather[0].icon,
                };
            } else {
                dailyForecast[day].minTemp = Math.min(dailyForecast[day].minTemp, data.main.temp_min);
                dailyForecast[day].maxTemp = Math.max(dailyForecast[day].maxTemp, data.main.temp_max);
            }
        });

        document.querySelector('.date-dayname').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        const date = new Date().toUTCString();
        const extractedDateTime = date.slice(5, 16);
        document.querySelector('.date-day').textContent = extractedDateTime;

        const currentWeatherIconCode = dailyForecast[new Date().toLocaleDateString('en-US', { weekday: 'long' })].icon;
        const weatherIconElement = document.querySelector('.weather-icon');
        weatherIconElement.innerHTML = getWeatherIcon(currentWeatherIconCode);

        document.querySelector('.location').textContent = response.data.city.name;
        document.querySelector('.weather-desc').textContent = dailyForecast[new Date().toLocaleDateString('en-US', { weekday: 'long' })].description
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        document.querySelector('.humidity .value').textContent = dailyForecast[new Date().toLocaleDateString('en-US', { weekday: 'long' })].humidity + ' %';
        document.querySelector('.wind .value').textContent = dailyForecast[new Date().toLocaleDateString('en-US', { weekday: 'long' })].windSpeed + ' m/s';

        updateForecastDisplay(dailyForecast);

        const { lat, lon } = response.data.city.coord;
        displayMap(lat, lon);

        displayHourlyForecast(forecastData);

    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}

function displayHourlyForecast(forecastData) {
    const weekListItems = document.querySelectorAll('.week-list li');
    const groupedByDay = {};

    forecastData.forEach((data) => {
        const date = new Date(data.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const time = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

        if (!groupedByDay[dayName]) {
            groupedByDay[dayName] = [];
        }
        groupedByDay[dayName].push({
            time: time,
            temp: isCelsius ? data.main.temp : (data.main.temp * 9) / 5 + 32,
            icon: data.weather[0].icon
        });
    });

    weekListItems.forEach((item) => {
        const dayNameElement = item.querySelector('.day-name');
        const dayName = dayNameElement.textContent.trim();
        const hourlyForecastDiv = item.querySelector('.hourly-forecast');

        if (groupedByDay[dayName]) {
            const hourlyData = groupedByDay[dayName]
                .map(hour =>
                    `<p>${hour.time}: ${Math.round(hour.temp)}°${isCelsius ? 'C' : 'F'} <img src="https://openweathermap.org/img/wn/${hour.icon}.png" alt="icon"></p>`
                )
                .join('');
            hourlyForecastDiv.innerHTML = hourlyData;
        }
    });
}

function getWeatherIcon(iconCode) {
    const iconBaseUrl = 'https://openweathermap.org/img/wn/';
    return `<img src="${iconBaseUrl}${iconCode}@2x.png" alt="Weather Icon">`;
}

function updateTemperatureDisplay() {
    const temperatureElement = document.querySelector('.weather-temp');
    const feelsLikeElement = document.querySelector('.feels-like-temp');
    const temperature = isCelsius ? currentTemperature : (currentTemperature * 9/5) + 32;
    const feelsLike = isCelsius ? feelsLikeTemperature : (feelsLikeTemperature * 9/5) + 32;
    const unit = isCelsius ? 'ºC' : 'ºF';

    temperatureElement.textContent = Math.round(temperature) + unit;
    feelsLikeElement.textContent = `Feels Like: ${Math.round(feelsLike)}${unit}`;
}

function updateForecastDisplay(dailyForecast) {
    const dayElements = document.querySelectorAll('.day-name');
    const tempElements = document.querySelectorAll('.day-temp');
    const iconElements = document.querySelectorAll('.day-icon');

    dayElements.forEach((dayElement, index) => {
        const day = Object.keys(dailyForecast)[index];
        const data = dailyForecast[day];
        const minTemp = isCelsius ? data.minTemp : (data.minTemp * 9/5) + 32;
        const maxTemp = isCelsius ? data.maxTemp : (data.maxTemp * 9/5) + 32;
        const unit = isCelsius ? 'ºC' : 'ºF';

        dayElement.textContent = day;
        tempElements[index].textContent = `${Math.round(minTemp)}${unit} / ${Math.round(maxTemp)}${unit}`;
        iconElements[index].innerHTML = getWeatherIcon(data.icon);
    });
}

document.getElementById('unit-toggle').addEventListener('click', () => {
    isCelsius = !isCelsius;
    updateTemperatureDisplay();
    updateForecastDisplay(getDailyForecast(forecastData));
    displayHourlyForecast(forecastData);
});

function getDailyForecast(forecastData) {
    const dailyForecast = {};
    forecastData.forEach((data) => {
        const day = new Date(data.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' });
        if (!dailyForecast[day]) {
            dailyForecast[day] = {
                minTemp: data.main.temp_min,
                maxTemp: data.main.temp_max,
                description: data.weather[0].description,
                humidity: data.main.humidity,
                windSpeed: data.wind.speed,
                icon: data.weather[0].icon,
            };
        } else {
            dailyForecast[day].minTemp = Math.min(dailyForecast[day].minTemp, data.main.temp_min);
            dailyForecast[day].maxTemp = Math.max(dailyForecast[day].maxTemp, data.main.temp_max);
        }
    });
    return dailyForecast;
}

document.addEventListener("DOMContentLoaded", function () {
    getWeather();
    setInterval(getWeather, 900000);
});
