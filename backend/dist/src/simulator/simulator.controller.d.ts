import { SimulatorService } from './simulator.service';
export declare class SimulatorController {
    private svc;
    constructor(svc: SimulatorService);
    simulate(id: string): Promise<import("./simulator.service").SimulationScenario[]>;
    teamWin(tid: string, body: {
        teamId: string;
    }): Promise<{
        team: any;
        ownerName: string;
        pointsGained: number;
        newOwnerRank: number;
        message: string;
    }>;
}
