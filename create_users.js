const bcrypt = require('bcryptjs');

async function createUsers() {
  try {
    // Пароль для пользователя
    const plainPassword = 'password123';
    
    // Создаем хеш пароля с правильным количеством раундов
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    
    console.log('=== Создание пользователя admin ===');
    console.log('Пароль:', plainPassword);
    console.log('Хеш пароля:', hashedPassword);
    console.log();
    
    // SQL запрос для вставки пользователя
    console.log('Выполните этот SQL запрос в вашей базе данных:');
    console.log(`-- ============================================
-- Вставка 20 тестовых пользователей
-- ============================================

INSERT INTO construction.users (
  username,
  email,
  password_hash,
  first_name,
  last_name,
  middle_name,
  phone,
  role_id,
  created_at,
  updated_at
)
VALUES
('sergei.galaev', 'sergei.galaev@example.com', '${hashedPassword}', 'Сергей', 'Галаев', 'Андреевич', '+996501112233', 2, NOW(), NOW()),
('aidar.bekov', 'aidar.bekov@example.com', '${hashedPassword}', 'Айдар', 'Беков', 'Нурланович', '+996700123456', 3, NOW(), NOW()),
('nursulu.kadyrova', 'nursulu.kadyrova@example.com', '${hashedPassword}', 'Нурсулу', 'Кадырова', 'Джумашевна', '+996555987654', 6, true, NOW(), NOW()),
('timur.sydykov', 'timur.sydykov@example.com', '${hashedPassword}', 'Тимур', 'Сыдыков', 'Азаматович', '+996770112244', 4, NOW(), NOW()),
('diana.umarova', 'diana.umarova@example.com', '${hashedPassword}', 'Диана', 'Умарова', 'Калыковна', '+996709556677', 8, NOW(), NOW()),
('alina.muratova', 'alina.muratova@example.com', '${hashedPassword}', 'Алина', 'Муратова', 'Эркиновна', '+996550223344', 7, NOW(), NOW()),
('bolot.toktonaliev', 'bolot.toktonaliev@example.com', '${hashedPassword}', 'Болот', 'Токтонаалиев', 'Тилекович', '+996558998877', 5, NOW(), NOW()),
('adil.kubatov', 'adil.kubatov@example.com', '${hashedPassword}', 'Адиль', 'Кубатов', 'Сейитович', '+996701334455', 3, NOW(), NOW()),
('elnura.saparova', 'elnura.saparova@example.com', '${hashedPassword}', 'Эльнура', 'Сапарова', 'Томировна', '+996555778899', 6, NOW(), NOW()),
('amir.kasymov', 'amir.kasymov@example.com', '${hashedPassword}', 'Амир', 'Касымов', 'Байышевич', '+996702991122', 4, NOW(), NOW()),
('zarina.askarova', 'zarina.askarova@example.com', '${hashedPassword}', 'Зарина', 'Аскарова', 'Нурсултановна', '+996709112255', 8, NOW(), NOW()),
('ruslan.akmatov', 'ruslan.akmatov@example.com', '${hashedPassword}', 'Руслан', 'Акматов', 'Умарович', '+996557443322', 1, NOW(), NOW()),
('eldar.momunov', 'eldar.momunov@example.com', '${hashedPassword}', 'Элдар', 'Момунов', 'Дастанович', '+996700664422', 7, NOW(), NOW()),
('asylkan.uulu', 'asylkan.uulu@example.com', '${hashedPassword}', 'Асылкан', 'Уулу', 'Таирбекович', '+996770556688', 5, NOW(), NOW()),
('kanykei.jakupova', 'kanykei.jakupova@example.com', '${hashedPassword}', 'Каныкей', 'Жакупова', 'Тураровна', '+996557667788', 6, NOW(), NOW()),
('mirlan.kurmanbekov', 'mirlan.kurmanbekov@example.com', '${hashedPassword}', 'Мирлан', 'Курманбеков', 'Абдырахманович', '+996702889944', 4, NOW(), NOW()),
('aliya.turusheva', 'aliya.turusheva@example.com', '${hashedPassword}', 'Алия', 'Турушeва', 'Жаныбековна', '+996709332211', 3, NOW(), NOW()),
('adilina.sadykova', 'adilina.sadykova@example.com', '${hashedPassword}', 'Адилина', 'Садыкова', 'Рахмановна', '+996550991133', 6, NOW(), NOW()),
('maksat.medeuov', 'maksat.medeuov@example.com', '${hashedPassword}', 'Максат', 'Медеуов', 'Шералиевич', '+996558773344', 7, NOW(), NOW()),
('gulsara.sydykova', 'gulsara.sydykova@example.com', '${hashedPassword}', 'Гульсара', 'Сыдыкова', 'Туманбаевна', '+996556110022', 8, NOW(), NOW());
`);
    
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
  }
}

createUsers();
