"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2, Phone, Save, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputMask, unmaskValue } from "@/components/ui/input-mask";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/trpc";

const userSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	email: z.string().email("Email inválido"),
	password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
	role: z.enum(["admin", "manager", "user"], {
		required_error: "Selecione um cargo",
	}),
	phone: z
		.string()
		.optional()
		.refine((val) => {
			if (!val) return true; // Opcional
			const unmasked = val.replace(/\D/g, "");
			return unmasked.length === 10 || unmasked.length === 11; // Telefone 10 ou 11 dígitos
		}, "Telefone deve ter 10 ou 11 dígitos"),
	department: z.string().optional(),
	position: z.string().optional(),
	companyId: z.string({
		required_error: "Selecione uma empresa",
	}),
});

type UserFormData = z.infer<typeof userSchema>;

function NovoUsuarioPageContent() {
	const router = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setValue,
		watch,
	} = useForm<UserFormData>({
		resolver: zodResolver(userSchema),
	});

	// Buscar empresas disponíveis
	const { data: companies, isLoading: loadingCompanies } =
		api.companies.list.useQuery({
			page: 1,
			limit: 100, // Buscar todas as empresas
			active: true,
		});

	// Mutation para criar usuário
	const createUserMutation = api.users.create.useMutation({
		onSuccess: () => {
			toast.success("Usuário criado com sucesso!");
			router.push("/admin/users");
		},
		onError: (error) => {
			toast.error(error.message || "Erro ao criar usuário");
		},
	});

	const onSubmit = async (data: UserFormData) => {
		// Limpar campos vazios e remover máscaras
		const cleanData = {
			...data,
			phone: data.phone ? unmaskValue(data.phone) : undefined,
			department: data.department || undefined,
			position: data.position || undefined,
		};

		createUserMutation.mutate(cleanData);
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" onClick={() => router.back()}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Voltar
					</Button>
					<div>
						<h1 className="font-bold text-3xl">Novo Usuário do Sistema</h1>
						<p className="text-muted-foreground">
							Criar um novo usuário no sistema
						</p>
					</div>
				</div>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
				{/* Informações Pessoais */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Informações Pessoais
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="name">Nome Completo *</Label>
								<Input
									id="name"
									placeholder="Ex: João da Silva"
									{...register("name")}
								/>
								{errors.name && (
									<p className="text-red-500 text-sm">{errors.name.message}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Email *</Label>
								<Input
									id="email"
									type="email"
									placeholder="joao@empresa.com"
									{...register("email")}
								/>
								{errors.email && (
									<p className="text-red-500 text-sm">{errors.email.message}</p>
								)}
							</div>
						</div>

						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="phone">Telefone</Label>
								<InputMask
									id="phone"
									mask="phone"
									placeholder="(11) 99999-9999"
									{...register("phone")}
								/>
								{errors.phone && (
									<p className="text-red-500 text-sm">{errors.phone.message}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">Senha *</Label>
								<Input
									id="password"
									type="password"
									placeholder="Mínimo 6 caracteres"
									{...register("password")}
								/>
								{errors.password && (
									<p className="text-red-500 text-sm">
										{errors.password.message}
									</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Informações Profissionais */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Shield className="h-5 w-5" />
							Informações Profissionais
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="role">Cargo no Sistema *</Label>
								<Select
									value={watch("role") || ""}
									onValueChange={(value) => setValue("role", value as any)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecione o cargo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="user">
											<div className="flex items-center gap-2">
												<div className="h-2 w-2 rounded-full bg-green-500" />
												<div>
													<div className="font-medium">Usuário</div>
													<div className="text-muted-foreground text-xs">
														Acesso básico ao sistema
													</div>
												</div>
											</div>
										</SelectItem>
										<SelectItem value="manager">
											<div className="flex items-center gap-2">
												<div className="h-2 w-2 rounded-full bg-blue-500" />
												<div>
													<div className="font-medium">Gerente</div>
													<div className="text-muted-foreground text-xs">
														Gerencia equipes e processos
													</div>
												</div>
											</div>
										</SelectItem>
										<SelectItem value="admin">
											<div className="flex items-center gap-2">
												<div className="h-2 w-2 rounded-full bg-red-500" />
												<div>
													<div className="font-medium">Administrador</div>
													<div className="text-muted-foreground text-xs">
														Acesso total à empresa
													</div>
												</div>
											</div>
										</SelectItem>
									</SelectContent>
								</Select>
								{errors.role && (
									<p className="text-red-500 text-sm">{errors.role.message}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="companyId">Empresa *</Label>
								<Select
									value={watch("companyId") || ""}
									onValueChange={(value) => setValue("companyId", value)}
									disabled={loadingCompanies}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												loadingCompanies
													? "Carregando empresas..."
													: "Selecione a empresa"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{companies?.companies?.map((company) => (
											<SelectItem key={company.id} value={company.id}>
												<div className="flex flex-col">
													<span className="font-medium">{company.name}</span>
													<span className="text-muted-foreground text-xs">
														{company.email}
													</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{errors.companyId && (
									<p className="text-red-500 text-sm">
										{errors.companyId.message}
									</p>
								)}
							</div>
						</div>

						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="department">Departamento</Label>
								<Input
									id="department"
									placeholder="Ex: Vendas, Marketing, Produção"
									{...register("department")}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="position">Cargo na Empresa</Label>
								<Input
									id="position"
									placeholder="Ex: Vendedor, Designer, Operador"
									{...register("position")}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Botões de Ação */}
				<div className="flex items-center justify-end space-x-4">
					<Button type="button" variant="outline" onClick={() => router.back()}>
						Cancelar
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting || createUserMutation.isPending}
						className="min-w-[120px]"
					>
						{isSubmitting || createUserMutation.isPending ? (
							<>
								<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
								Criando...
							</>
						) : (
							<>
								<Save className="mr-2 h-4 w-4" />
								Criar Usuário
							</>
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}

export default function NovoUsuarioPage() {
	return (
		<RoleGuard allowedRoles={["superadmin"]}>
			<NovoUsuarioPageContent />
		</RoleGuard>
	);
}
