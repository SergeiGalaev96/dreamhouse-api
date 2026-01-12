const bcrypt = require('bcryptjs');

async function createAdminUser() {
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
    console.log(`
-- Удаление существующего пользователя (если есть)
DELETE FROM construction.users WHERE username = 'admin';

-- Вставка нового пользователя
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
) VALUES (
  'admin',
  'admin@example.com',
  '${hashedPassword}',
  'Админ',
  'Системы',
  'Сервисный',
  '+996555123456',
  1,
  NOW(),
  NOW()
);

-- Проверка вставленной записи
SELECT id, username, email, first_name, last_name FROM construction.users WHERE username = 'admin';
    `);
    
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
  }
}

createAdminUser();