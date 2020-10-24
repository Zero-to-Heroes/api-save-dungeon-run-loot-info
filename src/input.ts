export interface Input {
	readonly type: 'duels' | 'paid-duels';
	readonly reviewId: string;
	readonly runId: string;
	readonly userId: string;
	readonly userName: string;
	readonly signatureTreasure: string;
	readonly startingHeroPower: string;
	readonly lootBundles: readonly OptionBundle[];
	readonly chosenLootIndex: number;
	readonly treasureOptions: readonly string[];
	readonly chosenTreasureIndex: number;
	readonly currentWins: number;
	readonly currentLosses: number;
	readonly rating: number;
}

export interface OptionBundle {
	readonly bundleId: string;
	readonly elements: readonly string[];
}
