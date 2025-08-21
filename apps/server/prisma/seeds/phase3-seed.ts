import { Decimal } from "decimal.js";
import { PrismaClient } from "../generated/client";

const prisma = new PrismaClient();

export async function seedPhase3() {
	console.log("🌱 Seeding Phase 3: Products and Formulas System...");

	// Buscar uma empresa ativa para os seeds
	const company = await prisma.company.findFirst({
		where: { name: "Empresa Teste Ltda" },
	});

	if (!company) {
		throw new Error(
			"Empresa não encontrada. Execute as seeds da FASE 2 primeiro.",
		);
	}

	const admin = await prisma.user.findFirst({
		where: {
			companyId: company.id,
			role: { in: ["admin", "ADMIN"] },
		},
	});

	if (!admin) {
		throw new Error("Usuário admin não encontrado.");
	}

	console.log("📦 Criando materiais...");

	// Criar materiais base
	const materials = await prisma.$transaction(async (tx) => {
		const materialData = [
			{
				name: "Vinil Adesivo Branco",
				description: "Vinil adesivo branco para impressão digital",
				code: "VIN-001",
				unit: "m2",
				cost: 12.5,
				category: "Vinil",
				brand: "Avery Dennison",
				color: "Branco",
				dimensions: { width: 1.37, thickness: 0.1 },
				tags: ["adesivo", "vinil", "impressão"],
				supplier: "Materiais Gráficos LTDA",
				supplierCode: "AVE-WHT-137",
				minStock: 100,
				maxStock: 500,
				location: "Estoque A - Prateleira 1",
				active: true,
				companyId: company.id,
				createdBy: admin.id,
			},
			{
				name: "Acrílico Cristal 3mm",
				description: "Placa de acrílico cristal transparente 3mm",
				code: "ACR-003",
				unit: "m2",
				cost: 45.8,
				category: "Acrílico",
				brand: "Acrigel",
				color: "Cristal",
				dimensions: { width: 2.0, height: 3.0, thickness: 3.0 },
				tags: ["acrílico", "transparente", "placa"],
				supplier: "Plásticos Industriais SA",
				supplierCode: "ACG-CRI-3MM",
				minStock: 20,
				maxStock: 100,
				location: "Estoque B - Área 2",
				active: true,
				companyId: company.id,
				createdBy: admin.id,
			},
			{
				name: "Tinta Eco-Solvente Preta",
				description: "Tinta eco-solvente preta para impressora Roland",
				code: "TNT-001",
				unit: "litro",
				cost: 89.9,
				category: "Tinta",
				brand: "Roland",
				color: "Preto",
				tags: ["tinta", "eco-solvente", "roland"],
				supplier: "Tintas Digitais LTDA",
				supplierCode: "ROL-ECO-BLK",
				minStock: 5,
				maxStock: 30,
				location: "Estoque C - Geladeira",
				active: true,
				companyId: company.id,
				createdBy: admin.id,
			},
			{
				name: "Parafuso Philips 4x30mm",
				description: "Parafuso phillips cabeça chata 4x30mm",
				code: "PAR-001",
				unit: "un",
				cost: 0.25,
				category: "Fixação",
				brand: "Gerdau",
				tags: ["parafuso", "fixação", "metal"],
				supplier: "Ferragens do Centro",
				supplierCode: "GER-PHI-4X30",
				minStock: 500,
				maxStock: 2000,
				location: "Estoque D - Gaveta 1",
				active: true,
				companyId: company.id,
				createdBy: admin.id,
			},
		];

		const createdMaterials = [];
		for (const material of materialData) {
			const created = await tx.material.create({ data: material });
			createdMaterials.push(created);
		}

		return createdMaterials;
	});

	console.log("⚙️ Criando equipamentos...");

	// Criar equipamentos
	const equipments = await prisma.$transaction(async (tx) => {
		const equipmentData = [
			{
				name: "Impressora Roland VersaCAMM VS-640",
				description: "Impressora e recortadora digital eco-solvente",
				code: "IMP-001",
				type: "printing",
				costPerHour: 25.0,
				maintenanceCost: 2.5,
				energyCost: 1.2,
				maxWidth: 1.61,
				maxHeight: 50.0,
				printingConfig: {
					resolution: 1440,
					colorModes: ["CMYK", "CMYK+W"],
					supportedMaterials: ["vinil", "banner", "papel"],
					printSpeed: 6.2,
				},
				status: "available",
				location: "Produção - Área 1",
				serialNumber: "RVS640-2023-001",
				manufacturer: "Roland",
				model: "VersaCAMM VS-640",
				year: 2023,
				maintenanceInterval: 30,
				tags: ["impressora", "recorte", "eco-solvente"],
				active: true,
				companyId: company.id,
				createdBy: admin.id,
			},
			{
				name: "Router CNC 1325",
				description: "Router CNC para usinagem de acrílico e madeira",
				code: "CNC-001",
				type: "machining",
				costPerHour: 35.0,
				maintenanceCost: 5.0,
				energyCost: 3.5,
				maxWidth: 1.3,
				maxHeight: 2.5,
				maxThickness: 0.05,
				machiningConfig: {
					toolTypes: ["fresa", "broca", "gravação"],
					spindleSpeed: 24000,
					feedRate: 3000,
					precision: 0.1,
				},
				status: "available",
				location: "Produção - Área 2",
				serialNumber: "CNC1325-2024-001",
				manufacturer: "China CNC",
				model: "1325 Professional",
				year: 2024,
				maintenanceInterval: 15,
				tags: ["cnc", "usinagem", "router"],
				active: true,
				companyId: company.id,
				createdBy: admin.id,
			},
		];

		const createdEquipments = [];
		for (const equipment of equipmentData) {
			const created = await tx.equipment.create({ data: equipment });
			createdEquipments.push(created);
		}

		return createdEquipments;
	});

	console.log("🔧 Criando processos...");

	// Criar processos
	const processes = await prisma.$transaction(async (tx) => {
		const processData = [
			{
				name: "Impressão Digital",
				description: "Processo de impressão digital em diversos materiais",
				costPerHour: 20.0,
				sector: "Impressão",
				timeUnit: "m2",
				companyId: company.id,
			},
			{
				name: "Recorte Eletrônico",
				description: "Recorte de materiais usando plotter de recorte",
				costPerHour: 15.0,
				sector: "Acabamento",
				timeUnit: "ml",
				companyId: company.id,
			},
			{
				name: "Usinagem CNC",
				description: "Usinagem de peças em acrílico e madeira",
				costPerHour: 30.0,
				sector: "Usinagem",
				timeUnit: "hora",
				companyId: company.id,
			},
			{
				name: "Soldagem",
				description: "Processo de soldagem de estruturas metálicas",
				costPerHour: 25.0,
				sector: "Metalurgia",
				timeUnit: "hora",
				companyId: company.id,
			},
			{
				name: "Aplicação",
				description: "Aplicação de adesivos e materiais no local",
				costPerHour: 18.0,
				sector: "Instalação",
				timeUnit: "hora",
				companyId: company.id,
			},
		];

		const createdProcesses = [];
		for (const process of processData) {
			const created = await tx.process.create({ data: process });
			createdProcesses.push(created);
		}

		return createdProcesses;
	});

	console.log("✨ Criando acabamentos...");

	// Criar acabamentos
	const finishes = await prisma.$transaction(async (tx) => {
		const finishData = [
			{
				name: "Laminação Brilho",
				description: "Laminação com filme brilhante para proteção",
				composition: {
					materials: [
						{ materialId: materials[0].id, quantity: 1.1, unit: "m2" },
					],
					processes: [
						{ processId: processes[1].id, timeNeeded: 0.5, unit: "m2" },
					],
				},
				cost: 8.5,
				companyId: company.id,
			},
			{
				name: "Furação Padrão",
				description: "Furação padrão para fixação com parafusos",
				composition: {
					materials: [{ materialId: materials[3].id, quantity: 4, unit: "un" }],
					processes: [
						{ processId: processes[2].id, timeNeeded: 0.25, unit: "hora" },
					],
				},
				cost: 12.0,
				companyId: company.id,
			},
		];

		const createdFinishes = [];
		for (const finish of finishData) {
			const created = await tx.finish.create({ data: finish });
			createdFinishes.push(created);
		}

		return createdFinishes;
	});

	console.log("🛍️ Criando produtos...");

	// Criar produtos
	const products = await prisma.$transaction(async (tx) => {
		const productData = [
			{
				name: "Adesivo Personalizado",
				description: "Adesivo personalizado em vinil com recorte eletrônico",
				code: "PROD-001",
				category: "Adesivos",
				formula: "largura * altura",
				checklist: [
					{
						id: "design",
						question: "Design aprovado pelo cliente?",
						type: "boolean",
						required: true,
					},
					{
						id: "cores",
						question: "Quantas cores no design?",
						type: "number",
						required: true,
						defaultValue: 1,
					},
					{
						id: "aplicacao",
						question: "Tipo de aplicação",
						type: "select",
						options: ["Interna", "Externa", "Automotiva"],
						required: true,
					},
				],
				margin: {
					markup: 100, // 100% de markup
					liquidMargin: 40, // 40% de margem líquida
				},
				companyId: company.id,
			},
			{
				name: "Placa de Acrílico Usinada",
				description: "Placa de acrílico com corte e gravação personalizada",
				code: "PROD-002",
				category: "Placas",
				formula: "largura * altura * espessura",
				checklist: [
					{
						id: "medidas",
						question: "Medidas conferidas?",
						type: "boolean",
						required: true,
					},
					{
						id: "gravacao",
						question: "Tipo de gravação",
						type: "select",
						options: ["Baixo relevo", "Alto relevo", "Vazado"],
						required: false,
					},
				],
				margin: {
					markup: 150, // 150% de markup
				},
				companyId: company.id,
			},
		];

		const createdProducts = [];
		for (const product of productData) {
			const created = await tx.product.create({ data: product });
			createdProducts.push(created);
		}

		return createdProducts;
	});

	// Criar relacionamentos dos produtos
	console.log("🔗 Criando relacionamentos dos produtos...");

	await prisma.$transaction(async (tx) => {
		// Produto 1: Adesivo Personalizado
		await tx.productMaterial.create({
			data: {
				productId: products[0].id,
				materialId: materials[0].id, // Vinil Adesivo
				quantity: 1.1, // 10% de desperdício
				formula: "largura * altura * 1.1",
			},
		});

		await tx.productProcess.create({
			data: {
				productId: products[0].id,
				processId: processes[0].id, // Impressão Digital
				timeNeeded: 1,
				formula: "largura * altura",
			},
		});

		await tx.productProcess.create({
			data: {
				productId: products[0].id,
				processId: processes[1].id, // Recorte Eletrônico
				timeNeeded: 1,
				formula: "2 * (largura + altura)",
			},
		});

		await tx.productEquipment.create({
			data: {
				productId: products[0].id,
				equipmentId: equipments[0].id, // Impressora Roland
				timeNeeded: 0.5,
				formula: "(largura * altura) / 6.2",
			},
		});

		// Produto 2: Placa de Acrílico
		await tx.productMaterial.create({
			data: {
				productId: products[1].id,
				materialId: materials[1].id, // Acrílico Cristal
				quantity: 1,
				formula: "largura * altura",
			},
		});

		await tx.productProcess.create({
			data: {
				productId: products[1].id,
				processId: processes[2].id, // Usinagem CNC
				timeNeeded: 1,
				formula: "(largura * altura) / 0.5 + 0.5",
			},
		});

		await tx.productEquipment.create({
			data: {
				productId: products[1].id,
				equipmentId: equipments[1].id, // Router CNC
				timeNeeded: 1,
				formula: "(largura * altura) / 0.5",
			},
		});

		await tx.productFinish.create({
			data: {
				productId: products[1].id,
				finishId: finishes[1].id, // Furação Padrão
				quantity: 1,
			},
		});
	});

	// Criar itens de estoque
	console.log("📊 Criando estoque inicial...");

	await prisma.$transaction(async (tx) => {
		for (const material of materials) {
			await tx.inventoryItem.create({
				data: {
					companyId: company.id,
					materialId: material.id,
					quantity: material.minStock ? Number(material.minStock) * 2 : 50,
					minStock: material.minStock,
					location: material.location,
					batch: `LOTE-${Date.now()}`,
				},
			});
		}
	});

	console.log("✅ FASE 3 seedada com sucesso!");
	console.log(`   📦 ${materials.length} materiais criados`);
	console.log(`   ⚙️ ${equipments.length} equipamentos criados`);
	console.log(`   🔧 ${processes.length} processos criados`);
	console.log(`   ✨ ${finishes.length} acabamentos criados`);
	console.log(`   🛍️ ${products.length} produtos criados`);
	console.log("   📊 Estoque inicial criado");

	return {
		materials,
		equipments,
		processes,
		finishes,
		products,
	};
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	seedPhase3()
		.then(() => {
			console.log("🌱 Seed da FASE 3 concluído!");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Erro ao executar seed da FASE 3:", error);
			process.exit(1);
		})
		.finally(() => {
			prisma.$disconnect();
		});
}
