// Конфигурация API
const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';
const API_KEY = 'f338d6ed-49aa-4add-a9f2-8235870ed3d3';

// Глобальные переменные для хранения данных
let allCourses = [];
let allTutors = [];
let selectedCourse = null;
let selectedTutor = null;
let currentCoursePage = 1;
const ITEMS_PER_PAGE = 5;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadCourses();
    loadTutors();
    setupEventListeners();
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Поиск курсов
    document.getElementById('course-search-form').addEventListener('submit', function(e) {
        e.preventDefault();
        filterCourses();
    });

    // Поиск репетиторов
    document.getElementById('tutor-search-form').addEventListener('submit', function(e) {
        e.preventDefault();
        filterTutors();
    });

    // Изменение полей в форме заказа курса
    document.getElementById('order-date').addEventListener('change', onOrderDateChange);
    document.getElementById('order-time').addEventListener('change', calculatePrice);
    document.getElementById('order-students').addEventListener('input', calculatePrice);
    
    // Чекбоксы опций
    document.querySelectorAll('#order-form input[type="checkbox"]').forEach(function(checkbox) {
        checkbox.addEventListener('change', calculatePrice);
    });

    // Отправка заявки на курс
    document.getElementById('submit-order-btn').addEventListener('click', submitOrder);

    // Форма заявки на репетитора
    document.getElementById('tutor-order-date').addEventListener('change', calculateTutorPrice);
    document.getElementById('tutor-order-time').addEventListener('change', calculateTutorPrice);
    document.getElementById('tutor-order-duration').addEventListener('input', calculateTutorPrice);
    document.getElementById('tutor-order-students').addEventListener('input', calculateTutorPrice);
    document.getElementById('submit-tutor-order-btn').addEventListener('click', submitTutorOrder);
}

// Функция для показа уведомлений
function showNotification(message, type = 'success') {
    const notificationArea = document.getElementById('notification-area');
    const alertId = 'alert-' + Date.now();
    
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show notification-toast" role="alert">
            ${type === 'success' ? '<i class="bi bi-check-circle me-2"></i>' : '<i class="bi bi-exclamation-circle me-2"></i>'}
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Закрыть"></button>
        </div>
    `;
    
    notificationArea.insertAdjacentHTML('beforeend', alertHtml);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(function() {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

// Загрузка списка курсов
async function loadCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/courses?api_key=${API_KEY}`);
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки курсов');
        }
        
        allCourses = await response.json();
        document.getElementById('courses-loading').style.display = 'none';
        displayCourses(allCourses);
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('courses-loading').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Ошибка загрузки курсов. Попробуйте обновить страницу.
            </div>
        `;
    }
}

// Отображение списка курсов с пагинацией
function displayCourses(courses) {
    const coursesList = document.getElementById('courses-list');
    coursesList.innerHTML = '';
    
    if (courses.length === 0) {
        coursesList.innerHTML = '<div class="alert alert-info">Курсы не найдены</div>';
        document.getElementById('courses-pagination').innerHTML = '';
        return;
    }
    
    // Вычисляем курсы для текущей страницы
    const startIndex = (currentCoursePage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const coursesToShow = courses.slice(startIndex, endIndex);
    
    coursesToShow.forEach(function(course) {
        const isSelected = selectedCourse && selectedCourse.id === course.id;
        const courseHtml = `
            <div class="list-group-item list-group-item-action ${isSelected ? 'course-selected' : ''}" 
                 data-course-id="${course.id}" onclick="selectCourse(${course.id})">
                <div class="d-flex w-100 justify-content-between align-items-start">
                    <div>
                        <h5 class="mb-1">${course.name}</h5>
                        <p class="mb-1 text-muted course-description" title="${course.description}">
                            ${course.description}
                        </p>
                        <small class="text-muted">
                            <i class="bi bi-person me-1"></i>Преподаватель: ${course.teacher} | 
                            <i class="bi bi-bar-chart me-1"></i>Уровень: ${course.level} | 
                            <i class="bi bi-clock me-1"></i>${course.total_length} недель, ${course.week_length} ч/неделю
                        </small>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-primary fs-6">${course.course_fee_per_hour} ₽/час</span>
                        <br>
                        <button class="btn btn-sm btn-success mt-2" onclick="event.stopPropagation(); selectCourse(${course.id}); openOrderModal();">
                            Подать заявку
                        </button>
                    </div>
                </div>
            </div>
        `;
        coursesList.insertAdjacentHTML('beforeend', courseHtml);
    });
    
    // Создаем пагинацию
    createPagination(courses.length, currentCoursePage, 'courses');
}

// Создание пагинации
function createPagination(totalItems, currentPage, type) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const paginationContainer = document.getElementById(`${type}-pagination`);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHtml = '<ul class="pagination">';
    
    // Кнопка "Предыдущая"
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}, '${type}'); return false;">Предыдущая</a>
        </li>
    `;
    
    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}, '${type}'); return false;">${i}</a>
            </li>
        `;
    }
    
    // Кнопка "Следующая"
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}, '${type}'); return false;">Следующая</a>
        </li>
    `;
    
    paginationHtml += '</ul>';
    paginationContainer.innerHTML = paginationHtml;
}

