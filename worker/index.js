const client_id = '07957ad810a70e99d67c'
const client_secret = GITHUB_SECRET
const SUCCESS = { status: 200, statusText: 'OK' }
const BAD_REQUEST = { status: 400, statusText: 'Bad Request' }
const INTERNAL = { status: 500, statusText: 'Internal Server Error' }
const NOT_FOUND = { status: 404, statusText: 'Not Found' }
const TYPE_JSON = { 'content-type': 'application/json' }
const rand = () => Math.random().toString(36).slice(2, 12).padEnd(10, '0')

const handlers = {}

handlers['/ping'] = async (params) => new Response('', SUCCESS)
handlers['/github'] = async (params) => {
  const state = params.get('state')
  const code = params.get('code')
  if (!state || !code) return new Response(null, BAD_REQUEST)

  // get the token
  const authParams = { client_id, client_secret, state, code }
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: String(new URLSearchParams(authParams)),
  })
  const authBody = new URLSearchParams(await res.text())
  const token = authBody.get('access_token')

  if (authBody.get('error')) {
    return new Response(authBody.get('error_description'), BAD_REQUEST)
  }

  // get user data
  const query = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'User-Agent': 'nan-academy/nan-platform',
      ...TYPE_JSON,
    },
    body: JSON.stringify({ query: '{ viewer { login id name }}' }),
  })

  const tmpTxt = await query.text()
  try {
    const { data, errors } = JSON.parse(tmpTxt)
    if (errors) {
      console.log(errors)
      return new Response(errors[0].message, INTERNAL)
    }
  } catch {
    new Response(tmpTxt, INTERNAL)
  }

  // create the user
  const { id, login, name } = data.viewer
  const sid = Number(atob(id).slice(7)).toString(36)
  const user = { sid, login, name }
  await NAN.put(`u:${sid}`, JSON.stringify(user))
  return Response.redirect(`https://nan.oct.ovh?${new URLSearchParams(user)}`, 301)
}


const handleRequest = (event) => {  
  const { searchParams, pathname } = new URL(event.request.url)
  const handler = handlers[pathname]
  return handler ? handler(searchParams) : new Response(pathname, NOT_FOUND)
}

addEventListener('fetch', event => event.respondWith(handleRequest(event)))
