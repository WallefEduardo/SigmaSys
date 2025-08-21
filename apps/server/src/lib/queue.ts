import Bull, { type Job, type Queue } from "bull";
import { redis } from "./cache";
import { logger } from "./logger";
import { TelemetryService } from "./telemetry";

const isDevelopment = process.env.NODE_ENV !== "production";
const isTest = process.env.NODE_ENV === "test";

// Configuração do Bull Queue
const queueConfig = {
	redis: {
		host: process.env.REDIS_HOST || "localhost",
		port: Number(process.env.REDIS_PORT) || 6379,
		password: process.env.REDIS_PASSWORD,
		db: Number(process.env.REDIS_DB) || 1, // Usar DB diferente para queues
	},
	defaultJobOptions: {
		removeOnComplete: 100, // Manter últimos 100 jobs concluídos
		removeOnFail: 50, // Manter últimos 50 jobs falhados
		attempts: 3, // Tentar 3 vezes antes de falhar
		backoff: {
			type: "exponential",
			delay: 2000, // Começar com 2 segundos
		},
	},
	settings: {
		stalledInterval: 30 * 1000, // 30 segundos
		maxStalledCount: 1,
	},
};

// Tipos de jobs disponíveis
export interface JobTypes {
	// Jobs de email
	"send-email": {
		to: string;
		subject: string;
		template: string;
		data: Record<string, any>;
	};

	// Jobs de relatórios
	"generate-report": {
		companyId: string;
		reportType: "materials" | "products" | "orders" | "financial";
		filters: Record<string, any>;
		userId: string;
		format: "pdf" | "excel" | "csv";
	};

	// Jobs de backup
	"backup-data": {
		companyId: string;
		tables: string[];
		userId: string;
	};

	// Jobs de importação
	"import-data": {
		companyId: string;
		dataType: "materials" | "products" | "clients";
		fileUrl: string;
		userId: string;
		options: Record<string, any>;
	};

	// Jobs de cálculos pesados
	"bulk-calculate": {
		companyId: string;
		productIds: string[];
		context: Record<string, any>;
		userId: string;
	};

	// Jobs de sincronização
	"sync-external": {
		companyId: string;
		provider: string;
		syncType: "full" | "incremental";
		options: Record<string, any>;
	};

	// Jobs de limpeza
	"cleanup-old-data": {
		companyId?: string;
		dataType: "logs" | "temp-files" | "cache" | "sessions";
		olderThan: string; // ISO date
	};

	// Jobs de notificações
	"send-notification": {
		userIds: string[];
		type: "push" | "sms" | "in-app";
		title: string;
		message: string;
		data?: Record<string, any>;
	};
}

export type JobName = keyof JobTypes;
export type JobData<T extends JobName> = JobTypes[T];

// Classe para gerenciar queues
export class QueueManager {
	private static queues = new Map<string, Queue>();
	private static initialized = false;

	/**
	 * Inicializar o sistema de queues
	 */
	static async initialize(): Promise<void> {
		if (QueueManager.initialized || isTest) {
			return;
		}

		try {
			// Criar queues principais
			const queueNames = [
				"email",
				"reports",
				"calculations",
				"imports",
				"notifications",
				"maintenance",
			];

			for (const name of queueNames) {
				const queue = new Bull(name, queueConfig);

				// Configurar event listeners
				QueueManager.setupQueueEvents(queue, name);

				QueueManager.queues.set(name, queue);
				logger.info(`Queue "${name}" initialized successfully`);
			}

			// Configurar processors
			QueueManager.setupProcessors();

			// Configurar jobs recorrentes
			QueueManager.setupRecurringJobs();

			QueueManager.initialized = true;
			logger.info("🚀 Queue system initialized successfully");
		} catch (error) {
			logger.error("Failed to initialize queue system", { error });
			throw error;
		}
	}

