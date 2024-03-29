/* eslint-disable @typescript-eslint/no-use-before-define */
import SqlString from 'sqlstring';
import { Input } from './input';
import { getConnection } from './services/rds';
import { formatDate } from './services/utils';

// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event): Promise<any> => {
	const headers = {
		'Access-Control-Allow-Headers':
			'Accept,Accept-Language,Content-Language,Content-Type,Authorization,x-correlation-id,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
		'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
		'Access-Control-Allow-Origin': event.headers.Origin || event.headers.origin,
	};
	// Preflight
	if (!event.body) {
		const response = {
			statusCode: 200,
			body: null,
			headers: headers,
		};
		return response;
	}

	console.log('parsing input', event.body);
	const input: Input = JSON.parse(event.body);

	if (!input.appVersion) {
		return {
			statusCode: 422,
			isBase64Encoded: false,
			body: 'old version ' + input.appVersion,
			headers: headers,
		};
	}

	if (input.chosenLootIndex === -1 && input.chosenTreasureIndex === -1 && !input.rewards?.Rewards?.length) {
		return {
			statusCode: 422,
			isBase64Encoded: false,
			body: 'invalid option choice ',
			headers: headers,
		};
	}

	// TODO: add current class / hero in DB for stats
	const mysqlBgs = await getConnection();
	const creationDate = formatDate(new Date());
	await saveStartingHeroPower(input, creationDate, mysqlBgs);
	await saveSignatureTreasure(input, creationDate, mysqlBgs);
	await saveLootBundles(input, creationDate, mysqlBgs);
	await saveTreasures(input, creationDate, mysqlBgs);
	await saveRewards(input, creationDate, mysqlBgs);
	await mysqlBgs.end();

	const response = {
		statusCode: 200,
		body: '',
		headers: headers,
	};

	return response;
};

const saveStartingHeroPower = async (input: Input, creationDate: string, mysqlBgs): Promise<void> => {
	const escape = SqlString.escape;
	if (input.startingHeroPower) {
		const values = `
			${escape(input.type)}, 
			${escape(creationDate)}, 
			${escape(input.reviewId)}, 
			${escape(input.runId)}, 
			${escape(input.userId)}, 
			${escape(input.userName)}, 
			'hero-power', 
			${escape(input.startingHeroPower)}, 
			1, 
			0, 
			0, 
			${escape(input.rating)}
		`;
		// https://stackoverflow.com/questions/1361340/how-to-insert-if-not-exists-in-mysql
		// Only insert the starting hero power once
		const query = `
			INSERT INTO dungeon_run_loot_info
			(adventureType, creationDate, reviewId, runId, userId, userName, bundleType, option1, chosenOptionIndex, wins, losses, rating)
			SELECT ${values}
			WHERE NOT EXISTS (
				SELECT * FROM dungeon_run_loot_info 
				WHERE adventureType = ${escape(input.type)}
				AND runId = ${escape(input.runId)}
				AND bundleType = 'hero-power'
				LIMIT 1
			)				
		`;
		await mysqlBgs.query(query);
	}
};

const saveSignatureTreasure = async (input: Input, creationDate: string, mysqlBgs): Promise<void> => {
	const escape = SqlString.escape;
	if (input.signatureTreasure) {
		const values = `
			${escape(input.type)}, 
			${escape(creationDate)}, 
			${escape(input.reviewId)}, 
			${escape(input.runId)}, 
			${escape(input.userId)}, 
			${escape(input.userName)}, 
			'signature-treasure', 
			${escape(input.signatureTreasure)}, 
			1, 
			0,
			0,
			${escape(input.rating)}
		`;
		// https://stackoverflow.com/questions/1361340/how-to-insert-if-not-exists-in-mysql
		// Only insert the starting hero power once
		const query = `
			INSERT INTO dungeon_run_loot_info
			(adventureType, creationDate, reviewId, runId, userId, userName, bundleType, option1, chosenOptionIndex, wins, losses, rating)
			SELECT ${values}
			WHERE NOT EXISTS (
				SELECT * FROM dungeon_run_loot_info 
				WHERE adventureType = ${escape(input.type)}
				AND runId = ${escape(input.runId)}
				AND bundleType = 'signature-treasure'
				LIMIT 1
			)				
		`;
		await mysqlBgs.query(query);
	}
};

