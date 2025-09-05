/**
 * 🔧 SCRIPT: Povoar Regras de Cálculo Predefinidas
 *
 * Script para criar as regras de cálculo predefinidas no banco de dados.
 * Execute com: pnpm tsx src/scripts/populate-calculation-rules.ts
 */

import { prisma } from "@repo/database/client";
import { PREDEFINED_RULES } from "../lib/formula-engine";

async function main() {
	console.log("🧮 Povoando regras de cálculo predefinidas...\n");

	let created = 0;
	let existing = 0;

	for (const rule of PREDEFINED_RULES) {
		try {
			// Verificar se regra já existe
			const existingRule = await prisma.calculationRule.findFirst({
				where: {
					name: rule.name,
					formula: rule.formula,
				},
			});

			if (existingRule) {
				console.log(`⚠️  Regra já existe: ${rule.name}`);
				existing++;
				continue;
			}

			// Criar nova regra
			const createdRule = await prisma.calculationRule.create({
				data: {
					name: rule.name,
					category: rule.category,
					formula: rule.formula,
					variables: rule.variables,
					resultUnit: rule.resultUnit,
					description: rule.description,
					active: true,
				},
			});

			console.log(
				`✅ Regra criada: ${rule.name} (${rule.category}) - ${rule.resultUnit}`,
			);
			console.log(`   Formula: ${rule.formula}`);
			console.log(`   Variables: [${rule.variables.join(", ")}]`);
			console.log(`   ID: ${createdRule.id}\n`);

			created++;
		} catch (error) {
			console.error(`❌ Erro ao criar regra ${rule.name}:`, error);
		}
	}

	console.log("\n📊 Resumo:");
	console.log(`✅ Regras criadas: ${created}`);
	console.log(`⚠️  Regras já existentes: ${existing}`);
	console.log(`📝 Total de regras no sistema: ${created + existing}`);

	// Mostrar estatísticas por categoria
	const rulesByCategory = await prisma.calculationRule.groupBy({
		by: ["category"],
		_count: {
			id: true,
		},
	});

	console.log("\n📈 Regras por categoria:");
	for (const stat of rulesByCategory) {
		console.log(`   ${stat.category}: ${stat._count.id} regras`);
	}
}

main()
	.catch((e) => {
		console.error("❌ Erro fatal:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
