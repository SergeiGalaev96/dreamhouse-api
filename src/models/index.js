const sequelize = require('../config/database');

// импорт моделей (КЛАССЫ, не функции)
const MaterialStatement = require('./MaterialStatement');
const MaterialStatementItem = require('./MaterialStatementItem');

const MaterialRequest = require('./MaterialRequest');
const MaterialRequestItem = require('./MaterialRequestItem');

const Material = require('./Material');
const UnitOfMeasure = require('./UnitOfMeasure');

const PurchaseOrderItem = require('./PurchaseOrderItem');
const PurchaseOrder = require('./PurchaseOrder');

const Currency = require('./Currency');
const CurrencyRate = require('./CurrencyRate');

const WarehouseStock = require('./WarehouseStock');
const Warehouse = require('./Warehouse');

const Document = require('./Document');
const DocumentFile = require('./DocumentFile');

/**
 * === АССОЦИАЦИИ ===
 */

// MaterialStatement -> MaterialStatementItem
MaterialStatement.hasMany(MaterialStatementItem, {
  foreignKey: 'material_statement_id',
  as: 'items'
});

MaterialStatementItem.belongsTo(MaterialStatement, {
  foreignKey: 'material_statement_id',
  as: 'material_statement'
});

// MaterialRequest -> MaterialRequestItem
MaterialRequest.hasMany(MaterialRequestItem, {
  foreignKey: 'material_request_id',
  as: 'items'
});

MaterialRequestItem.belongsTo(MaterialRequest, {
  foreignKey: 'material_request_id',
  as: 'material_request'
});

// MaterialRequestItem -> Material
MaterialRequestItem.belongsTo(Material, {
  foreignKey: 'material_id',
  as: 'material'
});

// MaterialRequestItem -> UnitOfMeasure
MaterialRequestItem.belongsTo(UnitOfMeasure, {
  foreignKey: 'unit_of_measure',
  as: 'unit'
});

// MaterialRequestItem -> PurchaseOrderItem
MaterialRequestItem.hasMany(PurchaseOrderItem, {
  foreignKey: 'material_request_item_id',
  as: 'purchase_order_items'
});

PurchaseOrderItem.belongsTo(MaterialRequestItem, {
  foreignKey: 'material_request_item_id',
  as: 'material_request_item'
});

// PurchaseOrder → PurchaseOrderItem
PurchaseOrder.hasMany(PurchaseOrderItem, {
  foreignKey: 'purchase_order_id',
  as: 'items'
});

PurchaseOrderItem.belongsTo(PurchaseOrder, {
  foreignKey: 'purchase_order_id',
  as: 'purchase_order'
});


Currency.associate = models => {
  Currency.hasMany(models.CurrencyRate, {
    foreignKey: 'currency_id'
  });
};
CurrencyRate.associate = models => {
  CurrencyRate.belongsTo(models.Currency, {
    foreignKey: 'currency_id',
    as: 'currency'
  });
};

// Warehouse → WarehouseStock
Warehouse.hasMany(WarehouseStock, {
  foreignKey: 'warehouse_id',
  as: 'items'
});

WarehouseStock.belongsTo(Warehouse, {
  foreignKey: 'warehouse_id',
  as: 'warehouse'
});

// Document → DocumentFile
Document.hasMany(DocumentFile, {
  foreignKey: 'document_id',
  as: 'files'
});

DocumentFile.belongsTo(Document, {
  foreignKey: 'document_id',
  as: 'file'
});

module.exports = {
  sequelize,
  MaterialStatement,
  MaterialStatementItem,
  MaterialRequest,
  MaterialRequestItem,
  Material,
  UnitOfMeasure,
  PurchaseOrderItem,
  PurchaseOrder,
  Currency,
  CurrencyRate,
  Warehouse,
  WarehouseStock,
  Document,
  DocumentFile
};