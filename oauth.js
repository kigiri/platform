import { DEV } from './env.js'

const rand = () => Math.random().toString(36).slice(2, 12).padEnd(10, '0')

const state = localStorage.state || `${rand()}-${rand()}`
localStorage.state = state

// Request a user's GitHub identity
export const githubUrl = `https://github.com/login/oauth/authorize?${new URLSearchParams(
  {
    // Required. The client ID you received from GitHub when you registered.
    client_id: `07957ad810a70e99d67c`,

    // The URL in your application where users will be sent after authorization.
    // DEV && `redirect_uri=${encodeURIComponent('http://localhost:8080')}`,

    // A random state
    state,

    // A space-delimited list of scopes.
    scope: 'user',
  },
)}`

// Request a user's GitHub identity
export const discordUrl = `https://discordapp.com/api/oauth2/authorize?${new URLSearchParams(
  {
    client_id: '826974634069983282',
    state,
    redirect_uri: window.location.origin,
    response_type: 'code',
    scope: 'identify gdm.join guilds.join',
  },
)}`

export const user = (({ searchParams }) => {
  // load user from local cache
  if (!searchParams.has('sid')) {
    const { user } = localStorage
    return user && JSON.parse(user)
  }

  // load user from URL
  const { session, ...user } = Object.fromEntries(searchParams)
  localStorage.user = JSON.stringify(user)
  history.replaceState({}, null, '/')
  const secure = DEV ? '' : '; secure'
  document.cookie = `nan-session=${session}; path=/; SameSite=Strict${secure}`
  return user
})(new URL(window.location))
