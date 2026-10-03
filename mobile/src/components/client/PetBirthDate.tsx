import { useState } from 'react';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { AppModal } from '../ui/AppModal';
import { useTheme } from '../../hooks/useTheme';
import { dateFromApi,dateToApi,displayPetDate } from '../../utils/pet-date';
export function PetBirthDate({value,disabled,onChange}:{value:string;disabled:boolean;onChange:(value:string)=>void}) {
  const [open,setOpen]=useState(false);const [draft,setDraft]=useState(new Date());const {mode,colors}=useTheme();
  const picker=<DateTimePicker value={draft} maximumDate={new Date()} mode="date" display={Platform.OS==='android'?'calendar':'spinner'} locale="es-AR" themeVariant={mode} textColor={colors.text}
    onDismiss={()=>setOpen(false)} onValueChange={(_event,date)=>{setDraft(date);if(Platform.OS==='android'){onChange(dateToApi(date));setOpen(false);}}}/>;
  return <><AppText>Fecha de nacimiento (opcional)</AppText>
    <AppButton variant="secondary" label={`${displayPetDate(value)||'Seleccionar fecha'}  📅`} disabled={disabled} onPress={()=>{setDraft(value?dateFromApi(value):new Date());setOpen(true);}}/>
    {Boolean(value)&&<AppButton compact variant="secondary" label="Quitar fecha" disabled={disabled} onPress={()=>onChange('')}/>}
    {open&&(Platform.OS==='android'?picker:<AppModal visible dismissible onClose={()=>setOpen(false)}>{picker}<AppButton label="Listo" onPress={()=>{onChange(dateToApi(draft));setOpen(false);}}/></AppModal>)}
  </>;
}
