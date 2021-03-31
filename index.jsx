import { Eve } from './shared/eve.js'
import { render } from 'react-dom'
import * as React from 'react'

import { authorizationUrl, user } from './oauth.js'

// import { FiGithub } from 'react-icons/fi'
window.React = React

const Github =
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="2em"
    width="2em"
    style={{marignLeft: '2em'}}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>

render(
  <header>
    <nav>
      <ul>
        <li>Menu Item 1</li>
        <li><a href="#">Menu Item 2</a></li>
      </ul>
      <ul>
        <li><a href="#">Github</a></li>
      </ul>
    </nav>
    <h1><code>NaN</code> Platform</h1>
    <p>Page Subheading with <mark>highlighting</mark></p>
    <br />
    <p>
      {user
        ? <b>Welcome {user.name}</b>
        : <a href={authorizationUrl}><b>{Github} Login with Github</b></a>
      }
    </p>
  </header>,
  document.getElementById('root')
)

const wesh = Eve()
