"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	ArrowRight,
	Building2,
	Loader2,
	Lock,
	Mail,
	Settings,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/trpc";

const loginSchema = z.object({
	email: z.string().email("Email inválido"),
	password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const router = useRouter();
	const { login } = useAuth();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	const loginMutation = api.auth.login.useMutation({
		onSuccess: (data) => {
			// Chamar a função login que salva no cookie
			login(data);

			toast.success("Login realizado com sucesso!");

			// Verificar se há redirect URL
			const urlParams = new URLSearchParams(window.location.search);
			const redirectUrl = urlParams.get("redirect");

			// Usar router.push para navegação
			router.push(redirectUrl || "/dashboard");
		},
		onError: (error) => {
			toast.error(error.message || "Erro ao fazer login");
		},
	});

	const onSubmit = (data: LoginFormData) => {
		loginMutation.mutate(data);
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
			{/* Background pattern */}
			<div className="absolute inset-0 opacity-5">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,#58DDAA_0%,transparent_50%),radial-gradient(circle_at_75%_75%,#151C24_0%,transparent_50%)]" />
			</div>

			<div className="relative z-10 w-full max-w-md">
				{/* Logo and Title */}
				<div className="mb-8 text-center">
					<div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-primary shadow-lg">
						<Building2 className="h-8 w-8 text-primary" />
					</div>
					<h1 className="mb-2 font-bold text-3xl text-white">ErpSys</h1>
					<p className="flex items-center justify-center gap-2 text-slate-400">
						<Settings className="h-4 w-4" />
						Sistema de Comunicação Visual
					</p>
				</div>

				{/* Login Card */}
				<Card className="border-slate-700/50 bg-slate-800/50 shadow-2xl backdrop-blur-xl">
					<CardHeader className="text-center">
						<CardTitle className="text-white text-xl">
							Bem-vindo de volta
						</CardTitle>
						<CardDescription className="text-slate-400">
							Entre com suas credenciais para acessar o sistema
						</CardDescription>
					</CardHeader>

					<CardContent>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email" className="text-slate-200">
									Email
								</Label>
								<div className="relative">
									<Mail className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-slate-400" />
									<Input
										id="email"
										type="email"
										placeholder="seu@email.com"
										className="border-slate-600 bg-slate-700/50 pl-10 text-white placeholder:text-slate-400 focus:border-secondary focus:ring-secondary/20"
										{...register("email")}
										disabled={isSubmitting}
									/>
								</div>
								{errors.email && (
									<p className="mt-1 text-red-400 text-sm">
										{errors.email.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="password" className="text-slate-200">
									Senha
								</Label>
								<div className="relative">
									<Lock className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-slate-400" />
									<Input
										id="password"
										type="password"
										placeholder="Sua senha"
										className="border-slate-600 bg-slate-700/50 pl-10 text-white placeholder:text-slate-400 focus:border-secondary focus:ring-secondary/20"
										{...register("password")}
										disabled={isSubmitting}
									/>
								</div>
								{errors.password && (
									<p className="mt-1 text-red-400 text-sm">
										{errors.password.message}
									</p>
								)}
							</div>

							<Button
								type="submit"
								className="h-11 w-full bg-secondary font-semibold text-secondary-foreground shadow-lg transition-all duration-200 hover:bg-secondary/90 hover:shadow-secondary/20"
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<div className="flex items-center gap-2">
										<Loader2 className="h-4 w-4 animate-spin" />
										Entrando...
									</div>
								) : (
									<div className="flex items-center gap-2">
										Entrar no Sistema
										<ArrowRight className="h-4 w-4" />
									</div>
								)}
							</Button>
						</form>

						{/* Demo Credentials */}
						<div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
							<div className="mb-3 flex items-center gap-2 font-semibold text-amber-400 text-sm">
								<User className="h-4 w-4" />
								Credenciais de Demonstração
							</div>
							<div className="space-y-1 text-slate-300 text-xs">
								<div className="flex justify-between">
									<span>Super Admin:</span>
									<span>superadmin@erpsys.com</span>
								</div>
								<div className="flex justify-between">
									<span>Admin:</span>
									<span>admin@empresateste.com</span>
								</div>
								<div className="flex justify-between">
									<span>Gerente:</span>
									<span>gerente@empresateste.com</span>
								</div>
								<div className="flex justify-between">
									<span>Usuário:</span>
									<span>usuario@empresateste.com</span>
								</div>
								<div className="mt-2 border-amber-500/20 border-t pt-2 text-center">
									<span className="font-semibold">
										Senhas: admin123 (Super) / 123456 (Outros)
									</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Footer */}
				<div className="mt-6 text-center text-slate-500 text-sm">
					© 2024 ErpSys. Sistema ERP para Comunicação Visual.
				</div>
			</div>
		</div>
	);
}
