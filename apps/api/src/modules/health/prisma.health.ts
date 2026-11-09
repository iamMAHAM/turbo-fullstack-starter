import { Injectable, Logger } from '@nestjs/common';
import {
	type HealthIndicatorResult,
	HealthIndicatorService,
} from '@nestjs/terminus';
import { I18nService } from '../../i18n/i18n.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class PrismaHealthIndicator {
	private readonly logger = new Logger(PrismaHealthIndicator.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly healthIndicatorService: HealthIndicatorService,
		private readonly i18n: I18nService,
	) {}

	async isHealthy(key: string): Promise<HealthIndicatorResult> {
		const indicator = this.healthIndicatorService.check(key);
		const startedAt = performance.now();
		try {
			await this.prisma.$queryRaw`SELECT 1`;
			return indicator.up({
				responseTime: Math.round(performance.now() - startedAt),
			});
		} catch (error) {
			this.logger.error(error);
			return indicator.down({
				message: this.i18n.t('api:healthcheck.databaseDown'),
			});
		}
	}
}
