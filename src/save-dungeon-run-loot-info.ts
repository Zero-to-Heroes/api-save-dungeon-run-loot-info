/* eslint-disable @typescript-eslint/no-use-before-define */
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
	try {
		console.log('processing event');
		// Preflight
		if (!event.body) {
			const response = {
				statusCode: 200,
				body: null,
				headers: headers,
			};
			console.log('sending back success response without body', response);
			return response;
		}

		const input: Input = JSON.parse(event.body);

		if (input.userName === 'daedin') {
			console.log('DEBUG daedin');
		}

		if (!input.appVersion) {
			console.log('old version, not doing anything');
			return;
		}

		if (input.chosenLootIndex === -1) {
			console.log('invalid option choice', input);
			return;
		}

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

		console.log('sending back success reponse', response);

		return response;
	} catch (e) {
		console.error('issue saving sample', e);
		const response = {
			statusCode: 500,
			isBase64Encoded: false,
			body: null,
			headers: headers,
		};
		console.log('sending back error reponse', response);
		return response;
	}
};

const saveStartingHeroPower = async (input: Input, creationDate: string, mysqlBgs): Promise<void> => {
	if (input.startingHeroPower) {
		const values = `'${input.type}', '${creationDate}', '${input.reviewId}', '${input.runId}', '${input.userId}', '${input.userName}', 'hero-power', '${input.startingHeroPower}', 1, ${input.currentWins}, ${input.currentLosses}, ${input.rating}`;
		// https://stackoverflow.com/questions/1361340/how-to-insert-if-not-exists-in-mysql
		// Only insert the starting hero power once
		const query = `
			INSERT INTO dungeon_run_loot_info
			(adventureType, creationDate, reviewId, runId, userId, userName, bundleType, option1, chosenOptionIndex, wins, losses, rating)
			SELECT ${values}
			WHERE NOT EXISTS (
				SELECT * FROM dungeon_run_loot_info 
				WHERE adventureType = '${input.type}'
				AND runId = '${input.runId}'
				AND bundleType = 'hero-power'
				LIMIT 1
			)				
		`;
		console.log('running query', query);
		await mysqlBgs.query(query);
		console.log('executed query');
	}
};

const saveSignatureTreasure = async (input: Input, creationDate: string, mysqlBgs): Promise<void> => {
	if (input.signatureTreasure) {
		const values = `'${input.type}', '${creationDate}', '${input.reviewId}', '${input.runId}', '${input.userId}', '${input.userName}', 'signature-treasure', '${input.signatureTreasure}', 1, ${input.currentWins}, ${input.currentLosses}, ${input.rating}`;
		// https://stackoverflow.com/questions/1361340/how-to-insert-if-not-exists-in-mysql
		// Only insert the starting hero power once
		const query = `
			INSERT INTO dungeon_run_loot_info
			(adventureType, creationDate, reviewId, runId, userId, userName, bundleType, option1, chosenOptionIndex, wins, losses, rating)
			SELECT ${values}
			WHERE NOT EXISTS (
				SELECT * FROM dungeon_run_loot_info 
				WHERE adventureType = '${input.type}'
				AND runId = '${input.runId}'
				AND bundleType = 'signature-treasure'
				LIMIT 1
			)				
		`;
		console.log('running query', query);
		await mysqlBgs.query(query);
	}
};

const saveLootBundles = async (input: Input, creationDate: string, mysqlBgs): Promise<void> => {
	if (input.lootBundles?.length) {
		const lootValues = `'${input.type}', '${creationDate}', '${input.reviewId}', '${input.runId}', '${
			input.userId
		}', '${input.userName}', 'loot', '${input.lootBundles[0].bundleId}', '${input.lootBundles[0].elements.join(
			',',
		)}', '${input.lootBundles[1].bundleId}', '${input.lootBundles[1].elements.join(',')}', '${
			input.lootBundles[2].bundleId
		}', '${input.lootBundles[2].elements.join(',')}', ${input.chosenLootIndex}, ${input.currentWins}, ${
			input.currentLosses
		}, ${input.rating}`;
		const query = `
			INSERT INTO dungeon_run_loot_info
			(adventureType, creationDate, reviewId, runId, userId, userName, bundleType, option1, option1Contents, option2, option2Contents, option3, option3Contents, chosenOptionIndex, wins, losses, rating)
			SELECT ${lootValues}
			WHERE NOT EXISTS (
				SELECT * FROM dungeon_run_loot_info 
				WHERE adventureType = '${input.type}'
				AND runId = '${input.runId}'
				AND bundleType = 'loot'
				AND wins = ${input.currentWins}
				AND losses = ${input.currentLosses}
				LIMIT 1
			)
			
		`;
		console.log('running query', query);
		await mysqlBgs.query(query);
	}
};

const saveTreasures = async (input: Input, creationDate: string, mysqlBgs): Promise<void> => {
	if (input.treasureOptions?.length) {
		const lootValues = `'${input.type}', '${creationDate}', '${input.reviewId}', '${input.runId}', '${input.userId}', '${input.userName}', 'treasure', '${input.treasureOptions[0]}', '${input.treasureOptions[1]}', '${input.treasureOptions[2]}', ${input.chosenTreasureIndex}, ${input.currentWins}, ${input.currentLosses}, ${input.rating}`;
		const query = `
			INSERT INTO dungeon_run_loot_info
			(adventureType, creationDate, reviewId, runId, userId, userName, bundleType, option1, option2, option3, chosenOptionIndex, wins, losses, rating)
			SELECT ${lootValues}
			WHERE NOT EXISTS (
				SELECT * FROM dungeon_run_loot_info 
				WHERE adventureType = '${input.type}'
				AND runId = '${input.runId}'
				AND bundleType = 'treasure'
				AND wins = ${input.currentWins}
				AND losses = ${input.currentLosses}
				LIMIT 1
			)
		`;
		console.log('running query', query);
		await mysqlBgs.query(query);
	}
};

const saveRewards = async (input: Input, creationDate: string, mysqlBgs): Promise<void> => {
	if (input.rewards?.Rewards?.length) {
		const values = input.rewards.Rewards.map(
			reward =>
				`('${input.type}', '${creationDate}', '${input.reviewId}', '${input.runId}', '${input.userId}', '${input.userName}', ${reward.Type}, ${reward.Amount}, ${reward.BoosterId}, ${input.currentWins}, ${input.currentLosses}, ${input.rating})`,
		).join('\n,');

		const query = `
			INSERT INTO dungeon_run_rewards
			(adventureType, creationDate, reviewId, runId, userId, userName, rewardType, rewardAmount, rewardBoosterId, wins, losses, rating)
			VALUES ${values}
		`;
		console.log('running query', query);
		await mysqlBgs.query(query);
	}
};
