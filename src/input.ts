import { BoosterType, RewardType } from '@firestone-hs/reference-data';

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
	readonly rewards: DuelsRewardsInfo;
	readonly currentWins: number;
	readonly currentLosses: number;
	readonly rating: number;
	readonly appVersion: string;
}

export interface OptionBundle {
	readonly bundleId: string;
	readonly elements: readonly string[];
}

export interface DuelsRewardsInfo {
	readonly Rewards: readonly DuelsRewardInfo[];
}

export interface DuelsRewardInfo {
	readonly Type: RewardType;
	readonly Amount: number;
	readonly BoosterId: BoosterType | string;
}