// Смена страницы пагинации
function changePage(page, type) {
    if (type === 'courses') {
        currentCoursePage = page;
        filterCourses();
    }
}

// Фильтрация курсов
function filterCourses() {
    const searchName = document.getElementById('search-name').value.toLowerCase();
    const searchLevel = document.getElementById('search-level').value;
    
    let filteredCourses = allCourses.filter(function(course) {
        const matchesName = course.name.toLowerCase().includes(searchName);
        const matchesLevel = !searchLevel || course.level === searchLevel;
        return matchesName && matchesLevel;
    });
    
    displayCourses(filteredCourses);
}

// Выбор курса
function selectCourse(courseId) {
    selectedCourse = allCourses.find(function(c) { return c.id === courseId; });
    selectedTutor = null;
    
    // Обновляем визуальное выделение
    document.querySelectorAll('#courses-list .list-group-item').forEach(function(item) {
        item.classList.remove('course-selected');
        if (parseInt(item.dataset.courseId) === courseId) {
            item.classList.add('course-selected');
        }
    });
    
    // Активируем кнопку заявки
    document.getElementById('open-order-btn').disabled = false;
}

// Открытие модального окна заявки
function openOrderModal() {
    if (!selectedCourse) {
        showNotification('Сначала выберите курс', 'warning');
        return;
    }
    
    // Заполняем форму данными курса
    document.getElementById('order-course-id').value = selectedCourse.id;
    document.getElementById('order-course-name').value = selectedCourse.name;
    document.getElementById('order-teacher-name').value = selectedCourse.teacher;
    document.getElementById('order-duration').value = `${selectedCourse.total_length} недель (${selectedCourse.week_length} ч/неделю)`;
    
    // Заполняем даты
    const dateSelect = document.getElementById('order-date');
    dateSelect.innerHTML = '<option value="">Выберите дату</option>';
    
    // Группируем даты
    const uniqueDates = [...new Set(selectedCourse.start_dates.map(function(dt) {
        return dt.split('T')[0];
    }))];
    
    uniqueDates.forEach(function(date) {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = formatDate(date);
        dateSelect.appendChild(option);
    });
    
    // Сбрасываем время
    document.getElementById('order-time').innerHTML = '<option value="">Сначала выберите дату</option>';
    document.getElementById('order-time').disabled = true;
    
    // Сбрасываем опции
    document.querySelectorAll('#order-form input[type="checkbox"]').forEach(function(cb) {
        cb.checked = false;
    });
    document.getElementById('order-students').value = 1;
    document.getElementById('order-end-date').textContent = '';
    
    // Скрываем бейджи
    document.getElementById('early-registration-badge').classList.add('d-none');
    document.getElementById('group-enrollment-badge').classList.add('d-none');
    document.getElementById('intensive-course-badge').classList.add('d-none');
    
    calculatePrice();
    
    // Открываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
}

