import { google } from 'googleapis'

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
]

export function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
}

export function authUrl() {
  return oauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // fuerza refresh_token
    scope: SCOPES,
  })
}

/** Cliente Drive autorizado con el refresh token de un usuario. */
export function driveCliente(refreshToken: string) {
  const oauth = oauthClient()
  oauth.setCredentials({ refresh_token: refreshToken })
  return google.drive({ version: 'v3', auth: oauth })
}

export function calendarCliente(refreshToken: string) {
  const oauth = oauthClient()
  oauth.setCredentials({ refresh_token: refreshToken })
  return google.calendar({ version: 'v3', auth: oauth })
}

export function gmailCliente(refreshToken: string) {
  const oauth = oauthClient()
  oauth.setCredentials({ refresh_token: refreshToken })
  return google.gmail({ version: 'v1', auth: oauth })
}
