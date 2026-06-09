jQuery(function () {
	// Load more
	$('.catalog-more').on('click', async function () {
		$(this).addClass('disabled');
		$(this).find('.spinner-border').removeClass('d-none');

		const catalogId = $(this).attr('data-id');
		const page = Number($(this).attr('data-page'));
		const nextPage = page + 1;
		const pageSize = Number($(this).attr('data-size'));
		const select = '_id name price unit avt discount catalogId';

		try {
			const apiResStr = await fetch(
				`${PRODUCT_SERVICE_API_URL}/list/catalog/${catalogId}?page=${nextPage}&pageSize=${pageSize}&select=${select}`,
			);
			if (apiResStr.status === 200) {
				const productDocs = await apiResStr.json();
				const { docs, total } = productDocs;
				const productXml = renderProductList(docs);

				$(this).siblings('.product-list').append(productXml);
				$(this)
					.find('.rest')
					.html(total - (page * pageSize + docs.length));

				if (nextPage * pageSize >= total) {
					$(this).remove();
				} else {
					$(this).attr('data-page', nextPage);
				}
			}
		} catch (error) {
		} finally {
			if ($(this)) {
				$(this).removeClass('disabled');
				$(this).find('.spinner-border').addClass('d-none');
			}
		}
	});
});
