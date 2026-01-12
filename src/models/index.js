const sequelize = require('../config/database');

// импорт моделей (КЛАССЫ, не функции)
const MaterialRequest = require('./MaterialRequest');
const MaterialRequestItem = require('./MaterialRequestItem');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const PurchaseOrder = require('./PurchaseOrder');

const Currency = require('./Currency');
const CurrencyRate = require('./CurrencyRate');

/**
 * === АССОЦИАЦИИ ===
 */

// MaterialRequest -> MaterialRequestItem
MaterialRequest.hasMany(MaterialRequestItem, {
  foreignKey: 'material_request_id',
  as: 'items'
});

MaterialRequestItem.belongsTo(MaterialRequest, {
  foreignKey: 'material_request_id',
  as: 'material_request'
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

module.exports = {
  sequelize,
  MaterialRequest,
  MaterialRequestItem,
  PurchaseOrderItem,
  PurchaseOrder,
  Currency,
  CurrencyRate
};