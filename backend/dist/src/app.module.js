"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const tournaments_module_1 = require("./tournaments/tournaments.module");
const participants_module_1 = require("./participants/participants.module");
const teams_module_1 = require("./teams/teams.module");
const pots_module_1 = require("./pots/pots.module");
const draws_module_1 = require("./draws/draws.module");
const phases_module_1 = require("./phases/phases.module");
const matches_module_1 = require("./matches/matches.module");
const results_module_1 = require("./results/results.module");
const scoring_module_1 = require("./scoring/scoring.module");
const ranking_module_1 = require("./ranking/ranking.module");
const simulator_module_1 = require("./simulator/simulator.module");
const export_module_1 = require("./export/export.module");
const audit_module_1 = require("./audit/audit.module");
const events_module_1 = require("./events/events.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule, auth_module_1.AuthModule, users_module_1.UsersModule, tournaments_module_1.TournamentsModule,
            participants_module_1.ParticipantsModule, teams_module_1.TeamsModule, pots_module_1.PotsModule, draws_module_1.DrawsModule,
            phases_module_1.PhasesModule, matches_module_1.MatchesModule, results_module_1.ResultsModule, scoring_module_1.ScoringModule,
            ranking_module_1.RankingModule, simulator_module_1.SimulatorModule, export_module_1.ExportModule, audit_module_1.AuditModule, events_module_1.EventsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map