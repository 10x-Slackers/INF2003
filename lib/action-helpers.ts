export type ActionState<T = Record<string, unknown>> = {
  fields?: Partial<T>;
  fieldErrors?: Partial<Record<keyof T, string[]>>;
  formError?: string;
  success: boolean;
};

export function actionError<T>(
  error: string,
  fields?: Partial<T>,
): ActionState<T> {
  return {
    fields,
    fieldErrors: {},
    formError: error,
    success: false,
  };
}

export function actionSuccess<T>(fields?: Partial<T>): ActionState<T> {
  return {
    fields,
    fieldErrors: {},
    formError: undefined,
    success: true,
  };
}

export function fieldError<T>(
  fieldErrors: Partial<Record<keyof T, string[]>>,
  fields?: Partial<T>,
): ActionState<T> {
  return {
    fields,
    fieldErrors,
    formError: undefined,
    success: false,
  };
}
