import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import RootProvider from "./providers/RootProvider";
import { RootLayout } from "./layouts/RootLayout.jsx";
import { Component } from "react";

// Simple Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h2>Something went wrong</h2>
          <pre style={{ color: 'red', fontSize: '12px', overflow: 'auto', maxWidth: '90%' }}>
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <RootLayout>
        <RootProvider>
          <RouterProvider router={router} />
        </RootProvider>
      </RootLayout>
    </ErrorBoundary>
  );
}

export default App;
