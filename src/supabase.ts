export const supabase = {} as any;

export const handleSupabaseError = (error: any, context: string) => {
  console.error(`AWS Database Error at ${context}:`, error);
  alert(`Error (${context}): ${error.message || 'Error desconocido'}`);
};
