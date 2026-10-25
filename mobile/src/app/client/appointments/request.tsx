/** Asistente de solicitud de turnos. Solo presenta servicios, mascotas y slots reales del backend. */
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useTheme } from '../../../hooks/useTheme';
import { PetCareCard, PetCareEmptyState, PetCareHeader, PetCareScreen, PetImage, QueryState, money, type IconName } from '../../../components/client/PetCareUI';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { FormNotice } from '../../../components/ui/FormNotice';
import { SelectionRow } from '../../../components/ui/SelectionRow';
import { clinicDate, clinicDateFilterToApi, clinicDateTime } from '../../../utils/clinic-date';
import type { AppointmentCatalog, Pet, Slot } from '../../../types/client';

const stepTitles = ['Mascota', 'Servicio', 'Profesional', 'Fecha y horario', 'Confirmación'];
type Submission = { id: string; status: 'REQUESTED' | 'CONFIRMED' };

export default function RequestAppointment() {
  const api = useClient();
  const action = useAsyncAction();
  const [step, setStep] = useState(1);
  const [typeId, setTypeId] = useState('');
  const [petId, setPetId] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [vetId, setVetId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [slotId, setSlotId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);

  const query = useClientQuery(useCallback(async () => ({ pets: await api.pets(), catalog: await api.appointmentCatalog() }), [api]));
  const slots = useClientQuery(useCallback(
    () => step >= 4 && serviceId ? api.slots(serviceId, vetId || undefined) : Promise.resolve(null),
    [api, step, serviceId, vetId],
  ));
  const data = query.data;
  const types = data?.catalog.types ?? [];
  const services = data?.catalog.services ?? [];
  const availableTypes = types.filter(type => services.some(service => service.typeId === type.id));
  const selectedType = types.find(type => type.id === typeId);
  const typeServices = services.filter(service => service.typeId === typeId);
  const specialties = (data?.catalog.specialties ?? []).filter(specialty => typeServices.some(service => service.specialtyId === specialty.id));
  const filteredServices = typeServices.filter(service => !specialtyId || service.specialtyId === specialtyId);
  const selectedService = services.find(service => service.id === serviceId);
  const selectedPet = data?.pets.find(pet => pet.id === petId);
  const availableSlots = slots.data ?? [];
  const selectedSlot = availableSlots.find(slot => slot.id === slotId);
  const dates = [...new Set(availableSlots.map(slot => clinicDateFilterToApi(clinicDate(slot.startsAt))))].sort();
  const activeDate = dates.includes(selectedDate) ? selectedDate : '';
  const dateSlots = activeDate ? availableSlots.filter(slot => clinicDateFilterToApi(clinicDate(slot.startsAt)) === activeDate) : [];
  const professionals = (data?.catalog.veterinarians ?? []).filter(professional =>
    Boolean(professional.isActive) && data?.catalog.assignments.some(assignment => assignment.professionalId === professional.id && assignment.serviceId === serviceId),
  );

  function clearLaterSelections() {
    setVetId('');
    setSelectedDate('');
    setSlotId('');
  }

  function chooseType(id: string) {
    if (id === typeId) return;
    setTypeId(id);
    setSpecialtyId('');
    setServiceId('');
    clearLaterSelections();
    setFormError(null);
    action.clearError();
  }

  function chooseSpecialty(id: string) {
    if (id === specialtyId) return;
    setSpecialtyId(id);
    setServiceId('');
    clearLaterSelections();
    setFormError(null);
    action.clearError();
  }

  function chooseService(id: string) {
    if (id === serviceId) return;
    setServiceId(id);
    clearLaterSelections();
    setFormError(null);
    action.clearError();
  }

  function chooseProfessional(id: string) {
    if (id === vetId) return;
    setVetId(id);
    setSelectedDate('');
    setSlotId('');
    setFormError(null);
    action.clearError();
  }

  function continueStep() {
    setFormError(null);
    if (step === 1 && !data?.pets.some(pet => pet.id === petId)) {
      setFormError('Elegí la mascota que necesita atención.');
      return;
    }
    if (step === 2 && (!availableTypes.some(type => type.id === typeId) || !filteredServices.some(service => service.id === serviceId))) {
      setFormError('Elegí el tipo de atención y uno de sus servicios.');
      return;
    }
    if (step === 3 && vetId && !professionals.some(professional => professional.id === vetId)) {
      setFormError('Elegí un profesional disponible o seleccioná cualquiera.');
      return;
    }
    if (step === 4 && !selectedSlot) {
      setFormError('Elegí una fecha y un horario disponible.');
      return;
    }
    setStep(current => Math.min(5, current + 1));
  }

  async function submitRequest() {
    if (!petId || !selectedSlot || !serviceId) {
      setFormError('Revisá la mascota, el servicio y el horario antes de enviar.');
      setStep(!petId ? 1 : !serviceId ? 2 : 4);
      return;
    }
    setFormError(null);
    const response: { value: Submission | null } = { value: null };
    const sent = await action.run(async () => { response.value = await api.requestAppointment(petId, selectedSlot.id); });
    if (sent && response.value) setSubmission(response.value);
  }

  if (submission) {
    const pending = submission.status === 'REQUESTED';
    return <PetCareScreen>
      <PetCareHeader title={pending ? 'Solicitud enviada' : 'Turno confirmado'} back />
      <PetCareCard>
        <View style={styles.resultIcon}><Ionicons name={pending ? 'time-outline' : 'checkmark-circle-outline'} size={36} color="#28795D" /></View>
        <AppText variant="subtitle">{pending ? 'Pendiente de confirmación' : 'Tu turno está confirmado'}</AppText>
        <AppText>{pending ? 'La clínica todavía debe confirmar esta solicitud.' : 'El turno quedó confirmado.'}</AppText>
        <AppText>Solicitud #{submission.id}</AppText>
        <AppButton label="Ver mis turnos" onPress={() => router.replace('/client/appointments')} />
        <AppButton label="Solicitar otro turno" variant="secondary" onPress={() => {
          setSubmission(null); setStep(1); setTypeId(''); setPetId(''); setSpecialtyId(''); setServiceId(''); clearLaterSelections();
        }} />
      </PetCareCard>
    </PetCareScreen>;
  }

  return <PetCareScreen>
    <PetCareHeader title="Solicitar un turno" subtitle="Te guiamos paso a paso para encontrar el turno que necesitás." back />
    <StepProgress step={step} />
    <AppText variant="subtitle">{stepTitles[step - 1]}</AppText>
    <SelectionSummary step={step} typeName={selectedType?.name} pet={selectedPet} serviceName={selectedService?.name} slot={selectedSlot} />
    <QueryState {...query} />
    {data && step === 1 && <>
      <AppText>¿A qué mascota vamos a atender?</AppText>
      {!data.pets.length ? <PetCareEmptyState
        title="Todavía no tenés mascotas registradas."
        message="Agregá una mascota para poder solicitar su turno."
        action={() => router.push('/client/pets/new')}
        label="Agregar mascota"
      /> : data.pets.map(pet => <PetChoice key={pet.id} pet={pet} selected={petId === pet.id} onPress={() => { setPetId(pet.id); setFormError(null); }} />)}
      {Boolean(data.pets.length) && <AppText muted>Una solicitud corresponde a una mascota. Si necesitás turnos para varias, enviá una solicitud por cada una.</AppText>}
      <StepHelp text={petId ? null : 'Elegí una mascota para continuar.'} />
    </>}

    {data && step === 2 && <>
      <AppText>¿Qué servicio necesitás?</AppText>
      <AppText muted>Elegí el tipo de atención y después el servicio.</AppText>
      {availableTypes.length ? <View style={styles.typeChoices}>{availableTypes.map(type => <ChoiceCard
        key={type.id}
        title={type.name}
        description={typeDescription(type)}
        icon={typeIcon(type)}
        selected={typeId === type.id}
        onPress={() => chooseType(type.id)}
      />)}</View> : <PetCareEmptyState title="No hay tipos de atención disponibles" message="La clínica todavía no ofrece servicios activos para solicitar un turno." icon="calendar-outline" />}
      {Boolean(typeId)&&<>
      {specialties.length > 0 && <PetCareCard>
        <AppText variant="subtitle">Especialidad (opcional)</AppText>
        <AppText muted>Podés elegir una para filtrar los servicios relacionados, o continuar sin filtro.</AppText>
        <SelectionRow radio label="Ver todos los servicios" checked={!specialtyId} disabled={action.loading} onPress={() => chooseSpecialty('')} />
        {specialties.map(specialty => <SelectionRow key={specialty.id} radio label={specialty.name} checked={specialtyId === specialty.id} disabled={action.loading} onPress={() => chooseSpecialty(specialty.id)} />)}
      </PetCareCard>}
      {filteredServices.length ? filteredServices.map(service => <ChoiceCard
        key={service.id}
        title={service.name}
        description={service.description || undefined}
        selected={serviceId === service.id}
        onPress={() => chooseService(service.id)}
        detail={[service.durationMinutes ? `${service.durationMinutes} min` : null, service.priceCents !== null && service.priceCents !== undefined ? money(Number(service.priceCents)) : null].filter(Boolean).join(' · ') || undefined}
      />) : <PetCareEmptyState title="No hay servicios disponibles" message="No encontramos servicios activos para esta opción. Volvé atrás para elegir otro tipo de atención." icon="medkit-outline" />}
      <StepHelp text={serviceId ? null : 'Elegí un servicio para continuar.'} />
      </>}
    </>}

    {data && step === 3 && <>
      <AppText>¿Tenés preferencia por un profesional?</AppText>
      <PetCareCard>
        <AppText variant="subtitle">Profesional</AppText>
        <AppText muted>Elegí a alguien o dejá que el sistema muestre todos los horarios disponibles para el servicio.</AppText>
        <SelectionRow radio label="Cualquier profesional disponible" checked={!vetId} disabled={action.loading} onPress={() => chooseProfessional('')} />
        {professionals.map(professional => <PetChoiceProfessional
          key={professional.id}
          name={professional.name}
          photoUrl={professional.profilePhotoUrl}
          specialties={professional.specialties}
          selected={vetId === professional.id}
          onPress={() => chooseProfessional(professional.id)}
        />)}
      </PetCareCard>
    </>}

    {data && step === 4 && <>
      <AppText>¿Cuándo querés venir?</AppText>
      <QueryState {...slots} />
      {slots.data && dates.length > 0 && <>
        <MonthCalendar dates={dates} selectedDate={activeDate} disabled={action.loading} onSelect={date=>{setSelectedDate(date);setSlotId('');setFormError(null);}} />
        <PetCareCard>
          <AppText variant="subtitle">Horarios disponibles</AppText>
          {!activeDate&&<AppText muted>Seleccioná un día disponible en el calendario.</AppText>}
          {dateSlots.map(slot => <SelectionRow key={slot.id} radio label={clinicDateTime(slot.startsAt)} hint={vetId ? undefined : slot.veterinarian} checked={slotId === slot.id} disabled={action.loading} onPress={() => { setSlotId(slot.id); setFormError(null); }} />)}
        </PetCareCard>
      </>}
      {slots.data && dates.length === 0 && <PetCareEmptyState title="No encontramos horarios disponibles para esta selección. Probá con otra fecha o profesional." message="Podés cambiar el profesional o elegir otro servicio." icon="time-outline" />}
      <StepHelp text={slotId ? null : 'Elegí una fecha y un horario para continuar.'} />
      {action.error?.includes('horario') && <AppButton label="Actualizar horarios" variant="secondary" onPress={() => { action.clearError(); slots.reload(); }} />}
    </>}

    {data && step === 5 && <>
      <AppText>Revisá los datos antes de enviar tu solicitud.</AppText>
      <PetCareCard>
        <AppText variant="subtitle">Resumen del turno</AppText>
      <SummaryLine label="Tipo de atención" value={selectedType?.name} />
        <SummaryLine label="Mascota" value={selectedPet?.name} />
        {selectedPet && <AppText muted>{[selectedPet.species, selectedPet.breed].filter(Boolean).join(' · ')}</AppText>}
        <SummaryLine label="Servicio" value={selectedService?.name} />
        {selectedService?.priceCents !== null && selectedService?.priceCents !== undefined && <SummaryLine label="Precio" value={money(Number(selectedService.priceCents))} />}
        <SummaryLine label="Profesional" value={selectedSlot?.veterinarian} />
        <SummaryLine label="Fecha y hora" value={selectedSlot ? `${weekday(clinicDateFilterToApi(clinicDate(selectedSlot.startsAt)))} · ${clinicDateTime(selectedSlot.startsAt)}` : undefined} />
      </PetCareCard>
      <FormNotice message="La solicitud quedará pendiente hasta que la clínica confirme el turno." />
    </>}

    <FormNotice error message={formError ?? action.error} />
    <View style={styles.actions}>
      {step > 1 && <AppButton label="Volver" variant="secondary" disabled={action.loading} onPress={() => { setFormError(null); action.clearError(); setStep(current => Math.max(1, current - 1)); }} />}
      {step < 5 ? <AppButton label="Continuar" disabled={action.loading || !canContinue(step, petId, data?.pets ?? [], serviceId, filteredServices, slotId, selectedSlot)} onPress={continueStep} /> : <AppButton label="Confirmar solicitud" loading={action.loading} onPress={() => void submitRequest()} />}
    </View>
  </PetCareScreen>;
}

function MonthCalendar({dates,selectedDate,disabled,onSelect}:{dates:string[];selectedDate:string;disabled:boolean;onSelect:(date:string)=>void}){
  const {colors}=useTheme();
  const [month,setMonth]=useState(()=>new Date());
  const sorted=[...dates].sort();
  const monthStart=new Date(month.getFullYear(),month.getMonth(),1);
  const monthKey=`${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}`;
  const availableInMonth=new Set(sorted.filter(date=>date.startsWith(monthKey)).map(date=>Number(date.slice(-2))));
  const leading=(monthStart.getDay()+6)%7;
  const days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  const minMonth=sorted[0]?.slice(0,7)??monthKey,maxMonth=sorted.at(-1)?.slice(0,7)??monthKey;
  const canPrevious=monthKey>minMonth,canNext=monthKey<maxMonth;
  const monthLabel=new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric'}).format(monthStart);
  const cells=Array.from({length:leading+days},(_,index)=>index<leading?null:index-leading+1);
  return <PetCareCard>
    <View style={styles.calendarHeading}><AppText variant="subtitle">Elegí una fecha</AppText><View style={styles.calendarNav}>
      <Pressable accessibilityRole="button" accessibilityLabel="Mes anterior" disabled={disabled||!canPrevious} onPress={()=>setMonth(current=>new Date(current.getFullYear(),current.getMonth()-1,1))} style={[styles.calendarArrow,{backgroundColor:colors.accent,opacity:canPrevious?1:.4}]}><Ionicons name="chevron-back" size={19} color={colors.primary}/></Pressable>
      <AppText style={styles.calendarMonth}>{monthLabel}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel="Mes siguiente" disabled={disabled||!canNext} onPress={()=>setMonth(current=>new Date(current.getFullYear(),current.getMonth()+1,1))} style={[styles.calendarArrow,{backgroundColor:colors.accent,opacity:canNext?1:.4}]}><Ionicons name="chevron-forward" size={19} color={colors.primary}/></Pressable>
    </View></View>
    <View style={styles.calendarGrid}>{['L','M','X','J','V','S','D'].map((day,index)=><AppText key={`${day}-${index}`} variant="caption" muted style={styles.calendarWeekday}>{day}</AppText>)}
      {cells.map((day,index)=>{if(day===null)return <View key={`empty-${index}`} style={styles.calendarCell}/>;const value=`${monthKey}-${String(day).padStart(2,'0')}`;const available=availableInMonth.has(day);const selected=selectedDate===value;return <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${day} ${monthLabel}${available?', disponible':', sin horarios disponibles'}`} accessibilityState={{selected,disabled:!available||disabled}} disabled={!available||disabled} onPress={()=>onSelect(value)} style={[styles.calendarCell,styles.calendarDay,{backgroundColor:selected?colors.primary:available?colors.accent:colors.surface,borderColor:selected?colors.primary:available?colors.border:'transparent',opacity:available?1:.42}]}><AppText style={{color:selected?colors.onPrimary:available?colors.text:colors.muted,fontWeight:available?'700':'400'}}>{day}</AppText>{available&&<View style={[styles.calendarDot,{backgroundColor:selected?colors.onPrimary:colors.primary}]}/>}</Pressable>;})}
    </View>
    <AppText variant="caption" muted>Los días marcados tienen horarios reales publicados por la clínica.</AppText>
  </PetCareCard>;
}

function canContinue(step: number, petId: string, pets: Pet[], serviceId: string, services: AppointmentCatalog['services'], slotId: string, slot?: Slot) {
  if (step === 1) return pets.some(pet => pet.id === petId);
  if (step === 2) return services.some(service => service.id === serviceId);
  if (step === 3) return true;
  if (step === 4) return Boolean(slotId && slot?.id === slotId);
  return false;
}

function typeDescription(type: AppointmentCatalog['types'][number]) {
  if (Boolean(type.isClinical)) return 'Consultas médicas, controles y atención de salud.';
  if (/peluquer|groom/i.test(type.name)) return 'Baño, corte y cuidado del pelo.';
  return `Servicios disponibles del área ${type.name}.`;
}

function typeIcon(type: AppointmentCatalog['types'][number]): IconName {
  if (Boolean(type.isClinical)) return 'medkit-outline';
  if (/peluquer|groom/i.test(type.name)) return 'cut-outline';
  return 'calendar-outline';
}

function weekday(date: string) {
  const normalized = clinicDateFilterToApi(date);
  const value = new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'long' }).format(new Date(`${normalized}T12:00:00-03:00`));
  return value.charAt(0).toLocaleUpperCase('es-AR') + value.slice(1);
}

function StepProgress({ step }: { step: number }) {
  const { colors } = useTheme();
  return <PetCareCard>
    <View style={styles.progressHeader}><AppText variant="subtitle">Paso {step} de 5</AppText><AppText muted>{stepTitles[step - 1]}</AppText></View>
    <View accessibilityRole="progressbar" accessibilityLabel={`Paso ${step} de 5`} style={styles.progressTrack}>
      {stepTitles.map((title, index) => <View key={title} style={[styles.progressPart, { backgroundColor: index < step ? colors.primary : colors.border }]} />)}
    </View>
  </PetCareCard>;
}

function ChoiceCard({ title, description, detail, icon = 'checkmark-circle-outline', selected, onPress }: { title: string; description?: string; detail?: string; icon?: IconName; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="radio" accessibilityLabel={title} accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.choice, { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border }]}>
    <Ionicons name={icon} size={28} color={selected ? colors.primary : colors.muted} />
    <View style={styles.choiceCopy}>
      <AppText variant="subtitle">{title}</AppText>
      {Boolean(description) && <AppText muted>{description}</AppText>}
      {Boolean(detail) && <AppText variant="caption">{detail}</AppText>}
    </View>
    {selected && <Ionicons name="checkmark-circle" size={23} color={colors.primary} />}
  </Pressable>;
}

function PetChoice({ pet, selected, onPress }: { pet: Pet; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="radio" accessibilityLabel={pet.name} accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.petChoice, { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border }]}>
    <PetImage uri={pet.photoUrl} size={64} />
    <View style={styles.choiceCopy}><AppText variant="subtitle">{pet.name}</AppText><AppText muted>{[pet.species, pet.breed].filter(Boolean).join(' · ')}</AppText></View>
    {selected && <Ionicons name="checkmark-circle" size={23} color={colors.primary} />}
  </Pressable>;
}

function PetChoiceProfessional({ name, photoUrl, specialties, selected, onPress }: { name: string; photoUrl: string | null | undefined; specialties?: string | null; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={name} accessibilityState={{ checked: selected }} onPress={onPress} style={styles.professionalChoice}>
    <PetImage uri={photoUrl ?? null} size={48} />
    <View style={styles.choiceCopy}><AppText>{name}</AppText>{Boolean(specialties) && <AppText variant="caption" muted>{specialties}</AppText>}</View>
    <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color="#28795D" />
  </Pressable>;
}

function SelectionSummary({ step, typeName, pet, serviceName, slot }: { step: number; typeName?: string; pet?: Pet; serviceName?: string; slot?: Slot }) {
  const values = [typeName, pet?.name, serviceName, slot ? clinicDateTime(slot.startsAt) : undefined].filter(Boolean);
  if (step < 2 || !values.length) return null;
  return <AppText variant="caption" muted>Elegido: {values.join(' · ')}</AppText>;
}

function SummaryLine({ label, value }: { label: string; value?: string }) {
  return <View style={styles.summaryLine}><AppText muted>{label}</AppText><AppText>{value || 'Elegí una opción'}</AppText></View>;
}

function StepHelp({ text }: { text: string | null }) {
  if (!text) return null;
  return <AppText variant="caption" muted>{text}</AppText>;
}

const styles = StyleSheet.create({
  progressHeader: { gap: 4 },
  progressTrack: { flexDirection: 'row', gap: 6, minHeight: 8 },
  progressPart: { flex: 1, height: 8, borderRadius: 8 },
  choice: { minHeight: 88, padding: 16, borderWidth: 2, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  typeChoices: { gap: 10 },
  calendarHeading:{gap:8},calendarNav:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},calendarArrow:{width:36,height:36,borderRadius:12,alignItems:'center',justifyContent:'center'},calendarMonth:{flex:1,textAlign:'center',fontWeight:'700',textTransform:'capitalize'},calendarGrid:{flexDirection:'row',flexWrap:'wrap'},calendarWeekday:{width:'14.2857%',height:34,textAlign:'center',textAlignVertical:'center',fontWeight:'700'},calendarCell:{width:'14.2857%',height:42,alignItems:'center',justifyContent:'center'},calendarDay:{borderWidth:1,borderRadius:13,marginBottom:4},calendarDot:{width:4,height:4,borderRadius:2,marginTop:2},
  petChoice: { minHeight: 88, padding: 12, borderWidth: 2, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  choiceCopy: { flex: 1, minWidth: 0, gap: 4 },
  professionalChoice: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryLine: { gap: 3 },
  actions: { gap: 10, marginTop: 6 },
  resultIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E8F3EE', alignItems: 'center', justifyContent: 'center' },
});
