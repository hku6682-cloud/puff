import { create } from 'zustand'
import { authAPI, userAPI } from '../services/authService'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  signup: async (email, username, password, phone, referralCode = null) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authAPI.signup(email, username, password, phone, referralCode)
      localStorage.setItem('access_token', response.data.data.access_token)
      localStorage.setItem('refresh_token', response.data.data.refresh_token)
      set({ token: response.data.data.access_token, isLoading: false })
      return response.data.data
    } catch (err) {
      const error = err.response?.data?.error?.message || 'Signup failed'
      set({ error, isLoading: false })
      throw err
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authAPI.login(email, password)
      localStorage.setItem('access_token', response.data.data.access_token)
      localStorage.setItem('refresh_token', response.data.data.refresh_token)
      set({ token: response.data.data.access_token, isLoading: false })
      
      // Load user details after login
      try {
        const userResponse = await userAPI.getCurrentUser()
        set({ user: userResponse.data.data })
      } catch (err) {
        console.error('Failed to load user details:', err)
      }
      
      return response.data.data
    } catch (err) {
      const error = err.response?.data?.error?.message || 'Login failed'
      set({ error, isLoading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ token: null, user: null })
  },

  setUser: (user) => set({ user }),
}))
