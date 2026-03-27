const cron = require('node-cron');
const { Op, Sequelize } = require('sequelize');

const Task = require('../models/Task');
const User = require('../models/User');

const { sendTaskDeadlineReminderEmail } = require('./mailer');

const startTaskDeadlineNotifier = () => {

  // каждый день в 11:00
  cron.schedule('1 11 * * *', async () => {

    try {

      console.log("⏰ Проверка дедлайнов задач...");

      // ===== уведомление за 3 дня =====

      const tasks3Days = await Task.findAll({
        where: {
          notify_3_days: false,
          status: {
            [Op.notIn]: [4, 5]   // исключаем завершенные и отмененные
          },
          [Op.and]: Sequelize.literal(`DATE(deadline) - CURRENT_DATE = 3`)
        }
      });

      for (const task of tasks3Days) {

        const user = await User.findByPk(task.responsible_user_id);

        if (user?.email) {

          await sendTaskDeadlineReminderEmail({
            to: user.email,
            task,
            daysLeft: 3
          });

          console.log(`📧 Напоминание за 3 дня отправлено | task_id=${task.id}`);

        }

        await task.update({ notify_3_days: true });

      }

      // ===== уведомление за 1 день =====

      const tasks1Day = await Task.findAll({
        where: {
          notify_1_day: false,
          status: {
            [Op.notIn]: [4, 5]
          },
          [Op.and]: Sequelize.literal(`DATE(deadline) - CURRENT_DATE = 1`)
        }
      });

      for (const task of tasks1Day) {

        const user = await User.findByPk(task.responsible_user_id);

        if (user?.email) {

          await sendTaskDeadlineReminderEmail({
            to: user.email,
            task,
            daysLeft: 1
          });

          console.log(`📧 Напоминание за 1 день отправлено | task_id=${task.id}`);

        }

        await task.update({ notify_1_day: true });

      }

      console.log("✅ Проверка дедлайнов завершена");

    } catch (error) {

      console.error("❌ Ошибка cron уведомлений:", error);

    }

  });

};

module.exports = startTaskDeadlineNotifier;