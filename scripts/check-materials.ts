import { prisma } from "@repo/database/client";

async function checkMaterials() {
	try {
		const materials = await prisma.material.findMany({
			select: { id: true, name: true, active: true },
		});

		console.log("📊 Todos os materiais no banco:", materials);

		const active = materials.filter((m) => m.active);
		const inactive = materials.filter((m) => !m.active);

		console.log("✅ Materiais ativos:", active);
		console.log("❌ Materiais inativos:", inactive);
	} catch (error) {
		console.error("❌ Erro:", error);
	} finally {
		await prisma.$disconnect();
	}
}

checkMaterials();
