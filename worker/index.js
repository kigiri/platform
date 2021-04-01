// ENV GITHUB_SECRET
// ENV DISCORD_SECRET
// ENV BOT_TOKEN
const db = {
  get: async (key) => (await NAN.getWithMetadata(key))?.metadata,
  set: (key, metadata) => NAN.put(key, '', { metadata }),
  put: (key, value, opts) => NAN.put(key, value, opts),
  update: async (key, p) => db.set(key, { ...(await db.get(key)), ...p }),
  find: async (prefix) => (await NAN.list({ prefix, limit: 1 })).keys[0],
  filter: async (prefix) => {
    let cursor, list
    const results = []
    while ((list = await NAN.list({ prefix, cursor }))) {
      results.push(...list.keys)
      if (list.list_complete) break
      cursor = list.cursor
    }
    return results
  },
}

const SUCCESS = { status: 200, statusText: 'OK' }
const INTERNAL = { status: 500, statusText: 'Internal Server Error' }
const NOT_FOUND = { status: 404, statusText: 'Not Found' }
const BAD_REQUEST = { status: 400, statusText: 'Bad Request' }
const UNAUTHORIZED = { status: 401, statusText: 'Unauthorized' }
const TYPE_JSON = { 'content-type': 'application/json' }
const rand = () => Math.random().toString(36).slice(2, 12).padEnd(10, '0')
const gql = async (query) => {
  const text = await query.text()
  try {
    const { data, errors } = JSON.parse(text)
    return { data, error: errors && errors[0].message }
  } catch {
    return { error: text }
  }
}

const handlers = {}
const setter = (p) => (_, k, v) => (handlers[`${p}/${k}`] = v)
const getter = (p) => (cache, k) => cache[k] || (cache[k] = ROUTE(`${p}/${k}`))
const ROUTE = (p) => new Proxy({}, { get: getter(p), set: setter(p) })
const GET = ROUTE('GET/api')
const POST = ROUTE('POST/api')

// HANDLE SESSIONS SIGNALS
// initOffer -> waiting for another player
// findSession -> joining session...
// sendAnswer -> sharing connection data
// joinSession -> connection done ! starting the game
//   at this point, both clients can close the websocket connection

// recieve offer
//   - save offer in kv
//   - look if we have open offers already
//   - if so, send other peer offer

// Alice is the first peer to join the swarm:
//
//     She gives the server an OFFER that can be used by the next person to join
//     As CANDIDATES and additional OFFERS trickle in, she forwards them to the server
//     The server groups CANDIDATES and OFFERS in a single CHUNK, awaiting an ACCEPT
//     When someone ACCEPTS her CHUNK, the server REQUESTS another from her
//     As CANDIDATES and OFFERS continue to trickle in, they are forwarded to client that ACCEPTED the original chunk
//
// When Bob joins the swarm:
//
//     He follows the same procedure as Alice
//     He takes one CHUNK from each client on the server
//     If Alice does not have a CHUNK readily available, Bob puts his name on her waiting list
//     On the client, Bob creates an ANSWER to each OFFER and forwards it to the signaling server
//     The signaling server forwards Bob's ANSWER to Alice
//     Alice uses Bob's ANSWER to initiate the connection

// CLASSROOMS FLOW
// add to classroom until 36 students

GET.swarm.poll = async (params) => {}
GET.swarm.leave = async ({ cookies }) => {
  await db.delete(`swarm:${cookies['x-session-id']}`)
}
POST.swarm.join = async ({ request }) => {
  const offer = await request.text()
  //
  await db.put(`swarm:${session}`, offer)
}

const withUser = (fn) => async (params) => {
  if (!params.session) return new Response('No Session', UNAUTHORIZED)
  params.user = await db.get(params.session)
  if (!params.user) return new Response('Bad Session', UNAUTHORIZED)
  // ...maybe remove session cookie in that case
  return fn(params)
}

