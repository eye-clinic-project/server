import { Controller, ForbiddenException, Get, Header, Param, Query, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { SkipThrottle } from '@nestjs/throttler';
import { Types } from 'mongoose';
import type { Connection } from 'mongoose';
import { AiService } from '../../dependency/service/ai.service.js';
import { CacheService } from '../../dependency/service/cache.service.js';
import { SignedUrl } from '../../dependency/presenter.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { FundusImageRepository } from '../../database/repository/fundus-image.repository.js';
import { AnalysisRepository } from '../../database/repository/analysis.repository.js';
import { UserRepository } from '../../database/repository/user.repository.js';
import { StorageService } from '../../dependency/service/storage.service.js';
import { NotFoundException } from '@nestjs/common';

@ApiTags('System')
@Controller('api/v1')
export class SystemController {
  constructor(
    private readonly ai: AiService,
    private readonly cache: CacheService,
    private readonly storage: StorageService,
    private readonly images: FundusImageRepository,
    private readonly analyses: AnalysisRepository,
    private readonly users: UserRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /** NestJS health (used by uptime monitoring, NFR5). */
  @Get('health')
  @SkipThrottle()
  @ApiOperation({
    summary: "API health",
    description: "Public. Checks MongoDB and Redis. status is ok or degraded. Use it for uptime monitoring (NFR5).",
  })
  async health() {
    const database = this.connection.readyState === 1;
    const redis = await this.cache
      .setCache({ key: 'health:ping', value: Date.now(), options: { EX: 10 } })
      .catch(() => false);
    return { status: database && redis ? 'ok' : 'degraded', database, redis, uptimeSeconds: Math.round(process.uptime()), time: new Date() };
  }

  @Get('ai/health')
  @SkipThrottle()
  @ApiOperation({
    summary: "AI service health",
    description: "Public. Shows the AI mode (disabled, mock or remote) and whether the FastAPI service is reachable (NFR15).",
  })
  aiHealth() {
    return this.ai.health();
  }

  @Get('ai/model-info')
  @Auth()
  @ApiOperation({
    summary: "AI model information",
    description: "Any signed-in user. Information reported by the AI service about the current model. 503 when the AI service is not connected.",
  })
  modelInfo() {
    return this.ai.modelInfo();
  }

  /**
   * Signed, short-lived file URLs (NFR9) so the browser can load private images in <img> tags.
   * URLs are only ever produced for users who passed the access checks.
   */
  @Get('files/:kind/:id')
  @SkipThrottle()
  @Header('Cache-Control', 'private, max-age=3600')
  @ApiOperation({
    summary: "Open a file from a signed URL",
    description: "Public, but only with a valid signature (NFR9). Serves images, Grad-CAM overlays and avatars from the signed URLs the API returns in fileUrl, gradCamUrl and avatarUrl. Links expire after 1–2 hours; tampered or expired links return 403.",
  })
  async file(
    @Param('kind') kind: string,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Query('exp') exp: string,
    @Query('sig') sig: string,
  ) {
    if (!SignedUrl.verify(kind, id.toString(), exp, sig)) {
      throw new ForbiddenException('This link is invalid or has expired');
    }
    let key: string | null | undefined;
    let mime = 'image/jpeg';
    if (kind === 'image') {
      const image = await this.images.findById({ _id: id, projection: '+storageKey' });
      key = image?.storageKey;
      mime = image?.mimeType ?? mime;
    } else if (kind === 'gradcam') {
      const analysis = await this.analyses.findById({ _id: id, projection: '+gradCamKey' });
      key = analysis?.gradCamKey;
    } else if (kind === 'avatar') {
      key = (await this.users.findById({ _id: id }))?.avatarKey;
    }
    if (!key) throw new NotFoundException('File not found');
    if (kind !== 'image') mime = key.includes('.png.') ? 'image/png' : 'image/jpeg';
    return new StreamableFile(await this.storage.read(key), {
      type: mime,
      disposition: 'inline',
    });
  }
}