	/**
	 * Configurar event listeners para uma queue
	 */
	private static setupQueueEvents(queue: Queue, name: string): void {
		queue.on("ready", () => {
			logger.debug(`Queue "${name}" is ready`);
		});

		queue.on("error", (error) => {
			logger.error(`Queue "${name}" error`, { error });
			TelemetryService.recordError("queue_error", "high", `queue_${name}`);
		});

		queue.on("waiting", (jobId) => {
			logger.debug(`Job ${jobId} is waiting in queue "${name}"`);
		});

		queue.on("active", (job) => {
			logger.debug(`Job ${job.id} started processing in queue "${name}"`, {
				jobType: job.name,
				jobData: job.data,
			});
		});

		queue.on("completed", (job, result) => {
			const duration = Date.now() - job.processedOn!;

			TelemetryService.recordDatabaseQuery(
				`queue_${name}`,
				"job_completed",
				duration,
				true,
			);

			logger.info(`Job ${job.id} completed in queue "${name}"`, {
				jobType: job.name,
				duration,
				result:
					typeof result === "object"
						? JSON.stringify(result).substring(0, 200)
						: result,
			});
		});

		queue.on("failed", (job, error) => {
			const duration = job.processedOn ? Date.now() - job.processedOn : 0;

			TelemetryService.recordDatabaseQuery(
				`queue_${name}`,
				"job_failed",
				duration,
				false,
			);
			TelemetryService.recordError("job_failed", "medium", `queue_${name}`);

			logger.error(`Job ${job.id} failed in queue "${name}"`, {
				jobType: job.name,
				error: error.message,
				attempts: job.attemptsMade,
				maxAttempts: job.opts.attempts,
			});
		});

		queue.on("stalled", (job) => {
			logger.warn(`Job ${job.id} stalled in queue "${name}"`, {
				jobType: job.name,
			});
			TelemetryService.recordError("job_stalled", "medium", `queue_${name}`);
		});
	}

	/**
	 * Configurar processors para cada tipo de job
	 */
	private static setupProcessors(): void {
		// Email processor
		QueueManager.getQueue("email").process(
			"send-email",
			async (job: Job<JobData<"send-email">>) => {
				const { to, subject, template, data } = job.data;

				// Simular envio de email (integrar com provedor real)
				logger.info("Sending email", { to, subject, template });

				// Aqui você integraria com SendGrid, AWS SES, etc.
				await new Promise((resolve) => setTimeout(resolve, 1000));

				return { sent: true, messageId: `msg_${Date.now()}` };
			},
		);

		// Report processor
		QueueManager.getQueue("reports").process(
			"generate-report",
			async (job: Job<JobData<"generate-report">>) => {
				const { companyId, reportType, filters, userId, format } = job.data;

				logger.info("Generating report", { companyId, reportType, format });

				// Simular geração de relatório
				job.progress(25);
				await new Promise((resolve) => setTimeout(resolve, 2000));

				job.progress(50);
				await new Promise((resolve) => setTimeout(resolve, 2000));

				job.progress(75);
				await new Promise((resolve) => setTimeout(resolve, 1000));

				job.progress(100);

				const reportUrl = `https://reports.example.com/${companyId}/${Date.now()}.${format}`;

				return {
					reportUrl,
					generated: true,
					fileSize: "2.5MB",
					records: Math.floor(Math.random() * 1000) + 100,
				};
			},
		);

		// Calculations processor
		QueueManager.getQueue("calculations").process(
			"bulk-calculate",
			async (job: Job<JobData<"bulk-calculate">>) => {
				const { companyId, productIds, context, userId } = job.data;

				logger.info("Processing bulk calculations", {
					companyId,
					productCount: productIds.length,
				});

				const results = [];

				for (let i = 0; i < productIds.length; i++) {
					const productId = productIds[i];

					// Simular cálculo complexo
					await new Promise((resolve) => setTimeout(resolve, 100));

					results.push({
						productId,
						calculation: Math.random() * 1000,
						unit: "un",
					});

					// Atualizar progresso
					job.progress(Math.round(((i + 1) / productIds.length) * 100));
				}

				return { results, totalCalculated: results.length };
			},
		);

		// Import processor
		QueueManager.getQueue("imports").process(
			"import-data",
			async (job: Job<JobData<"import-data">>) => {
				const { companyId, dataType, fileUrl, userId, options } = job.data;

				logger.info("Processing data import", { companyId, dataType, fileUrl });

				// Simular processamento de importação
				job.progress(10);
				await new Promise((resolve) => setTimeout(resolve, 1000));

				job.progress(30);
				await new Promise((resolve) => setTimeout(resolve, 2000));

				job.progress(60);
				await new Promise((resolve) => setTimeout(resolve, 1500));

				job.progress(90);
				await new Promise((resolve) => setTimeout(resolve, 500));

				job.progress(100);

				return {
					imported: true,
					recordsProcessed: Math.floor(Math.random() * 500) + 50,
					errors: Math.floor(Math.random() * 5),
					warnings: Math.floor(Math.random() * 10),
				};
			},
		);

		// Notification processor
		QueueManager.getQueue("notifications").process(
			"send-notification",
			async (job: Job<JobData<"send-notification">>) => {
				const { userIds, type, title, message, data } = job.data;

				logger.info("Sending notifications", {
					userCount: userIds.length,
					type,
					title,
				});

				// Simular envio de notificações
				for (let i = 0; i < userIds.length; i++) {
					await new Promise((resolve) => setTimeout(resolve, 50));
					job.progress(Math.round(((i + 1) / userIds.length) * 100));
				}

				return {
					sent: userIds.length,
					failed: 0,
					type,
				};
			},
		);

		// Maintenance processor
		QueueManager.getQueue("maintenance").process(
			"cleanup-old-data",
			async (job: Job<JobData<"cleanup-old-data">>) => {
				const { companyId, dataType, olderThan } = job.data;

				logger.info("Cleaning up old data", { companyId, dataType, olderThan });

				// Simular limpeza
				await new Promise((resolve) => setTimeout(resolve, 3000));

				return {
					cleaned: true,
					recordsDeleted: Math.floor(Math.random() * 1000),
					spaceFreed: `${Math.floor(Math.random() * 100)}MB`,
				};
			},
		);
	}

