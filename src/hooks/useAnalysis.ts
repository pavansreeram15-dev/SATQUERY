import { useState, useCallback } from 'react';
import { analysisApi } from '../services/analysisApi';
import { QueryRequest, QueryResponse, ComparisonResponse } from '../types';

export function useAnalysis() {
  const [currentResult, setCurrentResult] = useState<QueryResponse | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async (req: QueryRequest) => {
    setIsExecuting(true);
    setError(null);
    try {
      const res = await analysisApi.executeQuery(req);
      setCurrentResult(res);
      if (res.comparison_data) {
        setComparisonResult(res.comparison_data);
      }
      return res;
    } catch (err: any) {
      const msg = err.message || 'Geospatial query execution failed';
      setError(msg);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setCurrentResult(null);
    setComparisonResult(null);
    setError(null);
  }, []);

  return {
    currentResult,
    comparisonResult,
    isExecuting,
    error,
    executeQuery,
    clearResult,
    setCurrentResult,
  };
}
