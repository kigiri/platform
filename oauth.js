import { DEV } from './env.js'

const rand = () => Math.random().toString(36).slice(2, 12).padEnd(10, '0')

const state = localStorage.state || `${rand()}-${rand()}`
localStorage.state = state

const oauth2Url = (url, args) => `https://${url}?${new URLSearchParams(args)}`

export const githubUrl = oauth2Url('github.com/login/oauth/authorize', {
  client_id: `07957ad810a70e99d67c`,
  state,
  scope: 'user',
})

export const discordUrl = oauth2Url('discordapp.com/api/oauth2/authorize', {
  client_id: '826974634069983282',
  state,
  response_type: 'code',
  scope: 'identify gdm.join guilds.join',
})

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
