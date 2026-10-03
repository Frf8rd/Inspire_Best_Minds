// Mock backend: everything lives in localStorage so the site works with no server.
// Replace these functions with real fetch() calls when the backend is ready.
import seed from '../data/seed.json'

const K = { users: 'ibm_users', cases: 'ibm_cases', session: 'ibm_session' }
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const uid = () => Math.random().toString(36).slice(2, 10)
const strip = ({ password, ...u }) => u // never expose the password

export function initStore() {
  if (!read(K.users)) write(K.users, seed.users)
  if (!read(K.cases)) write(K.cases, seed.cases)
}

// ----- auth -----
const startSession = (u) => { write(K.session, u.id); return strip(u) }
export function register({ name, email, password }) {
  const users = read(K.users, [])
  email = email.trim().toLowerCase()
  if (users.some((u) => u.email === email)) throw new Error('This email is already registered.')
  const u = { id: uid(), name: name.trim(), email, password, role: 'citizen', createdAt: new Date().toISOString() }
  write(K.users, [...users, u])
  return startSession(u)
}
export function login(email, password) {
  const u = read(K.users, []).find((x) => x.email === email.trim().toLowerCase() && x.password === password)
  if (!u) throw new Error('Wrong email or password.')
  return startSession(u)
}
export const logout = () => localStorage.removeItem(K.session)
export function currentUser() {
  const id = read(K.session, null)
  const u = read(K.users, []).find((x) => x.id === id)
  return u ? strip(u) : null
}
export const updateUser = (id, patch) =>
  write(K.users, read(K.users, []).map((u) => (u.id === id ? { ...u, ...patch } : u)))

// ----- cases -----
export const getCases = () => read(K.cases, [])
export function addCase(data) {
  const c = { ...data, id: uid(), status: 'new', votes: [], createdAt: new Date().toISOString() }
  write(K.cases, [c, ...getCases()])
  return c
}
export const updateCase = (id, patch) =>
  write(K.cases, getCases().map((c) => (c.id === id ? { ...c, ...patch } : c)))
export const deleteCase = (id) => write(K.cases, getCases().filter((c) => c.id !== id))
export const toggleVote = (caseId, userId) =>
  write(K.cases, getCases().map((c) => c.id !== caseId ? c : {
    ...c, votes: c.votes.includes(userId) ? c.votes.filter((v) => v !== userId) : [...c.votes, userId],
  }))
