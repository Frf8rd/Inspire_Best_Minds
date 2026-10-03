import { useState } from 'react'
import './LoginSignupPage.css'

function LoginSignupPage() {
  const [isLogin, setIsLogin] = useState(true)

  const handleSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <main className="auth-page" aria-label="Authentication page">
      <section className="auth-card">
        <div className="auth-visual">
          <div className="brand">Inspire Best Minds</div>
        </div>

        <div className="auth-panel">
          <div className="tab-toggle" role="tablist" aria-label="Authentication toggle">
            <button
              type="button"
              className={isLogin ? 'tab active' : 'tab'}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              type="button"
              className={!isLogin ? 'tab active' : 'tab'}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          <div className="form-header">
            <h2>{isLogin ? 'Log in to your account' : 'Create your account'}</h2>
            <p>
              {isLogin
                ? 'Enter your details to continue.'
                : 'Fill in the information below to get started.'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <label>
                Full name
                <input type="text" name="fullName" placeholder="Your full name" required />
              </label>
            )}

            <label>
              Email address
              <input type="email" name="email" placeholder="you@example.com" required />
            </label>

            <label>
              Password
              <input type="password" name="password" placeholder="••••••••" required />
            </label>

            {!isLogin && (
              <label>
                Confirm password
                <input type="password" name="confirmPassword" placeholder="Repeat your password" required />
              </label>
            )}

            {isLogin && (
              <div className="row-inline">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Remember me
                </label>
                <a href="#">Forgot password?</a>
              </div>
            )}

            <button type="submit" className="submit-btn">
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <p className="switch-text">
            {isLogin ? 'Don’t have an account?' : 'Already have an account?'}{' '}
            <button type="button" className="link-btn" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}

export default LoginSignupPage
