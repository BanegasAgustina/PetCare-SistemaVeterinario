// Este archivo se encarga de lo siguiente: Componente reutilizable del área administrativa; organiza formularios, listas o controles de gestión.

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
// Función ConfirmNameModal: concentra la lógica dentro de este módulo.
export function ConfirmNameModal({visible,title,message,expectedName,identityHint,confirmLabel,onCancel,onConfirm}:Props){
  const action=useAsyncAction();
  // Función cancel: agrupa una operación que este módulo puede ejecutar o reutilizar.
const cancel=()=>{action.clearError();onCancel();};
  return <AppModal visible={visible} dismissible={!action.loading} onClose={cancel}>
    {visible&&<ConfirmNameContent key={expectedName} title={title} message={message} expectedName={expectedName} identityHint={identityHint} confirmLabel={confirmLabel} loading={action.loading} error={action.error} onCancel={cancel} onConfirm={()=>void action.run(onConfirm)}/>}
  </AppModal>;
}

// Tipo ContentProps: define la forma o las opciones válidas de los datos usados por este módulo.
type ContentProps=Omit<Props,'visible'|'onConfirm'>&{loading:boolean;error:string|null;onConfirm:()=>void};
// Función ConfirmNameContent: concentra la lógica dentro de este módulo.
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
