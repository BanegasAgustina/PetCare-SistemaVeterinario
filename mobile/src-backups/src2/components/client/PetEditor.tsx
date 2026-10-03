import { useCallback,useState } from 'react';
import { router } from 'expo-router';
import { useClient } from '../../hooks/useClient';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFeedback } from '../../contexts/FeedbackContext';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareEmptyState,QueryState } from './PetCareUI';
import { AppInput } from '../forms/AppInput';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { FormNotice } from '../ui/FormNotice';
import { SelectionRow } from '../ui/SelectionRow';
import type { PetValues } from '../../types/client';
const empty:PetValues={name:'',speciesId:'',breedId:'',birthDate:'',microchipNumber:'',photoUrl:'',weightKg:''};
export function PetEditor({id}:{id?:string}){const api=useClient();const action=useAsyncAction();const {showToast}=useFeedback();
  const [values,setValues]=useState<PetValues>(empty);const [errors,setErrors]=useState<Partial<Record<keyof PetValues,string>>>({});
  const load=useCallback(async()=>{const catalog=await api.petCatalog();const p=id?await api.pet(id):null;if(p)setValues({name:p.name,speciesId:p.speciesId,breedId:p.breedId??'',birthDate:p.birthDate??'',microchipNumber:p.microchipNumber??'',photoUrl:p.photoUrl??'',weightKg:p.weightKg??''});return {catalog,pet:p};},[api,id]);const query=useClientQuery(load);
  function change(key:keyof PetValues,value:string){setValues(v=>({...v,[key]:value,...(key==='speciesId'?{breedId:''}:{})}));setErrors(e=>({...e,[key]:undefined}));}
  function save(){const next:typeof errors={};if(!values.name.trim()||values.name.trim().length>100)next.name='Ingresá un nombre de hasta 100 caracteres.';if(!values.speciesId)next.speciesId='Seleccioná una especie.';
    if(values.birthDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(values.birthDate)||!Number.isFinite(Date.parse(values.birthDate))||new Date(values.birthDate).toISOString().slice(0,10)!==values.birthDate||values.birthDate>new Date().toISOString().slice(0,10)))next.birthDate='Ingresá una fecha válida, sin fechas futuras.';
    if(values.weightKg&&(!/^\d+(\.\d{1,2})?$/.test(values.weightKg)||Number(values.weightKg)<=0||Number(values.weightKg)>9999.99))next.weightKg='Ingresá un peso válido con hasta dos decimales.';
    if(values.photoUrl){try{const u=new URL(values.photoUrl);if(u.protocol!=='https:'||u.username||u.password)next.photoUrl='Usá una URL HTTPS de la foto real.';}catch{next.photoUrl='Usá una URL HTTPS de la foto real.';}}
    setErrors(next);if(Object.keys(next).length)return;
    void action.run(async()=>{const pet=await api.savePet(values,id);showToast(id?'Mascota actualizada':'Mascota agregada','success');router.replace({pathname:'/client/pets/[id]',params:{id:pet.id}});});
  }
  return <PetCareScreen><PetCareHeader title={id?'Editar mascota':'Agregar mascota'} back/><QueryState {...query}/>{query.data&&<>
    {!query.data.catalog.species.length?<PetCareEmptyState title="No hay especies disponibles" message="El catálogo debe ser configurado por la clínica antes de registrar una mascota."/>:<>
      <PetCareCard><AppInput label="Nombre" value={values.name} error={errors.name} maxLength={100} editable={!action.loading} onChangeText={v=>change('name',v)}/><AppText variant="subtitle">Especie</AppText><FormNotice error message={errors.speciesId??null}/>{query.data.catalog.species.map(s=><SelectionRow key={s.id} label={s.name} checked={s.id===values.speciesId} disabled={action.loading} onPress={()=>change('speciesId',s.id)}/>)}
      {Boolean(values.speciesId)&&<><AppText variant="subtitle">Raza (opcional)</AppText><SelectionRow label="Sin raza registrada" checked={!values.breedId} disabled={action.loading} onPress={()=>change('breedId','')}/>{query.data.catalog.breeds.filter(b=>b.speciesId===values.speciesId).map(b=><SelectionRow key={b.id} label={b.name} checked={b.id===values.breedId} disabled={action.loading} onPress={()=>change('breedId',b.id)}/>)}</>}
      <AppInput label="Nacimiento (AAAA-MM-DD, opcional)" value={values.birthDate} error={errors.birthDate} maxLength={10} editable={!action.loading} onChangeText={v=>change('birthDate',v)}/>
      <AppInput label="Peso en kg (opcional)" value={values.weightKg} error={errors.weightKg} keyboardType="decimal-pad" editable={!action.loading} onChangeText={v=>change('weightKg',v.replace(',','.'))}/>
      <AppInput label="Microchip (opcional)" value={values.microchipNumber} maxLength={32} editable={!action.loading} onChangeText={v=>change('microchipNumber',v)}/>
      <AppInput label="URL HTTPS de su foto (opcional)" value={values.photoUrl} error={errors.photoUrl} maxLength={2048} autoCapitalize="none" editable={!action.loading} onChangeText={v=>change('photoUrl',v)}/></PetCareCard>
      <FormNotice error message={action.error}/><AppButton label="Guardar mascota" loading={action.loading} onPress={save}/>
    </>}
  </>}</PetCareScreen>;
}
