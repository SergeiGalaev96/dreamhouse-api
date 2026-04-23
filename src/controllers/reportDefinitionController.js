const ReportDefinition = require('../models/ReportDefinition');

const normalizeReport = (report) => ({
  id: report.id,
  code: report.code,
  name: report.name,
  report_url: report.report_url,
  params_schema: report.params_schema || {},
  formats: {
    pdf: Boolean(report.allow_pdf),
    docx: Boolean(report.allow_docx),
    xlsx: Boolean(report.allow_xlsx)
  },
  sort_order: report.sort_order,
  active: report.active
});

const getActiveReportDefinitions = async (req, res) => {
  try {
    const reports = await ReportDefinition.findAll({
      where: {
        active: true,
        deleted: false
      },
      order: [
        ['sort_order', 'ASC'],
        ['id', 'ASC']
      ]
    });

    return res.json({
      success: true,
      data: reports.map(normalizeReport),
      pagination: {
        total: reports.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении списка отчетов',
      error: error.message
    });
  }
};

module.exports = {
  getActiveReportDefinitions
};
