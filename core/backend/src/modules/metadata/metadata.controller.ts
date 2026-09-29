import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PublicMetadataDto,
  ReportTypeOptionDto,
} from './dto/metadata.dto.js';
import { MetadataService } from './metadata.service.js';

@ApiTags('metadata')
@Controller()
export class MetadataController {
  constructor(private readonly metadata: MetadataService) {}

  @Get('metadata')
  @ApiOperation({
    summary: 'Enumerações públicas e limites de upload',
    description:
      'Consumido pelos dois portais para obter os rótulos em pt-BR. Não exige autenticação. ' +
      'As enumerações de uso interno ficam em GET /metadata/internal.',
  })
  @ApiOkResponse({ type: PublicMetadataDto })
  getPublicMetadata(): PublicMetadataDto {
    return this.metadata.getPublicMetadata();
  }

  @Get('report-types')
  @ApiOperation({
    summary: 'Atalho para metadata.reportTypes',
    description: 'Mantido pelo contrato; devolve apenas a lista de tipos de ocorrência.',
  })
  @ApiOkResponse({ type: [ReportTypeOptionDto] })
  getReportTypes(): ReportTypeOptionDto[] {
    return this.metadata.getReportTypes();
  }
}
