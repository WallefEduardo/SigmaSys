/**
 * Sistema de alertas para cabeças de impressão
 * Gerencia notificações e alertas baseados na vida útil das cabeças
 */

export interface PrintHeadAlert {
	id: string;
	printHeadId: string;
	printHeadName: string;
	type: "warning" | "critical" | "maintenance" | "replacement";
	priority: "low" | "medium" | "high" | "urgent";
	title: string;
	message: string;
	actionRequired: string;
	estimatedDaysRemaining?: number;
	createdAt: Date;
	acknowledged: boolean;
}

export interface PrintHeadStatus {
	id: string;
	name: string;
	currentUse: number;
	lifespan: number;
	position: string;
	installationDate: Date;
	model: string;
}

/**
 * Calcula o percentual de vida útil usado
 */
export function calculateLifePercentage(
	currentUse: number,
	lifespan: number,
): number {
	return Math.min((currentUse / lifespan) * 100, 100);
}

/**
 * Estima quantos dias restam baseado no uso médio
 */
export function estimateDaysRemaining(
	currentUse: number,
	lifespan: number,
	averageUsagePerDay: number,
): number {
	const remainingShots = lifespan - currentUse;
	if (remainingShots <= 0 || averageUsagePerDay <= 0) return 0;
	return Math.floor(remainingShots / averageUsagePerDay);
}

/**
 * Calcula o uso médio diário baseado na data de instalação
 */
export function calculateAverageUsagePerDay(
	currentUse: number,
	installationDate: Date,
): number {
	const now = new Date();
	const daysSinceInstallation = Math.floor(
		(now.getTime() - installationDate.getTime()) / (1000 * 60 * 60 * 24),
	);
	if (daysSinceInstallation <= 0) return 0;
	return currentUse / daysSinceInstallation;
}

/**
 * Gera alertas para uma cabeça de impressão específica
 */
export function generatePrintHeadAlerts(
	printHead: PrintHeadStatus,
): PrintHeadAlert[] {
	const alerts: PrintHeadAlert[] = [];
	const lifePercentage = calculateLifePercentage(
		printHead.currentUse,
		printHead.lifespan,
	);
	const averageUsage = calculateAverageUsagePerDay(
		printHead.currentUse,
		printHead.installationDate,
	);
	const daysRemaining = estimateDaysRemaining(
		printHead.currentUse,
		printHead.lifespan,
		averageUsage,
	);

	// Alerta crítico - acima de 95%
	if (lifePercentage >= 95) {
		alerts.push({
			id: `critical-${printHead.id}`,
			printHeadId: printHead.id,
			printHeadName: printHead.name,
			type: "critical",
			priority: "urgent",
			title: "Substituição Urgente Necessária",
			message: `A ${printHead.name} (${printHead.model}) está com ${lifePercentage.toFixed(1)}% da vida útil consumida.`,
			actionRequired: "Substitua imediatamente para evitar falhas na produção",
			estimatedDaysRemaining: daysRemaining,
			createdAt: new Date(),
			acknowledged: false,
		});
	}

	// Alerta de atenção - entre 80% e 95%
	else if (lifePercentage >= 80) {
		alerts.push({
			id: `warning-${printHead.id}`,
			printHeadId: printHead.id,
			printHeadName: printHead.name,
			type: "warning",
			priority: "high",
			title: "Planeje Substituição",
			message: `A ${printHead.name} (${printHead.model}) está com ${lifePercentage.toFixed(1)}% da vida útil consumida.`,
			actionRequired: "Programe a substituição dentro dos próximos dias",
			estimatedDaysRemaining: daysRemaining,
			createdAt: new Date(),
			acknowledged: false,
		});
	}

	// Alerta de manutenção preventiva - entre 50% e 80%
	else if (lifePercentage >= 50) {
		alerts.push({
			id: `maintenance-${printHead.id}`,
			printHeadId: printHead.id,
			printHeadName: printHead.name,
			type: "maintenance",
			priority: "medium",
			title: "Manutenção Preventiva Recomendada",
			message: `A ${printHead.name} (${printHead.model}) está com ${lifePercentage.toFixed(1)}% da vida útil consumida.`,
			actionRequired:
				"Considere realizar limpeza e verificação da qualidade de impressão",
			estimatedDaysRemaining: daysRemaining,
			createdAt: new Date(),
			acknowledged: false,
		});
	}

	// Alerta para cabeças muito antigas (mais de 1 ano)
	const daysSinceInstallation = Math.floor(
		(new Date().getTime() - printHead.installationDate.getTime()) /
			(1000 * 60 * 60 * 24),
	);
	if (daysSinceInstallation > 365) {
		alerts.push({
			id: `aging-${printHead.id}`,
			printHeadId: printHead.id,
			printHeadName: printHead.name,
			type: "maintenance",
			priority: "low",
			title: "Cabeça Antiga - Verificação Recomendada",
			message: `A ${printHead.name} foi instalada há ${Math.floor(daysSinceInstallation / 30)} meses.`,
			actionRequired:
				"Monitore a qualidade de impressão e considere substituição preventiva",
			createdAt: new Date(),
			acknowledged: false,
		});
	}

	return alerts;
}

/**
 * Obtém todos os alertas para uma lista de cabeças
 */
export function getAllPrintHeadAlerts(
	printHeads: PrintHeadStatus[],
): PrintHeadAlert[] {
	if (!printHeads || !Array.isArray(printHeads)) {
		return [];
	}
	return printHeads.flatMap((printHead) => generatePrintHeadAlerts(printHead));
}

/**
 * Filtra alertas por prioridade
 */
export function getAlertsByPriority(
	alerts: PrintHeadAlert[],
	priority: PrintHeadAlert["priority"],
): PrintHeadAlert[] {
	if (!alerts || !Array.isArray(alerts)) {
		return [];
	}
	return alerts.filter((alert) => alert.priority === priority);
}

/**
 * Filtra alertas não reconhecidos
 */
export function getUnacknowledgedAlerts(
	alerts: PrintHeadAlert[],
): PrintHeadAlert[] {
	if (!alerts || !Array.isArray(alerts)) {
		return [];
	}
	return alerts.filter((alert) => !alert.acknowledged);
}

/**
 * Formata o tempo restante em texto legível
 */
export function formatTimeRemaining(days: number): string {
	if (days <= 0) return "Tempo esgotado";
	if (days === 1) return "1 dia";
	if (days < 7) return `${days} dias`;
	if (days < 30) return `${Math.floor(days / 7)} semanas`;
	if (days < 365) return `${Math.floor(days / 30)} meses`;
	return `${Math.floor(days / 365)} anos`;
}

/**
 * Obtém a cor apropriada para o tipo de alerta
 */
export function getAlertColor(type: PrintHeadAlert["type"]): string {
	switch (type) {
		case "critical":
			return "red";
		case "warning":
			return "yellow";
		case "maintenance":
			return "blue";
		case "replacement":
			return "purple";
		default:
			return "gray";
	}
}

/**
 * Obtém ícone apropriado para o tipo de alerta
 */
export function getAlertIcon(type: PrintHeadAlert["type"]): string {
	switch (type) {
		case "critical":
			return "AlertTriangle";
		case "warning":
			return "Clock";
		case "maintenance":
			return "Settings";
		case "replacement":
			return "RefreshCw";
		default:
			return "Info";
	}
}
