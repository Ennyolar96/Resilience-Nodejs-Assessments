const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const getCardService = require('@app/services/card/get-card');
const { CardMessages } = require('@app/messages');

module.exports = createHandler({
    path: '/creator-cards/:slug',
    method: 'get',
    middlewares: [],
    async onResponseEnd(rc, rs) {
        appLogger.info({ requestContext: rc, response: rs }, 'get-card-request-completed');
    },
    async handler(rc, helpers) {
        const { slug } = rc.params;
        const accessCode = rc.query.access_code;

        const response = await getCardService(slug, accessCode);
        return {
            status: helpers.http_statuses.HTTP_200_OK,
            message: CardMessages.RETRIEVED,
            data: response,
        };
    },
});
