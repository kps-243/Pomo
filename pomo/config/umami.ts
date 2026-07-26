import env from '#start/env'

const umamiConfig = {
  domain: env.get('UMAMI_DOMAIN'),
  websiteId: env.get('UMAMI_WEBSITE_ID'),
  enabled: Boolean(env.get('UMAMI_DOMAIN')) && Boolean(env.get('UMAMI_WEBSITE_ID')),
}

export default umamiConfig
