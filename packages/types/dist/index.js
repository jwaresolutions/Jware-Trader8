"use strict";
/**
 * Jware-Trader8 Types Package
 *
 * Comprehensive TypeScript type definitions for the trading platform.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Export all trading interfaces
__exportStar(require("./trading"), exports);
// Export all data interfaces
__exportStar(require("./data"), exports);
// Export all strategy interfaces
__exportStar(require("./strategy"), exports);
// Export all configuration interfaces
__exportStar(require("./config"), exports);
// Export all backtesting interfaces
__exportStar(require("./backtesting"), exports);
