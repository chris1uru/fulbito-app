import { FontAwesome, Feather, Ionicons } from "@expo/vector-icons";

export const MapsIcon = (props) => (
  <FontAwesome name="map-o" size={24} color="white" {...props} />
);

export const CalendarIcon = (props) => (
  <FontAwesome name="calendar" size={24} color="white" {...props} />
);

export const BusinessIcon = (props) => (
  <Ionicons name="business" size={24} color="white" {...props} />
);

export const MessageIcon = (props) => (
  <Feather name="message-square" size={24} color="white" {...props} />
);

export const AccountIcon = (props) => (
  <Ionicons name="person" size={24} color="white" {...props} />
);
