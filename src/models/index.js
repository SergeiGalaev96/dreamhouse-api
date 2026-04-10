const sequelize = require('../config/database');

// импорт моделей
const MaterialEstimate = require('./MaterialEstimate');
const MaterialEstimateItem = require('./MaterialEstimateItem');

const WorkPerformed = require('./WorkPerformed');
const WorkPerformedItem = require('./WorkPerformedItem');

const Project = require('./Project');
const ProjectBlock = require('./ProjectBlock');
const BlockStage = require('./BlockStage');
const StageSubsection = require('./StageSubsection');

const MaterialRequest = require('./MaterialRequest');
const MaterialRequestItem = require('./MaterialRequestItem');

const Material = require('./Material');
const UnitOfMeasure = require('./UnitOfMeasure');

const PurchaseOrderItem = require('./PurchaseOrderItem');
const PurchaseOrder = require('./PurchaseOrder');

const Supplier = require('./Supplier');
const SupplierRating = require('./SupplierRating');


const Currency = require('./Currency');
const CurrencyRate = require('./CurrencyRate');

const WarehouseStock = require('./WarehouseStock');
const Warehouse = require('./Warehouse');
const MaterialWriteOff = require('./MaterialWriteOff');
const MaterialWriteOffItem = require('./MaterialWriteOffItem');
const MbpWriteOff = require('./MbpWriteOff');
const MbpWriteOffItem = require('./MbpWriteOffItem');

const Document = require('./Document');
const DocumentFile = require('./DocumentFile');


/**
 * ================================
 * ESTIMATE
 * ================================
 */

// MaterialEstimate → MaterialEstimateItem
MaterialEstimate.hasMany(MaterialEstimateItem, {
  foreignKey: 'material_estimate_id',
  as: 'items'
});

MaterialEstimateItem.belongsTo(MaterialEstimate, {
  foreignKey: 'material_estimate_id',
  as: 'material_estimate'
});

/**
 * ================================
 * PROJECT STRUCTURE
 * ================================
 */

// Project → ProjectBlock
Project.hasMany(ProjectBlock, {
  foreignKey: 'project_id',
  as: 'blocks'
});

ProjectBlock.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project'
});

// ProjectBlock → MaterialEstimate
ProjectBlock.hasMany(MaterialEstimate, {
  foreignKey: 'block_id',
  as: 'estimates'
});

MaterialEstimate.belongsTo(ProjectBlock, {
  foreignKey: 'block_id',
  as: 'block'
});


/**
 * ================================
 * WORK PERFORMED
 * ================================
 */

// WorkPerformed → WorkPerformedItem
WorkPerformed.hasMany(WorkPerformedItem, {
  foreignKey: 'work_performed_id',
  as: 'items'
});

WorkPerformedItem.belongsTo(WorkPerformed, {
  foreignKey: 'work_performed_id',
  as: 'work_performed'
});

// MaterialEstimateItem → WorkPerformedItem
MaterialEstimateItem.hasMany(WorkPerformedItem, {
  foreignKey: 'material_estimate_item_id',
  as: 'performed_items'
});

WorkPerformedItem.belongsTo(MaterialEstimateItem, {
  foreignKey: 'material_estimate_item_id',
  as: 'estimate_item'
});


/**
 * ================================
 * BLOCK STRUCTURE
 * ================================
 */

// ProjectBlock → BlockStage
ProjectBlock.hasMany(BlockStage, {
  foreignKey: 'block_id',
  as: 'stages'
});

BlockStage.belongsTo(ProjectBlock, {
  foreignKey: 'block_id',
  as: 'block'
});

// BlockStage → StageSubsection
BlockStage.hasMany(StageSubsection, {
  foreignKey: 'stage_id',
  as: 'subsections'
});

StageSubsection.belongsTo(BlockStage, {
  foreignKey: 'stage_id',
  as: 'stage'
});


/**
 * ================================
 * MATERIAL REQUEST
 * ================================
 */

MaterialRequest.hasMany(MaterialRequestItem, {
  foreignKey: 'material_request_id',
  as: 'items'
});

MaterialRequestItem.belongsTo(MaterialRequest, {
  foreignKey: 'material_request_id',
  as: 'material_request'
});

// MaterialRequestItem → Material
MaterialRequestItem.belongsTo(Material, {
  foreignKey: 'material_id',
  as: 'material'
});

// MaterialRequestItem → UnitOfMeasure
MaterialRequestItem.belongsTo(UnitOfMeasure, {
  foreignKey: 'unit_of_measure',
  as: 'unit'
});