// Обработка изменения даты в заказе
function onOrderDateChange() {
    const selectedDate = document.getElementById('order-date').value;
    const timeSelect = document.getElementById('order-time');
    
    if (!selectedDate || !selectedCourse) {
        timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
        timeSelect.disabled = true;
        return;
    }
    
    // Находим доступные времена для выбранной даты
    const availableTimes = selectedCourse.start_dates
        .filter(function(dt) { return dt.startsWith(selectedDate); })
        .map(function(dt) { return dt.split('T')[1].substring(0, 5); });
    
    timeSelect.innerHTML = '<option value="">Выберите время</option>';
    
    availableTimes.forEach(function(time) {
        // Вычисляем время окончания
        const startHour = parseInt(time.split(':')[0]);
        const endHour = startHour + selectedCourse.week_length;
        const endTime = endHour.toString().padStart(2, '0') + ':00';
        
        const option = document.createElement('option');
        option.value = time;
        option.textContent = `${time} - ${endTime}`;
        timeSelect.appendChild(option);
    });
    
    timeSelect.disabled = false;
    
    // Вычисляем дату окончания курса
    const startDate = new Date(selectedDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (selectedCourse.total_length * 7));
    document.getElementById('order-end-date').textContent = `Последнее занятие: ${formatDate(endDate.toISOString().split('T')[0])}`;
    
    calculatePrice();
}

// Расчет стоимости курса
function calculatePrice() {
    if (!selectedCourse) {
        document.getElementById('total-price').textContent = '0';
        return;
    }
    
    const students = parseInt(document.getElementById('order-students').value) || 1;
    const selectedDate = document.getElementById('order-date').value;
    const selectedTime = document.getElementById('order-time').value;
    
    // Базовая стоимость
    const courseFeePerHour = selectedCourse.course_fee_per_hour;
    const totalHours = selectedCourse.total_length * selectedCourse.week_length;
    
    // Определяем множитель за выходные/праздники
    let isWeekendOrHoliday = 1;
    if (selectedDate) {
        const dayOfWeek = new Date(selectedDate).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            isWeekendOrHoliday = 1.5;
        }
    }
    
    // Определяем надбавки за время
    let morningSurcharge = 0;
    let eveningSurcharge = 0;
    if (selectedTime) {
        const hour = parseInt(selectedTime.split(':')[0]);
        if (hour >= 9 && hour < 12) {
            morningSurcharge = 400;
        } else if (hour >= 18 && hour <= 20) {
            eveningSurcharge = 1000;
        }
    }
    
    // Базовая стоимость по формуле
    let basePrice = ((courseFeePerHour * totalHours * isWeekendOrHoliday) + morningSurcharge + eveningSurcharge) * students;
    
    // Автоматические скидки/надбавки
    let earlyRegistration = false;
    let groupEnrollment = false;
    let intensiveCourse = false;
    
    // Скидка за раннюю регистрацию (за месяц вперед)
    if (selectedDate) {
        const today = new Date();
        const courseDate = new Date(selectedDate);
        const diffDays = Math.ceil((courseDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays >= 30) {
            earlyRegistration = true;
        }
    }
    
    // Скидка за групповую запись (5+ человек)
    if (students >= 5) {
        groupEnrollment = true;
    }
    
    // Надбавка за интенсивный курс (5+ часов в неделю)
    if (selectedCourse.week_length >= 5) {
        intensiveCourse = true;
    }
    
    // Показываем/скрываем бейджи
    document.getElementById('early-registration-badge').classList.toggle('d-none', !earlyRegistration);
    document.getElementById('group-enrollment-badge').classList.toggle('d-none', !groupEnrollment);
    document.getElementById('intensive-course-badge').classList.toggle('d-none', !intensiveCourse);
    
    // Применяем скидки/надбавки
    if (intensiveCourse) {
        basePrice *= 1.2; // +20%
    }
    if (earlyRegistration) {
        basePrice *= 0.9; // -10%
    }
    if (groupEnrollment) {
        basePrice *= 0.85; // -15%
    }
    
    // Пользовательские опции
    if (document.getElementById('option-supplementary').checked) {
        basePrice += 2000 * students;
    }
    if (document.getElementById('option-personalized').checked) {
        basePrice += 1500 * selectedCourse.total_length;
    }
    if (document.getElementById('option-excursions').checked) {
        basePrice *= 1.25; // +25%
    }
    if (document.getElementById('option-assessment').checked) {
        basePrice += 300;
    }
    if (document.getElementById('option-interactive').checked) {
        basePrice *= 1.5; // +50%
    }
    
    document.getElementById('total-price').textContent = Math.round(basePrice);
}

