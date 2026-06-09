const {
	SVC_NAME,
	ACCOUNT_STATUS,
	ACCOUNT_TYPE,
} = require('../../../utils/constants');
const {
	Province,
	User,
	Account,
	Contract,
	District,
	Shop,
	UserAddress,
	Ward,
	userDb,
} = require('../user.db');

const { MoleculerError } = require('moleculer').Errors;

module.exports = {
	postCreateShop: {
		params: {
			email: 'string',
			password: 'string',
			phone: 'string',
			foundingDate: [{ type: 'string' }],
			name: 'string',
			supporterName: 'string',
			catalogId: 'string',
			openHours: 'string',
			businessLicense: { type: 'string', optional: true, default: '' },
			foodSafetyCertificate: { type: 'string', optional: true, default: '' },
			logoUrl: { type: 'string', optional: true, default: '' },
		},

		async handler(ctx) {
			const tx = await userDb.transaction();

			try {
				const {
					email,
					password,
					phone,
					foundingDate,
					name,
					supporterName,
					catalogId,
					openHours,
					businessLicense = '',
					foodSafetyCertificate = '',
					logoUrl = '',
				} = ctx.params;

				const existedAccount = await Account.findOne({
					where: { email },
					transaction: tx,
				});

				if (existedAccount) {
					throw new MoleculerError('Email already exists', 400);
				}

				const account = await Account.create(
					{
						email,
						password,
						status: ACCOUNT_STATUS.WAITING_APPROVAL,
						type: ACCOUNT_TYPE.SHOP,
						googleId: '',
						createdAt: new Date(),
					},
					{ transaction: tx },
				);

				const shop = await Shop.create(
					{
						accountId: account.accountId,
						phone,
						foundingDate: foundingDate ? new Date(foundingDate) : null,
						name,
						supporterName,
						catalogId,
						openHours,
						logoUrl,
						isOnline: false,
					},
					{ transaction: tx },
				);

				await Contract.create(
					{
						shopId: shop.shopId,
						businessLicense,
						foodSafetyCertificate,
						isOriginCommitment: true,
						isCustomerCareCommitment: true,
						isPolicyCommitment: true,
					},
					{ transaction: tx },
				);

				await tx.commit();

				return { shopId: shop.shopId };
			} catch (error) {
				await tx.rollback();
				this.logger.error(error);

				if (error instanceof MoleculerError) {
					throw error;
				}

				throw new MoleculerError(error.toString(), 500);
			}
		},
	},

	getUserByUserId: {
		cache: false,
		params: {
			userId: ['number', { type: 'string', numeric: true }],
		},
		async handler(ctx) {
			try {
				const user = await User.findOne({
					raw: true,
					where: { userId: ctx.params.userId },
				});
				return user;
			} catch (error) {
				this.logger.error(error);
				throw new MoleculerError(error.toString(), 500);
			}
		},
	},

	putUpdateAccountStatus: {
		params: {
			accountId: ['number', { type: 'string', numeric: true }],
			status: ['number', { type: 'string', numeric: true }],
		},
		async handler(ctx) {
			const { accountId, status } = ctx.params;

			try {
				await Account.update(
					{ status: Number(status) },
					{ where: { accountId: Number(accountId) } },
				);

				return true;
			} catch (error) {
				this.logger.error(error);
				throw new MoleculerError(error.toString(), 500);
			}
		},
	},
};