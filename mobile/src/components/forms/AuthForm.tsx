// Este archivo se encarga de lo siguiente: Control de formulario reutilizable; captura o valida datos ingresados en la aplicación.

/** Motor pequeño de formularios: errores por campo, foco siguiente y un único envío activo. */
import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Keyboard, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppInput } from './AppInput';
import { AppButton } from '../ui/AppButton';
import { FormNotice } from '../ui/FormNotice';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { firstInvalidField, type FieldErrors } from '../../utils/auth-validation';

// Tipo AuthField: define la forma o las opciones válidas de los datos usados por este módulo.
export type AuthField<T> = {
  key: keyof T; label: string; hint?: string; password?: boolean; icon?: 'mail-outline' | 'lock-closed-outline';
  inputProps?: Pick<TextInputProps, 'keyboardType' | 'autoComplete' | 'textContentType' | 'autoCapitalize' | 'placeholder' | 'maxLength' | 'autoCorrect'>;
};
// Tipo AuthFormProps: define la forma o las opciones válidas de los datos usados por este módulo.
type AuthFormProps<T extends Record<string, string>> = {
  fields: AuthField<T>[]; initialValues: T; validate: (values: T) => FieldErrors<T>;
  onSubmit: (values: T) => Promise<void>; submitLabel: string; loadingLabel: string;
  secondaryAction?: (loading: boolean) => ReactNode;
  compact?: boolean;
  centerSubmitButton?: boolean;
  /** Solo Login de poca altura; Registro mantiene sus medidas predeterminadas. */
  dense?: boolean;
  disabled?: boolean;
};

// Función AuthForm: concentra la lógica dentro de este módulo.
export function AuthForm<T extends Record<string, string>>({ fields, initialValues, validate, onSubmit, submitLabel, loadingLabel, secondaryAction, compact = false, centerSubmitButton = false, dense = false, disabled = false }: AuthFormProps<T>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const inputs = useRef<Partial<Record<keyof T, ComponentRef<typeof TextInput> | null>>>({});
  const action = useAsyncAction();
  // Función submit: agrupa una operación que este módulo puede ejecutar o reutilizar.
const submit = async () => {
    if (action.loading||disabled) return;
    const nextErrors = validate(values);
    setErrors(nextErrors);
    const firstInvalid = firstInvalidField(fields.map(field => field.key), nextErrors);
    if (firstInvalid) { inputs.current[firstInvalid]?.focus(); return; }
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
      value={values[field.key]} error={errors[field.key]} editable={!action.loading&&!disabled}
      returnKeyType={index === fields.length - 1 ? 'done' : 'next'}
      onSubmitEditing={() => index === fields.length - 1 ? void submit() : inputs.current[fields[index + 1].key]?.focus()}
      onChangeText={(value) => { setValues((previous) => ({ ...previous, [field.key]: value })); setErrors((previous) => ({ ...previous, [field.key]: undefined })); action.clearError(); }} />)}
    {/* El Login puede insertar recuperación; validación, foco y envío siguen compartidos. */}
    {secondaryAction?.(action.loading||disabled)}
    <FormNotice message={action.error} error />
    <AppButton compact={dense} centered={centerSubmitButton} label={action.loading ? loadingLabel : submitLabel} loading={action.loading} disabled={disabled} onPress={() => void submit()} />
  </View>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ form: { width: '100%', gap: 18 }, compact: { gap: 12 } });
