import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import AppHeader from "../../../components/common/AppHeader";

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const hour = String(Math.floor(index / 4)).padStart(2, "0");
  const minute = String((index % 4) * 15).padStart(2, "0");
  return `${hour}:${minute}`;
});
const WEEKDAYS = ["D", "L", "M", "M", "J", "V", "S"];

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateLabel(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-UY", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function monthLabel(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-UY", {
    month: "long",
    year: "numeric",
  });
}

function firstDayOfMonth(value) {
  return `${value.slice(0, 7)}-01`;
}

function moveMonth(value, amount) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  return dateKey(date);
}

function calendarDays(value) {
  const monthStart = new Date(`${firstDayOfMonth(value)}T12:00:00`);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = monthStart.getDay();
  const cells = Array.from({ length: leadingEmptyDays }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(dateKey(new Date(year, month, day, 12)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function BottomModal({ visible, title, children, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="rounded-t-3xl border border-[#30363D] bg-[#17191C] px-5 pb-8 pt-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-white">{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Cerrar ${title.toLowerCase()}`}
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-xl bg-[#292D32]"
            >
              <Ionicons name="close" size={21} color="#FFFFFF" />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function TimeDropdown({
  visible,
  anchor,
  selectedTime,
  selectedTimeIndex,
  onSelect,
  onClose,
}) {
  if (!anchor) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View
          className="absolute overflow-hidden rounded-xl border border-[#3B4249] bg-[#202428]"
          style={{
            top: anchor.y + anchor.height + 5,
            left: anchor.x,
            width: anchor.width,
            maxHeight: 244,
            elevation: 20,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.28,
            shadowRadius: 14,
          }}
        >
          <FlatList
            data={TIME_OPTIONS}
            keyExtractor={(item) => item}
            initialScrollIndex={selectedTimeIndex}
            getItemLayout={(_, index) => ({
              length: 48,
              offset: 48 * index,
              index,
            })}
            showsVerticalScrollIndicator
            renderItem={({ item, index }) => {
              const selected = item === selectedTime;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onSelect(item)}
                  className={`h-12 flex-row items-center justify-between px-4 ${
                    index < TIME_OPTIONS.length - 1
                      ? "border-b border-[#30363D]"
                      : ""
                  } ${selected ? "bg-[#2C4930]" : "bg-[#202428]"}`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      selected ? "text-[#80D160]" : "text-[#E6E9EC]"
                    }`}
                  >
                    {item}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={19} color="#80D160" />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function MapsHeader({
  query,
  onQueryChange,
  selectedDate,
  canGoPrevious,
  onPreviousDate,
  onNextDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  onlyAvailable,
  onOnlyAvailableChange,
}) {
  const timeButtonRef = useRef(null);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [timeAnchor, setTimeAnchor] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(
    firstDayOfMonth(selectedDate),
  );
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const selectedTimeIndex = useMemo(
    () => Math.max(0, TIME_OPTIONS.indexOf(selectedTime)),
    [selectedTime],
  );
  const days = useMemo(() => calendarDays(calendarMonth), [calendarMonth]);
  const today = dateKey(new Date());
  const canGoToPreviousMonth =
    firstDayOfMonth(calendarMonth) > firstDayOfMonth(today);

  function openTimeDropdown() {
    Keyboard.dismiss();
    timeButtonRef.current?.measureInWindow((x, y, width, height) => {
      setTimeAnchor({ x, y, width, height });
      setTimeDropdownOpen(true);
    });
  }

  function openCalendar() {
    Keyboard.dismiss();
    setCalendarMonth(firstDayOfMonth(selectedDate));
    setCalendarOpen(true);
  }

  return (
    <>
      <AppHeader>
        <View className="mb-2 flex-row items-center gap-2">
          <View className="h-12 flex-1 flex-row items-center rounded-xl border border-[#30363D] bg-[#202428] px-3">
            <Ionicons name="search" size={18} color="#80D160" />
            <TextInput
              value={query}
              onChangeText={onQueryChange}
              autoCorrect={false}
              returnKeyType="search"
              className="h-full flex-1 px-3 text-white"
              placeholder="Buscar complejo o zona..."
              placeholderTextColor="#8B949E"
            />
            {!!query && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpiar búsqueda"
                onPress={() => onQueryChange("")}
                className="h-8 w-8 items-center justify-center"
              >
                <Ionicons name="close-circle" size={18} color="#8B949E" />
              </Pressable>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtrar complejos"
            accessibilityState={{ selected: onlyAvailable }}
            onPress={() => setFilterModalOpen(true)}
            className={`h-12 w-12 items-center justify-center rounded-xl border ${
              onlyAvailable
                ? "border-[#80D160] bg-[#2C4930]"
                : "border-[#30363D] bg-[#202428]"
            }`}
          >
            <Ionicons name="options-outline" size={20} color="#80D160" />
          </Pressable>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="h-11 flex-1 flex-row items-center rounded-xl border border-[#30363D] bg-[#202428] px-1">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Día anterior"
              accessibilityState={{ disabled: !canGoPrevious }}
              disabled={!canGoPrevious}
              onPress={onPreviousDate}
              className={`h-9 w-9 items-center justify-center rounded-lg bg-[#292D32] ${
                canGoPrevious ? "" : "opacity-30"
              }`}
            >
              <Ionicons name="chevron-back" size={17} color="#A9B1B8" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Elegir fecha. Fecha actual ${dateLabel(selectedDate)}`}
              onPress={openCalendar}
              className="h-full flex-1 items-center justify-center px-1"
            >
              <Text
                numberOfLines={1}
                className="text-center text-sm font-semibold capitalize text-white"
              >
                {dateLabel(selectedDate)}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Día siguiente"
              onPress={onNextDate}
              className="h-9 w-9 items-center justify-center rounded-lg bg-[#292D32]"
            >
              <Ionicons name="chevron-forward" size={17} color="#A9B1B8" />
            </Pressable>
          </View>

          <Pressable
            ref={timeButtonRef}
            collapsable={false}
            accessibilityRole="button"
            accessibilityLabel={`Elegir hora. Hora actual ${selectedTime}`}
            accessibilityState={{ expanded: timeDropdownOpen }}
            onPress={openTimeDropdown}
            className="h-11 flex-1 flex-row items-center justify-center rounded-xl border border-[#30363D] bg-[#202428] px-3"
          >
            <Ionicons name="time-outline" size={17} color="#80D160" />
            <Text className="ml-2 text-sm font-semibold text-white">
              {selectedTime}
            </Text>
            <Ionicons
              name={timeDropdownOpen ? "chevron-up" : "chevron-down"}
              size={15}
              color="#8B949E"
              style={{ marginLeft: 6 }}
            />
          </Pressable>
        </View>
      </AppHeader>

      <TimeDropdown
        visible={timeDropdownOpen}
        anchor={timeAnchor}
        selectedTime={selectedTime}
        selectedTimeIndex={selectedTimeIndex}
        onClose={() => setTimeDropdownOpen(false)}
        onSelect={(time) => {
          onTimeChange(time);
          setTimeDropdownOpen(false);
        }}
      />

      <BottomModal
        visible={calendarOpen}
        title="Elegir fecha"
        onClose={() => setCalendarOpen(false)}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mes anterior"
            accessibilityState={{ disabled: !canGoToPreviousMonth }}
            disabled={!canGoToPreviousMonth}
            onPress={() => setCalendarMonth((value) => moveMonth(value, -1))}
            className={`h-10 w-10 items-center justify-center rounded-xl bg-[#292D32] ${
              canGoToPreviousMonth ? "" : "opacity-30"
            }`}
          >
            <Ionicons name="chevron-back" size={19} color="#C5CBD1" />
          </Pressable>
          <Text className="text-base font-bold capitalize text-white">
            {monthLabel(calendarMonth)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mes siguiente"
            onPress={() => setCalendarMonth((value) => moveMonth(value, 1))}
            className="h-10 w-10 items-center justify-center rounded-xl bg-[#292D32]"
          >
            <Ionicons name="chevron-forward" size={19} color="#C5CBD1" />
          </Pressable>
        </View>

        <View className="flex-row">
          {WEEKDAYS.map((day, index) => (
            <View
              key={`${day}-${index}`}
              className="h-8 items-center justify-center"
              style={{ width: `${100 / 7}%` }}
            >
              <Text className="text-xs font-semibold text-[#69727B]">
                {day}
              </Text>
            </View>
          ))}
        </View>
        <View className="flex-row flex-wrap">
          {days.map((day, index) => {
            if (!day) {
              return (
                <View
                  key={`empty-${index}`}
                  className="h-11"
                  style={{ width: `${100 / 7}%` }}
                />
              );
            }
            const disabled = day < today;
            const selected = day === selectedDate;
            const isToday = day === today;
            return (
              <View
                key={day}
                className="h-11 items-center justify-center"
                style={{ width: `${100 / 7}%` }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled, selected }}
                  disabled={disabled}
                  onPress={() => {
                    onDateChange(day);
                    setCalendarOpen(false);
                  }}
                  className={`h-9 w-9 items-center justify-center rounded-full ${
                    selected
                      ? "bg-[#80D160]"
                      : isToday
                        ? "border border-[#80D160] bg-[#142019]"
                        : ""
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selected
                        ? "text-[#152012]"
                        : disabled
                          ? "text-[#424950]"
                          : isToday
                            ? "text-[#80D160]"
                            : "text-[#C5CBD1]"
                    }`}
                  >
                    {Number(day.slice(-2))}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </BottomModal>

      <BottomModal
        visible={filterModalOpen}
        title="Filtrar mapa"
        onClose={() => setFilterModalOpen(false)}
      >
        {[
          {
            value: false,
            title: "Todos los complejos",
            subtitle: "Muestra disponibles en verde y no disponibles en gris.",
          },
          {
            value: true,
            title: "Sólo con disponibilidad",
            subtitle: "Oculta los complejos que no tienen un turno libre.",
          },
        ].map((option) => {
          const selected = option.value === onlyAvailable;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => {
                onOnlyAvailableChange(option.value);
                setFilterModalOpen(false);
              }}
              className={`mb-3 flex-row items-center rounded-2xl border p-4 ${
                selected
                  ? "border-[#80D160] bg-[#2C4930]"
                  : "border-[#30363D] bg-[#202428]"
              }`}
            >
              <View className="flex-1">
                <Text className="font-semibold text-white">{option.title}</Text>
                <Text className="mt-1 text-xs leading-5 text-[#A9B1B8]">
                  {option.subtitle}
                </Text>
              </View>
              <Ionicons
                name={selected ? "radio-button-on" : "radio-button-off"}
                size={21}
                color={selected ? "#80D160" : "#69727B"}
              />
            </Pressable>
          );
        })}
      </BottomModal>
    </>
  );
}
