import * as React from "react";
import { useCallback, useRef } from "react";

/**
 * Hook para debounce de funções
 * Útil para otimizar campos de busca e inputs
 */
export function useDebounce<T extends (...args: any[]) => any>(
	callback: T,
	delay: number,
): (...args: Parameters<T>) => void {
	const timeoutRef = useRef<NodeJS.Timeout>();

	return useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				callback(...args);
			}, delay);
		},
		[callback, delay],
	);
}

/**
 * Hook para debounce de valores
 * Retorna o valor após o delay especificado
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

	React.useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

/**
 * Hook para debounce com callback que cancela requisições anteriores
 */
export function useDebouncedCallback<
	T extends (...args: any[]) => Promise<any>,
>(callback: T, delay: number) {
	const timeoutRef = useRef<NodeJS.Timeout>();
	const abortControllerRef = useRef<AbortController>();

	return useCallback(
		async (...args: Parameters<T>) => {
			// Cancela a operação anterior
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			// Limpa timeout anterior
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
				timeoutRef.current = setTimeout(async () => {
					try {
						abortControllerRef.current = new AbortController();
						const result = await callback(...args);
						resolve(result);
					} catch (error) {
						reject(error);
					}
				}, delay);
			});
		},
		[callback, delay],
	);
}
