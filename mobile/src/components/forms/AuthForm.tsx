/**
 * ARCHIVO: AuthForm.tsx
 * UBICACIÓN: mobile/src/components/forms/AuthForm.tsx
 * FUNCIÓN: Formulario genérico para campos de autenticación con validación y envío asincrónico.
 * RESPONSABILIDAD: Compartir disposición, foco de primer campo inválido y estados de envío entre login, registro y OAuth.
 * CONEXIONES: Importa: mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/utils/auth-validation.ts Se utiliza desde: mobile/src/app/login.tsx, mobile/src/app/register.tsx, mobile/src/components/forms/OAuthRegistrationModal.tsx
 * FUNCIONAMIENTO: Recibe definición de campos, valores, validador y onSubmit; enfoca el primer error y ejecuta la acción protegida por useAsyncAction.
 * IMPORTANCIA: Reduce duplicación de formularios manteniendo la validación de dominio en cada pantalla.
 */
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
  key: keyof T; label: string; hint?: string; password?: boolean; icon?: 'mail-outline' | 'lock-closed-outline' | 'call-outline';
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

/** Renderiza campos configurables y administra errores de validación y envío. */
export function AuthForm<T extends Record<string, string>>({ fields, initialValues, validate, onSubmit, submitLabel, loadingLabel, secondaryAction, compact = false, centerSubmitButton = false, dense = false, disabled = false }: AuthFormProps<T>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const inputs = useRef<Partial<Record<keyof T, ComponentRef<typeof TextInput> | null>>>({});
  const action = useAsyncAction();
  /** Valida, enfoca el primer campo incorrecto y ejecuta onSubmit con el estado ocupado. */
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
