import { Eve } from './shared/eve.js'
import { render } from 'react-dom'
import { Github, Discord } from './icons.jsx'
import * as React from 'react'

import { user } from './auth.js'

// import { FiGithub } from 'react-icons/fi'
window.React = React

render(
  <header>
    <nav>
      <ul>
        <li>Logo</li>
        <li>
          <a href="#">about us</a>
        </li>
      </ul>
      <ul>
        <li>
          <a href="#">Github</a>
        </li>
      </ul>
    </nav>
    <h1>
      <code>NaN</code> Platform
    </h1>
    <p>
      Page Subheading with <mark>highlighting</mark>
    </p>
    <br />
    <p>
      {user ? (
        <>
          <b>Welcome {user.name}</b>
          <a href="/api/link/discord">
            <b>
              <Discord style={{ marignLeft: '2em' }} /> connect discord
            </b>
          </a>
        </>
      ) : (
        <a href="/api/link/github">
          <b>
            <Github style={{ marignLeft: '2em' }} /> Login with Github
          </b>
        </a>
      )}
    </p>
  </header>,
  document.getElementById('root'),
)

const wesh = Eve()
