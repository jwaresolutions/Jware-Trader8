"use strict";
/**
 * Jware-Trader8 Database Package
 *
 * Database layer for configuration and trade storage.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeStore = exports.ConfigStore = void 0;
// Export stores
var config_store_1 = require("./stores/config-store");
Object.defineProperty(exports, "ConfigStore", { enumerable: true, get: function () { return config_store_1.ConfigStore; } });
var trade_store_1 = require("./stores/trade-store");
Object.defineProperty(exports, "TradeStore", { enumerable: true, get: function () { return trade_store_1.TradeStore; } });
