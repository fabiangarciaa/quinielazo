import { Response } from 'express';
import { ExportService } from './export.service';
export declare class ExportController {
    private svc;
    constructor(svc: ExportService);
    exportRanking(tid: string, fmt: string, res: Response): Promise<void>;
}
