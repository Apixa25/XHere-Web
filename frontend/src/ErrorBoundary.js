import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    // Optionally log to a service
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: "red" }}>
          <h2>Something went wrong!</h2>
          <pre>{String(this.state.error)}</pre>
          <pre>{JSON.stringify(this.state.info)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
} 