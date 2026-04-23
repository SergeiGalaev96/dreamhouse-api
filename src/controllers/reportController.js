const sequelize = require('../config/database');

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatScheduleQuantity = (value) => {
  const number = toNumber(value);
  return number.toFixed(3).replace(/\.?0+$/, '');
};

const toDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const addDays = (value, days) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const monthNames = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря'
];

const formatPeriodLabel = (dateFrom, dateTo) => {
  if (!dateFrom || !dateTo) return '';

  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return `${dateFrom} - ${dateTo}`;
  }

  if (
    from.getUTCFullYear() === to.getUTCFullYear() &&
    from.getUTCMonth() === to.getUTCMonth()
  ) {
    return `${monthNames[from.getUTCMonth()]} ${from.getUTCFullYear()} г.`;
  }

  return `${dateFrom} - ${dateTo}`;
};

const formatDateLabel = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
};

/* ============================================================
   WORK PERFORMED REPORT
============================================================ */
const getWorkPerformedReport = async (req, res) => {
  try {

    const { id } = req.params;

    const header = await sequelize.query(
      `
      SELECT
        wp.*,
        p.name AS project_name,
        pb.name AS block_name,
        CASE wp.status
          WHEN 1 THEN 'Создан'
          WHEN 2 THEN 'Подписан'
          WHEN 3 THEN 'В работе'
          WHEN 4 THEN 'Завершен'
          WHEN 5 THEN 'Отменен'
          ELSE 'Неизвестно'
        END AS status_name,
        CONCAT(fu.first_name, ' ', fu.last_name) AS assigned_foreman_name,
        CONCAT(pu.first_name, ' ', pu.last_name) AS assigned_planning_engineer_name,
        CONCAT(mu.first_name, ' ', mu.last_name) AS assigned_main_engineer_name,
        CASE
          WHEN wp.signed_by_foreman = true
          THEN CONCAT(fu.first_name, ' ', fu.last_name)
          ELSE NULL
        END AS foreman_name,
        CASE
          WHEN wp.signed_by_planning_engineer = true
          THEN CONCAT(pu.first_name, ' ', pu.last_name)
          ELSE NULL
        END AS planning_engineer_name,
        CASE
          WHEN wp.signed_by_main_engineer = true
          THEN CONCAT(mu.first_name, ' ', mu.last_name)
          ELSE NULL
        END AS main_engineer_name
      FROM construction.work_performed wp
      LEFT JOIN construction.project_blocks pb
        ON pb.id = wp.block_id
      LEFT JOIN construction.projects p
        ON p.id = wp.project_id
      LEFT JOIN construction.users fu
        ON fu.id = wp.foreman_user_id
      LEFT JOIN construction.users pu
        ON pu.id = wp.planning_engineer_user_id
      LEFT JOIN construction.users mu
        ON mu.id = wp.main_engineer_user_id
      WHERE wp.id = :id
        AND wp.deleted = false
      `,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!header.length) {
      return res.status(404).json({
        success: false,
        message: 'Акт не найден'
      });
    }

    const items = await sequelize.query(
      `
      SELECT
        wpi.*,
        st.name AS service_type_name,
        s.name AS service_name,
        u.name AS unit_name,
        bs.name AS stage_name,
        ss.name AS subsection_name,
        CASE
          WHEN wpi.currency = 1 THEN wpi.price
          ELSE wpi.price * COALESCE(wpi.currency_rate, 1)
        END AS price_converted,
        (
          wpi.quantity *
          CASE
            WHEN wpi.currency = 1 THEN wpi.price
            ELSE wpi.price * COALESCE(wpi.currency_rate, 1)
          END
        ) AS total
      FROM construction.work_performed_items wpi
      LEFT JOIN construction.services s
        ON s.id = wpi.service_id
      LEFT JOIN construction.service_types st
        ON st.id = wpi.service_type
      LEFT JOIN construction.units_of_measure u
        ON u.id = wpi.unit_of_measure
      LEFT JOIN construction.block_stages bs
        ON bs.id = wpi.stage_id
      LEFT JOIN construction.stage_subsections ss
        ON ss.id = wpi.subsection_id
      WHERE wpi.work_performed_id = :id
        AND wpi.deleted = false
      ORDER BY wpi.created_at ASC
      `,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const total = items.reduce((sum, i) => sum + Number(i.total || 0), 0);
    const advancePayment = Number(header[0].advance_payment || 0);
    const remaining = total - advancePayment;

    res.json({
      success: true,
      data: {
        header: header[0],
        items,
        total,
        advance_payment: advancePayment,
        remaining
      }
    });

  } catch (error) {

    console.error('Report error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка формирования отчета',
      error: error.message
    });

  }
};

