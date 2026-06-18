const bcrypt = require('bcrypt');
const { throwAppError, CARD_ERROR_CODES } = require('@app-core/errors');
const { CardMessages } = require('@app/messages');
const cardRepository = require('@app/repository/card');

function serializeCard(card) {
  const { _id, access_code, __v, ...rest } = card;
  return { id: _id, ...rest };
}

async function getCard(slug, accessCode) {
  const card = await cardRepository.findOne({ query: { slug, deleted: null } });

  if (!card) {
    throwAppError(CardMessages.NOT_FOUND, CARD_ERROR_CODES.NF01);
  }

  if (card.status === 'draft') {
    throwAppError(CardMessages.DRAFT_NOT_FOUND, CARD_ERROR_CODES.NF02);
  }

  if (card.access_type === 'private') {
    if (!accessCode) {
      throwAppError(CardMessages.PRIVATE_ACCESS_REQUIRED, CARD_ERROR_CODES.AC03);
    }

    const codeMatches = await bcrypt.compare(accessCode, card.access_code);
    if (!codeMatches) {
      throwAppError(CardMessages.INVALID_ACCESS_CODE, CARD_ERROR_CODES.AC04);
    }
  }

  return serializeCard(card);
}

module.exports = getCard;