// Отправка заявки на курс
async function submitOrder() {
    const courseId = document.getElementById('order-course-id').value;
    const dateStart = document.getElementById('order-date').value;
    const timeStart = document.getElementById('order-time').value;
    const persons = parseInt(document.getElementById('order-students').value);
    const price = parseInt(document.getElementById('total-price').textContent);
    
    if (!dateStart || !timeStart) {
        showNotification('Пожалуйста, выберите дату и время', 'warning');
        return;
    }
    
    // Определяем автоматические опции
    const today = new Date();
    const courseDate = new Date(dateStart);
    const diffDays = Math.ceil((courseDate - today) / (1000 * 60 * 60 * 24));
    
    const orderData = {
        course_id: parseInt(courseId),
        date_start: dateStart,
        time_start: timeStart,
        persons: persons,
        price: price,
        early_registration: diffDays >= 30,
        group_enrollment: persons >= 5,
        intensive_course: selectedCourse.week_length >= 5,
        supplementary: document.getElementById('option-supplementary').checked,
        personalized: document.getElementById('option-personalized').checked,
        excursions: document.getElementById('option-excursions').checked,
        assessment: document.getElementById('option-assessment').checked,
        interactive: document.getElementById('option-interactive').checked
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/orders?api_key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Заявка успешно отправлена!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
            selectedCourse = null;
            document.getElementById('open-order-btn').disabled = true;
            document.querySelectorAll('#courses-list .list-group-item').forEach(function(item) {
                item.classList.remove('course-selected');
            });
        } else {
            showNotification(result.error || 'Ошибка при отправке заявки', 'danger');
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Ошибка соединения с сервером', 'danger');
    }
}