const saveLootBundles = async (input: Input, creationDate: string, mysqlBgs): Promise<void> => {
	const escape = SqlString.escape;
	if (input.lootBundles?.length) {
		const lootValues = `
			${escape(input.type)}, 
			${escape(creationDate)}, 
			${escape(input.reviewId)}, 
			${escape(input.runId)}, 
			${escape(input.userId)}, 
			${escape(input.userName)}, 
			'loot', 
			${escape(input.lootBundles[0].bundleId)}, 
			${escape(input.lootBundles[0].elements.join(','))}, 
			${escape(input.lootBundles[1].bundleId)}, 
			${escape(input.lootBundles[1].elements.join(','))}, 
			${escape(input.lootBundles[2].bundleId)}, 
			${escape(input.lootBundles[2].elements.join(','))}, 
			${escape(input.chosenLootIndex)}, 
			${escape(input.currentWins)}, 
			${escape(input.currentLosses)}, 
			${escape(input.rating)}
		`;
		const query = `
			INSERT INTO dungeon_run_loot_info
			(adventureType, creationDate, reviewId, runId, userId, userName, bundleType, option1, option1Contents, option2, option2Contents, option3, option3Contents, chosenOptionIndex, wins, losses, rating)
			SELECT ${lootValues}
			WHERE NOT EXISTS (
				SELECT * FROM dungeon_run_loot_info 
				WHERE adventureType = ${escape(input.type)}
				AND runId = ${escape(input.runId)}
				AND bundleType = 'loot'
				AND wins = ${escape(input.currentWins)}
				AND losses = ${escape(input.currentLosses)}
				LIMIT 1
			)
			
		`;
		await mysqlBgs.query(query);
	}
};

const saveTreasures = async (input: Input, creationDate: string, mysqlBgs): Promise<void> => {
	const escape = SqlString.escape;
	if (input.treasureOptions?.length) {
		const lootValues = `
			${escape(input.type)}, 
			${escape(creationDate)}, 
			${escape(input.reviewId)}, 
			${escape(input.runId)}, 
			${escape(input.userId)}, 
			${escape(input.userName)}, 
			'treasure', 
			${escape(input.treasureOptions[0])}, 
			${escape(input.treasureOptions[1])}, 
			${escape(input.treasureOptions[2])}, 
			${escape(input.chosenTreasureIndex)}, 
			${escape(input.currentWins)}, 
			${escape(input.currentLosses)}, 
			${escape(input.rating)}
		`;
		const query = `
			INSERT INTO dungeon_run_loot_info
			(adventureType, creationDate, reviewId, runId, userId, userName, bundleType, option1, option2, option3, chosenOptionIndex, wins, losses, rating)
			SELECT ${lootValues}
			WHERE NOT EXISTS (
				SELECT * FROM dungeon_run_loot_info 
				WHERE adventureType = ${escape(input.type)}
				AND runId = ${escape(input.runId)}
				AND bundleType = 'treasure'
				AND wins = ${escape(input.currentWins)}
				AND losses = ${escape(input.currentLosses)}
				LIMIT 1
			)
		`;
		await mysqlBgs.query(query);
	}
};

const saveRewards = async (input: Input, creationDate: string, mysqlBgs): Promise<void> => {
	const escape = SqlString.escape;
	if (input.rewards?.Rewards?.length) {
		console.log('saving rewards', input.rewards.Rewards);
		const values = input.rewards.Rewards.filter(reward => !!reward)
			.map(
				reward =>
					`(
					${escape(input.type)}, 
					${escape(creationDate)}, 
					${escape(input.reviewId)}, 
					${escape(input.runId)}, 
					${escape(input.userId)}, 
					${escape(input.userName)}, 
					${escape(reward.Type)}, 
					${escape(reward.Amount)}, 
					${escape(reward.BoosterId)}, 
					${escape(input.currentWins)}, 
					${escape(input.currentLosses)}, 
					${escape(input.rating)}
				)`,
			)
			.join('\n,');

		const query = `
			INSERT INTO dungeon_run_rewards
			(adventureType, creationDate, reviewId, runId, userId, userName, rewardType, rewardAmount, rewardBoosterId, wins, losses, rating)
			VALUES ${values}
		`;
		await mysqlBgs.query(query);
	}
};
