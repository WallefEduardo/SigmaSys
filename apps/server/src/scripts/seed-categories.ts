import "dotenv/config";
import { PrismaClient } from "../../prisma/generated/client";

const prisma = new PrismaClient();

async function seedCategories() {
	try {
		console.log("🌱 Script de categorias desabilitado temporariamente");
		console.log("ℹ️  A tabela materialCategory ainda não foi implementada no schema");
		console.log("✅ Seed concluído sem erros");
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
		console.log("🗑️  Script de limpeza desabilitado temporariamente");
		console.log("ℹ️  A tabela materialCategory ainda não foi implementada no schema");
		console.log("✅ Limpeza concluída sem erros");
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
main().catch((error) => {
	console.error("💥 Falha crítica:", error);
	process.exit(1);
});

export { seedCategories, clearCategories };
