export type ActionState<T = Record<string, unknown>> = {
  error?: string;
  success?: string;
  fields: Partial<T>;
};

export function actionError<T>(
  error: string,
  fields?: Partial<T>,
): ActionState<T> {
  return {
    error,
    fields: fields || {},
  };
}
