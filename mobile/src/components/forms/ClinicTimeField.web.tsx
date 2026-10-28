// Este archivo se encarga de lo siguiente: Control de formulario reutilizable; captura o valida datos ingresados en la aplicación.

import { createElement } from 'react';
import { View } from 'react-native';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';

// Tipo Props: define la forma o las opciones válidas de los datos usados por este módulo.
type Props = { label: string; value: string; onChange: (value: string) => void; disabled?: boolean };

/** Usa el selector horario del navegador para evitar escribir horas a mano. */
// Función ClinicTimeField: concentra la lógica dentro de este módulo.
export function ClinicTimeField({ label, value, onChange, disabled = false }: Props) {
  const { colors } = useTheme();
  return <View style={{ gap: 8 }}>
    <AppText>{label}</AppText>
    {createElement('input', { type: 'time', value, disabled, 'aria-label': label, onChange: (event: { target: { value: string } }) => onChange(event.target.value), style: { minHeight: 48, width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '10px 12px', color: colors.text, background: colors.surface, font: 'inherit' } })}
  </View>;
}
