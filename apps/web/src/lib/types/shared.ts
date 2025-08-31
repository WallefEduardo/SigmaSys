/**
 * Tipos compartilhados entre frontend e backend
 * Estes tipos são re-exportados do backend para garantir sincronização
 */

import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
// Re-exportar tipos do backend via tRPC
import type { AppRouter } from "../../../../server/src/routers";

// Inferir tipos de input e output das rotas tRPC
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Tipos específicos para cada entidade
export type Material = RouterOutputs["materials"]["list"][0];
export type Equipment = RouterOutputs["equipments"]["list"][0];
export type Process = RouterOutputs["processes"]["list"][0];
export type Finish = RouterOutputs["finishes"]["list"][0];

// Tipos para inputs de criação/edição
export type MaterialInput = RouterInputs["materials"]["create"];
export type EquipmentInput = RouterInputs["equipments"]["create"];
export type ProcessInput = RouterInputs["processes"]["create"];
export type FinishInput = RouterInputs["finishes"]["create"];

// Tipos para formulários (união de create e update)
export type MaterialFormData = MaterialInput;
export type EquipmentFormData = EquipmentInput;
export type ProcessFormData = ProcessInput;
export type FinishFormData = FinishInput;

// Tipos de filtros
export type MaterialFilters = RouterInputs["materials"]["list"];
export type EquipmentFilters = RouterInputs["equipments"]["list"];
export type ProcessFilters = RouterInputs["processes"]["list"];
export type FinishFilters = RouterInputs["finishes"]["list"];

// Tipos de resposta de listas
export type MaterialsResponse = RouterOutputs["materials"]["list"];
export type EquipmentsResponse = RouterOutputs["equipments"]["list"];
export type ProcessesResponse = RouterOutputs["processes"]["list"];
export type FinishesResponse = RouterOutputs["finishes"]["list"];

// Tipos para unidades (via formulas router)
export type Units = RouterOutputs["formulas"]["units"];
export type Unit = Units["area"][0]; // Assumindo estrutura por categoria

// Tipos de autenticação
export type LoginInput = RouterInputs["auth"]["login"];
export type LoginResponse = RouterOutputs["auth"]["login"];
export type User = RouterOutputs["auth"]["me"];

// Tipos de empresa
export type Company = RouterOutputs["companies"]["current"];

// Tipos de erro padronizados
export interface ApiError {
	code: string;
	message: string;
	details?: any;
}

// Tipos para estados de formulário
export interface FormState<T> {
	data: T;
	errors: Record<keyof T, string[]>;
	isSubmitting: boolean;
	isValid: boolean;
}

// Tipos para tabelas/listas
export interface TableColumn<T = any> {
	key: string;
	label: string;
	sortable?: boolean;
	render?: (value: any, item: T) => React.ReactNode;
	width?: string;
	align?: "left" | "center" | "right";
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	pages: number;
}

// Tipos para filtros de UI
export interface FilterOption {
	label: string;
	value: string;
}

// Tipos para estados de loading
export type LoadingState = "idle" | "loading" | "success" | "error";

// Tipos para notificações
export interface Notification {
	id: string;
	type: "success" | "error" | "warning" | "info";
	title: string;
	message?: string;
	duration?: number;
}

// Tipos para modals/dialogs
export interface ModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	description?: string;
}

// Tipos para formulários dinâmicos
export interface FormField {
	name: string;
	label: string;
	type: "text" | "number" | "select" | "textarea" | "checkbox" | "currency";
	required?: boolean;
	placeholder?: string;
	options?: FilterOption[];
	validation?: {
		min?: number;
		max?: number;
		pattern?: RegExp;
		custom?: (value: any) => string | null;
	};
}

export interface DynamicForm {
	fields: FormField[];
	onSubmit: (data: Record<string, any>) => Promise<void>;
	initialData?: Record<string, any>;
	submitLabel?: string;
}

// Tipos para dashboard/estatísticas
export interface DashboardCard {
	title: string;
	value: string | number;
	change?: {
		value: number;
		trend: "up" | "down" | "neutral";
		period: string;
	};
	icon?: React.ComponentType;
}

// Export para compatibilidade
export * from "../../../../server/src/routers";
