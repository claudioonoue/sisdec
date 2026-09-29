import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator.js';
import { MAX_FILES_PER_REQUEST } from '../../common/upload.constants.js';
import { AttachmentsService, type UploadedFile } from './attachments.service.js';
import { AttachmentResponseDto } from './dto/attachment-response.dto.js';

@ApiTags('attachments')
@Controller()
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Public()
  @Post('reports/:id/attachments')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FilesInterceptor('files', MAX_FILES_PER_REQUEST))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @ApiOperation({
    summary: 'Envia fotos da ocorrência',
    description:
      'Aceito apenas enquanto a ocorrência está em RECEIVED. O tipo é verificado pelo conteúdo do arquivo.',
  })
  @ApiCreatedResponse({ type: [AttachmentResponseDto] })
  @ApiBadRequestResponse({ description: 'Arquivo fora dos formatos aceitos ou acima do limite' })
  @ApiNotFoundResponse({ description: 'Ocorrência não encontrada' })
  @ApiConflictResponse({ description: 'A ocorrência já saiu de RECEIVED' })
  @ApiTooManyRequestsResponse({ description: 'Limite de envios por minuto excedido' })
  upload(
    @Param('id', ParseUUIDPipe) reportId: string,
    @UploadedFiles() files: UploadedFile[] = [],
  ): Promise<AttachmentResponseDto[]> {
    return this.attachments.attachToReport(reportId, files);
  }

  @Public()
  @Get('attachments/:id')
  @ApiOperation({
    summary: 'Devolve o conteúdo do anexo',
    description:
      'Sem autenticação, porque o Portal do Cidadão exibe as fotos na consulta por protocolo. ' +
      'A proteção é o id ser um UUID não enumerável.',
  })
  @ApiNotFoundResponse({ description: 'Anexo não encontrado' })
  async download(@Param('id', ParseUUIDPipe) id: string): Promise<StreamableFile> {
    const { stream, mimeType, fileName } = await this.attachments.openForReading(id);

    // StreamableFile, e não o stream cru: devolver o Readable direto faria o Nest
    // serializá-lo como JSON, servindo um objeto em vez da imagem. Assim o
    // conteúdo sai em fluxo, sem carregar o arquivo na memória (RNF-API-06).
    return new StreamableFile(stream, {
      type: mimeType,
      // `inline` para o navegador exibir a foto; o nome é sugestão de download, e
      // vai entre aspas por poder conter espaços. Aspas e quebras de linha são
      // removidas para não permitir injeção de cabeçalho.
      disposition: `inline; filename="${fileName.replace(/["\r\n]/g, '')}"`,
    });
  }
}