const GUILD = '821033851153285170'
const DISCORD = 'https://discordapp.com/api'
GET.auth.discord = async ({ url }) => {
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (!code || !state) return new Response('Missing Params', BAD_REQUEST)
  const session = await db.get(`discord:${state}`)
  if (!session?.user) return new Response('Bad State', BAD_REQUEST)
  const authResponse = await fetch(`${DISCORD}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      scope: 'identify gdm.join guilds.join',
      client_id: '826974634069983282',
      client_secret: DISCORD_SECRET,
      grant_type: 'authorization_code',
      // redirect_uri: redirectUri, do i need dis ?
      code,
    }),
  })

  const auth = await authResponse.json()
  if (auth.error) return new Response(auth.error_description, BAD_REQUEST)
  const userResponse = await fetch(`${DISCORD}/users/@me`, {
    headers: { Authorization: `Bearer ${auth.access_token}` },
  })
  const { id: discordId } = await userResponse.json()
  const user = { ...session.user, discordId }
  const pendingUpdate = db.set(session.name, user)
  // join discord server
  const join = await fetch(`${DISCORD}/guilds/${GUILD}/members/${discordId}`, {
    method: 'PUT',
    headers: { Authorization: `Bot ${BOT_TOKEN}`, ...TYPE_JSON },
    body: JSON.stringify({
      nick: user.name ? `${user.login} (${user.name})` : user.login,
      access_token: auth.access_token,
      roles: ['826978112054100008'],
    }),
  })

  if (!join.ok) {
    console.error('Unable to join discord:', join.statusText)
  }

  await pendingUpdate

  const Location = `/?${new URLSearchParams(user)}`
  return new Response(null, { headers: { Location }, status: 301 })
}

GET.auth.github = async ({ url: { searchParams } }) => {
  const state = searchParams.get('state')
  const code = searchParams.get('code')
  if (!state || !code) return new Response(null, BAD_REQUEST)

  // get github token
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: String(
      new URLSearchParams({
        client_id: '07957ad810a70e99d67c',
        client_secret: GITHUB_SECRET,
        state, // is the state needed here ?
        code,
      }),
    ),
  })

  const authBody = new URLSearchParams(await res.text())
  const token = authBody.get('access_token')

  if (authBody.get('error')) {
    return new Response(authBody.get('error_description'), BAD_REQUEST)
  }

  // get github user data from the token
  const query = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'User-Agent': 'nan-academy/nan-platform',
      ...TYPE_JSON,
    },
    body: JSON.stringify({ query: '{ viewer { login id name }}' }),
  })

  const { data, error } = await gql(query)
  if (error) return new Response(error, INTERNAL)

  // create the user session
  const { id, login, name } = data.viewer
  const sid = Number(atob(id).slice(7)).toString(36)
  const key = await db.find(`user:${sid}:`)
  const session =
    key?.name || `user:${sid}:${login}:${Date.now().toString(36)}:${rand()}`
  const user = { sid, login, name }
  await db.set(session, user)
  return new Response(null, {
    status: 301,
    headers: {
      Location: `/?${new URLSearchParams(user)}`,
      'Set-Cookie': [
        `nan-session=${session}`,
        'path=/',
        'domain=nan.oct.ovh',
        'HttpOnly',
        'SameSite=Strict',
        'Secure',
      ].join('; '),
    },
  })
}

const oauth2Url = (url, args) => `https://${url}?${new URLSearchParams(args)}`
GET.link.discord = withUser(async ({ user, session }) => {
  const state = `${rand()}-${rand()}`
  const metadata = { user, name: session }
  await db.put(`discord:${state}`, '', { expirationTtl: 3600, metadata })
  const Location = oauth2Url('discordapp.com/api/oauth2/authorize', {
    client_id: '826974634069983282',
    response_type: 'code',
    scope: 'identify gdm.join guilds.join',
    state,
  })
  return new Response(null, { headers: { Location }, status: 301 })
})

GET.link.github = async () => {
  const state = `${rand()}-${rand()}`
  await db.put(`github:${state}`, '', { expirationTtl: 3600 })
  const Location = oauth2Url('github.com/login/oauth/authorize', {
    client_id: `07957ad810a70e99d67c`,
    scope: 'user',
    state,
  })
  return new Response(null, { headers: { Location }, status: 301 })
}

const getCookie = (request, key) => {
  const cookieStr = request.headers.get('Cookie')
  if (!cookieStr) return undefined
  const x = cookieStr.indexOf(`${key}=`)
  if (x < 0) return
  const y = cookieStr.indexOf('; ', x)
  return cookieStr.slice(x + key.length + 1, y < x ? cookieStr.length : y)
}

const handleRequest = ({ request }) => {
  const url = new URL(request.url)
  const handler = handlers[`${request.method}${url.pathname}`]
  if (!handler) return new Response(null, NOT_FOUND)
  const session = getCookie(request, 'nan-session')
  return handler({ request, url, session })
}

addEventListener('fetch', (event) => event.respondWith(handleRequest(event)))
