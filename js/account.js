// Конфигурация API
const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';
const API_KEY = 'f338d6ed-49aa-4add-a9f2-8235870ed3d3';

// Глобальные переменные
let allOrders = [];
let allCourses = [];
let allTutors = [];
let currentOrderPage = 1;
const ITEMS_PER_PAGE = 5;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
});

// Настройка обработчиков событий
function setupEventListeners() {
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
    document.getElementById('save-edit-btn').addEventListener('click', saveEdit);
    
    // Обработчики изменений в форме редактирования
    document.getElementById('edit-date').addEventListener('change', calculateEditPrice);
    document.getElementById('edit-time').addEventListener('change', calculateEditPrice);
    document.getElementById('edit-students').addEventListener('input', calculateEditPrice);
    document.querySelectorAll('#edit-form input[type="checkbox"]').forEach(function(checkbox) {
        checkbox.addEventListener('change', calculateEditPrice);
    });
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

// Загрузка данных
async function loadData() {
    try {
        // Загружаем курсы и репетиторов для отображения названий
        const [coursesResponse, tutorsResponse, ordersResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/courses?api_key=${API_KEY}`),
            fetch(`${API_BASE_URL}/tutors?api_key=${API_KEY}`),
            fetch(`${API_BASE_URL}/orders?api_key=${API_KEY}`)
        ]);
        
        if (!coursesResponse.ok || !tutorsResponse.ok || !ordersResponse.ok) {
            throw new Error('Ошибка загрузки данных');
        }
        
        allCourses = await coursesResponse.json();
        allTutors = await tutorsResponse.json();
        allOrders = await ordersResponse.json();
        
        document.getElementById('orders-loading').style.display = 'none';
        displayOrders();
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('orders-loading').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Ошибка загрузки данных. Попробуйте обновить страницу.
            </div>
        `;
    }
}

// Получение информации о курсе или репетиторе
function getItemInfo(order) {
    if (order.course_id) {
        const course = allCourses.find(function(c) { return c.id === order.course_id; });
        return {
            name: course ? course.name : 'Курс #' + order.course_id,
            teacher: course ? course.teacher : 'Неизвестно',
            type: 'course',
            item: course
        };
    } else if (order.tutor_id) {
        const tutor = allTutors.find(function(t) { return t.id === order.tutor_id; });
        return {
            name: tutor ? 'Занятие с ' + tutor.name : 'Репетитор #' + order.tutor_id,
            teacher: tutor ? tutor.name : 'Неизвестно',
            type: 'tutor',
            item: tutor
        };
    }
    return { name: 'Неизвестно', teacher: 'Неизвестно', type: 'unknown', item: null };
}

// Отображение списка заказов с пагинацией
function displayOrders() {
    const ordersList = document.getElementById('orders-list');
    const ordersTable = document.getElementById('orders-table');
    const ordersEmpty = document.getElementById('orders-empty');
    
    ordersList.innerHTML = '';
    
    if (allOrders.length === 0) {
        ordersTable.style.display = 'none';
        ordersEmpty.classList.remove('d-none');
        document.getElementById('orders-pagination').innerHTML = '';
        return;
    }
    
    ordersEmpty.classList.add('d-none');
    ordersTable.style.display = 'table';
    
    // Вычисляем заказы для текущей страницы
    const startIndex = (currentOrderPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const ordersToShow = allOrders.slice(startIndex, endIndex);
    
    ordersToShow.forEach(function(order) {
        const info = getItemInfo(order);
        const orderHtml = `
            <tr data-order-id="${order.id}">
                <td>${order.id}</td>
                <td>${info.name}</td>
                <td>${formatDate(order.date_start)} в ${order.time_start}</td>
                <td>${order.price} ₽</td>
                <td>
                    <div class="btn-group btn-group-actions">
                        <button class="btn btn-info btn-sm" onclick="showDetails(${order.id})" title="Подробнее">
                            <i class="bi bi-eye"></i> Подробнее
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="openEditModal(${order.id})" title="Изменить">
                            <i class="bi bi-pencil"></i> Изменить
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${order.id})" title="Удалить">
                            <i class="bi bi-trash"></i> Удалить
                        </button>
                    </div>
                </td>
            </tr>
        `;
        ordersList.insertAdjacentHTML('beforeend', orderHtml);
    });
    
    // Создаем пагинацию
    createPagination(allOrders.length, currentOrderPage);
}

// Создание пагинации
function createPagination(totalItems, currentPage) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const paginationContainer = document.getElementById('orders-pagination');
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHtml = '<ul class="pagination justify-content-center">';
    
    // Кнопка "Предыдущая"
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Предыдущая</a>
        </li>
    `;
    
    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // Кнопка "Следующая"
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Следующая</a>
        </li>
    `;
    
    paginationHtml += '</ul>';
    paginationContainer.innerHTML = paginationHtml;
}

// Смена страницы пагинации
function changePage(page) {
    currentOrderPage = page;
    displayOrders();
}

// Показать подробности заказа
function showDetails(orderId) {
    const order = allOrders.find(function(o) { return o.id === orderId; });
    if (!order) return;
    
    const info = getItemInfo(order);
    const detailsContent = document.getElementById('details-content');
    
    // Формируем список опций
    let optionsHtml = '';
    const options = [
        { key: 'early_registration', name: 'Скидка за раннюю регистрацию', type: 'discount', value: '-10%' },
        { key: 'group_enrollment', name: 'Скидка за групповую запись', type: 'discount', value: '-15%' },
        { key: 'intensive_course', name: 'Интенсивный курс', type: 'surcharge', value: '+20%' },
        { key: 'supplementary', name: 'Дополнительные материалы', type: 'surcharge', value: '+2000₽/студент' },
        { key: 'personalized', name: 'Индивидуальные занятия', type: 'surcharge', value: '+1500₽/неделя' },
        { key: 'excursions', name: 'Культурные экскурсии', type: 'surcharge', value: '+25%' },
        { key: 'assessment', name: 'Оценка уровня владения', type: 'surcharge', value: '+300₽' },
        { key: 'interactive', name: 'Интерактивная платформа', type: 'surcharge', value: '+50%' }
    ];
    
    options.forEach(function(opt) {
        if (order[opt.key]) {
            const badgeClass = opt.type === 'discount' ? 'discount-badge' : 'surcharge-badge';
            optionsHtml += `<span class="${badgeClass}">${opt.name}: ${opt.value}</span>`;
        }
    });
    
    if (!optionsHtml) {
        optionsHtml = '<span class="text-muted">Нет дополнительных опций</span>';
    }
    
    detailsContent.innerHTML = `
        <div class="details-info-block">
            <h6><i class="bi bi-info-circle me-2"></i>Основная информация</h6>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Название:</strong> ${info.name}</p>
                    <p><strong>Преподаватель:</strong> ${info.teacher}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Дата:</strong> ${formatDate(order.date_start)}</p>
                    <p><strong>Время:</strong> ${order.time_start}</p>
                </div>
            </div>
        </div>
        
        <div class="details-info-block">
            <h6><i class="bi bi-clock me-2"></i>Параметры</h6>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Продолжительность:</strong> ${order.duration} ч.</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Количество студентов:</strong> ${order.persons}</p>
                </div>
            </div>
        </div>
        
        <div class="details-info-block">
            <h6><i class="bi bi-tags me-2"></i>Скидки и надбавки</h6>
            <div>${optionsHtml}</div>
        </div>
        
        <div class="alert alert-success mb-0">
            <h5 class="mb-0"><i class="bi bi-currency-dollar me-2"></i>Итоговая стоимость: ${order.price} ₽</h5>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
    modal.show();
}

// Открыть модальное окно редактирования
function openEditModal(orderId) {
    const order = allOrders.find(function(o) { return o.id === orderId; });
    if (!order) return;
    
    const info = getItemInfo(order);
    
    document.getElementById('edit-order-id').value = order.id;
    document.getElementById('edit-course-id').value = order.course_id || '';
    document.getElementById('edit-tutor-id').value = order.tutor_id || '';
    document.getElementById('edit-course-name').value = info.name;
    document.getElementById('edit-teacher-name').value = info.teacher;
    document.getElementById('edit-date').value = order.date_start;
    document.getElementById('edit-time').value = order.time_start;
    document.getElementById('edit-duration').value = order.duration + ' ч.';
    document.getElementById('edit-students').value = order.persons;
    
    // Заполняем чекбоксы
    document.getElementById('edit-supplementary').checked = order.supplementary;
    document.getElementById('edit-personalized').checked = order.personalized;
    document.getElementById('edit-excursions').checked = order.excursions;
    document.getElementById('edit-assessment').checked = order.assessment;
    document.getElementById('edit-interactive').checked = order.interactive;
    
    document.getElementById('edit-total-price').textContent = order.price;
    
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

// Расчет стоимости при редактировании
function calculateEditPrice() {
    const orderId = parseInt(document.getElementById('edit-order-id').value);
    const order = allOrders.find(function(o) { return o.id === orderId; });
    if (!order) return;
    
    const info = getItemInfo(order);
    const students = parseInt(document.getElementById('edit-students').value) || 1;
    const dateStart = document.getElementById('edit-date').value;
    const timeStart = document.getElementById('edit-time').value;
    
    let price = 0;
    
    if (info.type === 'course' && info.item) {
        const course = info.item;
        const totalHours = course.total_length * course.week_length;
        
        // Множитель за выходные
        let isWeekendOrHoliday = 1;
        if (dateStart) {
            const dayOfWeek = new Date(dateStart).getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                isWeekendOrHoliday = 1.5;
            }
        }
        
        // Надбавки за время
        let morningSurcharge = 0;
        let eveningSurcharge = 0;
        if (timeStart) {
            const hour = parseInt(timeStart.split(':')[0]);
            if (hour >= 9 && hour < 12) {
                morningSurcharge = 400;
            } else if (hour >= 18 && hour <= 20) {
                eveningSurcharge = 1000;
            }
        }
        
        price = ((course.course_fee_per_hour * totalHours * isWeekendOrHoliday) + morningSurcharge + eveningSurcharge) * students;
        
        // Автоматические опции
        if (course.week_length >= 5) {
            price *= 1.2;
        }
        
        if (dateStart) {
            const today = new Date();
            const courseDate = new Date(dateStart);
            const diffDays = Math.ceil((courseDate - today) / (1000 * 60 * 60 * 24));
            if (diffDays >= 30) {
                price *= 0.9;
            }
        }
        
        if (students >= 5) {
            price *= 0.85;
        }
        
        // Пользовательские опции
        if (document.getElementById('edit-supplementary').checked) {
            price += 2000 * students;
        }
        if (document.getElementById('edit-personalized').checked) {
            price += 1500 * course.total_length;
        }
        if (document.getElementById('edit-excursions').checked) {
            price *= 1.25;
        }
        if (document.getElementById('edit-assessment').checked) {
            price += 300;
        }
        if (document.getElementById('edit-interactive').checked) {
            price *= 1.5;
        }
        
    } else if (info.type === 'tutor' && info.item) {
        const tutor = info.item;
        price = tutor.price_per_hour * order.duration;
        
        if (dateStart) {
            const dayOfWeek = new Date(dateStart).getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                price *= 1.5;
            }
        }
        
        if (timeStart) {
            const hour = parseInt(timeStart.split(':')[0]);
            if (hour >= 9 && hour < 12) {
                price += 400;
            } else if (hour >= 18 && hour <= 20) {
                price += 1000;
            }
        }
        
        price *= students;
    }
    
    document.getElementById('edit-total-price').textContent = Math.round(price);
}

// Сохранение изменений
async function saveEdit() {
    const orderId = document.getElementById('edit-order-id').value;
    const dateStart = document.getElementById('edit-date').value;
    const timeStart = document.getElementById('edit-time').value;
    const persons = parseInt(document.getElementById('edit-students').value);
    const price = parseInt(document.getElementById('edit-total-price').textContent);
    
    if (!dateStart || !timeStart) {
        showNotification('Заполните все обязательные поля', 'warning');
        return;
    }
    
    const today = new Date();
    const orderDate = new Date(dateStart);
    const diffDays = Math.ceil((orderDate - today) / (1000 * 60 * 60 * 24));
    
    const updateData = {
        date_start: dateStart,
        time_start: timeStart,
        persons: persons,
        price: price,
        early_registration: diffDays >= 30,
        group_enrollment: persons >= 5,
        intensive_course: false,
        supplementary: document.getElementById('edit-supplementary').checked,
        personalized: document.getElementById('edit-personalized').checked,
        excursions: document.getElementById('edit-excursions').checked,
        assessment: document.getElementById('edit-assessment').checked,
        interactive: document.getElementById('edit-interactive').checked
    };
    
    // Проверяем интенсивный курс
    const order = allOrders.find(function(o) { return o.id === parseInt(orderId); });
    if (order && order.course_id) {
        const course = allCourses.find(function(c) { return c.id === order.course_id; });
        if (course && course.week_length >= 5) {
            updateData.intensive_course = true;
        }
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}?api_key=${API_KEY}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Заявка успешно обновлена!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
            
            // Обновляем данные в локальном массиве
            const index = allOrders.findIndex(function(o) { return o.id === parseInt(orderId); });
            if (index !== -1) {
                allOrders[index] = result;
            }
            displayOrders();
        } else {
            showNotification(result.error || 'Ошибка при обновлении заявки', 'danger');
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Ошибка соединения с сервером', 'danger');
    }
}

// Открыть модальное окно удаления
function openDeleteModal(orderId) {
    document.getElementById('delete-order-id').value = orderId;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

// Подтверждение удаления
async function confirmDelete() {
    const orderId = document.getElementById('delete-order-id').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}?api_key=${API_KEY}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Заявка успешно удалена!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
            
            // Удаляем из локального массива
            allOrders = allOrders.filter(function(o) { return o.id !== parseInt(orderId); });
            
            // Если на текущей странице нет записей, переходим на предыдущую
            const totalPages = Math.ceil(allOrders.length / ITEMS_PER_PAGE);
            if (currentOrderPage > totalPages && totalPages > 0) {
                currentOrderPage = totalPages;
            }
            
            displayOrders();
        } else {
            showNotification(result.error || 'Ошибка при удалении заявки', 'danger');
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
