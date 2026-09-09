import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

const COUNTRIES = [
  ["Afganistán", "+93"],
  ["Albania", "+355"],
  ["Alemania", "+49"],
  ["Andorra", "+376"],
  ["Angola", "+244"],
  ["Antigua y Barbuda", "+1"],
  ["Arabia Saudita", "+966"],
  ["Argelia", "+213"],
  ["Argentina", "+54"],
  ["Armenia", "+374"],
  ["Australia", "+61"],
  ["Austria", "+43"],
  ["Azerbaiyán", "+994"],
  ["Bahamas", "+1"],
  ["Baréin", "+973"],
  ["Bangladés", "+880"],
  ["Barbados", "+1"],
  ["Bélgica", "+32"],
  ["Belice", "+501"],
  ["Benín", "+229"],
  ["Bielorrusia", "+375"],
  ["Birmania", "+95"],
  ["Bolivia", "+591"],
  ["Bosnia y Herzegovina", "+387"],
  ["Botsuana", "+267"],
  ["Brasil", "+55"],
  ["Brunéi", "+673"],
  ["Bulgaria", "+359"],
  ["Burkina Faso", "+226"],
  ["Burundi", "+257"],
  ["Bután", "+975"],
  ["Cabo Verde", "+238"],
  ["Camboya", "+855"],
  ["Camerún", "+237"],
  ["Canadá", "+1"],
  ["Catar", "+974"],
  ["Chad", "+235"],
  ["Chile", "+56"],
  ["China", "+86"],
  ["Chipre", "+357"],
  ["Colombia", "+57"],
  ["Comoras", "+269"],
  ["Congo", "+242"],
  ["Corea del Norte", "+850"],
  ["Corea del Sur", "+82"],
  ["Costa de Marfil", "+225"],
  ["Costa Rica", "+506"],
  ["Croacia", "+385"],
  ["Cuba", "+53"],
  ["Dinamarca", "+45"],
  ["Dominica", "+1"],
  ["Ecuador", "+593"],
  ["Egipto", "+20"],
  ["El Salvador", "+503"],
  ["Emiratos Árabes Unidos", "+971"],
  ["Eritrea", "+291"],
  ["Eslovaquia", "+421"],
  ["Eslovenia", "+386"],
  ["España", "+34"],
  ["Estados Unidos", "+1"],
  ["Estonia", "+372"],
  ["Esuatini", "+268"],
  ["Etiopía", "+251"],
  ["Filipinas", "+63"],
  ["Finlandia", "+358"],
  ["Fiyi", "+679"],
  ["Francia", "+33"],
  ["Gabón", "+241"],
  ["Gambia", "+220"],
  ["Georgia", "+995"],
  ["Ghana", "+233"],
  ["Granada", "+1"],
  ["Grecia", "+30"],
  ["Guatemala", "+502"],
  ["Guinea", "+224"],
  ["Guinea-Bisáu", "+245"],
  ["Guinea Ecuatorial", "+240"],
  ["Guyana", "+592"],
  ["Haití", "+509"],
  ["Honduras", "+504"],
  ["Hungría", "+36"],
  ["India", "+91"],
  ["Indonesia", "+62"],
  ["Irak", "+964"],
  ["Irán", "+98"],
  ["Irlanda", "+353"],
  ["Islandia", "+354"],
  ["Islas Marshall", "+692"],
  ["Islas Salomón", "+677"],
  ["Israel", "+972"],
  ["Italia", "+39"],
  ["Jamaica", "+1"],
  ["Japón", "+81"],
  ["Jordania", "+962"],
  ["Kazajistán", "+7"],
  ["Kenia", "+254"],
  ["Kirguistán", "+996"],
  ["Kiribati", "+686"],
  ["Kuwait", "+965"],
  ["Laos", "+856"],
  ["Lesoto", "+266"],
  ["Letonia", "+371"],
  ["Líbano", "+961"],
  ["Liberia", "+231"],
  ["Libia", "+218"],
  ["Liechtenstein", "+423"],
  ["Lituania", "+370"],
  ["Luxemburgo", "+352"],
  ["Macedonia del Norte", "+389"],
  ["Madagascar", "+261"],
  ["Malasia", "+60"],
  ["Malaui", "+265"],
  ["Maldivas", "+960"],
  ["Malí", "+223"],
  ["Malta", "+356"],
  ["Marruecos", "+212"],
  ["Mauricio", "+230"],
  ["Mauritania", "+222"],
  ["México", "+52"],
  ["Micronesia", "+691"],
  ["Moldavia", "+373"],
  ["Mónaco", "+377"],
  ["Mongolia", "+976"],
  ["Montenegro", "+382"],
  ["Mozambique", "+258"],
  ["Namibia", "+264"],
  ["Nauru", "+674"],
  ["Nepal", "+977"],
  ["Nicaragua", "+505"],
  ["Níger", "+227"],
  ["Nigeria", "+234"],
  ["Noruega", "+47"],
  ["Nueva Zelanda", "+64"],
  ["Omán", "+968"],
  ["Países Bajos", "+31"],
  ["Pakistán", "+92"],
  ["Palaos", "+680"],
  ["Panamá", "+507"],
  ["Papúa Nueva Guinea", "+675"],
  ["Paraguay", "+595"],
  ["Perú", "+51"],
  ["Polonia", "+48"],
  ["Portugal", "+351"],
  ["Reino Unido", "+44"],
  ["República Centroafricana", "+236"],
  ["República Checa", "+420"],
  ["República Democrática del Congo", "+243"],
  ["República Dominicana", "+1"],
  ["Ruanda", "+250"],
  ["Rumania", "+40"],
  ["Rusia", "+7"],
  ["Samoa", "+685"],
  ["San Cristóbal y Nieves", "+1"],
  ["San Marino", "+378"],
  ["San Vicente y las Granadinas", "+1"],
  ["Santa Lucía", "+1"],
  ["Santo Tomé y Príncipe", "+239"],
  ["Senegal", "+221"],
  ["Serbia", "+381"],
  ["Seychelles", "+248"],
  ["Sierra Leona", "+232"],
  ["Singapur", "+65"],
  ["Siria", "+963"],
  ["Somalia", "+252"],
  ["Sri Lanka", "+94"],
  ["Sudáfrica", "+27"],
  ["Sudán", "+249"],
  ["Sudán del Sur", "+211"],
  ["Suecia", "+46"],
  ["Suiza", "+41"],
  ["Surinam", "+597"],
  ["Tailandia", "+66"],
  ["Tanzania", "+255"],
  ["Tayikistán", "+992"],
  ["Timor Oriental", "+670"],
  ["Togo", "+228"],
  ["Tonga", "+676"],
  ["Trinidad y Tobago", "+1"],
  ["Túnez", "+216"],
  ["Turkmenistán", "+993"],
  ["Turquía", "+90"],
  ["Tuvalu", "+688"],
  ["Ucrania", "+380"],
  ["Uganda", "+256"],
  ["Uruguay", "+598"],
  ["Uzbekistán", "+998"],
  ["Vanuatu", "+678"],
  ["Vaticano", "+39"],
  ["Venezuela", "+58"],
  ["Vietnam", "+84"],
  ["Yemen", "+967"],
  ["Yibuti", "+253"],
  ["Zambia", "+260"],
  ["Zimbabue", "+263"],
].map(([name, dialCode]) => ({ name, dialCode }));

