"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
	Calendar, 
	Clock, 
	Mail, 
	MessageCircle, 
	Phone, 
	Plus, 
	Star, 
	User,
	FileText,
	DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import type { ClientInteraction } from "@/lib/types/shared";

interface InteractionTimelineProps {
	interactions: ClientInteraction[];
	clientId: string;
}

export function InteractionTimeline({ interactions, clientId }: InteractionTimelineProps) {
	const [showAddForm, setShowAddForm] = useState(false);
	const [newInteraction, setNewInteraction] = useState({
		type: "" as const,
		description: "",
		notes: "",
	});

	const utils = api.useUtils();

	const addInteraction = api.clients.addInteraction.useMutation({
		onSuccess: () => {
			toast.success("Interação adicionada com sucesso!");
			setShowAddForm(false);
			setNewInteraction({ type: "" as const, description: "", notes: "" });
			utils.clients.getInteractions.invalidate({ clientId });
		},
		onError: (error) => {
			toast.error(`Erro ao adicionar interação: ${error.message}`);
		},
	});

	const getInteractionIcon = (type: string) => {
		switch (type) {
			case "call": return <Phone className="h-4 w-4" />;
			case "email": return <Mail className="h-4 w-4" />;
			case "meeting": return <User className="h-4 w-4" />;
			case "quote": return <FileText className="h-4 w-4" />;
			case "order": return <DollarSign className="h-4 w-4" />;
			case "note": return <MessageCircle className="h-4 w-4" />;
			default: return <MessageCircle className="h-4 w-4" />;
		}
	};

	const getInteractionColor = (type: string) => {
		switch (type) {
			case "call": return "bg-blue-500";
			case "email": return "bg-green-500";
			case "meeting": return "bg-purple-500";
			case "quote": return "bg-orange-500";
			case "order": return "bg-emerald-500";
			case "note": return "bg-gray-500";
			default: return "bg-gray-500";
		}
	};

	const getInteractionTypeLabel = (type: string) => {
		switch (type) {
			case "call": return "Ligação";
			case "email": return "E-mail";
			case "meeting": return "Reunião";
			case "quote": return "Orçamento";
			case "order": return "Pedido";
			case "note": return "Nota";
			default: return "Interação";
		}
	};

	const handleAddInteraction = async () => {
		if (!newInteraction.type || !newInteraction.description) {
			toast.error("Preencha o tipo e a descrição da interação");
			return;
		}

		await addInteraction.mutateAsync({
			clientId,
			...newInteraction,
		});
	};

	return (
		<div className="space-y-6">
			{/* Botão para adicionar nova interação */}
			<div className="flex justify-end">
				<Button
					variant="outline"
					size="sm"
					onClick={() => setShowAddForm(!showAddForm)}
				>
					<Plus className="mr-2 h-4 w-4" />
					Nova Interação
				</Button>
			</div>

			{/* Formulário para nova interação */}
			{showAddForm && (
				<Card>
					<CardContent className="pt-6">
						<div className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="type">Tipo de Interação</Label>
									<Select
										value={newInteraction.type}
										onValueChange={(value) => 
											setNewInteraction(prev => ({ ...prev, type: value as any }))
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Selecione o tipo" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="call">Ligação</SelectItem>
											<SelectItem value="email">E-mail</SelectItem>
											<SelectItem value="meeting">Reunião</SelectItem>
											<SelectItem value="quote">Orçamento</SelectItem>
											<SelectItem value="order">Pedido</SelectItem>
											<SelectItem value="note">Nota</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Descrição</Label>
								<Textarea
									id="description"
									placeholder="Descreva brevemente a interação..."
									value={newInteraction.description}
									onChange={(e) => 
										setNewInteraction(prev => ({ ...prev, description: e.target.value }))
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="notes">Observações (Opcional)</Label>
								<Textarea
									id="notes"
									placeholder="Observações adicionais..."
									value={newInteraction.notes}
									onChange={(e) => 
										setNewInteraction(prev => ({ ...prev, notes: e.target.value }))
									}
								/>
							</div>

							<div className="flex gap-2">
								<Button 
									onClick={handleAddInteraction}
									disabled={addInteraction.isPending}
								>
									{addInteraction.isPending ? "Salvando..." : "Salvar"}
								</Button>
								<Button
									variant="outline"
									onClick={() => setShowAddForm(false)}
								>
									Cancelar
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Timeline de interações */}
			<div className="space-y-4">
				{interactions.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
						<p>Nenhuma interação registrada</p>
						<p className="text-sm">Adicione a primeira interação com este cliente</p>
					</div>
				) : (
					<div className="relative">
						{/* Linha vertical da timeline */}
						<div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

						{interactions.map((interaction, index) => (
							<div key={interaction.id} className="relative flex gap-4">
								{/* Ícone da interação */}
								<div className={`
									relative z-10 flex h-12 w-12 items-center justify-center rounded-full 
									${getInteractionColor(interaction.type)} text-white
								`}>
									{getInteractionIcon(interaction.type)}
								</div>

								{/* Conteúdo da interação */}
								<div className="flex-1 pb-8">
									<Card>
										<CardContent className="pt-4">
											<div className="flex items-start justify-between mb-2">
												<div className="flex items-center gap-2">
													<Badge variant="outline">
														{getInteractionTypeLabel(interaction.type)}
													</Badge>
													<div className="flex items-center gap-1 text-sm text-muted-foreground">
														<Calendar className="h-3 w-3" />
														<span>
															{format(new Date(interaction.date), "dd/MM/yyyy", { locale: ptBR })}
														</span>
													</div>
													<div className="flex items-center gap-1 text-sm text-muted-foreground">
														<Clock className="h-3 w-3" />
														<span>
															{format(new Date(interaction.date), "HH:mm")}
														</span>
													</div>
												</div>
											</div>
											
											<h4 className="font-medium mb-2">{interaction.description}</h4>
											
											{interaction.notes && (
												<p className="text-sm text-muted-foreground">
													{interaction.notes}
												</p>
											)}
											
											{interaction.user && (
												<div className="flex items-center gap-2 mt-3 pt-3 border-t">
													<User className="h-4 w-4 text-muted-foreground" />
													<span className="text-sm text-muted-foreground">
														Por {interaction.user.name}
													</span>
												</div>
											)}
										</CardContent>
									</Card>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}