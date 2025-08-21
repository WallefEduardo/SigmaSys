"use client";

import {
	Activity,
	Building2,
	MoreHorizontal,
	Plus,
	Search,
	Shield,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import { api } from "@/lib/trpc";

function UsersPageContent() {
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [page, setPage] = useState(1);

	// tRPC queries
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
	});

	const toggleActiveMutation = api.users.toggleActive.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	const users = usersData?.users || [];
	const pagination = usersData?.pagination;

	const handleToggleStatus = (userId: string, currentActive: boolean) => {
		toggleActiveMutation.mutate({
			id: userId,
			active: !currentActive,
		});
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

	const getRoleColor = (role: string) => {
		switch (role) {
			case "superadmin":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case "admin":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "manager":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "user":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	const getRoleLabel = (role: string) => {
		switch (role) {
			case "superadmin":
				return "Super Admin";
			case "admin":
				return "Administrador";
			case "manager":
				return "Gerente";
			case "user":
				return "Usuário";
			default:
				return role;
		}
	};

	if (isLoading) {
		return (
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between space-y-2">
					<h2 className="font-bold text-3xl tracking-tight">
						Gestão de Usuários do Sistema
					</h2>
				</div>
				<div className="flex min-h-[400px] items-center justify-center">
					<div className="text-center">
						<div className="mx-auto h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2" />
						<p className="mt-2 text-muted-foreground">Carregando usuários...</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="font-bold text-3xl tracking-tight">
					Gestão de Usuários do Sistema
				</h2>
				<div className="flex items-center space-x-2">
					<Button asChild>
						<Link href="/admin/users/novo">
							<Plus className="mr-2 h-4 w-4" />
							Novo Usuário
						</Link>
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
							Usuários cadastrados
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
						<div className="font-bold text-2xl">
							{(roleStats.admin || 0) + (roleStats.superadmin || 0)}
						</div>
						<p className="text-muted-foreground text-xs">Super Admin + Admin</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Gerentes</CardTitle>
						<Building2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{roleStats.manager || 0}</div>
						<p className="text-muted-foreground text-xs">Usuários gerentes</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Usuários Ativos
						</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{users.filter((u) => u.active).length}
						</div>
						<p className="text-muted-foreground text-xs">
							{(
								(users.filter((u) => u.active).length / users.length) *
								100
							).toFixed(1)}
							% do total
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Filtros */}
			<div className="flex items-center space-x-4">
				<div className="relative max-w-sm flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar usuários..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-8"
					/>
				</div>

				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-40">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos</SelectItem>
						<SelectItem value="active">Ativos</SelectItem>
						<SelectItem value="inactive">Inativos</SelectItem>
					</SelectContent>
				</Select>

				<Select value={roleFilter} onValueChange={setRoleFilter}>
					<SelectTrigger className="w-40">
						<SelectValue placeholder="Cargo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos</SelectItem>
						<SelectItem value="superadmin">Super Admin</SelectItem>
						<SelectItem value="admin">Admin</SelectItem>
						<SelectItem value="manager">Gerente</SelectItem>
						<SelectItem value="user">Usuário</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Tabela */}
			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Usuário</TableHead>
								<TableHead>Cargo</TableHead>
								<TableHead>Empresa</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Último Acesso</TableHead>
								<TableHead className="text-right">Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
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
											variant="secondary"
											className={getRoleColor(user.role)}
										>
											{getRoleLabel(user.role)}
										</Badge>
									</TableCell>
									<TableCell>
										<div>
											<div className="font-medium">{user.company?.name}</div>
											{user.department && (
												<div className="text-muted-foreground text-sm">
													{user.department}
												</div>
											)}
										</div>
									</TableCell>
									<TableCell>
										<Badge variant={user.active ? "default" : "destructive"}>
											{user.active ? "Ativo" : "Inativo"}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="text-sm">
											{user.lastLogin
												? new Date(user.lastLogin).toLocaleDateString("pt-BR")
												: "Nunca"}
										</div>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end space-x-2">
											<Button variant="outline" size="sm" asChild>
												<Link href={`/admin/users/editar/${user.id}`}>
													Editar
												</Link>
											</Button>
											<Button
												variant={user.active ? "destructive" : "default"}
												size="sm"
												onClick={() => handleToggleStatus(user.id, user.active)}
												disabled={toggleActiveMutation.isPending}
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
		</div>
	);
}

export default function UsersPage() {
	return (
		<RoleGuard allowedRoles={["superadmin"]}>
			<UsersPageContent />
		</RoleGuard>
	);
}
