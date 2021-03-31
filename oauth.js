import { DEV } from './env.js'

const rand = () => Math.random().toString(36).slice(2, 12).padEnd(10, '0')

const state = localStorage.state || `${rand()}-${rand()}`
localStorage.state = state

  // Request a user's GitHub identity
export const authorizationUrl = `https://github.com/login/oauth/authorize?${[
  // Required. The client ID you received from GitHub when you registered.
  `client_id=07957ad810a70e99d67c`,

  // The URL in your application where users will be sent after authorization.
  // DEV && `redirect_uri=${encodeURIComponent('http://localhost:8080')}`,

  // A random state
  `state=${state}`,

  // A space-delimited list of scopes.
  `scope=${encodeURIComponent(['user'].join(' '))}`,
].filter(Boolean).join('&')}`

export const user = (({ searchParams }) => {
  // load user from local cache
  if (!searchParams.has('sid')) {
    const { user } = localStorage
    return user && JSON.parse(user)
  }

  // load user from URL
  const user = Object.fromEntries(searchParams)
  localStorage.user = JSON.stringify(user)
  history.replaceState({}, null, '/')
  document.cookie = `X-User-Id=${user.sid}; path=/; SameSite=Strict`
  return user
})(new URL(window.location))
