import { createContext, useContext, useState } from 'react'
import * as api from '../api/store'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(api.currentUser)
  const value = {
    user,
    login: (email, pw) => setUser(api.login(email, pw)),
    register: (data) => setUser(api.register(data)),
    logout: () => { api.logout(); setUser(null) },
    update: (patch) => { api.updateUser(user.id, patch); setUser(api.currentUser()) },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Ctx)
