import { useApiRequest } from "./useApiRequest";

export const useCreateBuilders = () => {
  const { createBuilder } = useApiRequest();

  const crawlerBuilder = createBuilder<any>("SCRAPE_WEBSITE");

  return {
    crawlerBuilder,
  };
};
