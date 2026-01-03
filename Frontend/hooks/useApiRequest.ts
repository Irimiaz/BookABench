// src/hooks/useApiRequest.ts
import { useState, useCallback } from "react";
import { apiClient } from "../api/client";
import { AxiosError } from "axios";
import { RequestBuilder } from "../api/requestBuilder";

type State = {
  status: "idle" | "inProgress" | "done" | "error";
  error: AxiosError | null;
};

export function useApiRequest() {
  const [state, setState] = useState<State>({
    status: "idle",
    error: null,
  });
  const [data, setData] = useState<any>(null);

  // 1️⃣ core send fn:
  const send = useCallback(
    async <T = any>(
      entity: string,
      params: Record<string, any>
    ): Promise<T> => {
      setState({ status: "inProgress", error: null });
      try {
        const result = await apiClient.request<T>(entity, params);
        setData(result);
        setState({ status: "done", error: null });
        // Log the average after each request

        return result;
      } catch (err) {
        setState({ status: "error", error: err as AxiosError });
        throw err;
      }
    },
    []
  );

  // 2️⃣ reset everything
  const resetStatus = useCallback(() => {
    setData(null);
    setState({ status: "idle", error: null });
  }, []);

  // 3️⃣ factory for builders tied to this send()
  const createBuilder = useCallback(
    <T = any>(entity: string) => new RequestBuilder<T>(entity, send),
    [send]
  );

  return {
    send,
    status: state.status,
    data,
    error: state.error,
    resetStatus,
    createBuilder,
  };
}
