const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const createCardService = require('@app/services/card/create-card');
const { CardMessages } = require('@app/messages');

module.exports = createHandler({
    path: '/creator-cards',
    method: 'post',
    middlewares: [],
    async onResponseEnd(rc, rs) {
        appLogger.info({ requestContext: rc, response: rs }, 'create-card-request-completed');
    },
    async handler(rc, helpers) {
        const payload = rc.body;

        const response = await createCardService(payload);
        return {
            status: helpers.http_statuses.HTTP_200_OK,
            message: CardMessages.CREATED,
            data: response,
        };
    },
});
