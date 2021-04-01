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
  return user
})(new URL(window.location))