// Загрузка списка репетиторов
async function loadTutors() {
    try {
        const response = await fetch(`${API_BASE_URL}/tutors?api_key=${API_KEY}`);
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки репетиторов');
        }
        
        allTutors = await response.json();
        document.getElementById('tutors-loading').style.display = 'none';
        document.getElementById('tutors-table').style.display = 'table';
        displayTutors(allTutors);
        
        // Заполняем список языков для фильтра
        const languages = new Set();
        allTutors.forEach(function(tutor) {
            tutor.languages_offered.forEach(function(lang) {
                languages.add(lang);
            });
        });
        
        const languageSelect = document.getElementById('tutor-language');
        languages.forEach(function(lang) {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = lang;
            languageSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('tutors-loading').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Ошибка загрузки репетиторов. Попробуйте обновить страницу.
            </div>
        `;
    }
}

// Отображение списка репетиторов
function displayTutors(tutors) {
    const tutorsList = document.getElementById('tutors-list');
    tutorsList.innerHTML = '';
    
    if (tutors.length === 0) {
        tutorsList.innerHTML = '<tr><td colspan="7" class="text-center">Репетиторы не найдены</td></tr>';
        return;
    }
    
    tutors.forEach(function(tutor) {
        const isSelected = selectedTutor && selectedTutor.id === tutor.id;
        const tutorHtml = `
            <tr class="${isSelected ? 'tutor-selected' : ''}" data-tutor-id="${tutor.id}">
                <td>
                    <div class="tutor-avatar">
                        <i class="bi bi-person"></i>
                    </div>
                </td>
                <td>${tutor.name}</td>
                <td>${tutor.language_level}</td>
                <td>${tutor.languages_offered.join(', ')}</td>
                <td>${tutor.work_experience}</td>
                <td>${tutor.price_per_hour} ₽</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="selectTutor(${tutor.id})">
                        Выбрать
                    </button>
                </td>
            </tr>
        `;
        tutorsList.insertAdjacentHTML('beforeend', tutorHtml);
    });
}

// Фильтрация репетиторов
function filterTutors() {
    const language = document.getElementById('tutor-language').value;
    const level = document.getElementById('tutor-level').value;
    const experience = parseInt(document.getElementById('tutor-experience').value) || 0;
    
    let filteredTutors = allTutors.filter(function(tutor) {
        const matchesLanguage = !language || tutor.languages_offered.includes(language);
        const matchesLevel = !level || tutor.language_level === level;
        const matchesExperience = tutor.work_experience >= experience;
        return matchesLanguage && matchesLevel && matchesExperience;
    });
    
    displayTutors(filteredTutors);
}

// Выбор репетитора
function selectTutor(tutorId) {
    selectedTutor = allTutors.find(function(t) { return t.id === tutorId; });
    
    // Обновляем визуальное выделение
    document.querySelectorAll('#tutors-list tr').forEach(function(row) {
        row.classList.remove('tutor-selected');
        if (parseInt(row.dataset.tutorId) === tutorId) {
            row.classList.add('tutor-selected');
        }
    });
    
    // Заполняем форму
    document.getElementById('tutor-order-id').value = selectedTutor.id;
    document.getElementById('tutor-order-name').value = selectedTutor.name;
    
    // Устанавливаем минимальную дату - завтра
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('tutor-order-date').min = tomorrow.toISOString().split('T')[0];
    document.getElementById('tutor-order-date').value = '';
    
    calculateTutorPrice();
    
    // Открываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('tutorOrderModal'));
    modal.show();
}

// Расчет стоимости занятия с репетитором
function calculateTutorPrice() {
    if (!selectedTutor) {
        document.getElementById('tutor-total-price').textContent = '0';
        return;
    }
    
    const dateStart = document.getElementById('tutor-order-date').value;
    const timeStart = document.getElementById('tutor-order-time').value;
    const duration = parseInt(document.getElementById('tutor-order-duration').value) || 1;
    const students = parseInt(document.getElementById('tutor-order-students').value) || 1;
    
    // Базовая стоимость
    let price = selectedTutor.price_per_hour * duration;
    
    // Множитель за выходные
    if (dateStart) {
        const dayOfWeek = new Date(dateStart).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            price *= 1.5;
        }
    }
    
    // Надбавки за время
    if (timeStart) {
        const hour = parseInt(timeStart.split(':')[0]);
        if (hour >= 9 && hour < 12) {
            price += 400;
        } else if (hour >= 18 && hour <= 20) {
            price += 1000;
        }
    }
    
    // Умножаем на количество студентов
    price *= students;
    
    document.getElementById('tutor-total-price').textContent = Math.round(price);
}

// Отправка заявки на репетитора
async function submitTutorOrder() {
    const tutorId = document.getElementById('tutor-order-id').value;
    const dateStart = document.getElementById('tutor-order-date').value;
    const timeStart = document.getElementById('tutor-order-time').value;
    const duration = parseInt(document.getElementById('tutor-order-duration').value);
    const persons = parseInt(document.getElementById('tutor-order-students').value);
    const price = parseInt(document.getElementById('tutor-total-price').textContent);
    
    if (!dateStart || !timeStart) {
        showNotification('Пожалуйста, выберите дату и время', 'warning');
        return;
    }
    
    const orderData = {
        tutor_id: parseInt(tutorId),
        date_start: dateStart,
        time_start: timeStart,
        duration: duration,
        persons: persons,
        price: price,
        early_registration: false,
        group_enrollment: false,
        intensive_course: false,
        supplementary: false,
        personalized: false,
        excursions: false,
        assessment: false,
        interactive: false
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/orders?api_key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Заявка на репетитора успешно отправлена!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('tutorOrderModal')).hide();
            selectedTutor = null;
            document.querySelectorAll('#tutors-list tr').forEach(function(row) {
                row.classList.remove('tutor-selected');
            });
        } else {
            showNotification(result.error || 'Ошибка при отправке заявки', 'danger');
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Ошибка соединения с сервером', 'danger');
    }
}

// Форматирование даты
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}
