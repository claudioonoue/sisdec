import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_FILES_PER_REQUEST } from '../../common/upload.constants.js';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { AttachmentsController } from './attachments.controller.js';
import { AttachmentsService } from './attachments.service.js';
import { LocalStorageService } from './storage/local-storage.service.js';
import { STORAGE_SERVICE } from './storage/storage.service.js';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        // Em memória para que o tipo seja verificado pelo conteúdo **antes** de
        // qualquer gravação. O consumo é limitado pelos tetos abaixo.
        storage: memoryStorage(),
        limits: {
          fileSize: config.get('MAX_UPLOAD_SIZE_MB', { infer: true }) * 1024 * 1024,
          files: MAX_FILES_PER_REQUEST,
        },
      }),
    }),
  ],
  controllers: [AttachmentsController],
  providers: [
    AttachmentsService,
    {
      // Ponto único de escolha da implementação de armazenamento (RNF-API-28).
      // Trocar por S3 significa acrescentar uma classe e um caso aqui — nada mais.
      provide: STORAGE_SERVICE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => {
        const driver = config.get('STORAGE_DRIVER', { infer: true });

        switch (driver) {
          case 'local':
            return new LocalStorageService(config);
          default:
            throw new Error(`STORAGE_DRIVER não suportado: ${driver}`);
        }
      },
    },
  ],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
