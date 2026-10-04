import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../api/client.js';

export default function AuthPage({ actions, t, onExit, initialMode = 'login' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setGoogleLoading(true);
    const url = `${API_BASE_URL}/auth/google`;
    try {
      const response = await fetch(url, { redirect: 'manual', credentials: 'include' });
      if (response.status === 503) {
        const result = await response.json().catch(() => ({}));
        setError(result.message || 'Autentificarea cu Google nu este configurată pe server.');
        setGoogleLoading(false);
        return;
      }
    } catch (requestError) {
      console.error('Unable to check Google sign-in availability', requestError);
      setError('Nu s-a putut contacta serverul. Încearcă din nou.');
      setGoogleLoading(false);
      return;
    }
    window.location.assign(url);
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setError('');
    if (mode === 'register' && password !== passwordConfirmation) {
      setError('Parolele nu coincid.');
      return;
    }
    if (mode === 'register' && !/\d/.test(password)) {
      setError('Parola trebuie s\u0103 con\u021bin\u0103 cel pu\u021bin o cifr\u0103.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await actions.register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
        });
      } else {
        await actions.login(email.trim().toLowerCase(), password);
      }
      const destinationPath = location.state?.from?.pathname;
      const destination = typeof destinationPath === 'string'
        && destinationPath.startsWith('/')
        && !destinationPath.startsWith('//')
        ? `${destinationPath}${location.state.from.search || ''}${location.state.from.hash || ''}`
        : '/';
      navigate(
        destination,
        { replace: true },
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <button className="login-exit-button" type="button" onClick={onExit}>
        <span aria-hidden="true">&#8592;</span> Înapoi la site
      </button>
      <section className="login-intro" aria-labelledby="login-headline">
        <div className="login-brand">
          <div className="logo"><img className="brand-mark-image" src="/logo.png" alt="" /></div>
          <span>{t('brandTagline')}</span>
        </div>
        <p className="login-kicker">{t('loginKicker')}</p>
        <h1 id="login-headline">
          {t('loginHeadline').split('|').map((line, index) => (
            <span key={line}>{index > 0 && <br />}{index === 2 ? <em>{line}</em> : line}</span>
          ))}
        </h1>
        <p className="login-intro-copy">{t('loginDescription')}</p>
      </section>
      <section className="glass-card login-card pad" aria-labelledby="login-form-title">
        <div className="login-form-heading">
          <p className="login-kicker">{t('accessCommunity')}</p>
          <h2 id="login-form-title">{mode === 'login' ? 'Conectare' : 'Creeaz\u0103 un cont'}</h2>
          <p className="login-form-description">
            {mode === 'login'
              ? 'Conecteaz\u0103-te pentru a urm\u0103ri sesiz\u0103rile \u0219i nout\u0103\u021bile din ora\u0219.'
              : '\u00cenregistreaz\u0103-te ca s\u0103 po\u021bi trimite \u0219i urm\u0103ri sesiz\u0103ri.'}
          </p>
        </div>
        <div className="login-mode-switch" role="tablist" aria-label={'Tipul autentific\u0103rii'}>
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-active' : ''} onClick={() => { setMode('login'); setError(''); }}>
            Conectare
          </button>
          <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'is-active' : ''} onClick={() => { setMode('register'); setError(''); }}>
            {'\u00cenregistrare'}
          </button>
        </div>
        <a className="login-google-button" href={`${API_BASE_URL}/auth/google`} onClick={handleGoogleLogin}>
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" />
            <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z" />
            <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z" />
            <path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 5.9 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3c1.6-4.9 6.1-8.5 11.4-8.5Z" />
          </svg>
          <span>{googleLoading ? 'Se conectează...' : 'Continu\u0103 cu Google'}</span>
          <span className="login-google-arrow" aria-hidden="true">&gt;</span>
        </a>
        <div className="login-divider"><span>{'sau folose\u0219te emailul'}</span></div>
        <form className="login-auth-form" onSubmit={submitAuth}>
          {mode === 'register' && (
            <div className="form-group">
              <input className="form-input" placeholder={t('name')} aria-label={t('name')} autoComplete="name" required minLength={2} maxLength={50} value={name} onChange={(event) => setName(event.target.value)} />
            </div>
          )}
          {mode === 'login' && (
            <Link className="login-forgot-link" to="/forgot-password">Ai uitat parola?</Link>
          )}
          <div className="form-group">
            <input className="form-input" placeholder="Email" aria-label="Email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          {mode === 'register' && (
            <div className="form-group">
              <input className="form-input" placeholder={`${t('phone')} (op\u021bional)`} aria-label={t('phone')} type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
          )}
          <div className="form-group">
            <input className="form-input" placeholder={'Parol\u0103'} aria-label={'Parol\u0103'} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {mode === 'register' && (
            <div className="form-group">
              <input className="form-input" placeholder={'Confirm\u0103 parola'} aria-label={'Confirm\u0103 parola'} type="password" autoComplete="new-password" required minLength={6} value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} />
            </div>
          )}
          {mode === 'register' && <p className="login-password-hint">{'Parola trebuie s\u0103 aib\u0103 minimum 6 caractere \u0219i o cifr\u0103.'}</p>}
          {error && <p className="login-auth-error" role="alert">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Se proceseaz\u0103\u2026' : mode === 'login' ? 'Conectare' : 'Creeaz\u0103 cont'}
          </button>
        </form>
      </section>
    </main>
  );
}
