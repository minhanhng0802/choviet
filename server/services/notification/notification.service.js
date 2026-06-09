const { SVC_NAME } = require('../../utils/constants');
const notificationActions = require('./notification.action');

module.exports = {
	name: SVC_NAME.NOTIFICATION,

	actions: {
		...notificationActions,
	},
};
