import { createContext, useContext, useState } from 'react'
import * as api from '../api/store'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(api.currentUser)
  const value = {
    user,
    login: (email, pw) => setUser(api.login(email, pw)),
    register: (data) => setUser(api.register(data)),
    loginWithGoogle: (profile) => setUser(api.loginWithGoogle(profile)),
    logout: () => { api.logout(); setUser(null) },
    update: (patch) => {
      const updatedUser = api.updateUser(user.id, patch)
      setUser(updatedUser)
      return updatedUser
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Ctx)
