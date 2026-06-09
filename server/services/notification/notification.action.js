const nodemailer = require('nodemailer');
const { ORDER_STATUS } = require('../../utils/constants');

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTransporter() {
	return nodemailer.createTransport({
		host: process.env.MAIL_HOST || 'smtp.gmail.com',
		port: Number(process.env.MAIL_PORT) || 465,
		secure: true,
		auth: {
			user: process.env.MAIL_USERNAME,
			pass: process.env.MAIL_PASSWORD,
		},
	});
}

function buildOrderStatusEmail(receiverName, orderCode, status) {
	const statusMap = {
		[ORDER_STATUS.PENDING_SHOP]: {
			subject: `[MetaMarket] Đơn hàng #${orderCode} đã đặt thành công`,
			body: `
				<p>Xin chào <strong>${receiverName}</strong>,</p>
				<p>Đơn hàng <strong>#${orderCode}</strong> của bạn đã được đặt thành công và đang chờ shop xác nhận.</p>
				<p>Chúng tôi sẽ thông báo ngay khi có cập nhật mới.</p>
			`,
		},
		[ORDER_STATUS.SHIPPING]: {
			subject: `[MetaMarket] Đơn hàng #${orderCode} đang trên đường giao`,
			body: `
				<p>Xin chào <strong>${receiverName}</strong>,</p>
				<p>Đơn hàng <strong>#${orderCode}</strong> của bạn đã được bàn giao cho shipper và đang trên đường giao đến bạn.</p>
				<p>Vui lòng chú ý điện thoại để nhận hàng.</p>
			`,
		},
		[ORDER_STATUS.COMPLETE]: {
			subject: `[MetaMarket] Đơn hàng #${orderCode} đã giao thành công 🎉`,
			body: `
				<p>Xin chào <strong>${receiverName}</strong>,</p>
				<p>Đơn hàng <strong>#${orderCode}</strong> đã được giao thành công. Cảm ơn bạn đã mua sắm tại MetaMarket!</p>
				<p>Hãy để lại đánh giá để giúp shop phát triển nhé 🌟</p>
			`,
		},
		[ORDER_STATUS.CANCELED]: {
			subject: `[MetaMarket] Đơn hàng #${orderCode} đã bị huỷ`,
			body: `
				<p>Xin chào <strong>${receiverName}</strong>,</p>
				<p>Đơn hàng <strong>#${orderCode}</strong> của bạn đã bị huỷ.</p>
				<p>Nếu bạn có thắc mắc, vui lòng liên hệ hỗ trợ MetaMarket.</p>
			`,
		},
	};

	return statusMap[Number(status)] || null;
}

function wrapHtml(title, bodyHtml) {
	return `
		<!DOCTYPE html>
		<html lang="vi">
		<head>
			<meta charset="UTF-8"/>
			<style>
				body { font-family: Arial, sans-serif; color: #333; background: #f5f5f5; padding: 20px; }
				.card { background: #fff; border-radius: 8px; padding: 24px 32px; max-width: 560px; margin: auto; }
				.header { font-size: 22px; font-weight: bold; color: #e85d04; margin-bottom: 16px; }
				.footer { margin-top: 24px; font-size: 12px; color: #aaa; }
			</style>
		</head>
		<body>
			<div class="card">
				<div class="header">MetaMarket</div>
				<h2>${title}</h2>
				${bodyHtml}
				<div class="footer">© MetaMarket — Đừng trả lời email này.</div>
			</div>
		</body>
		</html>
	`;
}

// ─── Actions ────────────────────────────────────────────────────────────────

module.exports = {
	/**
	 * Gửi email thông báo trạng thái đơn hàng cho user.
	 * Params: { email, receiverName, orderCode, status }
	 */
	sendOrderStatusEmail: {
		params: {
			email: 'string',
			receiverName: 'string',
			orderCode: 'string',
			status: ['number', { type: 'string', numeric: true }],
		},
		async handler(ctx) {
			const { email, receiverName, orderCode, status } = ctx.params;

			const template = buildOrderStatusEmail(receiverName, orderCode, status);
			if (!template) {
				this.logger.warn(
					`[Notification] Không có template cho status=${status}, bỏ qua.`,
				);
				return false;
			}

			try {
				const transporter = getTransporter();
				await transporter.sendMail({
					from: `"MetaMarket" <${process.env.MAIL_USERNAME}>`,
					to: email,
					subject: template.subject,
					html: wrapHtml(template.subject, template.body),
				});
				this.logger.info(
					`[Notification] Đã gửi email đơn hàng #${orderCode} (status=${status}) → ${email}`,
				);
				return true;
			} catch (error) {
				this.logger.error('[Notification] Lỗi gửi email:', error.message);
				return false;
			}
		},
	},

	/**
	 * Gửi email thông báo shop được duyệt.
	 * Params: { email, shopName }
	 */
	sendShopApprovedEmail: {
		params: {
			email: 'string',
			shopName: 'string',
		},
		async handler(ctx) {
			const { email, shopName } = ctx.params;

			const subject = `[MetaMarket] Shop "${shopName}" đã được duyệt 🎉`;
			const body = `
				<p>Xin chào,</p>
				<p>Shop <strong>${shopName}</strong> của bạn đã được MetaMarket phê duyệt thành công!</p>
				<p>Bạn có thể đăng nhập và bắt đầu đăng sản phẩm ngay bây giờ.</p>
			`;

			try {
				const transporter = getTransporter();
				await transporter.sendMail({
					from: `"MetaMarket" <${process.env.MAIL_USERNAME}>`,
					to: email,
					subject,
					html: wrapHtml(subject, body),
				});
				this.logger.info(
					`[Notification] Đã gửi email duyệt shop "${shopName}" → ${email}`,
				);
				return true;
			} catch (error) {
				this.logger.error('[Notification] Lỗi gửi email shop:', error.message);
				return false;
			}
		},
	},
};
