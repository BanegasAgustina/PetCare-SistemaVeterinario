/**
 * ARCHIVO: ClinicTimeField.web.tsx
 * UBICACIÓN: mobile/src/components/forms/ClinicTimeField.web.tsx
 * FUNCIÓN: Selector de hora basado en entrada web.
 * RESPONSABILIDAD: Ofrecer una edición de hora compatible con navegador con el contrato del campo nativo.
 * CONEXIONES: Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Lee y escribe el formato HH:mm y aplica disabled antes de informar cambios.
 * IMPORTANCIA: La resolución de plataforma usa esta versión en web.
 */
import { createElement } from 'react';
import { View } from 'react-native';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';

// Tipo Props: define la forma o las opciones válidas de los datos usados por este módulo.
type Props = { label: string; value: string; onChange: (value: string) => void; disabled?: boolean };

/** Usa el selector horario del navegador para evitar escribir horas a mano. */
/** Presenta la entrada HTML de hora y comunica el valor HH:mm al padre. */
export function ClinicTimeField({ label, value, onChange, disabled = false }: Props) {
  const { colors } = useTheme();
  return <View style={{ gap: 8 }}>
    <AppText>{label}</AppText>
    {createElement('input', { type: 'time', value, disabled, 'aria-label': label, onChange: (event: { target: { value: string } }) => onChange(event.target.value), style: { minHeight: 48, width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '10px 12px', color: colors.text, background: colors.surface, font: 'inherit' } })}
  </View>;
}