	/**
	 * Configurar jobs recorrentes
	 */
	private static setupRecurringJobs(): void {
		const maintenanceQueue = QueueManager.getQueue("maintenance");

		// Limpeza diária de logs antigos (às 2h da manhã)
		maintenanceQueue.add(
			"cleanup-old-data",
			{
				dataType: "logs",
				olderThan: new Date(
					Date.now() - 30 * 24 * 60 * 60 * 1000,
				).toISOString(), // 30 dias
			},
			{
				repeat: { cron: "0 2 * * *" }, // Todo dia às 2h
				removeOnComplete: 5,
				removeOnFail: 2,
			},
		);

		// Limpeza semanal de arquivos temporários (domingos às 3h)
		maintenanceQueue.add(
			"cleanup-old-data",
			{
				dataType: "temp-files",
				olderThan: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
			},
			{
				repeat: { cron: "0 3 * * 0" }, // Domingos às 3h
				removeOnComplete: 5,
				removeOnFail: 2,
			},
		);

		// Limpeza de cache antigo (a cada 6 horas)
		maintenanceQueue.add(
			"cleanup-old-data",
			{
				dataType: "cache",
				olderThan: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 horas
			},
			{
				repeat: { cron: "0 */6 * * *" }, // A cada 6 horas
				removeOnComplete: 5,
				removeOnFail: 2,
			},
		);

		logger.info("Recurring jobs configured successfully");
	}

	/**
	 * Obter uma queue pelo nome
	 */
	static getQueue(name: string): Queue {
		const queue = QueueManager.queues.get(name);
		if (!queue) {
			throw new Error(`Queue "${name}" not found`);
		}
		return queue;
	}

	/**
	 * Adicionar um job à queue
	 */
	static async addJob<T extends JobName>(
		queueName: string,
		jobName: T,
		data: JobData<T>,
		options: any = {},
	): Promise<Job> {
		const queue = QueueManager.getQueue(queueName);

		const job = await queue.add(jobName, data, {
			...queueConfig.defaultJobOptions,
			...options,
		});

		logger.info(`Job ${job.id} added to queue "${queueName}"`, {
			jobName,
			jobId: job.id,
		});

		return job;
	}

	/**
	 * Obter estatísticas de uma queue
	 */
	static async getQueueStats(queueName: string): Promise<{
		waiting: number;
		active: number;
		completed: number;
		failed: number;
		delayed: number;
		paused: number;
	}> {
		const queue = QueueManager.getQueue(queueName);

		const [waiting, active, completed, failed, delayed, paused] =
			await Promise.all([
				queue.getWaiting(),
				queue.getActive(),
				queue.getCompleted(),
				queue.getFailed(),
				queue.getDelayed(),
				queue.getPaused(),
			]);

		return {
			waiting: waiting.length,
			active: active.length,
			completed: completed.length,
			failed: failed.length,
			delayed: delayed.length,
			paused: paused.length,
		};
	}

