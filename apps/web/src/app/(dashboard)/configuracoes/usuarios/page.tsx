"use client";

import {
	Activity,
	MoreHorizontal,
	Plus,
	Search,
	Settings,
	Shield,
	Users,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { mockPermissions, roleColors, roleLabels } from "@/lib/mock-data/users";
import { api } from "@/lib/trpc";

export default function CompanyUsersPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [departmentFilter, setDepartmentFilter] = useState<string>("all");
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<any>(null);
	const [editingPermissions, setEditingPermissions] = useState<any>(null);
	const [page, setPage] = useState(1);

	// tRPC queries - company users (excluding superadmin)
	const {
		data: usersData,
		isLoading,
		refetch,
	} = api.users.list.useQuery({
		page,
		limit: 10,
		search: searchTerm || undefined,
		role: roleFilter !== "all" ? roleFilter : undefined,
		active: statusFilter === "all" ? undefined : statusFilter === "active",
		department: departmentFilter !== "all" ? departmentFilter : undefined,
	});

	const createUserMutation = api.users.create.useMutation({
		onSuccess: () => {
			refetch();
			setIsDialogOpen(false);
			setEditingUser(null);
		},
	});

	const updateUserMutation = api.users.update.useMutation({
		onSuccess: () => {
			refetch();
			setIsDialogOpen(false);
			setEditingUser(null);
		},
	});

	const users = usersData?.users?.filter((u) => u.role !== "superadmin") || [];
	const pagination = usersData?.pagination;

	const handleEdit = (user: any) => {
		setEditingUser(user);
		setIsDialogOpen(true);
	};

	const handleEditPermissions = (user: any) => {
		setEditingPermissions(user);
		setIsPermissionDialogOpen(true);
	};

	const handleCreate = () => {
		setEditingUser(null);
		setIsDialogOpen(true);
	};

	const handleToggleStatus = (userId: string, currentActive: boolean) => {
		updateUserMutation.mutate({
			id: userId,
			active: !currentActive,
		});
	};

	const handleSubmit = (formData: FormData) => {
		const data = {
			name: formData.get("name") as string,
			email: formData.get("email") as string,
			role: formData.get("role") as "admin" | "manager" | "user",
			department: (formData.get("department") as string) || undefined,
			position: (formData.get("position") as string) || undefined,
			phone: (formData.get("phone") as string) || undefined,
		};

		if (editingUser) {
			updateUserMutation.mutate({
				id: editingUser.id,
				...data,
			});
		} else {
			const password = formData.get("password") as string;
			createUserMutation.mutate({
				...data,
				password,
			});
		}
	};

	const getRoleStats = () => {
		return users.reduce(
			(stats, user) => {
				if (user.active) {
					stats[user.role] = (stats[user.role] || 0) + 1;
				}
				return stats;
			},
			{} as Record<string, number>,
		);
	};

	const roleStats = getRoleStats();
	const uniqueDepartments = [
		...new Set(users.map((u) => u.department).filter(Boolean)),
	];

	if (isLoading) {
		return (
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex h-32 items-center justify-center">
					<div className="text-muted-foreground">Carregando usuários...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="font-bold text-3xl tracking-tight">
					Gestão de Usuários da Empresa
				</h2>
				<div className="flex items-center space-x-2">
					<Button onClick={handleCreate}>
						<Plus className="mr-2 h-4 w-4" />
						Novo Usuário
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total de Usuários
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{users.length}</div>
						<p className="text-muted-foreground text-xs">
							{users.filter((u) => u.active).length} ativos
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Administradores
						</CardTitle>
						<Shield className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{roleStats.admin || 0}</div>
						<p className="text-muted-foreground text-xs">Acesso total</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Gerentes</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{roleStats.manager || 0}</div>
						<p className="text-muted-foreground text-xs">
							Gestão departamental
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Usuários</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{roleStats.user || 0}</div>
						<p className="text-muted-foreground text-xs">Operacionais</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle>Filtros</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Buscar usuários..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-8"
								/>
							</div>
						</div>
						<div className="w-full md:w-[150px]">
							<Select value={roleFilter} onValueChange={setRoleFilter}>
								<SelectTrigger>
									<SelectValue placeholder="Cargo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos cargos</SelectItem>
									<SelectItem value="admin">Administrador</SelectItem>
									<SelectItem value="manager">Gerente</SelectItem>
									<SelectItem value="user">Usuário</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="w-full md:w-[150px]">
							<Select
								value={departmentFilter}
								onValueChange={setDepartmentFilter}
							>
								<SelectTrigger>
									<SelectValue placeholder="Departamento" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos depart.</SelectItem>
									{uniqueDepartments.map((dept) => (
										<SelectItem key={dept} value={dept!}>
											{dept}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="w-full md:w-[150px]">
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger>
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos status</SelectItem>
									<SelectItem value="active">Ativos</SelectItem>
									<SelectItem value="inactive">Inativos</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Users Table */}
			<Card>
				<CardHeader>
					<CardTitle>Usuários ({users.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Usuário</TableHead>
								<TableHead>Cargo</TableHead>
								<TableHead>Departamento</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Último Login</TableHead>
								<TableHead>Criado por</TableHead>
								<TableHead className="text-right">Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user: any) => (
								<TableRow key={user.id}>
									<TableCell className="font-medium">
										<div>
											<div className="font-medium">{user.name}</div>
											<div className="text-muted-foreground text-sm">
												{user.email}
											</div>
											{user.phone && (
												<div className="text-muted-foreground text-xs">
													{user.phone}
												</div>
											)}
										</div>
									</TableCell>
									<TableCell>
										<Badge
											className={
												roleColors[
													user.role.toUpperCase() as keyof typeof roleColors
												]
											}
										>
											{
												roleLabels[
													user.role.toUpperCase() as keyof typeof roleLabels
												]
											}
										</Badge>
									</TableCell>
									<TableCell>
										<div>
											<div className="text-sm">{user.department || "-"}</div>
											{user.position && (
												<div className="text-muted-foreground text-xs">
													{user.position}
												</div>
											)}
										</div>
									</TableCell>
									<TableCell>
										<Badge
											className={
												user.active
													? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
													: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
											}
										>
											{user.active ? "Ativo" : "Inativo"}
										</Badge>
									</TableCell>
									<TableCell>
										{user.lastLoginAt
											? new Date(user.lastLoginAt).toLocaleDateString("pt-BR")
											: "Nunca"}
									</TableCell>
									<TableCell>{user.creator?.name || "-"}</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end space-x-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleEditPermissions(user)}
											>
												<Settings className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleEdit(user)}
											>
												Editar
											</Button>
											<Button
												variant={user.active ? "destructive" : "default"}
												size="sm"
												onClick={() => handleToggleStatus(user.id, user.active)}
												disabled={updateUserMutation.isPending}
											>
												{user.active ? "Desativar" : "Ativar"}
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Dialog for Create/Edit User */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{editingUser ? "Editar Usuário" : "Novo Usuário"}
						</DialogTitle>
						<DialogDescription>
							{editingUser
								? "Altere as informações do usuário aqui."
								: "Preencha as informações para criar um novo usuário."}
						</DialogDescription>
					</DialogHeader>
					<form action={handleSubmit} className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<label htmlFor="name" className="text-right">
								Nome
							</label>
							<Input
								id="name"
								name="name"
								defaultValue={editingUser?.name || ""}
								className="col-span-3"
								required
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<label htmlFor="email" className="text-right">
								Email
							</label>
							<Input
								id="email"
								name="email"
								type="email"
								defaultValue={editingUser?.email || ""}
								className="col-span-3"
								required
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<label htmlFor="phone" className="text-right">
								Telefone
							</label>
							<Input
								id="phone"
								name="phone"
								defaultValue={editingUser?.phone || ""}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<label htmlFor="role" className="text-right">
								Cargo
							</label>
							<Select name="role" defaultValue={editingUser?.role || "user"}>
								<SelectTrigger className="col-span-3">
									<SelectValue placeholder="Selecione um cargo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="admin">Administrador</SelectItem>
									<SelectItem value="manager">Gerente</SelectItem>
									<SelectItem value="user">Usuário</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<label htmlFor="department" className="text-right">
								Departamento
							</label>
							<Select
								name="department"
								defaultValue={editingUser?.department || ""}
							>
								<SelectTrigger className="col-span-3">
									<SelectValue placeholder="Selecione um departamento" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Administração">Administração</SelectItem>
									<SelectItem value="Comercial">Comercial</SelectItem>
									<SelectItem value="Produção">Produção</SelectItem>
									<SelectItem value="Atendimento">Atendimento</SelectItem>
									<SelectItem value="Financeiro">Financeiro</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<label htmlFor="position" className="text-right">
								Posição
							</label>
							<Input
								id="position"
								name="position"
								defaultValue={editingUser?.position || ""}
								className="col-span-3"
							/>
						</div>
						{!editingUser && (
							<div className="grid grid-cols-4 items-center gap-4">
								<label htmlFor="password" className="text-right">
									Senha
								</label>
								<Input
									id="password"
									name="password"
									type="password"
									className="col-span-3"
									required
								/>
							</div>
						)}
						<DialogFooter>
							<Button
								type="submit"
								disabled={
									createUserMutation.isPending || updateUserMutation.isPending
								}
							>
								{createUserMutation.isPending || updateUserMutation.isPending
									? "Salvando..."
									: editingUser
										? "Salvar alterações"
										: "Criar usuário"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Permissions Dialog */}
			<Dialog
				open={isPermissionDialogOpen}
				onOpenChange={setIsPermissionDialogOpen}
			>
				<DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>Gerenciar Permissões</DialogTitle>
						<DialogDescription>
							Configure as permissões para {editingPermissions?.name}
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<div className="space-y-4">
							{Object.entries(
								mockPermissions.reduce(
									(groups, permission) => {
										if (!groups[permission.module]) {
											groups[permission.module] = [];
										}
										groups[permission.module].push(permission);
										return groups;
									},
									{} as Record<string, typeof mockPermissions>,
								),
							).map(([module, permissions]) => (
								<Card key={module}>
									<CardHeader>
										<CardTitle className="text-base capitalize">
											{module}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-2 gap-2">
											{permissions.map((permission) => (
												<div
													key={permission.id}
													className="flex items-center space-x-2"
												>
													<input
														type="checkbox"
														id={permission.id}
														defaultChecked={editingPermissions?.permissions?.includes(
															permission.id,
														)}
													/>
													<label htmlFor={permission.id} className="text-sm">
														{permission.name}
													</label>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
					<DialogFooter>
						<Button type="submit">Salvar Permissões</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
