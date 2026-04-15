const sequelize = require('../config/database');

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
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
        AND mwo.write_off_date BETWEEN :dateFrom AND :dateTo
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
    for (const service of estimateServices) {
      const key = `${service.stage_id || 0}_${service.subsection_id || 0}_${service.unit_of_measure || 0}`;
      subsectionServicePlanByUnit.set(
        key,
        toNumber(subsectionServicePlanByUnit.get(key)) + toNumber(service.quantity_planned)
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
          is_additional: Boolean(material.is_additional)
        });
      }

      const current = materialMap.get(materialId);
      current.quantity_planned += toNumber(material.quantity_planned);
      current.is_additional = current.is_additional || Boolean(material.is_additional);
      materialMap.set(materialId, current);

      if (!globalMaterialMap.has(materialId)) {
        globalMaterialMap.set(materialId, {
          material_id: materialId,
          material_name: current.material_name,
          unit_name: current.unit_name,
          is_additional: Boolean(material.is_additional),
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
          is_additional: Number(material.entry_type) === 2
        });
      }

      const current = subsectionEstimateMap.get(materialId);
      current.quantity_planned += toNumber(material.quantity_planned);
      current.is_additional = current.is_additional || Number(material.entry_type) === 2;
      subsectionEstimateMap.set(materialId, current);

      ensureSubsectionMaterial(subsectionKey, {
        material_id: material.material_id,
        material_name: current.material_name,
        unit_name: current.unit_name,
        unit_of_measure: current.unit_of_measure,
        quantity_planned: toNumber(material.quantity_planned),
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
          quantity_planned: estimateMaterial?.quantity_planned ?? 0,
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
        const servicePlanKey = `${row.stage_id || 0}_${row.subsection_id || 0}_${row.unit_of_measure || 0}`;
        const sameUnitServicePlan = toNumber(subsectionServicePlanByUnit.get(servicePlanKey));
        const factualQuantity = toNumber(
          factByWorkAndMaterial.get(`${row.work_performed_item_id}_${material.material_id}`)
        );

        let normKind = 'fact';
        let normValue = 'ф';
        let plannedQuantity = factualQuantity;

        if (
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
        total.deviation_quantity = total.actual_quantity - total.planned_quantity;
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
        deviation_quantity: toNumber(total.actual_quantity) - toNumber(total.planned_quantity)
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
        p.customer_id,
        COALESCE(c.name, '') AS customer_name
      FROM construction.project_blocks pb
      JOIN construction.projects p
        ON p.id = pb.project_id
      LEFT JOIN construction.suppliers c
        ON c.id = p.customer_id
       AND (c.deleted = false OR c.deleted IS NULL)
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
        AND mwo.write_off_date BETWEEN :dateFrom AND :dateTo
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

module.exports = {
  getWorkPerformedReport,
  getForm29Report,
  getForm2Report
};
