import { Module } from '@nestjs/common';
import { PotsService } from './pots.service';
import { PotsController } from './pots.controller';
@Module({ providers:[PotsService], controllers:[PotsController], exports:[PotsService] })
export class PotsModule {}