/* ============================================================
   FORM 29 REPORT
============================================================ */
const getForm29Report = async (req, res) => {
  try {

    const {
      block_id,
      date_from,
      date_to
    } = req.body || {};

    const blockId = Number(block_id);
    const dateFrom = toDateOnly(date_from);
    const dateTo = toDateOnly(date_to);

    if (!blockId || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Нужны block_id, date_from и date_to'
      });
    }

    const [header] = await sequelize.query(
      `
      SELECT
        pb.id AS block_id,
        pb.name AS block_name,
        p.id AS project_id,
        p.name AS project_name
      FROM construction.project_blocks pb
      JOIN construction.projects p
        ON p.id = pb.project_id
      WHERE pb.id = :blockId
        AND pb.deleted = false
      LIMIT 1
      `,
      {
        replacements: { blockId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!header) {
      return res.status(404).json({
        success: false,
        message: 'Блок не найден'
      });
    }

    const estimateServices = await sequelize.query(
      `
      SELECT
        mei.id,
        mei.stage_id,
        mei.subsection_id,
        mei.service_id,
        mei.unit_of_measure,
        mei.quantity_planned,
        COALESCE(s.name, mei.comment, 'Услуга') AS service_name,
        bs.name AS stage_name,
        ss.name AS subsection_name,
        u.name AS unit_name
      FROM construction.material_estimate_items mei
      JOIN construction.material_estimates me
        ON me.id = mei.material_estimate_id
       AND me.deleted = false
      LEFT JOIN construction.services s
        ON s.id = mei.service_id
      LEFT JOIN construction.block_stages bs
        ON bs.id = mei.stage_id
      LEFT JOIN construction.stage_subsections ss
        ON ss.id = mei.subsection_id
      LEFT JOIN construction.units_of_measure u
        ON u.id = mei.unit_of_measure
      WHERE me.block_id = :blockId
        AND mei.deleted = false
        AND mei.item_type = 2
      ORDER BY mei.stage_id, mei.subsection_id, mei.id
      `,
      {
        replacements: { blockId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const estimateMaterials = await sequelize.query(
      `
      SELECT
        mei.id,
        mei.stage_id,
        mei.subsection_id,
        mei.material_id,
        mei.entry_type,
        mei.coefficient,
        mei.unit_of_measure,
        mei.quantity_planned,
        m.name AS material_name,
        bs.name AS stage_name,
        ss.name AS subsection_name,
        u.name AS unit_name
      FROM construction.material_estimate_items mei
      JOIN construction.material_estimates me
        ON me.id = mei.material_estimate_id
       AND me.deleted = false
      LEFT JOIN construction.materials m
        ON m.id = mei.material_id
      LEFT JOIN construction.block_stages bs
        ON bs.id = mei.stage_id
      LEFT JOIN construction.stage_subsections ss
        ON ss.id = mei.subsection_id
      LEFT JOIN construction.units_of_measure u
        ON u.id = mei.unit_of_measure
      WHERE me.block_id = :blockId
        AND mei.deleted = false
        AND mei.item_type = 1
      ORDER BY mei.stage_id, mei.subsection_id, mei.id
      `,
      {
        replacements: { blockId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const workRows = await sequelize.query(
      `
      SELECT
        wpi.id AS work_performed_item_id,
        wp.id AS work_performed_id,
        wp.code AS work_performed_code,
        COALESCE(s.name, 'Работа') AS work_name,
        wpi.stage_id,
        wpi.subsection_id,
        wpi.unit_of_measure,
        wpi.quantity,
        bs.name AS stage_name,
        ss.name AS subsection_name,
        u.name AS unit_name,
        COALESCE(
          wp.signed_by_main_engineer_time::date,
          wp.updated_at::date,
          wp.created_at::date
        ) AS signed_date
      FROM construction.work_performed_items wpi
      JOIN construction.work_performed wp
        ON wp.id = wpi.work_performed_id
      LEFT JOIN construction.services s
        ON s.id = wpi.service_id
      LEFT JOIN construction.block_stages bs
        ON bs.id = wpi.stage_id
      LEFT JOIN construction.stage_subsections ss
        ON ss.id = wpi.subsection_id
      LEFT JOIN construction.units_of_measure u
        ON u.id = wpi.unit_of_measure
      WHERE wp.block_id = :blockId
        AND wp.deleted = false
        AND wpi.deleted = false
        AND wp.status = 2
        AND wp.signed_by_foreman = true
        AND wp.signed_by_planning_engineer = true
        AND wp.signed_by_main_engineer = true
        AND COALESCE(
          wp.signed_by_main_engineer_time::date,
          wp.updated_at::date,
          wp.created_at::date
        ) BETWEEN :dateFrom AND :dateTo
      ORDER BY wpi.stage_id, wpi.subsection_id, wp.id, wpi.id
      `,
      {
        replacements: {
          blockId,
          dateFrom,
          dateTo
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const writeOffFacts = await sequelize.query(
      `
      SELECT
        mwo.work_performed_item_id,
        mwoi.material_id,
        SUM(mwoi.quantity) AS quantity,
        MAX(m.name) AS material_name,
        MAX(u.name) AS unit_name
      FROM construction.material_write_offs mwo
      JOIN construction.material_write_off_items mwoi
        ON mwoi.material_write_off_id = mwo.id
       AND (mwoi.deleted = false OR mwoi.deleted IS NULL)
      LEFT JOIN construction.materials m
        ON m.id = mwoi.material_id
      LEFT JOIN construction.units_of_measure u
        ON u.id = mwoi.unit_of_measure
      WHERE mwo.block_id = :blockId
        AND (mwo.deleted = false OR mwo.deleted IS NULL)
        AND mwo.status = 3
        AND mwo.posted_at >= CAST(:dateFrom AS timestamp)
        AND mwo.posted_at < CAST(:dateTo AS timestamp) + INTERVAL '1 day'
      GROUP BY mwo.work_performed_item_id, mwoi.material_id
      `,
      {
        replacements: {
          blockId,
          dateFrom,
          dateTo
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const subsectionServicePlanByUnit = new Map();
    const subsectionServicePlan = new Map();
    for (const service of estimateServices) {
      const key = `${service.stage_id || 0}_${service.subsection_id || 0}_${service.unit_of_measure || 0}`;
      subsectionServicePlanByUnit.set(
        key,
        toNumber(subsectionServicePlanByUnit.get(key)) + toNumber(service.quantity_planned)
      );

      const subsectionKey = `${service.stage_id || 0}_${service.subsection_id || 0}`;
      subsectionServicePlan.set(
        subsectionKey,
        toNumber(subsectionServicePlan.get(subsectionKey)) + toNumber(service.quantity_planned)
      );
    }

    const estimateMaterialsBySubsection = new Map();
    const subsectionMaterials = new Map();
    const globalMaterialMap = new Map();

    const ensureSubsectionMaterial = (subsectionKey, material) => {
      if (!subsectionMaterials.has(subsectionKey)) {
        subsectionMaterials.set(subsectionKey, new Map());
      }

      const materialMap = subsectionMaterials.get(subsectionKey);
      const materialId = Number(material.material_id);

      if (!materialMap.has(materialId)) {
        materialMap.set(materialId, {
          material_id: materialId,
          material_name: material.material_name || `Материал #${materialId}`,
          unit_name: material.unit_name || '',
          unit_of_measure: material.unit_of_measure ? Number(material.unit_of_measure) : null,
          quantity_planned: 0,
          coefficient: toNumber(material.coefficient),
          is_additional: Boolean(material.is_additional)
        });
      }

      const current = materialMap.get(materialId);
      current.quantity_planned += toNumber(material.quantity_planned);
      if (!toNumber(current.coefficient) && toNumber(material.coefficient)) {
        current.coefficient = toNumber(material.coefficient);
      }
      current.is_additional = current.is_additional || Boolean(material.is_additional);
      materialMap.set(materialId, current);

      if (!globalMaterialMap.has(materialId)) {
        globalMaterialMap.set(materialId, {
          material_id: materialId,
          material_name: current.material_name,
          unit_name: current.unit_name,
          is_additional: Boolean(material.is_additional),
          coefficient: toNumber(material.coefficient),
          has_fact: false,
          from_estimate: true
        });
      } else {
        const currentGlobalMaterial = globalMaterialMap.get(materialId);
        currentGlobalMaterial.is_additional =
          currentGlobalMaterial.is_additional || Boolean(material.is_additional);
        currentGlobalMaterial.from_estimate = true;
        if (!currentGlobalMaterial.unit_name && current.unit_name) {
          currentGlobalMaterial.unit_name = current.unit_name;
        }
        if (!currentGlobalMaterial.material_name && current.material_name) {
          currentGlobalMaterial.material_name = current.material_name;
        }
        if (!toNumber(currentGlobalMaterial.coefficient) && toNumber(material.coefficient)) {
          currentGlobalMaterial.coefficient = toNumber(material.coefficient);
        }
        globalMaterialMap.set(materialId, currentGlobalMaterial);
      }
    };

    for (const material of estimateMaterials) {
      const subsectionKey = `${material.stage_id || 0}_${material.subsection_id || 0}`;
      if (!estimateMaterialsBySubsection.has(subsectionKey)) {
        estimateMaterialsBySubsection.set(subsectionKey, new Map());
      }

      const subsectionEstimateMap = estimateMaterialsBySubsection.get(subsectionKey);
      const materialId = Number(material.material_id);

      if (!subsectionEstimateMap.has(materialId)) {
        subsectionEstimateMap.set(materialId, {
          material_id: materialId,
          material_name: material.material_name || `Материал #${materialId}`,
          unit_name: material.unit_name || '',
          unit_of_measure: material.unit_of_measure ? Number(material.unit_of_measure) : null,
          quantity_planned: 0,
          coefficient: toNumber(material.coefficient),
          is_additional: Number(material.entry_type) === 2
        });
      }

      const current = subsectionEstimateMap.get(materialId);
      current.quantity_planned += toNumber(material.quantity_planned);
      if (!toNumber(current.coefficient) && toNumber(material.coefficient)) {
        current.coefficient = toNumber(material.coefficient);
      }
      current.is_additional = current.is_additional || Number(material.entry_type) === 2;
      subsectionEstimateMap.set(materialId, current);

      ensureSubsectionMaterial(subsectionKey, {
        material_id: material.material_id,
        material_name: current.material_name,
        unit_name: current.unit_name,
        unit_of_measure: current.unit_of_measure,
        quantity_planned: toNumber(material.quantity_planned),
        coefficient: current.coefficient,
        is_additional: current.is_additional
      });
    }

    const factByWorkAndMaterial = new Map();
    for (const fact of writeOffFacts) {
      const key = `${fact.work_performed_item_id}_${fact.material_id}`;
      factByWorkAndMaterial.set(key, toNumber(fact.quantity));

      const materialId = Number(fact.material_id);
      if (!globalMaterialMap.has(materialId)) {
        globalMaterialMap.set(materialId, {
          material_id: materialId,
          material_name: fact.material_name || `Материал #${materialId}`,
          unit_name: fact.unit_name || '',
          is_additional: false,
          has_fact: true,
          from_estimate: false
        });
      } else {
        const currentGlobalMaterial = globalMaterialMap.get(materialId);
        currentGlobalMaterial.has_fact = true;
        if (!currentGlobalMaterial.unit_name && fact.unit_name) {
          currentGlobalMaterial.unit_name = fact.unit_name;
        }
        if (!currentGlobalMaterial.material_name && fact.material_name) {
          currentGlobalMaterial.material_name = fact.material_name;
        }
        globalMaterialMap.set(materialId, currentGlobalMaterial);
      }
    }

    for (const row of workRows) {
      const subsectionKey = `${row.stage_id || 0}_${row.subsection_id || 0}`;
      const subsectionEstimateMap = estimateMaterialsBySubsection.get(subsectionKey) || new Map();

      for (const fact of writeOffFacts) {
        if (Number(fact.work_performed_item_id) !== Number(row.work_performed_item_id)) {
          continue;
        }

        const estimateMaterial = subsectionEstimateMap.get(Number(fact.material_id));
        ensureSubsectionMaterial(subsectionKey, {
          material_id: fact.material_id,
          material_name: fact.material_name,
          unit_name: fact.unit_name,
          unit_of_measure: estimateMaterial?.unit_of_measure ?? null,
          quantity_planned: 0,
          coefficient: estimateMaterial?.coefficient ?? 0,
          is_additional: estimateMaterial?.is_additional ?? false
        });

        const globalMaterial = globalMaterialMap.get(Number(fact.material_id));
        if (globalMaterial) {
          globalMaterial.is_additional = globalMaterial.is_additional || Boolean(estimateMaterial?.is_additional);
          globalMaterial.has_fact = true;
          globalMaterialMap.set(Number(fact.material_id), globalMaterial);
        }
      }
    }

    const sectionsMap = new Map();
    const totalsMap = new Map();
    const subsectionWorkRowCount = new Map();

    for (const row of workRows) {
      const subsectionKey = `${row.stage_id || 0}_${row.subsection_id || 0}`;
      subsectionWorkRowCount.set(
        subsectionKey,
        toNumber(subsectionWorkRowCount.get(subsectionKey)) + 1
      );
    }

    for (const row of workRows) {
      const sectionKey = `${row.stage_id || 0}_${row.subsection_id || 0}`;
      const subsectionMaterialsMap = subsectionMaterials.get(sectionKey) || new Map();

      if (!sectionsMap.has(sectionKey)) {
        sectionsMap.set(sectionKey, {
          stage_id: row.stage_id,
          stage_name: row.stage_name || 'Без этапа',
          subsection_id: row.subsection_id,
          subsection_name: row.subsection_name || 'Без подэтапа',
          rows: []
        });
      }

      const rowData = {
        work_performed_item_id: Number(row.work_performed_item_id),
        work_performed_id: Number(row.work_performed_id),
        work_performed_code: row.work_performed_code || '',
        work_name: row.work_name || 'Работа',
        unit_name: row.unit_name || '',
        quantity: toNumber(row.quantity),
        signed_date: row.signed_date,
        cells: []
      };

      const subsectionMaterialList = Array.from(subsectionMaterialsMap.values())
        .sort((a, b) => a.material_name.localeCompare(b.material_name, 'ru'));

      for (const material of subsectionMaterialList) {
        const subsectionKey = `${row.stage_id || 0}_${row.subsection_id || 0}`;
        const servicePlanKey = `${row.stage_id || 0}_${row.subsection_id || 0}_${row.unit_of_measure || 0}`;
        const sameUnitServicePlan = toNumber(subsectionServicePlanByUnit.get(servicePlanKey));
        const subsectionPlannedServiceQuantity = toNumber(subsectionServicePlan.get(subsectionKey));
        const factualQuantity = toNumber(
          factByWorkAndMaterial.get(`${row.work_performed_item_id}_${material.material_id}`)
        );

        let normKind = 'fact';
        let normValue = 'ф';
        let plannedQuantity = factualQuantity;
        const materialCoefficient = toNumber(material.coefficient);
        const subsectionRowsCount = toNumber(subsectionWorkRowCount.get(subsectionKey));
        const explicitCoefficient = materialCoefficient > 0 && Math.abs(materialCoefficient - 1) > 0.000001
          ? materialCoefficient
          : 0;

        if (explicitCoefficient > 0) {
          normKind = 'coefficient';
          normValue = explicitCoefficient;
          plannedQuantity = toNumber(material.quantity_planned) * explicitCoefficient;
        } else if (subsectionRowsCount <= 1 && toNumber(material.quantity_planned) > 0) {
          normKind = 'quantity';
          normValue = toNumber(material.quantity_planned);
          plannedQuantity = toNumber(material.quantity_planned);
        } else if (
          material.unit_of_measure &&
          row.unit_of_measure &&
          Number(material.unit_of_measure) === Number(row.unit_of_measure) &&
          sameUnitServicePlan > 0 &&
          toNumber(material.quantity_planned) > 0
        ) {
          const coefficient = toNumber(material.quantity_planned) / sameUnitServicePlan;
          normKind = 'coefficient';
          normValue = coefficient;
          plannedQuantity = coefficient * toNumber(row.quantity);
        } else if (
          subsectionPlannedServiceQuantity > 0 &&
          toNumber(material.quantity_planned) > 0
        ) {
          const coefficient = toNumber(material.quantity_planned) / subsectionPlannedServiceQuantity;
          normKind = 'coefficient';
          normValue = coefficient;
          plannedQuantity = coefficient * toNumber(row.quantity);
        }

        rowData.cells.push({
          material_id: material.material_id,
          norm_kind: normKind,
          norm_value: normValue,
          planned_quantity: plannedQuantity,
          actual_quantity: factualQuantity
        });

        if (!totalsMap.has(material.material_id)) {
          totalsMap.set(material.material_id, {
            material_id: material.material_id,
            material_name: material.material_name,
            unit_name: material.unit_name || '',
            planned_quantity: 0,
            actual_quantity: 0,
            deviation_quantity: 0
          });
        }

        const total = totalsMap.get(material.material_id);
        total.planned_quantity += plannedQuantity;
        total.actual_quantity += factualQuantity;
        total.deviation_quantity = total.planned_quantity - total.actual_quantity;
        totalsMap.set(material.material_id, total);
      }

      sectionsMap.get(sectionKey).rows.push(rowData);
    }

    const materials = Array.from(globalMaterialMap.values())
      .sort((a, b) => {
        const aGroup = a.has_fact ? (a.is_additional ? 2 : 1) : (a.from_estimate ? 3 : 4);
        const bGroup = b.has_fact ? (b.is_additional ? 2 : 1) : (b.from_estimate ? 3 : 4);

        if (aGroup !== bGroup) {
          return aGroup - bGroup;
        }

        if (aGroup !== 3 && Boolean(a.is_additional) !== Boolean(b.is_additional)) {
          return a.is_additional ? 1 : -1;
        }
        return a.material_name.localeCompare(b.material_name, 'ru');
      });

    const sections = Array.from(sectionsMap.values())
      .sort((a, b) => {
        const stageCompare = (a.stage_name || '').localeCompare(b.stage_name || '', 'ru');
        if (stageCompare !== 0) return stageCompare;
        return (a.subsection_name || '').localeCompare(b.subsection_name || '', 'ru');
      });

    const totals = materials.map((material) => {
      const total = totalsMap.get(material.material_id) || {
        material_id: material.material_id,
        material_name: material.material_name,
        unit_name: material.unit_name || '',
        planned_quantity: 0,
        actual_quantity: 0,
        deviation_quantity: 0
      };

      return {
        ...total,
        planned_quantity: toNumber(total.planned_quantity),
        actual_quantity: toNumber(total.actual_quantity),
        deviation_quantity: toNumber(total.planned_quantity) - toNumber(total.actual_quantity)
      };
    });

    return res.json({
      success: true,
      data: {
        header: {
          ...header,
          block_id: blockId,
          date_from: dateFrom,
          date_to: dateTo,
          period_label: formatPeriodLabel(dateFrom, dateTo)
        },
        materials,
        sections,
        totals
      }
    });

  } catch (error) {

    console.error('Form29 report error:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка формирования отчета Форма 29',
      error: error.message
    });

  }
};

/* ============================================================
   FORM 2 REPORT
============================================================ */
const getForm2Report = async (req, res) => {
  try {

    const {
      block_id,
      date_from,
      date_to
    } = req.body || {};

    const blockId = Number(block_id);
    const dateFrom = toDateOnly(date_from);
    const dateTo = toDateOnly(date_to);

    if (!blockId || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Нужны block_id, date_from и date_to'
      });
    }

    const [header] = await sequelize.query(
      `
      SELECT
        pb.id AS block_id,
        pb.name AS block_name,
        p.id AS project_id,
        p.name AS project_name,
        p.address AS project_address,
        COALESCE(p.customer_name, '') AS customer_name
      FROM construction.project_blocks pb
      JOIN construction.projects p
        ON p.id = pb.project_id
      WHERE pb.id = :blockId
        AND pb.deleted = false
      LIMIT 1
      `,
      {
        replacements: { blockId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!header) {
      return res.status(404).json({
        success: false,
        message: 'Блок не найден'
      });
    }

    const periodItems = await sequelize.query(
      `
      SELECT
        wpi.id AS work_performed_item_id,
        wpi.work_performed_id,
        wpi.material_estimate_item_id,
        wpi.service_id,
        wpi.service_type,
        wpi.stage_id,
        wpi.subsection_id,
        wpi.unit_of_measure,
        wpi.quantity,
        wpi.price,
        wpi.currency,
        wpi.currency_rate,
        COALESCE(s.name, 'Работа') AS service_name,
        COALESCE(st.name, '') AS service_type_name,
        COALESCE(u.name, '') AS unit_name,
        bs.name AS stage_name,
        ss.name AS subsection_name,
        wp.code AS document_number,
        COALESCE(
          wp.signed_by_main_engineer_time::date,
          wp.updated_at::date,
          wp.created_at::date
        ) AS document_date,
        CASE
          WHEN wpi.currency = 1 THEN COALESCE(wpi.price, 0)
          ELSE COALESCE(wpi.price, 0) * COALESCE(wpi.currency_rate, 1)
        END AS price_converted,
        COALESCE(wpi.quantity, 0) *
        CASE
          WHEN wpi.currency = 1 THEN COALESCE(wpi.price, 0)
          ELSE COALESCE(wpi.price, 0) * COALESCE(wpi.currency_rate, 1)
        END AS amount_converted
      FROM construction.work_performed_items wpi
      JOIN construction.work_performed wp
        ON wp.id = wpi.work_performed_id
      LEFT JOIN construction.services s
        ON s.id = wpi.service_id
      LEFT JOIN construction.service_types st
        ON st.id = wpi.service_type
      LEFT JOIN construction.units_of_measure u
        ON u.id = wpi.unit_of_measure
      LEFT JOIN construction.block_stages bs
        ON bs.id = wpi.stage_id
      LEFT JOIN construction.stage_subsections ss
        ON ss.id = wpi.subsection_id
      WHERE wp.block_id = :blockId
        AND wp.deleted = false
        AND wpi.deleted = false
        AND wp.status = 2
        AND wp.signed_by_foreman = true
        AND wp.signed_by_planning_engineer = true
        AND wp.signed_by_main_engineer = true
        AND COALESCE(
          wp.signed_by_main_engineer_time::date,
          wp.updated_at::date,
          wp.created_at::date
        ) BETWEEN :dateFrom AND :dateTo
      ORDER BY
        COALESCE(
          wp.signed_by_main_engineer_time::date,
          wp.updated_at::date,
          wp.created_at::date
        ),
        wp.id,
        wpi.id
      `,
      {
        replacements: { blockId, dateFrom, dateTo },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const cumulativeStats = await sequelize.query(
      `
      SELECT
        COALESCE(wpi.material_estimate_item_id, 0) AS material_estimate_item_id,
        wpi.service_id,
        wpi.stage_id,
        wpi.subsection_id,
        SUM(
          CASE
            WHEN COALESCE(
              wp.signed_by_main_engineer_time::date,
              wp.updated_at::date,
              wp.created_at::date
            ) < :dateFrom
            THEN COALESCE(wpi.quantity, 0)
            ELSE 0
          END
        ) AS previous_quantity,
        SUM(
          CASE
            WHEN COALESCE(
              wp.signed_by_main_engineer_time::date,
              wp.updated_at::date,
              wp.created_at::date
            ) < :dateFrom
            THEN (
              COALESCE(wpi.quantity, 0) *
              CASE
                WHEN wpi.currency = 1 THEN COALESCE(wpi.price, 0)
                ELSE COALESCE(wpi.price, 0) * COALESCE(wpi.currency_rate, 1)
              END
            )
            ELSE 0
          END
        ) AS previous_amount,
        SUM(
          CASE
            WHEN COALESCE(
              wp.signed_by_main_engineer_time::date,
              wp.updated_at::date,
              wp.created_at::date
            ) <= :dateTo
            THEN COALESCE(wpi.quantity, 0)
            ELSE 0
          END
        ) AS total_quantity,
        SUM(
          CASE
            WHEN COALESCE(
              wp.signed_by_main_engineer_time::date,
              wp.updated_at::date,
              wp.created_at::date
            ) <= :dateTo
            THEN (
              COALESCE(wpi.quantity, 0) *
              CASE
                WHEN wpi.currency = 1 THEN COALESCE(wpi.price, 0)
                ELSE COALESCE(wpi.price, 0) * COALESCE(wpi.currency_rate, 1)
              END
            )
            ELSE 0
          END
        ) AS total_amount
      FROM construction.work_performed_items wpi
      JOIN construction.work_performed wp
        ON wp.id = wpi.work_performed_id
      WHERE wp.block_id = :blockId
        AND wp.deleted = false
        AND wpi.deleted = false
        AND wp.status = 2
        AND wp.signed_by_foreman = true
        AND wp.signed_by_planning_engineer = true
        AND wp.signed_by_main_engineer = true
        AND COALESCE(
          wp.signed_by_main_engineer_time::date,
          wp.updated_at::date,
          wp.created_at::date
        ) <= :dateTo
      GROUP BY COALESCE(wpi.material_estimate_item_id, 0), wpi.service_id, wpi.stage_id, wpi.subsection_id
      `,
      {
        replacements: { blockId, dateFrom, dateTo },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const estimateServices = await sequelize.query(
      `
      SELECT
        mei.id AS material_estimate_item_id,
        mei.service_id,
        mei.stage_id,
        mei.subsection_id,
        mei.quantity_planned,
        mei.price,
        mei.currency,
        mei.currency_rate,
        CASE
          WHEN mei.currency = 1 THEN COALESCE(mei.price, 0)
          ELSE COALESCE(mei.price, 0) * COALESCE(mei.currency_rate, 1)
        END AS price_converted,
        COALESCE(mei.quantity_planned, 0) *
        CASE
          WHEN mei.currency = 1 THEN COALESCE(mei.price, 0)
          ELSE COALESCE(mei.price, 0) * COALESCE(mei.currency_rate, 1)
        END AS amount_converted
      FROM construction.material_estimate_items mei
      JOIN construction.material_estimates me
        ON me.id = mei.material_estimate_id
       AND me.deleted = false
      WHERE me.block_id = :blockId
        AND mei.deleted = false
        AND mei.item_type = 2
      `,
      {
        replacements: { blockId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const materialFacts = await sequelize.query(
      `
      SELECT
        mwo.work_performed_item_id,
        mwoi.material_id,
        MAX(COALESCE(m.name, 'Материал')) AS material_name,
        MAX(COALESCE(u.name, '')) AS unit_name,
        SUM(COALESCE(mwoi.quantity, 0)) AS quantity
      FROM construction.material_write_offs mwo
      JOIN construction.material_write_off_items mwoi
        ON mwoi.material_write_off_id = mwo.id
       AND (mwoi.deleted = false OR mwoi.deleted IS NULL)
      LEFT JOIN construction.materials m
        ON m.id = mwoi.material_id
      LEFT JOIN construction.units_of_measure u
        ON u.id = mwoi.unit_of_measure
      WHERE mwo.block_id = :blockId
        AND (mwo.deleted = false OR mwo.deleted IS NULL)
        AND mwo.status = 3
        AND mwo.posted_at >= CAST(:dateFrom AS timestamp)
        AND mwo.posted_at < CAST(:dateTo AS timestamp) + INTERVAL '1 day'
      GROUP BY mwo.work_performed_item_id, mwoi.material_id
      ORDER BY mwo.work_performed_item_id, MAX(COALESCE(m.name, 'Материал'))
      `,
      {
        replacements: { blockId, dateFrom, dateTo },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const constructionTypes = Array.from(
      new Set(
        periodItems
          .map((item) => (item.service_type_name || '').trim())
          .filter(Boolean)
      )
    );

    const reportDate = new Date().toISOString().slice(0, 10);
    const estimateServiceMap = new Map();
    const estimateFallbackMap = new Map();
    const cumulativeMap = new Map();
    const materialFactsMap = new Map();

    for (const estimateItem of estimateServices) {
      estimateServiceMap.set(Number(estimateItem.material_estimate_item_id), estimateItem);
      const fallbackKey = `${estimateItem.service_id || 0}_${estimateItem.stage_id || 0}_${estimateItem.subsection_id || 0}`;
      if (!estimateFallbackMap.has(fallbackKey)) {
        estimateFallbackMap.set(fallbackKey, estimateItem);
      }
    }

    for (const stat of cumulativeStats) {
      const statKey = `${Number(stat.material_estimate_item_id || 0)}_${stat.service_id || 0}_${stat.stage_id || 0}_${stat.subsection_id || 0}`;
      cumulativeMap.set(statKey, stat);
    }

    for (const fact of materialFacts) {
      const workPerformedItemId = Number(fact.work_performed_item_id);
      if (!materialFactsMap.has(workPerformedItemId)) {
        materialFactsMap.set(workPerformedItemId, []);
      }
      materialFactsMap.get(workPerformedItemId).push(fact);
    }

    let rowNumber = 1;
    const rows = [];

    for (const item of periodItems) {
      const estimateItem = estimateServiceMap.get(Number(item.material_estimate_item_id))
        || estimateFallbackMap.get(`${item.service_id || 0}_${item.stage_id || 0}_${item.subsection_id || 0}`)
        || null;

      const statKey = `${Number(item.material_estimate_item_id || 0)}_${item.service_id || 0}_${item.stage_id || 0}_${item.subsection_id || 0}`;
      const stat = cumulativeMap.get(statKey) || {
        previous_quantity: 0,
        previous_amount: 0,
        total_quantity: toNumber(item.quantity),
        total_amount: toNumber(item.amount_converted)
      };

      const contractQuantity = toNumber(estimateItem?.quantity_planned);
      const contractPrice = toNumber(estimateItem?.price_converted);
      const contractAmount = toNumber(estimateItem?.amount_converted);
      const totalQuantity = toNumber(stat.total_quantity);
      const completionPercent = contractQuantity > 0
        ? Math.min(100, (totalQuantity / contractQuantity) * 100)
        : 0;

      const workRowNumber = rowNumber++;
      const materialRows = (materialFactsMap.get(Number(item.work_performed_item_id)) || []).map((materialFact) => ({
        row_no: rowNumber++,
        type: 'material',
        material_name: materialFact.material_name,
        unit_name: materialFact.unit_name,
        period_quantity: toNumber(materialFact.quantity)
      }));

      const estimateNumber = estimateItem
        ? Number(estimateItem.material_estimate_item_id)
        : null;

      rows.push({
        row_no: workRowNumber,
        type: 'work',
        estimate_no: estimateNumber,
        estimate_span: 1 + materialRows.length,
        work_performed_item_id: Number(item.work_performed_item_id),
        document_number: item.document_number || '',
        document_date: formatDateLabel(item.document_date),
        work_name: item.service_name || 'Работа',
        stage_name: item.stage_name || '',
        subsection_name: item.subsection_name || '',
        unit_name: item.unit_name || '',
        contract_quantity: contractQuantity,
        contract_price: contractPrice,
        contract_amount: contractAmount,
        previous_quantity: toNumber(stat.previous_quantity),
        previous_amount: toNumber(stat.previous_amount),
        period_quantity: toNumber(item.quantity),
        period_amount: toNumber(item.amount_converted),
        total_quantity: totalQuantity,
        total_amount: toNumber(stat.total_amount),
        completion_percent: completionPercent,
        materials: materialRows
      });
    }

    return res.json({
      success: true,
      data: {
        header: {
          ...header,
          date_from: dateFrom,
          date_to: dateTo,
          report_date: reportDate,
          report_date_label: formatDateLabel(reportDate),
          period_from_label: formatDateLabel(dateFrom),
          period_to_label: formatDateLabel(dateTo),
          period_label: formatPeriodLabel(dateFrom, dateTo),
          construction_type: constructionTypes.length === 1
            ? constructionTypes[0]
            : (constructionTypes.join(', ') || 'Общестроительные работы'),
          report_number: ''
        },
        rows
      }
    });

  } catch (error) {

    console.error('Form2 report error:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка формирования отчета Форма 2',
      error: error.message
    });

  }
};

/* ============================================================
   SCHEDULE REPORT
============================================================ */
const getScheduleReport = async (req, res) => {
  try {

    const {
      project_id
    } = req.body || {};

    const projectId = Number(project_id);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Нужен project_id'
      });
    }

    const [header] = await sequelize.query(
      `
      SELECT
        p.id AS project_id,
        p.name AS project_name,
        p.customer_name,
        p.address AS project_address,
        p.start_date,
        p.end_date
      FROM construction.projects p
      WHERE p.id = :projectId
        AND p.deleted = false
      LIMIT 1
      `,
      {
        replacements: { projectId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!header) {
      return res.status(404).json({
        success: false,
        message: 'Объект не найден'
      });
    }

      const rows = await sequelize.query(
        `
        SELECT
          pb.id AS block_id,
          pb.name AS block_name,
          bs.id AS stage_id,
          bs.name AS stage_name,
          bs.start_date,
          bs.end_date
        FROM construction.project_blocks pb
        LEFT JOIN construction.block_stages bs
          ON bs.block_id = pb.id
         AND bs.deleted = false
        WHERE pb.project_id = :projectId
          AND pb.deleted = false
        ORDER BY
          pb.id ASC,
          COALESCE(bs.start_date::date, bs.end_date::date, CURRENT_DATE) ASC,
          bs.id ASC
        `,
        {
          replacements: { projectId },
          type: sequelize.QueryTypes.SELECT
        }
      );

      const normalizedRows = rows
        .filter((row) => row.stage_id)
        .map((row) => ({
          block_id: row.block_id,
          block_name: row.block_name || 'Блок',
          stage_id: row.stage_id,
          stage_name: row.stage_name || 'Этап',
          start_date: toDateOnly(row.start_date),
          end_date: toDateOnly(row.end_date)
        }));

      const datedStarts = normalizedRows.map((row) => row.start_date).filter(Boolean).sort();
      const datedEnds = normalizedRows.map((row) => row.end_date || row.start_date).filter(Boolean).sort();

      const projectStart = toDateOnly(header.start_date);
      const projectEnd = toDateOnly(header.end_date);

      const scheduleDateFrom = datedStarts[0] || projectStart || new Date().toISOString().slice(0, 10);
      const scheduleDateTo = datedEnds[datedEnds.length - 1] || projectEnd || scheduleDateFrom;

      return res.json({
        success: true,
        data: {
          header: {
            ...header,
            report_title: 'КАЛЕНДАРНЫЙ ГРАФИК ПРОИЗВОДСТВА РАБОТ',
            name_column: 'Наименование работ',
            sheet_name: 'График работ',
            filename_prefix: 'График работ',
            date_from: scheduleDateFrom,
            date_to: scheduleDateTo
          },
          rows: normalizedRows.map((row, index) => ({
            row_no: index + 1,
            block_id: row.block_id,
            block_name: row.block_name,
            stage_id: row.stage_id,
            stage_name: row.stage_name,
            start_date: row.start_date,
            end_date: row.end_date
          }))
        }
      });

  } catch (error) {

    console.error('Schedule report error:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка формирования графика',
      error: error.message
    });

  }
};

/* ============================================================
   MATERIAL DELIVERY SCHEDULE REPORT
============================================================ */
const getMaterialScheduleReport = async (req, res) => {
  try {
    const { project_id } = req.body || {};
    const projectId = Number(project_id);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Нужен project_id'
      });
    }

    const [header] = await sequelize.query(
      `
      SELECT
        p.id AS project_id,
        p.name AS project_name,
        p.customer_name,
        p.address AS project_address,
        p.start_date,
        p.end_date
      FROM construction.projects p
      WHERE p.id = :projectId
        AND p.deleted = false
      LIMIT 1
      `,
      {
        replacements: { projectId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!header) {
      return res.status(404).json({
        success: false,
        message: 'Объект не найден'
      });
    }

    const rows = await sequelize.query(
      `
      SELECT
        pb.id AS block_id,
        pb.name AS block_name,
        bs.id AS stage_id,
        bs.name AS stage_name,
        bs.start_date,
        bs.end_date,
        ss.id AS subsection_id,
        ss.name AS subsection_name,
        mei.material_id,
        COALESCE(m.name, NULLIF(TRIM(mei.comment), ''), 'Материал') AS material_name,
        COALESCE(u.name, '') AS unit_name,
        SUM(COALESCE(mei.quantity_planned, 0)) AS quantity_planned
      FROM construction.project_blocks pb
      JOIN construction.material_estimates me
        ON me.block_id = pb.id
       AND me.deleted = false
      JOIN construction.material_estimate_items mei
        ON mei.material_estimate_id = me.id
       AND mei.deleted = false
       AND mei.item_type = 1
      LEFT JOIN construction.block_stages bs
        ON bs.id = mei.stage_id
       AND bs.deleted = false
      LEFT JOIN construction.stage_subsections ss
        ON ss.id = mei.subsection_id
       AND ss.deleted = false
      LEFT JOIN construction.materials m
        ON m.id = mei.material_id
      LEFT JOIN construction.units_of_measure u
        ON u.id = mei.unit_of_measure
      WHERE pb.project_id = :projectId
        AND pb.deleted = false
      GROUP BY
        pb.id,
        pb.name,
        bs.id,
        bs.name,
        bs.start_date,
        bs.end_date,
        ss.id,
        ss.name,
        mei.material_id,
        m.name,
        mei.comment,
        u.name
      ORDER BY
        pb.id ASC,
        COALESCE(bs.start_date::date, bs.end_date::date, CURRENT_DATE) ASC,
        bs.id ASC,
        ss.id ASC,
        material_name ASC
      `,
      {
        replacements: { projectId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const normalizedRows = rows
      .filter((row) => row.stage_id)
      .map((row) => {
        const materialName = row.material_name || 'Материал';
        const quantity = toNumber(row.quantity_planned);
        const unitName = row.unit_name ? ` ${row.unit_name}` : '';
        const context = [row.stage_name, row.subsection_name].filter(Boolean).join(' / ');
        const quantityLabel = quantity ? ` (${formatScheduleQuantity(quantity)}${unitName})` : '';

        return {
          block_id: row.block_id,
          block_name: row.block_name || 'Блок',
          stage_id: row.stage_id,
          stage_name: context
            ? `${materialName}${quantityLabel} - ${context}`
            : `${materialName}${quantityLabel}`,
          start_date: toDateOnly(row.start_date),
          end_date: toDateOnly(row.end_date)
        };
      });

    const datedStarts = normalizedRows.map((row) => row.start_date).filter(Boolean).sort();
    const datedEnds = normalizedRows.map((row) => row.end_date || row.start_date).filter(Boolean).sort();

    const projectStart = toDateOnly(header.start_date);
    const projectEnd = toDateOnly(header.end_date);

    const scheduleDateFrom = datedStarts[0] || projectStart || new Date().toISOString().slice(0, 10);
    const scheduleDateTo = datedEnds[datedEnds.length - 1] || projectEnd || scheduleDateFrom;

    return res.json({
      success: true,
      data: {
        header: {
          ...header,
          report_title: 'КАЛЕНДАРНЫЙ ГРАФИК ПОСТАВКИ МАТЕРИАЛОВ',
          name_column: 'Наименование материалов',
          sheet_name: 'График материалов',
          filename_prefix: 'График поставки материалов',
          date_from: scheduleDateFrom,
          date_to: scheduleDateTo
        },
        rows: normalizedRows.map((row, index) => ({
          row_no: index + 1,
          block_id: row.block_id,
          block_name: row.block_name,
          stage_id: row.stage_id,
          stage_name: row.stage_name,
          start_date: row.start_date,
          end_date: row.end_date
        }))
      }
    });
  } catch (error) {
    console.error('Material schedule report error:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка формирования графика поставки материалов',
      error: error.message
    });
  }
};

/* ============================================================
   FORM 19 REPORT
============================================================ */
const getForm19Report = async (req, res) => {
  try {
    const {
      project_id,
      warehouse_id,
      date_from,
      date_to
    } = req.body || {};

    const projectId = Number(project_id);
    const warehouseId = Number(warehouse_id);
    const dateFrom = toDateOnly(date_from);
    const dateTo = toDateOnly(date_to);

    if ((!projectId && !warehouseId) || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Нужны warehouse_id, date_from и date_to'
      });
    }

    const [header] = projectId
      ? await sequelize.query(
          `
          SELECT
            w.id AS warehouse_id,
            w.name AS warehouse_name,
            p.id AS project_id,
            p.name AS project_name,
            p.customer_name
          FROM construction.projects p
          JOIN construction.warehouses w
            ON w.project_id = p.id
           AND w.deleted = false
          WHERE p.id = :projectId
            AND p.deleted = false
          ORDER BY w.id ASC
          LIMIT 1
          `,
          {
            replacements: { projectId },
            type: sequelize.QueryTypes.SELECT
          }
        )
      : await sequelize.query(
          `
          SELECT
            w.id AS warehouse_id,
            w.name AS warehouse_name,
            p.id AS project_id,
            p.name AS project_name,
            p.customer_name
          FROM construction.warehouses w
          JOIN construction.projects p
            ON p.id = w.project_id
          WHERE w.id = :warehouseId
            AND w.deleted = false
          LIMIT 1
          `,
          {
            replacements: { warehouseId },
            type: sequelize.QueryTypes.SELECT
          }
        );

    if (!header) {
      return res.status(404).json({
        success: false,
        message: 'Склад не найден'
      });
    }

    const resolvedWarehouseId = Number(header.warehouse_id);

    const currentStocks = await sequelize.query(
      `
      SELECT
        ws.material_id,
        ws.quantity AS current_quantity
      FROM construction.warehouse_stock ws
      WHERE ws.warehouse_id = :warehouseId
        AND ws.deleted = false
      `,
      {
        replacements: { warehouseId: resolvedWarehouseId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const movementAfterStart = await sequelize.query(
      `
      SELECT
        mm.material_id,
        SUM(CASE WHEN mm.to_warehouse_id = :warehouseId THEN COALESCE(mm.quantity, 0) ELSE 0 END) AS incoming_quantity,
        SUM(CASE WHEN mm.from_warehouse_id = :warehouseId THEN COALESCE(mm.quantity, 0) ELSE 0 END) AS outgoing_quantity
      FROM construction.material_movements mm
      WHERE mm.deleted = false
        AND mm.date::date >= :dateFrom
        AND (mm.to_warehouse_id = :warehouseId OR mm.from_warehouse_id = :warehouseId)
      GROUP BY mm.material_id
      `,
      {
        replacements: { warehouseId: resolvedWarehouseId, dateFrom },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const movementAfterEnd = await sequelize.query(
      `
      SELECT
        mm.material_id,
        SUM(CASE WHEN mm.to_warehouse_id = :warehouseId THEN COALESCE(mm.quantity, 0) ELSE 0 END) AS incoming_quantity,
        SUM(CASE WHEN mm.from_warehouse_id = :warehouseId THEN COALESCE(mm.quantity, 0) ELSE 0 END) AS outgoing_quantity
      FROM construction.material_movements mm
      WHERE mm.deleted = false
        AND mm.date::date > :dateTo
        AND (mm.to_warehouse_id = :warehouseId OR mm.from_warehouse_id = :warehouseId)
      GROUP BY mm.material_id
      `,
      {
        replacements: { warehouseId: resolvedWarehouseId, dateTo },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const periodIncoming = await sequelize.query(
      `
      SELECT
        mm.material_id,
        SUM(COALESCE(mm.quantity, 0)) AS quantity
      FROM construction.material_movements mm
      WHERE mm.deleted = false
        AND mm.to_warehouse_id = :warehouseId
        AND mm.date::date BETWEEN :dateFrom AND :dateTo
      GROUP BY mm.material_id
      `,
      {
        replacements: { warehouseId: resolvedWarehouseId, dateFrom, dateTo },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const periodForm29Expense = await sequelize.query(
      `
      SELECT
        mm.material_id,
        SUM(COALESCE(mm.quantity, 0)) AS quantity
      FROM construction.material_movements mm
      WHERE mm.deleted = false
        AND mm.from_warehouse_id = :warehouseId
        AND mm.entity_type = 'material_write_off'
        AND mm.date::date BETWEEN :dateFrom AND :dateTo
      GROUP BY mm.material_id
      `,
      {
        replacements: { warehouseId: resolvedWarehouseId, dateFrom, dateTo },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const periodMbpExpense = await sequelize.query(
      `
      SELECT
        mm.material_id,
        SUM(COALESCE(mm.quantity, 0)) AS quantity
      FROM construction.material_movements mm
      WHERE mm.deleted = false
        AND mm.from_warehouse_id = :warehouseId
        AND mm.entity_type = 'mbp_write_off'
        AND mm.date::date BETWEEN :dateFrom AND :dateTo
      GROUP BY mm.material_id
      `,
      {
        replacements: { warehouseId: resolvedWarehouseId, dateFrom, dateTo },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const periodProcessingExpense = await sequelize.query(
      `
      SELECT
        mm.material_id,
        SUM(COALESCE(mm.quantity, 0)) AS quantity
      FROM construction.material_movements mm
      WHERE mm.deleted = false
        AND mm.from_warehouse_id = :warehouseId
        AND mm.entity_type = 'processing_write_off'
        AND mm.date::date BETWEEN :dateFrom AND :dateTo
      GROUP BY mm.material_id
      `,
      {
        replacements: { warehouseId: resolvedWarehouseId, dateFrom, dateTo },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const periodTransferExpense = await sequelize.query(
      `
      SELECT
        mm.material_id,
        SUM(COALESCE(mm.quantity, 0)) AS quantity
      FROM construction.material_movements mm
      WHERE mm.deleted = false
        AND mm.from_warehouse_id = :warehouseId
        AND (mm.entity_type = 'warehouse_transfer' OR mm.operation = '=')
        AND mm.date::date BETWEEN :dateFrom AND :dateTo
      GROUP BY mm.material_id
      `,
      {
        replacements: { warehouseId: resolvedWarehouseId, dateFrom, dateTo },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const materialIds = new Set();

    for (const row of currentStocks) materialIds.add(Number(row.material_id));
    for (const row of movementAfterStart) materialIds.add(Number(row.material_id));
    for (const row of movementAfterEnd) materialIds.add(Number(row.material_id));
    for (const row of periodIncoming) materialIds.add(Number(row.material_id));
    for (const row of periodForm29Expense) materialIds.add(Number(row.material_id));
    for (const row of periodMbpExpense) materialIds.add(Number(row.material_id));
    for (const row of periodProcessingExpense) materialIds.add(Number(row.material_id));
    for (const row of periodTransferExpense) materialIds.add(Number(row.material_id));

    const materialIdList = Array.from(materialIds);

    if (!materialIdList.length) {
      return res.json({
        success: true,
        data: {
          header: {
            ...header,
            date_from: dateFrom,
            date_to: dateTo,
            period_label: formatPeriodLabel(dateFrom, dateTo)
          },
          rows: []
        }
      });
    }

    const materials = await sequelize.query(
      `
      SELECT
        m.id AS material_id,
        m.name AS material_name,
        COALESCE(u.name, '') AS unit_name
      FROM construction.materials m
      LEFT JOIN construction.units_of_measure u
        ON u.id = m.unit_of_measure
      WHERE m.id IN (:materialIds)
        AND m.deleted = false
      ORDER BY m.name ASC
      `,
      {
        replacements: { materialIds: materialIdList },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const toQuantityMap = (rows, field = 'quantity') => {
      const map = new Map();
      for (const row of rows) {
        map.set(Number(row.material_id), toNumber(row[field]));
      }
      return map;
    };

    const toMovementMap = (rows) => {
      const map = new Map();
      for (const row of rows) {
        map.set(Number(row.material_id), {
          incoming_quantity: toNumber(row.incoming_quantity),
          outgoing_quantity: toNumber(row.outgoing_quantity)
        });
      }
      return map;
    };

    const currentStockMap = toQuantityMap(currentStocks, 'current_quantity');
    const afterStartMap = toMovementMap(movementAfterStart);
    const afterEndMap = toMovementMap(movementAfterEnd);
    const incomingMap = toQuantityMap(periodIncoming);
    const form29Map = toQuantityMap(periodForm29Expense);
    const mbpMap = toQuantityMap(periodMbpExpense);
    const processingMap = toQuantityMap(periodProcessingExpense);
    const transferOutMap = toQuantityMap(periodTransferExpense);

    const rows = materials.map((material, index) => {
      const materialId = Number(material.material_id);
      const currentQuantity = toNumber(currentStockMap.get(materialId));
      const futureFromStart = afterStartMap.get(materialId) || { incoming_quantity: 0, outgoing_quantity: 0 };
      const futureAfterEnd = afterEndMap.get(materialId) || { incoming_quantity: 0, outgoing_quantity: 0 };

      const openingQuantity =
        currentQuantity
        - toNumber(futureFromStart.incoming_quantity)
        + toNumber(futureFromStart.outgoing_quantity);

      const closingQuantity =
        currentQuantity
        - toNumber(futureAfterEnd.incoming_quantity)
        + toNumber(futureAfterEnd.outgoing_quantity);

      return {
        row_no: index + 1,
        material_id: materialId,
        material_name: material.material_name,
        unit_name: material.unit_name || '',
        opening_quantity: openingQuantity,
        incoming_quantity: toNumber(incomingMap.get(materialId)),
        form29_quantity: toNumber(form29Map.get(materialId)),
        mbp_quantity: toNumber(mbpMap.get(materialId)),
        processing_quantity: toNumber(processingMap.get(materialId)),
        transfer_out_quantity: toNumber(transferOutMap.get(materialId)),
        closing_quantity: closingQuantity
      };
    }).filter((row) =>
      row.opening_quantity !== 0 ||
      row.incoming_quantity !== 0 ||
      row.form29_quantity !== 0 ||
      row.mbp_quantity !== 0 ||
      row.processing_quantity !== 0 ||
      row.transfer_out_quantity !== 0 ||
      row.closing_quantity !== 0
    );

    return res.json({
      success: true,
      data: {
        header: {
          ...header,
          date_from: dateFrom,
          date_to: dateTo,
          period_label: formatPeriodLabel(dateFrom, dateTo)
        },
        rows
      }
    });

  } catch (error) {
    console.error('Form19 report error:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка формирования отчета Ф-19',
      error: error.message
    });
  }
};

/* ============================================================
   MBP WRITE-OFF REPORT
============================================================ */
const getMbpWriteOffReport = async (req, res) => {
  try {
    const {
      project_id,
      warehouse_id,
      date_from,
      date_to
    } = req.body || {};

    const projectId = Number(project_id);
    const warehouseId = Number(warehouse_id);
    const dateFrom = toDateOnly(date_from);
    const dateTo = toDateOnly(date_to);

    if ((!projectId && !warehouseId) || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Нужны project_id или warehouse_id, date_from и date_to'
      });
    }

    const [header] = projectId
      ? await sequelize.query(
          `
          SELECT
            p.id AS project_id,
            p.name AS project_name,
            p.address AS project_address,
            p.customer_name,
            w.id AS warehouse_id,
            w.name AS warehouse_name
          FROM construction.projects p
          LEFT JOIN construction.warehouses w
            ON w.project_id = p.id
           AND w.deleted = false
          WHERE p.id = :projectId
            AND p.deleted = false
          ORDER BY w.id ASC
          LIMIT 1
          `,
          {
            replacements: { projectId },
            type: sequelize.QueryTypes.SELECT
          }
        )
      : await sequelize.query(
          `
          SELECT
            p.id AS project_id,
            p.name AS project_name,
            p.address AS project_address,
            p.customer_name,
            w.id AS warehouse_id,
            w.name AS warehouse_name
          FROM construction.warehouses w
          JOIN construction.projects p
            ON p.id = w.project_id
           AND p.deleted = false
          WHERE w.id = :warehouseId
            AND w.deleted = false
          LIMIT 1
          `,
          {
            replacements: { warehouseId },
            type: sequelize.QueryTypes.SELECT
          }
        );

    if (!header) {
      return res.status(404).json({
        success: false,
        message: 'Объект или склад не найден'
      });
    }

    const rows = await sequelize.query(
      `
      SELECT
        ROW_NUMBER() OVER (ORDER BY mw.posted_at ASC, mw.id ASC, mwi.id ASC) AS row_no,
        mw.id AS write_off_id,
        mw.posted_at,
        to_char(mw.posted_at, 'DD.MM.YYYY') AS posted_at_label,
        m.id AS material_id,
        m.name AS material_name,
        COALESCE(u.name, '') AS unit_name,
        COALESCE(mwi.quantity, 0) AS quantity,
        COALESCE(mwi.note, mw.note, '') AS note
      FROM construction.mbp_write_offs mw
      JOIN construction.mbp_write_off_items mwi
        ON mwi.mbp_write_off_id = mw.id
       AND mwi.deleted = false
      JOIN construction.materials m
        ON m.id = mwi.material_id
       AND m.deleted = false
      LEFT JOIN construction.units_of_measure u
        ON u.id = mwi.unit_of_measure
      WHERE mw.deleted = false
        AND mw.status = 3
        AND mw.posted_at IS NOT NULL
        AND mw.posted_at::date BETWEEN :dateFrom AND :dateTo
        AND (
          (:projectId > 0 AND mw.project_id = :projectId)
          OR (:warehouseId > 0 AND mw.warehouse_id = :warehouseId)
        )
      ORDER BY mw.posted_at ASC, mw.id ASC, mwi.id ASC
      `,
      {
        replacements: {
          projectId: projectId || 0,
          warehouseId: warehouseId || 0,
          dateFrom,
          dateTo
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    return res.json({
      success: true,
      data: {
        header: {
          ...header,
          date_from: dateFrom,
          date_to: dateTo,
          period_label: formatPeriodLabel(dateFrom, dateTo)
        },
        rows: rows.map((row) => ({
          ...row,
          row_no: Number(row.row_no),
          quantity: toNumber(row.quantity)
        }))
      }
    });
  } catch (error) {
    console.error('MBP write-off report error:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка формирования отчета по списаниям МБП',
      error: error.message
    });
  }
};

/* ============================================================
   ESTIMATE STAGE REPORT
============================================================ */
const getEstimateStageReport = async (req, res) => {
  try {

    const { block_id } = req.body || {};
    const blockId = Number(block_id);

    if (!blockId) {
      return res.status(400).json({
        success: false,
        message: 'Нужен block_id'
      });
    }

    const [header] = await sequelize.query(
      `
      SELECT
        pb.id AS block_id,
        pb.name AS block_name,
        pb.total_area,
        pb.sale_area,
        p.id AS project_id,
        p.name AS project_name,
        p.address AS project_address,
        COALESCE(p.customer_name, '') AS customer_name
      FROM construction.project_blocks pb
      JOIN construction.projects p
        ON p.id = pb.project_id
      WHERE pb.id = :blockId
        AND pb.deleted = false
      LIMIT 1
      `,
      {
        replacements: { blockId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!header) {
      return res.status(404).json({
        success: false,
        message: 'Блок не найден'
      });
    }

    const estimateItems = await sequelize.query(
      `
      SELECT
        mei.id,
        mei.item_type,
        mei.material_id,
        mei.service_id,
        mei.stage_id,
        mei.subsection_id,
        mei.unit_of_measure,
        mei.quantity_planned,
        mei.price,
        mei.currency,
        mei.currency_rate,
        CASE
          WHEN mei.currency = 1 THEN COALESCE(mei.price, 0)
          ELSE COALESCE(mei.price, 0) * COALESCE(mei.currency_rate, 1)
        END AS price_converted,
        COALESCE(mei.quantity_planned, 0) *
        CASE
          WHEN mei.currency = 1 THEN COALESCE(mei.price, 0)
          ELSE COALESCE(mei.price, 0) * COALESCE(mei.currency_rate, 1)
        END AS amount_converted,
        bs.name AS stage_name,
        ss.name AS subsection_name,
        COALESCE(u.name, '') AS unit_name,
        COALESCE(m.name, s.name, NULLIF(TRIM(mei.comment), ''), 'Позиция') AS item_name
      FROM construction.material_estimate_items mei
      JOIN construction.material_estimates me
        ON me.id = mei.material_estimate_id
       AND me.deleted = false
      LEFT JOIN construction.materials m
        ON m.id = mei.material_id
      LEFT JOIN construction.services s
        ON s.id = mei.service_id
      LEFT JOIN construction.block_stages bs
        ON bs.id = mei.stage_id
      LEFT JOIN construction.stage_subsections ss
        ON ss.id = mei.subsection_id
      LEFT JOIN construction.units_of_measure u
        ON u.id = mei.unit_of_measure
      WHERE me.block_id = :blockId
        AND mei.deleted = false
      ORDER BY mei.stage_id, mei.subsection_id, mei.item_type, mei.id
      `,
      {
        replacements: { blockId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const shouldIgnoreItem = (name) => {
      const normalized = String(name || '').trim().toLowerCase();
      return normalized.startsWith('итого арматура');
    };

    const stagesMap = new Map();
    const stageSummaryMap = new Map();

    const ensureStage = (item) => {
      const stageId = Number(item.stage_id || 0);
      if (!stagesMap.has(stageId)) {
        stagesMap.set(stageId, {
          stage_id: stageId,
          stage_name: item.stage_name || `Этап #${stageId}`,
          subsections: [],
          subsection_order: new Map(),
          material_rows: new Map(),
          service_rows: new Map(),
          material_total_amount: 0,
          service_total_amount: 0,
          total_amount: 0
        });
      }

      const stage = stagesMap.get(stageId);
      const subsectionId = Number(item.subsection_id || 0);
      if (!stage.subsection_order.has(subsectionId)) {
        stage.subsection_order.set(subsectionId, {
          subsection_id: subsectionId,
          subsection_name: item.subsection_name || `Подэтап #${subsectionId}`
        });
      }

      return stage;
    };

    const buildRowKey = (item) => {
      if (Number(item.item_type) === 1) {
        return `m_${item.material_id || 0}_${String(item.item_name || '').trim()}_${item.unit_of_measure || 0}`;
      }
      return `s_${item.service_id || 0}_${String(item.item_name || '').trim()}_${item.unit_of_measure || 0}`;
    };

    for (const item of estimateItems) {
      if (shouldIgnoreItem(item.item_name)) {
        continue;
      }

      const stage = ensureStage(item);
      const subsectionId = Number(item.subsection_id || 0);
      const rowKey = buildRowKey(item);
      const targetMap = Number(item.item_type) === 1 ? stage.material_rows : stage.service_rows;

      if (!targetMap.has(rowKey)) {
        targetMap.set(rowKey, {
          item_name: item.item_name || 'Позиция',
          unit_name: item.unit_name || '',
          subsection_quantities: {},
          total_quantity: 0,
          total_amount: 0
        });
      }

      const row = targetMap.get(rowKey);
      row.subsection_quantities[subsectionId] = toNumber(row.subsection_quantities[subsectionId]) + toNumber(item.quantity_planned);
      row.total_quantity += toNumber(item.quantity_planned);
      row.total_amount += toNumber(item.amount_converted);
      row.unit_price = row.total_quantity > 0
        ? row.total_amount / row.total_quantity
        : toNumber(item.price_converted);
      targetMap.set(rowKey, row);

      const amount = toNumber(item.amount_converted);
      if (Number(item.item_type) === 1) {
        stage.material_total_amount += amount;
      } else {
        stage.service_total_amount += amount;
      }
      stage.total_amount += amount;
      stagesMap.set(stage.stage_id, stage);

      if (!stageSummaryMap.has(stage.stage_id)) {
        stageSummaryMap.set(stage.stage_id, {
          stage_id: stage.stage_id,
          stage_name: stage.stage_name,
          total_amount: 0
        });
      }
      const summaryRow = stageSummaryMap.get(stage.stage_id);
      summaryRow.total_amount += amount;
      stageSummaryMap.set(stage.stage_id, summaryRow);
    }

    const saleArea = toNumber(header.sale_area);
    const totalArea = toNumber(header.total_area);

    const stages = Array.from(stagesMap.values())
      .map((stage) => ({
        stage_id: stage.stage_id,
        stage_name: stage.stage_name,
        subsections: Array.from(stage.subsection_order.values())
          .sort((a, b) => a.subsection_id - b.subsection_id),
        material_rows: Array.from(stage.material_rows.values())
          .sort((a, b) => a.item_name.localeCompare(b.item_name, 'ru')),
        service_rows: Array.from(stage.service_rows.values())
          .sort((a, b) => a.item_name.localeCompare(b.item_name, 'ru')),
        material_total_amount: toNumber(stage.material_total_amount),
        service_total_amount: toNumber(stage.service_total_amount),
        total_amount: toNumber(stage.total_amount)
      }))
      .sort((a, b) => a.stage_id - b.stage_id);

    const summaryRows = Array.from(stageSummaryMap.values())
      .map((row, index) => ({
        row_no: index + 1,
        stage_id: row.stage_id,
        name: row.stage_name,
        total_amount: toNumber(row.total_amount),
        cost_per_sale_area: saleArea > 0 ? toNumber(row.total_amount) / saleArea : 0,
        cost_per_total_area: totalArea > 0 ? toNumber(row.total_amount) / totalArea : 0
      }))
      .sort((a, b) => a.stage_id - b.stage_id);

    const totalSummaryAmount = summaryRows.reduce((sum, row) => sum + toNumber(row.total_amount), 0);

    return res.json({
      success: true,
      data: {
        header: {
          ...header,
          total_area: totalArea,
          sale_area: saleArea
        },
        stages,
        summary: {
          total_area: totalArea,
          sale_area: saleArea,
          rows: summaryRows,
          total_amount: totalSummaryAmount,
          total_cost_per_sale_area: saleArea > 0 ? totalSummaryAmount / saleArea : 0,
          total_cost_per_total_area: totalArea > 0 ? totalSummaryAmount / totalArea : 0
        }
      }
    });

  } catch (error) {

    console.error('Estimate stage report error:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка формирования сметного отчета',
      error: error.message
    });

  }
};

module.exports = {
  getWorkPerformedReport,
  getForm29Report,
  getForm2Report,
  getForm19Report,
  getMbpWriteOffReport,
  getEstimateStageReport,
  getScheduleReport,
  getMaterialScheduleReport
};
