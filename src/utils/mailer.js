const nodemailer = require('nodemailer');

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // ❗ 587 = false, 465 = true
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendTempPasswordEmail = async (to, tempPassword) => {
  await mailer.verify();
  console.log('SMTP готов к отправке писем');
  await mailer.sendMail({
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

const sendMaterialRequestEmail = async ({
  to,
  project_name,
  materialRequest,
  materialRequestItems = []
}) => {

  const rowsHtml = materialRequestItems.length
    ? materialRequestItems.map((item, index) => `
        <tr>
          <td style="padding:6px; border:1px solid #ddd;">${index + 1}</td>
          <td style="padding:6px; border:1px solid #ddd;">${item.material_name || '—'}</td>
          <td style="padding:6px; border:1px solid #ddd; text-align:right;">
            ${item.quantity} ${item.unit_name || ''}
          </td>
          <td style="padding:6px; border:1px solid #ddd;">
            ${item.comment || '—'}
          </td>
        </tr>
      `).join('')
    : `
      <tr>
        <td colspan="4" style="padding:8px; text-align:center;">
          Нет позиций
        </td>
      </tr>
    `;

  const html = `
    <p>Здравствуйте!</p>

    <p>
      Новая заявка на материалы была <b>полностью согласована</b> и готова к закупке.
    </p>

    <p>
      <b>ID заявки:</b> ${materialRequest.id}<br/>
      <b>Проект:</b> ${project_name}<br/>
      <b>Комментарий:</b> ${materialRequest.comment || '—'}
    </p>

    <h3>Состав заявки</h3>

    <table style="border-collapse:collapse; width:100%; font-size:14px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:6px; border:1px solid #ddd;">#</th>
          <th style="padding:6px; border:1px solid #ddd;">Материал</th>
          <th style="padding:6px; border:1px solid #ddd;">Количество</th>
          <th style="padding:6px; border:1px solid #ddd;">Комментарий</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <p style="margin-top:20px;">
      Пожалуйста, перейдите в систему для оформления закупки.
    </p>

    <p style="font-size:12px; color:#888;">
      Это письмо сформировано автоматически системой DreamHouse.
    </p>
  `;

  await mailer.sendMail({
    from: `"DreamHouse" <${process.env.SMTP_USER}>`,
    to,
    subject: `Новая заявка на материалы №${materialRequest.id}`,
    html
  });
};


module.exports = { sendTempPasswordEmail, sendMaterialRequestEmail };
