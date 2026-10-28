// Este archivo se encarga de lo siguiente: Pantalla o navegación del área administrativa; conecta la interfaz con las operaciones de administración.

import { useState } from "react";
import { View } from "react-native";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { AppText } from "../../components/ui/AppText";
import { AppInput } from "../../components/forms/AppInput";
import { AppButton } from "../../components/ui/AppButton";
import { FormNotice } from "../../components/ui/FormNotice";
import { QueryState } from "../../components/client/PetCareUI";
import { SelectionRow } from "../../components/ui/SelectionRow";
import {
  AdminFormActions,
  AdminFormSection,
} from "../../components/admin/AdminFormLayout";
import { AdminPageHeading } from "../../components/admin/AdminPageHeading";
import { useAdmin } from "../../hooks/useAdmin";
import { useClientQuery } from "../../hooks/useClientQuery";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useFeedback } from "../../contexts/FeedbackContext";
import type {
  GeneralInformation,
  OpeningHours,
  Weekday,
} from "../../types/admin";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";

// Configuración weekdays: reúne valores o reglas que consume el resto del módulo.
const weekdays: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
// Configuración dayNames: reúne valores o reglas que consume el resto del módulo.
const dayNames: Record<Weekday, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};
// Función emptyHours: concentra una operación reutilizable de este módulo.
const emptyHours = (): OpeningHours =>
  Object.fromEntries(
    weekdays.map((day) => [day, { open: false, periods: [] }]),
  ) as unknown as OpeningHours;
// Configuración empty: reúne valores o reglas que consume el resto del módulo.
const empty: GeneralInformation = {
  clinicName: "PetCare",
  description: null,
  logoUrl: null,
  welcomeMessage: null,
  phone: null,
  whatsapp: null,
  publicEmail: null,
  address: null,
  city: null,
  province: null,
  mapUrl: null,
  openingHours: emptyHours(),
  instagramUrl: null,
  facebookUrl: null,
  xUrl: null,
  websiteUrl: null,
  updatedAt: null,
};
// Función nullableFields: concentra una operación reutilizable de este módulo.
const nullableFields = (information: GeneralInformation) => ({
  ...information,
  description: information.description || null,
  logoUrl: information.logoUrl || null,
  welcomeMessage: information.welcomeMessage || null,
  phone: information.phone || null,
  whatsapp: information.whatsapp || null,
  publicEmail: information.publicEmail || null,
  address: information.address || null,
  city: information.city || null,
  province: information.province || null,
  mapUrl: information.mapUrl || null,
  instagramUrl: information.instagramUrl || null,
  facebookUrl: information.facebookUrl || null,
  xUrl: information.xUrl || null,
  websiteUrl: information.websiteUrl || null,
});

