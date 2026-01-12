const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // ❗ 587 = false, 465 = true
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendTempPasswordEmail = async (to, tempPassword) => {
  await transporter.verify();
  console.log('SMTP готов к отправке писем');
  await transporter.sendMail({
    from: `"DreamHouse" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Временный пароль для входа',
    html: `
      <p>Здравствуйте!</p>
      <p>Администратор установил вам временный пароль:</p>
      <h2>${tempPassword}</h2>
      <p>При первом входе система потребует сменить пароль.</p>
      <p>Если вы не запрашивали доступ — сообщите администратору.</p>
    `
  });
};

module.exports = { sendTempPasswordEmail };
