let myMap;
let clusterer;

const languageResources = [
    {
        id: 1,
        name: "Библиотека иностранной литературы",
        category: "library",
        address: "Москва, ул. Николоямская, д. 1",
        coords: [55.747, 37.653],
        hours: "Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-18:00",
        phone: "+7 (495) 915-36-36",
        description: "Крупнейшая библиотека с литературой на иностранных языках. Проводятся языковые клубы и мероприятия."
    },
    {
        id: 2,
        name: "Языковой клуб Speak Up",
        category: "language_club",
        address: "Москва, ул. Тверская, д. 18",
        coords: [55.764, 37.605],
        hours: "Пн-Вс: 10:00-22:00",
        phone: "+7 (495) 123-45-67",
        description: "Разговорный клуб для практики английского, немецкого и французского языков."
    },
    {
        id: 3,
        name: "Культурный центр ЗИЛ",
        category: "cultural_center",
        address: "Москва, ул. Восточная, д. 4к1",
        coords: [55.712, 37.649],
        hours: "Пн-Вс: 9:00-22:00",
        phone: "+7 (495) 675-16-36",
        description: "Культурный центр с языковыми курсами и международными мероприятиями."
    },
    {
        id: 4,
        name: "Языковая школа BigWig",
        category: "courses",
        address: "Москва, Газетный пер., д. 9с2",
        coords: [55.757, 37.611],
        hours: "Пн-Пт: 8:00-21:00, Сб: 10:00-18:00",
        phone: "+7 (495) 646-00-76",
        description: "Курсы английского, испанского, китайского и других языков для всех уровней."
    },
    {
        id: 5,
        name: "Кафе языкового обмена Tandem",
        category: "language_cafe",
        address: "Москва, ул. Покровка, д. 27",
        coords: [55.760, 37.649],
        hours: "Пн-Вс: 12:00-23:00",
        phone: "+7 (495) 987-65-43",
        description: "Кафе для встреч с носителями языков. Еженедельные разговорные вечера."
    },
    {
        id: 6,
        name: "Гёте-Институт",
        category: "cultural_center",
        address: "Москва, Ленинский пр-т, д. 95а",
        coords: [55.683, 37.538],
        hours: "Пн-Пт: 9:00-20:00",
        phone: "+7 (495) 936-24-57",
        description: "Культурный центр Германии. Курсы немецкого языка и культурные мероприятия."
    },
    {
        id: 7,
        name: "Институт Сервантеса",
        category: "cultural_center",
        address: "Москва, Новинский б-р, д. 20а",
        coords: [55.755, 37.578],
        hours: "Пн-Пт: 10:00-19:00",
        phone: "+7 (495) 609-90-22",
        description: "Испанский культурный центр. Курсы испанского языка и латиноамериканская культура."
    },
    {
        id: 8,
        name: "Французский институт",
        category: "cultural_center",
        address: "Москва, Милютинский пер., д. 7а",
        coords: [55.765, 37.630],
        hours: "Пн-Пт: 10:00-19:00, Сб: 10:00-17:00",
        phone: "+7 (495) 937-44-71",
        description: "Французский культурный центр с языковыми курсами и медиатекой."
    },
    {
        id: 9,
        name: "Библиотека им. Некрасова",
        category: "library",
        address: "Москва, ул. Бауманская, д. 58/25с14",
        coords: [55.772, 37.679],
        hours: "Пн-Пт: 10:00-22:00, Сб-Вс: 10:00-20:00",
        phone: "+7 (499) 267-76-56",
        description: "Центральная библиотека с секцией иностранной литературы и языковыми клубами."
    },
    {
        id: 10,
        name: "English First",
        category: "courses",
        address: "Москва, ул. Новый Арбат, д. 15",
        coords: [55.753, 37.589],
        hours: "Пн-Пт: 7:00-22:00, Сб-Вс: 9:00-18:00",
        phone: "+7 (495) 937-38-38",
        description: "Международная сеть языковых школ. Курсы для детей и взрослых."
    },
    {
        id: 11,
        name: "Разговорный клуб Moscow Speaks",
        category: "language_club",
        address: "Москва, Чистопрудный б-р, д. 12",
        coords: [55.763, 37.642],
        hours: "Ср, Пт: 19:00-22:00",
        phone: "+7 (925) 111-22-33",
        description: "Бесплатный разговорный клуб. Практика английского с носителями языка."
    },
    {
        id: 12,
        name: "Японский центр",
        category: "cultural_center",
        address: "Москва, ул. Космонавта Волкова, д. 6",
        coords: [55.808, 37.537],
        hours: "Пн-Сб: 10:00-18:00",
        phone: "+7 (495) 626-55-83",
        description: "Центр японской культуры. Курсы японского языка и культурные мероприятия."
    }
];

