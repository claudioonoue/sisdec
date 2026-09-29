import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ACCEPTED_MIME_TYPES, MAX_FILES_PER_REQUEST } from '../../common/upload.constants.js';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import {
  AgentRole,
  Priority,
  ReportCategory,
  ReportStatus,
  ReportType,
} from '../../generated/prisma/enums.js';
import type {
  EnumOptionDto,
  InternalMetadataDto,
  PublicMetadataDto,
  ReportTypeOptionDto,
  UploadLimitsDto,
} from './dto/metadata.dto.js';
import {
  AGENT_ROLE_LABELS,
  PRIORITY_LABELS,
  REPORT_CATEGORY_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  isUrgentReportType,
} from './metadata.labels.js';

/**
 * Fonte única das enumerações consumidas pelos portais. Eles não mantêm lista
 * nem mapa de tradução próprio: tudo vem daqui (RNF-API-29).
 *
 * A ordem devolvida é a de declaração no `schema.prisma`, que agrupa os tipos por
 * afinidade — é a ordem em que aparecem nos seletores das interfaces.
 */
@Injectable()
export class MetadataService {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  getPublicMetadata(): PublicMetadataDto {
    return {
      reportTypes: this.getReportTypes(),
      reportCategories: this.getReportCategories(),
      reportStatuses: this.getReportStatuses(),
      upload: this.getUploadLimits(),
    };
  }

  getInternalMetadata(): InternalMetadataDto {
    return {
      priorities: Object.values(Priority).map((value) => ({
        value,
        label: PRIORITY_LABELS[value],
      })),
      agentRoles: Object.values(AgentRole).map((value) => ({
        value,
        label: AGENT_ROLE_LABELS[value],
      })),
    };
  }

  getReportTypes(): ReportTypeOptionDto[] {
    return Object.values(ReportType).map((value) => ({
      value,
      label: REPORT_TYPE_LABELS[value],
      urgent: isUrgentReportType(value),
    }));
  }

  getReportCategories(): EnumOptionDto<ReportCategory>[] {
    return Object.values(ReportCategory).map((value) => ({
      value,
      label: REPORT_CATEGORY_LABELS[value],
    }));
  }

  getReportStatuses(): EnumOptionDto<ReportStatus>[] {
    return Object.values(ReportStatus).map((value) => ({
      value,
      label: REPORT_STATUS_LABELS[value],
    }));
  }

  /**
   * Limites derivados da configuração efetiva, e não repetidos aqui — é o que
   * permite aos portais validarem o arquivo antes do envio sem duplicar
   * constantes (RF-API-64).
   */
  getUploadLimits(): UploadLimitsDto {
    return {
      maxFiles: MAX_FILES_PER_REQUEST,
      maxSizeMb: this.config.get('MAX_UPLOAD_SIZE_MB', { infer: true }),
      acceptedMimeTypes: [...ACCEPTED_MIME_TYPES],
    };
  }
}
