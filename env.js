export const DEV = process.env.NODE_ENV === 'developement'
export const API = DEV ? '127.0.0.1:8787' : 'nan.clem.workers.dev'