const DEFAULT_COUNTRY = COUNTRIES.find((country) => country.name === "Uruguay");
const URUGUAY_DIAL_CODE = "+598";

function digits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function splitPhone(value) {
  const normalized = String(value ?? "");
  const match = [...COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => normalized.startsWith(country.dialCode));
  return {
    country: match ?? DEFAULT_COUNTRY,
    nationalNumber: match ? normalized.slice(match.dialCode.length) : digits(normalized),
  };
}

export function phoneValidationMessage(value) {
  if (!value) return null;
  const { country, nationalNumber } = splitPhone(value);
  if (country.dialCode === URUGUAY_DIAL_CODE) {
    if (nationalNumber.length !== 8 || nationalNumber.startsWith("0")) {
      return "Con +598 ingresá los 8 dígitos sin el cero inicial. Ejemplo: 99 999 999.";
    }
  }
  return /^\+[1-9][0-9]{7,14}$/.test(value)
    ? null
    : "Ingresá un número válido.";
}

export default function CountryPhoneField({
  label = "Teléfono",
  value,
  onChangeText,
}) {
  const initial = splitPhone(value);
  const [country, setCountry] = useState(initial.country);
  const [nationalNumber, setNationalNumber] = useState(initial.nationalNumber);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [query, setQuery] = useState("");
  const visibleCountries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return COUNTRIES;
    return COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.dialCode.includes(normalized),
    );
  }, [query]);

  function updateNumber(nextNumber, nextCountry = country) {
    const cleanNumber = digits(nextNumber);
    setNationalNumber(cleanNumber);
    onChangeText(cleanNumber ? `${nextCountry.dialCode}${cleanNumber}` : "");
  }

  function chooseCountry(nextCountry) {
    setCountry(nextCountry);
    setPickerVisible(false);
    setQuery("");
    updateNumber(nationalNumber, nextCountry);
  }

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">{label}</Text>
      <View className="h-13 flex-row items-center rounded-xl border border-[#30363D] bg-[#17191C] px-3">
        <Pressable
          onPress={() => setPickerVisible(true)}
          className="flex-row items-center border-r border-[#30363D] pr-3"
          accessibilityRole="button"
          accessibilityLabel={`Código de país: ${country.name}, ${country.dialCode}`}
        >
          <Text className="font-semibold text-white">{country.dialCode}</Text>
          <Ionicons name="chevron-down" size={16} color="#A9B1B8" />
        </Pressable>
        <TextInput
          value={nationalNumber}
          onChangeText={updateNumber}
          keyboardType="phone-pad"
          placeholder={
            country.dialCode === URUGUAY_DIAL_CODE
              ? "99 999 999"
              : "Número de teléfono"
          }
          placeholderTextColor="#69727B"
          maxLength={
            country.dialCode === URUGUAY_DIAL_CODE
              ? 8
              : 15 - digits(country.dialCode).length
          }
          className="h-full flex-1 px-3 text-white"
        />
      </View>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/70">
          <Pressable className="flex-1" onPress={() => setPickerVisible(false)} />
          <View className="h-[70%] rounded-t-3xl bg-[#202428] px-5 pb-6 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-white">Código de país</Text>
              <Pressable onPress={() => setPickerVisible(false)} className="p-2">
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
            <View className="mb-3 flex-row items-center rounded-xl bg-[#17191C] px-3">
              <Ionicons name="search-outline" size={18} color="#8B949E" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar país o código"
                placeholderTextColor="#69727B"
                autoFocus
                className="h-12 flex-1 px-3 text-white"
              />
            </View>
            <FlatList
              data={visibleCountries}
              keyExtractor={(item, index) => `${item.name}-${item.dialCode}-${index}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => chooseCountry(item)}
                  className="flex-row items-center justify-between border-b border-[#30363D] py-4"
                >
                  <Text className="text-base text-white">{item.name}</Text>
                  <Text className="font-semibold text-[#80D160]">{item.dialCode}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
