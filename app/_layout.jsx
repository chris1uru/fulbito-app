import "../global.css";
import { Stack } from "expo-router";



export default function Layout() {
    return (
            <Stack 
                screenOptions={{
                    headerStyle: { opacity: 0.9, backgroundColor: "#1E1E1E" },
                    headerTitle:"",
                }}
            />
    );
}