import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller.js';
import { ReportsManagementService } from './reports-management.service.js';
import { ReportsService } from './reports.service.js';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsManagementService],
  exports: [ReportsService, ReportsManagementService],
})
export class ReportsModule {}
