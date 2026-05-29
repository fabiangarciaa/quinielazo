"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringModule = void 0;
const common_1 = require("@nestjs/common");
const scoring_service_1 = require("./scoring.service");
const ranking_module_1 = require("../ranking/ranking.module");
const events_module_1 = require("../events/events.module");
let ScoringModule = class ScoringModule {
};
exports.ScoringModule = ScoringModule;
exports.ScoringModule = ScoringModule = __decorate([
    (0, common_1.Module)({ imports: [ranking_module_1.RankingModule, events_module_1.EventsModule], providers: [scoring_service_1.ScoringService], exports: [scoring_service_1.ScoringService] })
], ScoringModule);
//# sourceMappingURL=scoring.module.js.map