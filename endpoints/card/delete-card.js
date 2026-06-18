const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const deleteCardService = require('@app/services/card/delete-card');
const { CardMessages } = require('@app/messages');

module.exports = createHandler({
    path: '/creator-cards/:slug',
    method: 'delete',
    middlewares: [],
    async onResponseEnd(rc, rs) {
        appLogger.info({ requestContext: rc, response: rs }, 'delete-card-request-completed');
    },
    async handler(rc, helpers) {
        const { slug } = rc.params;
        const payload = rc.body;

        const response = await deleteCardService(slug, payload);
        return {
            status: helpers.http_statuses.HTTP_200_OK,
            message: CardMessages.DELETED,
            data: response,
        };
    },
});