const categoryColors = {
    language_club: 'islands#blueEducationIcon',
    courses: 'islands#greenEducationIcon',
    library: 'islands#orangeBookIcon',
    cultural_center: 'islands#redHomeIcon',
    language_cafe: 'islands#violetFoodIcon'
};

const categoryNames = {
    language_club: 'Языковой клуб',
    courses: 'Курсы',
    library: 'Библиотека',
    cultural_center: 'Культурный центр',
    language_cafe: 'Языковое кафе'
};

ymaps.ready(initMap);

function initMap() {
    myMap = new ymaps.Map("map", {
        center: [55.751574, 37.573856],
        zoom: 11,
        controls: ['zoomControl', 'searchControl', 'typeSelector', 'fullscreenControl']
    });

    clusterer = new ymaps.Clusterer({
        preset: 'islands#invertedBlueClusterIcons',
        groupByCoordinates: false,
        clusterDisableClickZoom: false,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false
    });

    displayPlaces(languageResources);

    document.getElementById('map-search-btn').addEventListener('click', searchPlaces);
    document.getElementById('map-category').addEventListener('change', filterByCategory);
    
    document.getElementById('map-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchPlaces();
        }
    });
}

function displayPlaces(places) {
    clusterer.removeAll();
    
    const placemarks = [];
    
    places.forEach(function(place) {
        const placemark = new ymaps.Placemark(place.coords, {
            balloonContentHeader: `<strong>${place.name}</strong>`,
            balloonContentBody: `
                <p><strong>Категория:</strong> ${categoryNames[place.category]}</p>
                <p><strong>Адрес:</strong> ${place.address}</p>
                <p><strong>Часы работы:</strong> ${place.hours}</p>
                <p><strong>Телефон:</strong> ${place.phone}</p>
                <p>${place.description}</p>
            `,
            hintContent: place.name
        }, {
            preset: categoryColors[place.category]
        });
        
        placemarks.push(placemark);
    });
    
    clusterer.add(placemarks);
    myMap.geoObjects.add(clusterer);
    updatePlacesList(places);
}

function updatePlacesList(places) {
    const placesList = document.getElementById('places-list');
    
    if (places.length === 0) {
        placesList.innerHTML = '<div class="col-12"><p class="text-muted">Места не найдены</p></div>';
        return;
    }
    
    let html = '';
    places.forEach(function(place) {
        html += `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h6 class="card-title">${place.name}</h6>
                        <span class="badge bg-secondary mb-2">${categoryNames[place.category]}</span>
                        <p class="card-text small mb-1"><i class="bi bi-geo-alt me-1"></i>${place.address}</p>
                        <p class="card-text small mb-1"><i class="bi bi-clock me-1"></i>${place.hours}</p>
                        <p class="card-text small mb-0"><i class="bi bi-telephone me-1"></i>${place.phone}</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-sm btn-outline-primary w-100" onclick="showOnMap(${place.coords[0]}, ${place.coords[1]})">
                            <i class="bi bi-geo me-1"></i>Показать на карте
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    placesList.innerHTML = html;
}

function showOnMap(lat, lng) {
    myMap.setCenter([lat, lng], 15, {
        duration: 500
    });
    document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
}

function searchPlaces() {
    const searchQuery = document.getElementById('map-search').value.toLowerCase();
    const category = document.getElementById('map-category').value;
    
    let filteredPlaces = languageResources;
    
    if (category !== 'all') {
        filteredPlaces = filteredPlaces.filter(function(place) {
            return place.category === category;
        });
    }
    
    if (searchQuery) {
        filteredPlaces = filteredPlaces.filter(function(place) {
            return place.name.toLowerCase().includes(searchQuery) ||
                   place.address.toLowerCase().includes(searchQuery) ||
                   place.description.toLowerCase().includes(searchQuery);
        });
    }
    
    displayPlaces(filteredPlaces);

    if (filteredPlaces.length === 1) {
        myMap.setCenter(filteredPlaces[0].coords, 15, { duration: 500 });
    } else if (filteredPlaces.length > 1) {
        const bounds = clusterer.getBounds();
        if (bounds) {
            myMap.setBounds(bounds, { checkZoomRange: true, duration: 500 });
        }
    }
}

// Фильтрация по категории
function filterByCategory() {
    searchPlaces();
}
