import React from 'react';
import { Button } from './Button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ChartErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
          <div className="p-4 mb-4 text-red-400 bg-red-900 border border-red-700 rounded-lg">
            <p className="font-bold">오류 발생</p>
            <p>{this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}</p>
          </div>
          <Button variant="primary" onClick={this.handleRetry}>
            다시 시도
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