	/**
	 * Obter estatísticas de todas as queues
	 */
	static async getAllQueueStats(): Promise<Record<string, any>> {
		const stats: Record<string, any> = {};

		for (const [name] of QueueManager.queues) {
			stats[name] = await QueueManager.getQueueStats(name);
		}

		return stats;
	}

	/**
	 * Pausar uma queue
	 */
	static async pauseQueue(queueName: string): Promise<void> {
		const queue = QueueManager.getQueue(queueName);
		await queue.pause();
		logger.info(`Queue "${queueName}" paused`);
	}

	/**
	 * Retomar uma queue
	 */
	static async resumeQueue(queueName: string): Promise<void> {
		const queue = QueueManager.getQueue(queueName);
		await queue.resume();
		logger.info(`Queue "${queueName}" resumed`);
	}

	/**
	 * Limpar uma queue
	 */
	static async clearQueue(
		queueName: string,
		status: "completed" | "failed" | "active" | "waiting" = "completed",
	): Promise<void> {
		const queue = QueueManager.getQueue(queueName);
		await queue.clean(0, status);
		logger.info(`Queue "${queueName}" cleared (${status} jobs)`);
	}

	/**
	 * Health check do sistema de queues
	 */
	static async healthCheck(): Promise<{
		healthy: boolean;
		queues: Record<string, { healthy: boolean; error?: string }>;
	}> {
		const result: any = {
			healthy: true,
			queues: {},
		};

		for (const [name, queue] of QueueManager.queues) {
			try {
				// Tentar uma operação simples para verificar se a queue está funcionando
				await queue.getWaiting();
				result.queues[name] = { healthy: true };
			} catch (error) {
				result.queues[name] = {
					healthy: false,
					error: error instanceof Error ? error.message : "Unknown error",
				};
				result.healthy = false;
			}
		}

		return result;
	}

	/**
	 * Shutdown graceful
	 */
	static async shutdown(): Promise<void> {
		try {
			const promises = Array.from(QueueManager.queues.values()).map((queue) =>
				queue.close(),
			);
			await Promise.all(promises);

			QueueManager.queues.clear();
			QueueManager.initialized = false;

			logger.info("🔴 Queue system shutdown completed");
		} catch (error) {
			logger.error("Error during queue shutdown", { error });
		}
	}
}

// Helpers para adicionar jobs específicos
export const QueueHelpers = {
	// Enviar email
	async sendEmail(data: JobData<"send-email">, options: any = {}) {
		return QueueManager.addJob("email", "send-email", data, options);
	},

	// Gerar relatório
	async generateReport(data: JobData<"generate-report">, options: any = {}) {
		return QueueManager.addJob("reports", "generate-report", data, {
			...options,
			attempts: 2, // Relatórios são mais críticos
			priority: "high",
		});
	},

	// Cálculos em lote
	async bulkCalculate(data: JobData<"bulk-calculate">, options: any = {}) {
		return QueueManager.addJob("calculations", "bulk-calculate", data, options);
	},

	// Importar dados
	async importData(data: JobData<"import-data">, options: any = {}) {
		return QueueManager.addJob("imports", "import-data", data, {
			...options,
			timeout: 30 * 60 * 1000, // 30 minutos timeout para imports
		});
	},

	// Enviar notificação
	async sendNotification(
		data: JobData<"send-notification">,
		options: any = {},
	) {
		return QueueManager.addJob("notifications", "send-notification", data, {
			...options,
			priority: "high", // Notificações são prioritárias
		});
	},

	// Backup de dados
	async backupData(data: JobData<"backup-data">, options: any = {}) {
		return QueueManager.addJob("maintenance", "backup-data", data, {
			...options,
			attempts: 1, // Não tentar novamente backups falhados automaticamente
			timeout: 60 * 60 * 1000, // 1 hora timeout
		});
	},
};

// Inicializar automaticamente se não estiver em teste
if (!isTest) {
	QueueManager.initialize().catch((error) => {
		logger.error("Failed to initialize queue system", { error });
	});
}

// Shutdown graceful
process.on("SIGTERM", async () => {
	await QueueManager.shutdown();
});

process.on("SIGINT", async () => {
	await QueueManager.shutdown();
});

export { QueueManager };
export default QueueManager;
