// Placeholder for use-csv-upload hook
export function useCSVUpload() {
  return {
    isParsing: false,
    error: null as string | null,
    processFile: async (_file: File) => {},
    loadDemoData: async () => {},
  };
}
