import { prisma } from "@repo/database/client";

async function resetMaterials() {
	try {
		console.log("🗑️ Deletando todos os materiais...");

		const deleted = await prisma.material.deleteMany({
			where: {
				companyId: "company-1",
			},
		});

		console.log(`✅ ${deleted.count} materiais deletados`);

		console.log("🔄 Criando materiais novos...");

		const materials = await prisma.material.createMany({
			data: [
				{
					id: "mat-1",
					name: "Papel Couché 150g",
					category: "Papel",
					unit: "folha",
					cost: 2.5,
					supplier: "Papelaria Central",
					active: true,
					companyId: "company-1",
					createdBy: null,
				},
				{
					id: "mat-2",
					name: "Tinta Preta CMYK",
					category: "Tinta",
					unit: "ml",
					cost: 0.15,
					supplier: "Tintas Pro",
					active: true,
					companyId: "company-1",
					createdBy: null,
				},
				{
					id: "mat-3",
					name: "Adesivo Vinil Branco",
					category: "Adesivo",
					unit: "m²",
					cost: 12.8,
					supplier: "Adesivos & Cia",
					active: true,
					companyId: "company-1",
					createdBy: null,
				},
			],
		});

		console.log(`✅ ${materials.count} materiais criados`);

		const finalCount = await prisma.material.count({
			where: { companyId: "company-1", active: true },
		});

		console.log(`📊 Total final: ${finalCount} materiais ativos`);
	} catch (error) {
		console.error("❌ Erro:", error);
	} finally {
		await prisma.$disconnect();
	}
}

resetMaterials();
