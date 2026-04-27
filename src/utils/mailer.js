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

const sendPurchaseOrderSupplierEmail = async ({
  to,
  supplier_name,
  project_name,
  block_name,
  purchaseOrder,
  purchaseOrderItems = []
}) => {
  const locationLabel = [project_name, block_name].filter(Boolean).join(', ');

  const rowsHtml = purchaseOrderItems.length
    ? purchaseOrderItems.map((item, index) => `
        <tr>
          <td style="padding:6px; border:1px solid #ddd;">${index + 1}</td>
          <td style="padding:6px; border:1px solid #ddd;">${item.material_name || '—'}</td>
          <td style="padding:6px; border:1px solid #ddd; text-align:right;">
            ${item.quantity ?? '—'} ${item.unit_name || ''}
          </td>
        </tr>
      `).join('')
    : `
      <tr>
        <td colspan="3" style="padding:8px; text-align:center;">
          Нет позиций
        </td>
      </tr>
    `;

  const html = `
    <p>Здравствуйте${supplier_name ? `, ${supplier_name}` : ''}!</p>

    <p>
      Для вас создана новая заявка на закуп материалов.
    </p>

    <p>
      <b>ID заявки:</b> ${purchaseOrder.id}<br/>
      <b>Проект:</b> ${locationLabel || '—'}
    </p>

    <h3>Позиции закупа</h3>

    <table style="border-collapse:collapse; width:100%; font-size:14px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:6px; border:1px solid #ddd;">#</th>
          <th style="padding:6px; border:1px solid #ddd;">Материал</th>
          <th style="padding:6px; border:1px solid #ddd;">Количество</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <p style="margin-top:20px;">
      Пожалуйста, перейдите в систему DreamHouse для обработки заявки.
    </p>

    <p style="font-size:12px; color:#888;">
      Это письмо сформировано автоматически системой DreamHouse.
    </p>
  `;

  await mailer.sendMail({
    from: `"DreamHouse" <${process.env.SMTP_USER}>`,
    to,
    subject: `Новая заявка на закуп №${purchaseOrder.id}`,
    html
  });
};

const formatDate = (date) => {
  if (!date) return '—';

  const d = new Date(date);

  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const sendTaskAssignedEmail = async ({ to, task, creator_name, priority }) => {
  const html = `
    <p>Здравствуйте!</p>

    <p>
      Вам назначена новая задача в системе <b>DreamHouse</b>.
    </p>

    <p>
      <b>Название задачи:</b> ${task.title}<br/>
      <b>Описание:</b> ${task.description || '—'}<br/>
      <b>Срок выполнения:</b> ${formatDate(task.deadline) || 'не указан'}<br/>
      <b>Назначил:</b> ${creator_name || 'Руководитель'}<br/>
      <b>Приоритет:</b> ${priority || '—'}
    </p>

    <p style="margin-top:20px;">
      Пожалуйста, перейдите в систему для выполнения задачи.
    </p>

    <p style="font-size:12px; color:#888;">
      Это письмо сформировано автоматически системой DreamHouse.
    </p>
  `;

  await mailer.sendMail({
    from: `"DreamHouse" <${process.env.SMTP_USER}>`,
    to,
    subject: `Новая задача: ${task.title}`,
    html
  });

};

const sendTaskStatusChangedEmail = async ({ to, task, creator_name, responsible_user_name, priority, status }) => {
  const html = `
    <p>Здравствуйте!</p>

    <p>
      Задача в системе <b>DreamHouse</b> получила новый статус.
    </p>

    <p>
      <b>Название задачи:</b> ${task.title}<br/>
      <b>Описание:</b> ${task.description || '—'}<br/>
      <b>Срок выполнения:</b> ${formatDate(task.deadline) || 'не указан'}<br/>
      <b>Назначил:</b> ${creator_name}<br/>
      <b>Исполнитель:</b> ${responsible_user_name}<br/>
      <b>Приоритет:</b> ${priority || '—'}<br/>
      <b>Статус:</b> ${status || '—'}
    </p>

    <p style="font-size:12px; color:#888;">
      Это письмо сформировано автоматически системой DreamHouse.
    </p>
  `;

  await mailer.sendMail({
    from: `"DreamHouse" <${process.env.SMTP_USER}>`,
    to,
    subject: `Обновление задачи: ${task.title}`,
    html
  });

};



const sendTaskDeadlineReminderEmail = async ({
  to,
  task,
  daysLeft
}) => {

  const html = `
    <p><b>До срока выполнения осталось ${daysLeft} ${daysLeft === 1 ? 'день' : 'дня'}</b></p>

    <p>
      <b>Задача:</b> ${task.title}
    </p>

    <p>
      <b>Описание:</b><br/>
      ${task.description || '—'}
    </p>

    <p>
      <b>Срок выполнения:</b> ${formatDate(task.deadline)}
    </p>

    <p style="font-size:12px;color:#888;">
      Это автоматическое уведомление системы DreamHouse.
    </p>
  `;

  await mailer.sendMail({
    from: `"DreamHouse" <${process.env.SMTP_USER}>`,
    to,
    subject: `Напоминание о задаче`,
    html
  });

};

module.exports = {
  sendTempPasswordEmail,
  sendMaterialRequestEmail,
  sendPurchaseOrderSupplierEmail,
  sendTaskAssignedEmail,
  sendTaskStatusChangedEmail,
  sendTaskDeadlineReminderEmail
};
