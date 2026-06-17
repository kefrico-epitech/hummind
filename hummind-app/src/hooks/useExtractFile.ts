"use client";

import { useCallback, useMemo, useRef, useState } from "react";

type ExtractResult = {
  content?: string;
  error?: string;
};

export function useExtractFile(options?: {
  endpoint?: string;
  onSuccess?: (content: string) => void;
  onError?: (message: string) => void;
}) {
  const endpoint = options?.endpoint ?? "/api/extract-file";
  const onSuccessRef = useRef(options?.onSuccess);
  const onErrorRef = useRef(options?.onError);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);

  onSuccessRef.current = options?.onSuccess;
  onErrorRef.current = options?.onError;

  const startFakeProgress = () => {
    setProgress(0);
    if (intervalRef.current) window.clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      setProgress((currentProgress) =>
        currentProgress >= 95 ? currentProgress : currentProgress + 5,
      );
    }, 200);
  };

  const stopFakeProgress = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const extract = useCallback(
    async (file: File) => {
      if (!file) return;

      setLoading(true);
      setError(null);
      startFakeProgress();

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        let data: ExtractResult | null = null;
        try {
          data = (await response.json()) as ExtractResult;
        } catch {
          data = null;
        }

        if (!response.ok) {
          const message =
            data?.error || `Extraction echouee (HTTP ${response.status})`;
          setError(message);
          onErrorRef.current?.(message);
          return;
        }

        if (data?.content) {
          setProgress(100);
          onSuccessRef.current?.(data.content);
        } else {
          const message = data?.error || "Aucun contenu extrait.";
          setError(message);
          onErrorRef.current?.(message);
        }
      } finally {
        stopFakeProgress();
        window.setTimeout(() => setLoading(false), 400);
      }
    },
    [endpoint],
  );

  const reset = useCallback(() => {
    stopFakeProgress();
    setLoading(false);
    setProgress(0);
    setError(null);
  }, []);

  return useMemo(
    () => ({ loading, progress, error, extract, reset }),
    [loading, progress, error, extract, reset],
  );
}
