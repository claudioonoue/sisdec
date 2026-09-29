import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import {
  CountByKeyDto,
  DashboardPeriodDto,
  DashboardSummaryDto,
} from './dto/dashboard.dto.js';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Totais por situação, prioridade e tipo' })
  @ApiOkResponse({ type: DashboardSummaryDto })
  summary(@Query() period: DashboardPeriodDto): Promise<DashboardSummaryDto> {
    return this.dashboard.summary(period);
  }

  @Get('by-district')
  @ApiOperation({ summary: 'Ocorrências agrupadas por bairro' })
  @ApiOkResponse({ type: [CountByKeyDto] })
  byDistrict(@Query() period: DashboardPeriodDto): Promise<CountByKeyDto[]> {
    return this.dashboard.byDistrict(period);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Volume de registros por dia' })
  @ApiOkResponse({ type: [CountByKeyDto] })
  timeline(@Query() period: DashboardPeriodDto): Promise<CountByKeyDto[]> {
    return this.dashboard.timeline(period);
  }
}
