const { SVC_NAME } = require('../../utils/constants');
const { Shop, Account } = require('../user/user.db');
const { Sequelize } = require('sequelize');
const { MoleculerError } = require('moleculer').Errors;

module.exports = {
	name: SVC_NAME.SHOP,

	actions: {
		getShopById: {
			cache: false,
			params: {
				shopId: [
					{ type: 'string', numeric: true },
					{ type: 'number' },
				],
			},
			async handler(ctx) {
				try {
					const shopId = Number(ctx.params.shopId);

					if (!Number.isInteger(shopId) || shopId <= 0) {
						throw new MoleculerError('Invalid shopId', 400);
					}

					const shop = await Shop.findOne({
						raw: true,
						attributes: {
							include: [
								[Sequelize.col('Account.email'), 'email'],
								[Sequelize.col('Account.status'), 'status'],
							],
						},
						where: { shopId },
						include: {
							model: Account,
							attributes: [],
							required: false,
						},
					});

					if (!shop) {
						throw new MoleculerError('Shop not found', 404);
					}

					return shop;
				} catch (error) {
					this.logger.error(error);

					if (error instanceof MoleculerError) {
						throw error;
					}

					throw new MoleculerError(error.toString(), 500);
				}
			},
		},
	},
};