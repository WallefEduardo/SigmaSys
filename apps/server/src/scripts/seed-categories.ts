import "dotenv/config";
import { PrismaClient } from "../../prisma/generated/client";
import { getAllPredefinedCategories } from "../lib/quiz-engine/predefined-categories";

const prisma = new PrismaClient();

async function seedCategories() {
	try {
		console.log("🌱 Iniciando população de categorias de materiais...");

		// Buscar todas as empresas ativas
		const companies = await prisma.company.findMany({
			where: { active: true },
			select: { id: true, name: true }
		});

		if (companies.length === 0) {
			console.log("❌ Nenhuma empresa encontrada. Execute primeiro o seed de empresas.");
			return;
		}

		console.log(`📊 Encontradas ${companies.length} empresas ativas`);

		// Obter categorias predefinidas
		const predefinedCategories = getAllPredefinedCategories();
		console.log(`📋 ${predefinedCategories.length} categorias para inserir`);

		let totalInserted = 0;
		let totalSkipped = 0;

		// Inserir categorias para cada empresa
		for (const company of companies) {
			console.log(`\n🏢 Processando empresa: ${company.name}`);

			// Verificar quantas categorias já existem para esta empresa
			const existingCount = await prisma.materialCategory.count({
				where: { companyId: company.id }
			});

			if (existingCount > 0) {
				console.log(`ℹ️  Empresa já possui ${existingCount} categorias. Adicionando apenas novas...`);
			}

			const categoriesToInsert = [];

			for (const category of predefinedCategories) {
				// Verificar se categoria já existe para esta empresa
				const existing = await prisma.materialCategory.findFirst({
					where: {
						companyId: company.id,
						name: category.name,
						visualType: category.visualType,
						substrate: category.substrate
					}
				});

				if (existing) {
					totalSkipped++;
					continue;
				}

				categoriesToInsert.push({
					name: category.name,
					description: category.description,
					visualType: category.visualType,
					substrate: category.substrate,
					application: category.application,
					durability: category.durability,
					finish: category.finish,
					calculationRules: category.calculationRules,
					compatibleWith: category.compatibleWith,
					requiredProcesses: category.requiredProcesses,
					quizRules: category.quizRules,
					priority: category.priority,
					companyId: company.id
				});
			}

			if (categoriesToInsert.length > 0) {
				// Inserir em lotes para melhor performance
				const batchSize = 50;
				for (let i = 0; i < categoriesToInsert.length; i += batchSize) {
					const batch = categoriesToInsert.slice(i, i + batchSize);
					
					await prisma.materialCategory.createMany({
						data: batch,
						skipDuplicates: true
					});

					totalInserted += batch.length;
					console.log(`  ✅ Lote ${Math.floor(i / batchSize) + 1}: ${batch.length} categorias inseridas`);
				}
			}

			console.log(`  📈 Total para ${company.name}: ${categoriesToInsert.length} novas categorias`);
		}

		// Estatísticas finais
		console.log(`\n📊 Resumo da População:`);
		console.log(`  ✅ Total inserido: ${totalInserted} categorias`);
		console.log(`  ⏭️  Total pulado: ${totalSkipped} categorias (já existiam)`);
		console.log(`  🏢 Empresas processadas: ${companies.length}`);

		// Verificação final
		const finalCount = await prisma.materialCategory.count();
		console.log(`\n🎯 Total de categorias no banco: ${finalCount}`);

		// Estatísticas por tipo
		const statsByType = await prisma.materialCategory.groupBy({
			by: ['visualType'],
			_count: { visualType: true },
			orderBy: { _count: { visualType: 'desc' } }
		});

		console.log(`\n📈 Distribuição por tipo visual:`);
		statsByType.forEach(stat => {
			console.log(`  ${stat.visualType}: ${stat._count.visualType} categorias`);
		});

		// Categorias com maior prioridade
		const topCategories = await prisma.materialCategory.findMany({
			take: 10,
			orderBy: { priority: 'desc' },
			select: { name: true, priority: true, visualType: true }
		});

		console.log(`\n⭐ Top 10 categorias por prioridade:`);
		topCategories.forEach((cat, index) => {
			console.log(`  ${index + 1}. ${cat.name} (${cat.priority}) - ${cat.visualType}`);
		});

		console.log(`\n🎉 População de categorias concluída com sucesso!`);

	} catch (error) {
		console.error("❌ Erro durante a população de categorias:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

// Função para limpar categorias (útil para desenvolvimento)
async function clearCategories() {
	try {
		console.log("🗑️  Limpando categorias existentes...");
		
		const deleteResult = await prisma.materialCategory.deleteMany({});
		console.log(`✅ ${deleteResult.count} categorias removidas`);
		
	} catch (error) {
		console.error("❌ Erro ao limpar categorias:", error);
		throw error;
	}
}

// Executar seed
async function main() {
	const args = process.argv.slice(2);
	
	if (args.includes("--clear")) {
		await clearCategories();
	}
	
	if (!args.includes("--clear-only")) {
		await seedCategories();
	}
}

// Executar se chamado diretamente
main()
	.catch((error) => {
		console.error("💥 Falha crítica:", error);
		process.exit(1);
	});

export { seedCategories, clearCategories };