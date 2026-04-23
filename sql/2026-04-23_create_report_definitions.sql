CREATE TABLE IF NOT EXISTS construction.report_definitions (
  id serial PRIMARY KEY,
  code varchar(80) NOT NULL UNIQUE,
  name varchar(200) NOT NULL,
  report_url varchar(300) NOT NULL,
  params_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  allow_pdf boolean NOT NULL DEFAULT true,
  allow_docx boolean NOT NULL DEFAULT true,
  allow_xlsx boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  deleted boolean DEFAULT false
);

COMMENT ON TABLE construction.report_definitions IS 'Реестр отчетов Jasper и метаданные формы параметров';
COMMENT ON COLUMN construction.report_definitions.report_url IS 'URL отчета в jasper-service, например /report/form29';
COMMENT ON COLUMN construction.report_definitions.params_schema IS 'JSONB-метаданные полей формы параметров';

INSERT INTO construction.report_definitions (
  code,
  name,
  report_url,
  params_schema,
  allow_pdf,
  allow_docx,
  allow_xlsx,
  sort_order,
  active,
  deleted
) VALUES
(
  'form2',
  'Форма 2',
  '/report/form2',
  '{"fields":[{"name":"blockId","type":"dict","label":"Блок","required":true,"options_api":"projectBlocks"},{"name":"month","type":"month","label":"Месяц","required":true}]}',
  true,
  true,
  true,
  10,
  true,
  false
),
(
  'form19',
  'Ф-19',
  '/report/form19',
  '{"fields":[{"name":"projectId","type":"int","required":true,"value_from":"projectId"},{"name":"month","type":"month","label":"Месяц","required":true}]}',
  true,
  true,
  true,
  20,
  true,
  false
),
(
  'mbp-write-off',
  'Списание МБП',
  '/report/mbp-write-off',
  '{"fields":[{"name":"projectId","type":"int","required":true,"value_from":"projectId"},{"name":"month","type":"month","label":"Месяц","required":true}]}',
  true,
  true,
  true,
  30,
  true,
  false
),
(
  'form29',
  'Форма 29',
  '/report/form29',
  '{"fields":[{"name":"blockId","type":"dict","label":"Блок","required":true,"options_api":"projectBlocks"},{"name":"month","type":"month","label":"Месяц","required":true}]}',
  true,
  true,
  true,
  40,
  true,
  false
),
(
  'schedule',
  'График работ',
  '/report/schedule',
  '{"fields":[{"name":"projectId","type":"int","required":true,"value_from":"projectId"}]}',
  true,
  true,
  true,
  50,
  true,
  false
),
(
  'material-schedule',
  'График поставки материалов',
  '/report/material-schedule',
  '{"fields":[{"name":"projectId","type":"int","required":true,"value_from":"projectId"}]}',
  true,
  true,
  true,
  60,
  true,
  false
),
(
  'estimate-stage',
  'Сметный отчет',
  '/report/estimate-stage',
  '{"preview":false,"fields":[{"name":"blockId","type":"dict","label":"Блок","required":true,"options_api":"projectBlocks"}]}',
  false,
  false,
  true,
  70,
  true,
  false
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  report_url = EXCLUDED.report_url,
  params_schema = EXCLUDED.params_schema,
  allow_pdf = EXCLUDED.allow_pdf,
  allow_docx = EXCLUDED.allow_docx,
  allow_xlsx = EXCLUDED.allow_xlsx,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active,
  deleted = false,
  updated_at = now();
