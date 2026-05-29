import type { Model } from "@earendil-works/pi-ai";
import { calculateCost } from "@earendil-works/pi-ai";
import type { AssistantMessage } from "@earendil-works/pi-ai";
import { getEffectiveFastForModelId } from "./cursor-state.js";

/** Cursor Composer API rates (USD per 1M tokens). See cursor.com/docs/models/cursor-composer-2-5 */
export const CURSOR_COMPOSER_STANDARD_COST = {
	input: 0.5,
	output: 2.5,
	cacheRead: 0,
	cacheWrite: 0,
} as const;

export const CURSOR_COMPOSER_FAST_COST = {
	input: 3,
	output: 15,
	cacheRead: 0,
	cacheWrite: 0,
} as const;

export type CursorModelCostRates = {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
};

function normalizeCursorModelId(modelId: string): string {
	return modelId.trim().toLowerCase();
}

function isComposerFamilyModel(modelId: string): boolean {
	const normalized = normalizeCursorModelId(modelId);
	return normalized === "composer" || normalized.startsWith("composer-") || normalized === "composer-latest";
}

export function resolveCursorComposerCostRates(modelId: string, fastEnabled?: boolean): CursorModelCostRates | undefined {
	if (!isComposerFamilyModel(modelId)) return undefined;
	const useFast = fastEnabled ?? getEffectiveFastForModelId(modelId) ?? true;
	return useFast ? { ...CURSOR_COMPOSER_FAST_COST } : { ...CURSOR_COMPOSER_STANDARD_COST };
}

export function applyCursorComposerUsageCost<TApi extends AssistantMessage["api"]>(
	partial: AssistantMessage,
	model: Model<TApi>,
	fastEnabled?: boolean,
): void {
	const rates = resolveCursorComposerCostRates(model.id, fastEnabled);
	if (rates == null) return;
	calculateCost({ ...model, cost: rates }, partial.usage);
}
