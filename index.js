const allowedNumber = '77763777408'; // замените на нужный вам номер
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');

const client = new Client();

// Здесь хранятся состояния пользователей и таймеры для напоминаний
let userStates = {};
let userTimers = {};

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', message => {

    if (message.from === `${allowedNumber}@c.us`) {

        const userId = message.from;

        // Если пользователь новый, устанавливаем начальное состояние
        if (!userStates[userId]) {
            userStates[userId] = { step: 'language', previousStep: null, account: null, readings: null };
        }

        const userState = userStates[userId];

        // Сброс таймера на каждом шаге
        clearTimeout(userTimers[userId]);

        // Установка таймера для напоминания
        userTimers[userId] = setTimeout(() => {
            client.sendMessage(message.from, 'Пожалуйста, выберите один из предложенных вариантов.');
        }, 15000); // 15 секунд

        if (message.body === '0' && userState.previousStep) {
            // Возврат к предыдущему шагу
            userState.step = userState.previousStep;
            client.sendMessage(message.from, 'Возвращение к предыдущему этапу...');
            // Повторный вывод содержания этапа после возврата
            handleStep(client, message.from, userState);
            return;
        }

        handleStep(client, message.from, userState, message.body);
    }
});

function handleStep(client, userId, userState, userInput = null) {
    switch (userState.step) {
        case 'language':
            client.sendMessage(userId, `Добро пожаловать! 
                Выберите язык:
                1. Қазақ тілі
                2. Русский язык
            `);
            userState.previousStep = null; // Нет предыдущего этапа для выбора языка
            userState.step = 'selectLanguage';
            break;

        case 'selectLanguage':
            if (userInput === '1') {
                userState.language = 'kazakh';
                client.sendMessage(userId, 'Сіз қазақ тілін таңдадыңыз.\n1. Қызметтер\n2. Шотты көру\n3. Показания приборов\n0. Артқа қайту');
                userState.previousStep = 'language';
                userState.step = 'mainMenu';
            } else if (userInput === '2') {
                userState.language = 'russian';
                client.sendMessage(userId, 'Вы выбрали русский язык.\n1. Услуги\n2. Посмотреть счет\n3. Показания приборов\n0. Вернуться назад');
                userState.previousStep = 'language';
                userState.step = 'mainMenu';
            } else {
                client.sendMessage(userId, 'Неверный выбор. Пожалуйста, выберите 1 или 2.');
            }
            break;

        case 'mainMenu':
            if (userInput === '1') {
                if (userState.language === 'kazakh') {
                    client.sendMessage(userId, 'Сіз қызметтерді таңдадыңыз.\n1. Мобильді байланыс\n2. Интернет\n0. Артқа қайту');
                } else if (userState.language === 'russian') {
                    client.sendMessage(userId, 'Вы выбрали услуги.\n1. Мобильная связь\n2. Интернет\n0. Вернуться назад');
                }
                userState.previousStep = 'mainMenu';
                userState.step = 'services';
            } else if (userInput === '2') {
                if (userState.language === 'kazakh') {
                    client.sendMessage(userId, 'Сіздің шотыңыз 10000 теңге.\n0. Артқа қайту');
                } else if (userState.language === 'russian') {
                    client.sendMessage(userId, 'Ваш баланс составляет 10000 тенге.\n0. Вернуться назад');
                }
                userState.previousStep = 'mainMenu';
                userState.step = 'mainMenu';
            } else if (userInput === '3') {
                if (userState.language === 'kazakh') {
                    client.sendMessage(userId, 'Лицевой счетты енгізіңіз:\n0. Артқа қайту');
                } else if (userState.language === 'russian') {
                    client.sendMessage(userId, 'Введите лицевой счет:\n0. Вернуться назад');
                }
                userState.previousStep = 'mainMenu';
                userState.step = 'enterAccount';
            } else if (userInput === '0' && userState.previousStep) {
                // Логика возврата уже обработана выше, поэтому не нужно ее снова проверять
                return;
            } else {
                client.sendMessage(userId, 'Неверный выбор. Пожалуйста, выберите 1, 2 или 3. Чтобы вернуться назад, нажмите 0.');
            }
            break;

        case 'enterAccount':
            if (userInput === '0' && userState.previousStep) {
                // Логика возврата уже обработана выше, поэтому не нужно ее снова проверять
                return;
            } else if (userInput) {
                userState.account = userInput;
                if (userState.language === 'kazakh') {
                    client.sendMessage(userId, 'Прибор көрсеткіштерін енгізіңіз:\n0. Артқа қайту');
                } else if (userState.language === 'russian') {
                    client.sendMessage(userId, 'Введите показания прибора:\n0. Вернуться назад');
                }
                userState.previousStep = 'enterAccount';
                userState.step = 'enterReadings';
            }
            break;

        case 'enterReadings':
            if (userInput === '0' && userState.previousStep) {
                // Логика возврата уже обработана выше, поэтому не нужно ее снова проверять
                return;
            } else if (userInput) {
                userState.readings = userInput;
                // Здесь можно добавить логику для отправки данных в систему и получения ответа.
                // Например:
                // const response = sendToSystem(userState.account, userState.readings);

                if (userState.language === 'kazakh') {
                    client.sendMessage(userId, 'Сіз көрсеткіштерді енгіздіңіз. Деректер өңделуде.');
                } else if (userState.language === 'russian') {
                    client.sendMessage(userId, 'Вы ввели показания. Данные обрабатываются.');
                }
                userState.previousStep = 'enterReadings';
                userState.step = 'mainMenu';
            }
            break;

        case 'services':
            if (userInput === '1') {
                if (userState.language === 'kazakh') {
                    client.sendMessage(userId, 'Сіз мобильді байланысты таңдадыңыз.\n0. Артқа қайту');
                } else if (userState.language === 'russian') {
                    client.sendMessage(userId, 'Вы выбрали мобильную связь.\n0. Вернуться назад');
                }
                userState.previousStep = 'services';
                userState.step = 'mainMenu';
            } else if (userInput === '2') {
                if (userState.language === 'kazakh') {
                    client.sendMessage(userId, 'Сіз интернетті таңдадыңыз.\n0. Артқа қайту');
                } else if (userState.language === 'russian') {
                    client.sendMessage(userId, 'Вы выбрали интернет.\n0. Вернуться назад');
                }
                userState.previousStep = 'services';
                userState.step = 'mainMenu';
            } else if (userInput === '0' && userState.previousStep) {
                // Логика возврата уже обработана выше, поэтому не нужно ее снова проверять
                return;
            } else {
                client.sendMessage(userId, 'Неверный выбор. Пожалуйста, выберите 1 или 2. Чтобы вернуться назад, нажмите 0.');
            }
            break;

        default:
            userState.step = 'language';
            break;
    }
}

client.initialize();
