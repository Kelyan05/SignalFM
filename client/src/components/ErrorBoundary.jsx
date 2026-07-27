import { Component } from "react";

// Standard React error boundary — nothing in this component tree has one,
// so any uncaught render error (e.g. from the Spotify Web Playback SDK
// integration) currently blanks the whole page instead of failing gracefully.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
