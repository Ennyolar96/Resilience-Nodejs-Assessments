const bcrypt = require('bcrypt');
const validator = require('@app-core/validator');
const { throwAppError, CARD_ERROR_CODES } = require('@app-core/errors');
const { CardMessages } = require('@app/messages');
const cardRepository = require('@app/repository/card');
const { randomBytes } = require('@app-core/randomness');

const createCardSpec = `root {
  title string<minlength:3|maxlength:100>
  description? string<maxlength:500>
  slug? string<minlength:5|maxlength:50>
  creator_reference string<length:20>
  links[]? {
    title string<minlength:1|maxlength:100>
    url string<maxlength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<minlength:3|maxlength:100>
      description string<maxlength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}`;

const parsedCreateCardSpec = validator.parse(createCardSpec);

function generateSlug(title) {
  let slug = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
  return slug;
}

function generateRandomSuffix() {
  return randomBytes(6);
}

function serializeCard(card) {
  const { _id, __v, ...rest } = card;
  return { id: _id, ...rest };
}

async function createCard(serviceData) {
  const validatedData = validator.validate(serviceData, parsedCreateCardSpec, { dontThrowErrors: true });

  let { title, description, slug, creator_reference, links, service_rates, status, access_type, access_code } = validatedData;

  if (!access_type) {
    access_type = 'public';
  }

  if (access_type === 'private' && !access_code) {
    throwAppError(CardMessages.ACCESS_CODE_REQUIRED, CARD_ERROR_CODES.AC01);
  }

  if (access_type === 'public' && access_code) {
    throwAppError(CardMessages.ACCESS_CODE_ON_PUBLIC, CARD_ERROR_CODES.AC05);
  }

  if (slug) {
    const slugPattern = /^[a-zA-Z0-9_-]+$/;
    if (!slugPattern.test(slug)) {
      throwAppError(CardMessages.INVALID_SLUG_FORMAT, CARD_ERROR_CODES.SL02);
    }

    const existingCard = await cardRepository.findOne({ query: { slug } });
    if (existingCard) {
      throwAppError(CardMessages.SLUG_TAKEN, CARD_ERROR_CODES.SL02);
    }
  }

  if (links && links.length) {
    for (const link of links) {
      if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
        throwAppError(CardMessages.INVALID_URL, CARD_ERROR_CODES.SL02);
      }
    }
  }

  if (!slug) {
    slug = generateSlug(title);

    const existingCard = await cardRepository.findOne({ query: { slug } });
    if (!slug || slug.length < 5 || existingCard) {
      slug = `${slug || 'card'}-${generateRandomSuffix()}`;
    }
  }

  const plainAccessCode = access_code || null;
  const storedAccessCode = plainAccessCode ? await bcrypt.hash(plainAccessCode, 10) : null;

  const cardData = {
    title,
    description: description || null,
    slug,
    creator_reference,
    links: links || [],
    service_rates: service_rates || null,
    status,
    access_type,
    access_code: storedAccessCode,
  };

  const createdCard = await cardRepository.create(cardData);

  const responseCard = { ...createdCard, access_code: plainAccessCode };

  return serializeCard(responseCard);
}

module.exports = createCard;
