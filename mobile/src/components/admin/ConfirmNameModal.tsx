/**
 * ARCHIVO: ConfirmNameModal.tsx
 * UBICACIÓN: mobile/src/components/admin/ConfirmNameModal.tsx
 * FUNCIÓN: Modal de confirmación reforzada que exige volver a escribir un nombre esperado.
 * RESPONSABILIDAD: Prevenir confirmaciones accidentales para acciones administrativas sensibles.
 * CONEXIONES: Importa: mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/utils/exact-name-confirmation.ts Se utiliza desde: mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx
 * FUNCIONAMIENTO: Compara la entrada normalizada con expectedName y solo entonces permite ejecutar onConfirm con useAsyncAction.
 * IMPORTANCIA: Agrega una comprobación explícita para bajas o cambios de impacto.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { AppModal } from '../ui/AppModal';
import { AppText } from '../ui/AppText';
import { AppInput } from '../forms/AppInput';
import { AppButton } from '../ui/AppButton';
import { FormNotice } from '../ui/FormNotice';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { matchesExactConfirmation } from '../../utils/exact-name-confirmation';

// Tipo Props: define la forma o las opciones válidas de los datos usados por este módulo.
type Props={visible:boolean;title:string;message:string;expectedName:string;identityHint?:string;confirmLabel:string;onCancel:()=>void;onConfirm:()=>Promise<void>};
/** Destructive confirmation shared across the responsive web and Android screens. */
/** Mantiene la confirmación bloqueada hasta validar el nombre requerido. */
export function ConfirmNameModal({visible,title,message,expectedName,identityHint,confirmLabel,onCancel,onConfirm}:Props){
  const action=useAsyncAction();
  /** Limpia el error de la acción y cierra el diálogo de confirmación. */
const cancel=()=>{action.clearError();onCancel();};
  return <AppModal visible={visible} dismissible={!action.loading} onClose={cancel}>
    {visible&&<ConfirmNameContent key={expectedName} title={title} message={message} expectedName={expectedName} identityHint={identityHint} confirmLabel={confirmLabel} loading={action.loading} error={action.error} onCancel={cancel} onConfirm={()=>void action.run(onConfirm)}/>}
  </AppModal>;
}

// Tipo ContentProps: define la forma o las opciones válidas de los datos usados por este módulo.
type ContentProps=Omit<Props,'visible'|'onConfirm'>&{loading:boolean;error:string|null;onConfirm:()=>void};
/** Presenta el mensaje, entrada de confirmación y botón de acción protegido. */
function ConfirmNameContent({title,message,expectedName,identityHint,confirmLabel,loading,error,onCancel,onConfirm}:ContentProps){
  const [entered,setEntered]=useState('');const matches=matchesExactConfirmation(expectedName,entered);
  return <>
    <AppText variant="subtitle" accessibilityRole="header">{title}</AppText>
    <AppText muted>{message}</AppText>
    {identityHint&&<AppText variant="caption" muted>{identityHint}</AppText>}
    <AppText>Escribí exactamente: <AppText style={{fontWeight:'700'}}>{expectedName}</AppText></AppText>
    <AppInput label="Confirmar nombre" value={entered} editable={!loading} autoCapitalize="none" autoCorrect={false} returnKeyType="done" onChangeText={setEntered} />
    <FormNotice error message={error}/>
    <View style={{flexDirection:'row',justifyContent:'flex-end',flexWrap:'wrap',gap:10}}>
      <AppButton compact label={loading?'Procesando…':confirmLabel} destructive loading={loading} disabled={!matches||loading} onPress={onConfirm}/>
      <AppButton compact label="Cancelar" variant="secondary" disabled={loading} onPress={onCancel}/>
    </View>
  </>;
}
