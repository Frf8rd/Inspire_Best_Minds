import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Application render failed', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-boundary" role="alert">
          <h1>Aplicația a întâmpinat o eroare.</h1>
          <p>Datele afișate nu au putut fi încărcate.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reîncarcă aplicația
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}