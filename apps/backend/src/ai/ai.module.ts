import { Global, Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';
import { GeoResolverService } from './geo-resolver.service';

@Global()
@Module({
  controllers: [AiController],
  providers: [AiService, GeminiService, GeoResolverService],
  exports: [AiService, GeminiService, GeoResolverService],
})
export class AiModule {}
