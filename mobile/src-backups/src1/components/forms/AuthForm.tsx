/** Motor pequeño de formularios: errores por campo, foco siguiente y un único envío activo. */
import { useRef, useState, type ReactNode } from 'react';
import { Keyboard, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppInput } from './AppInput';
import { AppButton } from '../ui/AppButton';
import { FormNotice } from '../ui/FormNotice';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import type { FieldErrors } from '../../utils/auth-validation';

export type AuthField<T> = {
  key: keyof T; label: string; hint?: string; password?: boolean; icon?: 'mail-outline' | 'lock-closed-outline';
  inputProps?: Pick<TextInputProps, 'keyboardType' | 'autoComplete' | 'textContentType' | 'autoCapitalize' | 'placeholder' | 'maxLength' | 'autoCorrect'>;
};
type AuthFormProps<T extends Record<string, string>> = {
  fields: AuthField<T>[]; initialValues: T; validate: (values: T) => FieldErrors<T>;
  onSubmit: (values: T) => Promise<void>; submitLabel: string; loadingLabel: string;
  secondaryAction?: (loading: boolean) => ReactNode;
  compact?: boolean;
  /** Solo Login de poca altura; Registro mantiene sus medidas predeterminadas. */
  dense?: boolean;
};

export function AuthForm<T extends Record<string, string>>({ fields, initialValues, validate, onSubmit, submitLabel, loadingLabel, secondaryAction, compact = false, dense = false }: AuthFormProps<T>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const inputs = useRef<Partial<Record<keyof T, TextInput | null>>>({});
  const action = useAsyncAction();
  const submit = async () => {
    if (action.loading) return;
    const nextErrors = validate(values);
    setErrors(nextErrors);
    const firstInvalid = fields.find((field) => nextErrors[field.key]);
    if (firstInvalid) { inputs.current[firstInvalid.key]?.focus(); return; }
    await action.run(async () => {
      // Cerrar el teclado del formulario antes de abrir el modal permite enfocar su código.
      Keyboard.dismiss(); await onSubmit(values);
      setValues(previous => {
        const next = { ...previous };
        for (const field of fields) if (field.password) next[field.key] = '' as T[keyof T];
        return next;
      });
    });
  };
  return <View style={[styles.form, compact && styles.compact, dense && { gap: 4 }]}>
    {fields.map((field, index) => <AppInput key={String(field.key)} {...field.inputProps}
      ref={(input) => { inputs.current[field.key] = input; }} label={field.label} hint={field.hint} password={field.password} icon={field.icon} compact={dense}
      value={values[field.key]} error={errors[field.key]} editable={!action.loading}
      returnKeyType={index === fields.length - 1 ? 'done' : 'next'}
      onSubmitEditing={() => index === fields.length - 1 ? void submit() : inputs.current[fields[index + 1].key]?.focus()}
      onChangeText={(value) => { setValues((previous) => ({ ...previous, [field.key]: value })); setErrors((previous) => ({ ...previous, [field.key]: undefined })); action.clearError(); }} />)}
    {/* El Login puede insertar recuperación; validación, foco y envío siguen compartidos. */}
    {secondaryAction?.(action.loading)}
    <FormNotice message={action.error} error />
    <AppButton compact={dense} label={action.loading ? loadingLabel : submitLabel} loading={action.loading} onPress={() => void submit()} />
  </View>;
}
const styles = StyleSheet.create({ form: { width: '100%', gap: 18 }, compact: { gap: 12 } });