/**
 * ================================
 * PURCHASE ORDER
 * ================================
 */

MaterialRequestItem.hasMany(PurchaseOrderItem, {
  foreignKey: 'material_request_item_id',
  as: 'purchase_order_items'
});

PurchaseOrderItem.belongsTo(MaterialRequestItem, {
  foreignKey: 'material_request_item_id',
  as: 'material_request_item'
});

PurchaseOrder.hasMany(PurchaseOrderItem, {
  foreignKey: 'purchase_order_id',
  as: 'items'
});

PurchaseOrderItem.belongsTo(PurchaseOrder, {
  foreignKey: 'purchase_order_id',
  as: 'purchase_order'
});

PurchaseOrderItem.belongsTo(Material, {
  foreignKey: "material_id",
  as: "material"
});
Material.hasMany(PurchaseOrderItem, {
  foreignKey: "material_id",
  as: "purchase_items"
});

PurchaseOrder.belongsTo(Project, {
  foreignKey: "project_id",
  as: "project"
});

PurchaseOrder.belongsTo(ProjectBlock, {
  foreignKey: "block_id",
  as: "block"
});

/**
 * ================================
 * SUPPLIER RATING
 * ================================
 */
Supplier.hasMany(SupplierRating, {
  foreignKey: "supplier_id",
  as: "ratings"
});

SupplierRating.belongsTo(Supplier, {
  foreignKey: "supplier_id",
  as: "supplier"
});


/**
 * ================================
 * CURRENCY
 * ================================
 */

Currency.hasMany(CurrencyRate, {
  foreignKey: 'currency_id',
  as: 'rates'
});

CurrencyRate.belongsTo(Currency, {
  foreignKey: 'currency_id',
  as: 'currency'
});


/**
 * ================================
 * WAREHOUSE
 * ================================
 */

Warehouse.hasMany(WarehouseStock, {
  foreignKey: 'warehouse_id',
  as: 'items'
});

WarehouseStock.belongsTo(Warehouse, {
  foreignKey: 'warehouse_id',
  as: 'warehouse'
});

WarehouseStock.belongsTo(Material, {
  foreignKey: "material_id",
  as: "material"
});

/**
 * ================================
 * MATERIAL WRITE OFF
 * ================================
 */

MaterialWriteOff.hasMany(MaterialWriteOffItem, {
  foreignKey: 'material_write_off_id',
  as: 'items'
});

MaterialWriteOffItem.belongsTo(MaterialWriteOff, {
  foreignKey: 'material_write_off_id',
  as: 'write_off'
});

MaterialWriteOff.belongsTo(WorkPerformed, {
  foreignKey: 'work_performed_id',
  as: 'work_performed'
});

MaterialWriteOff.belongsTo(WorkPerformedItem, {
  foreignKey: 'work_performed_item_id',
  as: 'work_performed_item'
});

MaterialWriteOff.belongsTo(Warehouse, {
  foreignKey: 'warehouse_id',
  as: 'warehouse'
});

MaterialWriteOffItem.belongsTo(Material, {
  foreignKey: 'material_id',
  as: 'material'
});

MbpWriteOff.hasMany(MbpWriteOffItem, {
  foreignKey: 'mbp_write_off_id',
  as: 'items'
});

MbpWriteOffItem.belongsTo(MbpWriteOff, {
  foreignKey: 'mbp_write_off_id',
  as: 'write_off'
});

MbpWriteOff.belongsTo(Warehouse, {
  foreignKey: 'warehouse_id',
  as: 'warehouse'
});

MbpWriteOffItem.belongsTo(Material, {
  foreignKey: 'material_id',
  as: 'material'
});


/**
 * ================================
 * DOCUMENTS
 * ================================
 */

Document.hasMany(DocumentFile, {
  foreignKey: 'document_id',
  as: 'files'
});

DocumentFile.belongsTo(Document, {
  foreignKey: 'document_id',
  as: 'document'
});


module.exports = {
  sequelize,
  MaterialEstimate,
  MaterialEstimateItem,
  WorkPerformed,
  WorkPerformedItem,
  Project,
  ProjectBlock,
  BlockStage,
  StageSubsection,
  MaterialRequest,
  MaterialRequestItem,
  Material,
  UnitOfMeasure,
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  SupplierRating,
  Currency,
  CurrencyRate,
  Warehouse,
  WarehouseStock,
  MaterialWriteOff,
  MaterialWriteOffItem,
  MbpWriteOff,
  MbpWriteOffItem,
  Document,
  DocumentFile
};