// Función GeneralInformationScreen: concentra la lógica dentro de este módulo.
export default function GeneralInformationScreen() {
  const api = useAdmin();
  const action = useAsyncAction();
  const { showToast } = useFeedback();
  const query = useClientQuery(api.generalInformation);
  const [savedValues, setValues] = useState<GeneralInformation | null>(null);
  const [baseline, setBaseline] = useState<GeneralInformation | null>(null);
  const values = savedValues ?? query.data?.information ?? empty;
  const { confirmation: unsavedChangesPrompt } = useUnsavedChangesGuard(
    Boolean(query.data) &&
      JSON.stringify(values) !==
        JSON.stringify(baseline ?? query.data?.information),
  );
  // Función change: actualiza o guarda información dentro de este módulo.
function change<K extends keyof GeneralInformation>(
    key: K,
    value: GeneralInformation[K],
  ) {
    setValues({ ...values, [key]: value });
  }
  // Función updateHours: actualiza o guarda información dentro de este módulo.
function updateHours(
    day: Weekday,
    update: (current: OpeningHours[Weekday]) => OpeningHours[Weekday],
  ) {
    setValues({
      ...values,
      openingHours: {
        ...values.openingHours,
        [day]: update(values.openingHours[day]),
      },
    });
  }
  // Función save: actualiza o guarda información dentro de este módulo.
async function save() {
    const saved = await api.saveGeneralInformation(nullableFields(values));
    setValues(saved);
    setBaseline(saved);
    query.reload();
    showToast("Información de PetCare guardada", "success");
  }
  return (
    <ScreenContainer wide>
      <AdminPageHeading title="Información de PetCare" />
      <AppText muted>
        Estos datos aparecen en el inicio público de la aplicación.
      </AppText>
      
<QueryState {...query} />
      {query.data && (
        <>
          {!query.data.configured && (
            <FormNotice message="No es posible editar esta información en este momento. Intentá nuevamente más tarde." />
          )}
          
<AdminFormSection
            title="Identidad"
            description="Nombre y presentación institucional."
          >
            <AppInput
              label="Nombre de PetCare"
              required
              maxLength={120}
              value={values.clinicName}
              onChangeText={(value) => change("clinicName", value)}
            />
            <AppInput
              label="Mensaje de bienvenida"
              maxLength={500}
              value={values.welcomeMessage ?? ""}
              onChangeText={(value) => change("welcomeMessage", value)}
            />
            <AppInput
              label="Descripción"
              multiline
              numberOfLines={4}
              maxLength={2000}
              value={values.description ?? ""}
              onChangeText={(value) => change("description", value)}
            />
            <AppInput
              label="URL del logo (HTTPS)"
              keyboardType="url"
              maxLength={2048}
              value={values.logoUrl ?? ""}
              onChangeText={(value) => change("logoUrl", value)}
            />
          </AdminFormSection>
          
<AdminFormSection
            title="Contacto"
            description="Canales que se muestran a clientes."
          >
            <AppInput
              label="Teléfono"
              keyboardType="phone-pad"
              maxLength={40}
              value={values.phone ?? ""}
              onChangeText={(value) => change("phone", value)}
            />
            <AppInput
              label="WhatsApp"
              keyboardType="phone-pad"
              maxLength={40}
              value={values.whatsapp ?? ""}
              onChangeText={(value) => change("whatsapp", value)}
            />
            <AppInput
              label="Correo público"
              keyboardType="email-address"
              maxLength={254}
              value={values.publicEmail ?? ""}
              onChangeText={(value) => change("publicEmail", value)}
            />
          </AdminFormSection>
          
<AdminFormSection
            title="Ubicación"
            description="Dirección y enlace del mapa."
          >
            <AppInput
              label="Dirección"
              maxLength={200}
              value={values.address ?? ""}
              onChangeText={(value) => change("address", value)}
            />
            <AppInput
              label="Ciudad"
              maxLength={100}
              value={values.city ?? ""}
              onChangeText={(value) => change("city", value)}
            />
            <AppInput
              label="Provincia"
              maxLength={100}
              value={values.province ?? ""}
              onChangeText={(value) => change("province", value)}
            />
            <AppInput
              label="Enlace del mapa (HTTPS)"
              keyboardType="url"
              maxLength={2048}
              value={values.mapUrl ?? ""}
              onChangeText={(value) => change("mapUrl", value)}
            />
          </AdminFormSection>
          
<AdminFormSection
            title="Horarios de atención"
            description="Configurá hasta dos franjas por día. Usá el formato de 24 horas HH:MM."
          >
            {weekdays.map((day) => {
              const row = values.openingHours[day];
              return (
                <View
                  key={day}
                  style={{ width: "100%", gap: 9, paddingVertical: 5 }}
                >
                  <SelectionRow
                    label={`${dayNames[day]}: ${row.open ? "Abierto" : "Cerrado"}`}
                    checked={row.open}
                    onPress={() =>
                      updateHours(day, (current) => ({
                        open: !current.open,
                        periods: !current.open
                          ? current.periods.length
                            ? current.periods
                            : [{ opensAt: "09:00", closesAt: "18:00" }]
                          : [],
                      }))
                    }
                  />
                  {row.open && (
                    <>
                      {row.periods.map((period, index) => (
                        <View
                          key={`${day}-${index}`}
                          style={{ flexDirection: "row", gap: 10 }}
                        >
                          <View style={{ flex: 1 }}>
                            <AppInput
                              label={`Franja ${index + 1} · abre`}
                              placeholder="09:00"
                              maxLength={5}
                              value={period.opensAt}
                              onChangeText={(value) =>
                                updateHours(day, (current) => ({
                                  ...current,
                                  periods: current.periods.map((item, i) =>
                                    i === index
                                      ? { ...item, opensAt: value }
                                      : item,
                                  ),
                                }))
                              }
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <AppInput
                              label={`Franja ${index + 1} · cierra`}
                              placeholder="18:00"
                              maxLength={5}
                              value={period.closesAt}
                              onChangeText={(value) =>
                                updateHours(day, (current) => ({
                                  ...current,
                                  periods: current.periods.map((item, i) =>
                                    i === index
                                      ? { ...item, closesAt: value }
                                      : item,
                                  ),
                                }))
                              }
                            />
                          </View>
                          {index > 0 && (
                            <AppButton
                              compact
                              variant="secondary"
                              label="Quitar"
                              accessibilityLabel={`Quitar franja ${index + 1} del ${dayNames[day]}`}
                              onPress={() =>
                                updateHours(day, (current) => ({
                                  ...current,
                                  periods: current.periods.filter(
                                    (_, i) => i !== index,
                                  ),
                                }))
                              }
                            />
                          )}
                        </View>
                      ))}
                      {row.periods.length < 2 && (
                        <AppButton
                          compact
                          variant="secondary"
                          label="Agregar otra franja"
                          onPress={() =>
                            updateHours(day, (current) => ({
                              ...current,
                              periods: [
                                ...current.periods,
                                { opensAt: "13:00", closesAt: "17:00" },
                              ],
                            }))
                          }
                        />
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </AdminFormSection>
          
<AdminFormSection
            title="Redes y sitio web"
            description="Ingresá enlaces HTTPS completos."
          >
            <AppInput
              label="Instagram"
              keyboardType="url"
              maxLength={2048}
              value={values.instagramUrl ?? ""}
              onChangeText={(value) => change("instagramUrl", value)}
            />
            <AppInput
              label="Facebook"
              keyboardType="url"
              maxLength={2048}
              value={values.facebookUrl ?? ""}
              onChangeText={(value) => change("facebookUrl", value)}
            />
            <AppInput
              label="X"
              keyboardType="url"
              maxLength={2048}
              value={values.xUrl ?? ""}
              onChangeText={(value) => change("xUrl", value)}
            />
            <AppInput
              label="Sitio web"
              keyboardType="url"
              maxLength={2048}
              value={values.websiteUrl ?? ""}
              onChangeText={(value) => change("websiteUrl", value)}
            />
          </AdminFormSection>
          <FormNotice error message={action.error} />
          
<AdminFormActions>
            <AppButton
              label="Guardar información"
              loading={action.loading}
              disabled={!query.data.configured || query.loading}
              onPress={() => void action.run(save)}
            />
          </AdminFormActions>
        </>
      )}
      {unsavedChangesPrompt}
    </ScreenContainer>
  );
}
