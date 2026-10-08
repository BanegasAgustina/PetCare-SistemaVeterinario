/** Calendario web sin ingreso manual ni módulos nativos. */
import { useState } from 'react';
import { Pressable,View } from 'react-native';
import { AppModal } from '../ui/AppModal';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';
import { dateFromApi,dateToApi,displayPetDate } from '../../utils/pet-date';
export function PetBirthDate({value,disabled,onChange}:{value:string;disabled:boolean;onChange:(value:string)=>void}) {
  const [open,setOpen]=useState(false);const [month,setMonth]=useState(new Date());const {colors}=useTheme();
  const days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();const offset=new Date(month.getFullYear(),month.getMonth(),1).getDay();
  function move(delta:number){setMonth(new Date(month.getFullYear(),month.getMonth()+delta,1));}
  return <><AppText>Fecha de nacimiento (opcional)</AppText><AppButton variant="secondary" label={`${displayPetDate(value)||'Seleccionar fecha'}  📅`} disabled={disabled} onPress={()=>{setMonth(value?dateFromApi(value):new Date());setOpen(true);}}/>
    {Boolean(value)&&<AppButton compact variant="secondary" label="Quitar fecha" disabled={disabled} onPress={()=>onChange('')}/>}
    <AppModal visible={open} dismissible onClose={()=>setOpen(false)}><AppText variant="subtitle">{month.toLocaleDateString('es-AR',{month:'long',year:'numeric'})}</AppText>
      <AppButton variant="secondary" label="Mes anterior" onPress={()=>move(-1)}/><AppButton variant="secondary" label="Mes siguiente" disabled={month.getFullYear()===new Date().getFullYear()&&month.getMonth()===new Date().getMonth()} onPress={()=>move(1)}/>
      <View style={{flexDirection:'row',flexWrap:'wrap'}}>{Array.from({length:offset+days},(_,index)=>{
        const day=index-offset+1;if(day<1)return <View key={index} style={{width:'14.28%'}}/>;
        const date=dateToApi(new Date(month.getFullYear(),month.getMonth(),day));const future=date>dateToApi(new Date());
        return <Pressable key={index} accessibilityRole="button" accessibilityLabel={displayPetDate(date)} accessibilityState={{disabled:future,selected:value===date}} disabled={future} onPress={()=>{onChange(date);setOpen(false);}} style={{width:'14.28%',minHeight:48,alignItems:'center',justifyContent:'center',opacity:future?0.3:1,backgroundColor:value===date?colors.accent:colors.surface}}><AppText>{day}</AppText></Pressable>;
      })}</View><AppButton variant="secondary" label="Cerrar" onPress={()=>setOpen(false)}/></AppModal>
  </>;
}
