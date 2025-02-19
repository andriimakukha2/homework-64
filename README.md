# **Веб-додаток на Express.js з аутентифікацією та керуванням користувачами**

## 📌 **Опис**
Цей проект є базовим веб-додатком, що використовує `Express.js` для аутентифікації користувачів за допомогою `Passport.js`. Він реалізує:  
- **Реєстрацію та вхід користувачів**  
- **Захищені маршрути** (доступні тільки авторизованим користувачам)  
- **Керування темою сайту** через сесії  
- **CRUD-операції з даними користувачів** у `MongoDB`  

---

## 🚀 **Технології**
- **Express.js** — створення веб-сервера  
- **Passport.js** — аутентифікація користувачів  
- **MongoDB** + **Mongoose** — зберігання та управління даними  
- **Bcryptjs** — хешування паролів  
- **EJS/Pug** — рендеринг шаблонів  
- **Express-session** + **Cookie-parser** — збереження сесій користувачів  
- **Connect-flash** — flash-повідомлення  
- **dotenv** — керування змінними середовища  

---

## 🔧 **Встановлення**
1. **Клонуйте репозиторій**  
   ```bash
   git clone <посилання на репозиторій>
   cd <назва папки з проєктом>

2. **Встановіть залежності**
   ```bash
   npm install

3. **Створіть файл .env у кореневій директорії та додайте наступні змінні**
   ```bash
   SESSION_SECRET=your-session-secret
   MONGO_URI=your-mongodb-uri

4. **Запустіть сервер**
   ```bash
   npm start
Сервер буде доступний за адресою http://localhost:3001.


📂 Структура проекту
 /project
  /public
    /styles
      styles.css
  /views
    layout.pug
    index.pug
  /routes
    auth.js
    settings.js
    users.js
    userData.js  <- Додано маршрути для CRUD-операцій
  /models
    User.js
  server.js
  .env
  README.md

✨ Основні функції
 🔑 Аутентифікація

✅ Реєстрація користувача – введення імені, email, пароля та віку
✅ Вхід користувача – автентифікація через email і пароль
✅ Захищені маршрути – обмежений доступ для авторизованих користувачів
✅ Сесії – для збереження стану авторизації

🎨 Керування темою сайту

✅ Вибір між світлою та темною темою
✅ Збереження теми в сесії (а не в cookie)

🛠 CRUD-операції з користувачами

✅ Створення користувачів (одного або багатьох)
✅ Оновлення (одного чи багатьох, а також повна заміна документа)
✅ Видалення (одного або багатьох)
✅ Читання з фільтрацією та проекцією
