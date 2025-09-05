import { prisma } from "@repo/database/client";

async function testMaterialsAPI() {
	try {
		console.log("🔍 Testando lógica de filtro de materiais...");

		// Simular query do frontend (com active: true)
		const companyId = "company-1";
		const active = true;

		const where = {
			companyId,
			active: active === false ? false : true,
		};

		console.log("📋 Filtro aplicado:", where);

		const materials = await prisma.material.findMany({
			where,
			select: { id: true, name: true, active: true },
		});

		console.log("📊 Materiais retornados:", materials);

		// Testar sem active (undefined)
		console.log("\n🔍 Testando sem parâmetro active...");
		const activeUndefined = undefined;
		const where2 = {
			companyId,
			active: activeUndefined === false ? false : true,
		};

		console.log("📋 Filtro aplicado (undefined):", where2);

		const materials2 = await prisma.material.findMany({
			where: where2,
			select: { id: true, name: true, active: true },
		});

		console.log("📊 Materiais retornados (undefined):", materials2);
	} catch (error) {
		console.error("❌ Erro:", error);
	} finally {
		await prisma.$disconnect();
	}
}

testMaterialsAPI();
