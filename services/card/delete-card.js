const validator = require('@app-core/validator');
const { throwAppError, CARD_ERROR_CODES } = require('@app-core/errors');
const { CardMessages } = require('@app/messages');
const cardRepository = require('@app/repository/card');

const deleteCardSpec = `root {
  creator_reference string<length:20>
}`;

const parsedDeleteCardSpec = validator.parse(deleteCardSpec);

function serializeCard(card) {
  const { _id, __v, ...rest } = card;
  return { id: _id, ...rest };
}

async function deleteCard(slug, serviceData) {
  validator.validate(serviceData, parsedDeleteCardSpec, { dontThrowErrors: true });

  const card = await cardRepository.findOne({ query: { slug, deleted: null } });

  if (!card) {
    throwAppError(CardMessages.NOT_FOUND, CARD_ERROR_CODES.NF01);
  }

  const deletedTimestamp = Date.now();

  await cardRepository.updateOne({
    query: { slug },
    updateValues: { deleted: deletedTimestamp },
  });

  return serializeCard({ ...card, deleted: deletedTimestamp, updated: deletedTimestamp });
}

module.exports = deleteCard;
