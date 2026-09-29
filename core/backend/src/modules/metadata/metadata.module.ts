import { Module } from '@nestjs/common';
import { MetadataController } from './metadata.controller.js';
import { MetadataService } from './metadata.service.js';

@Module({
  controllers: [MetadataController],
  providers: [MetadataService],
  // Exportado porque a triagem (B5) usa a marcação `urgent` para sugerir prioridade.
  exports: [MetadataService],
})
export class MetadataModule {}
