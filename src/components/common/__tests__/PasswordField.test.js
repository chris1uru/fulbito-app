import { fireEvent, render } from "@testing-library/react-native";
import PasswordField from "../PasswordField";

describe("PasswordField", () => {
  test("oculta y muestra el valor con un control accesible", async () => {
    const screen = await render(
      <PasswordField
        label="Contraseña"
        value="secreto"
        onChangeText={() => {}}
      />,
    );

    expect(screen.getByDisplayValue("secreto").props.secureTextEntry).toBe(
      true,
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "Mostrar contraseña" }),
    );

    expect(screen.getByDisplayValue("secreto").props.secureTextEntry).toBe(
      false,
    );
    expect(
      screen.getByRole("button", { name: "Ocultar contraseña" }),
    ).toBeTruthy();
  });

  test("cada campo administra su visibilidad de forma independiente", async () => {
    const screen = await render(
      <>
        <PasswordField label="Contraseña" value="uno" onChangeText={() => {}} />
        <PasswordField
          label="Repetir contraseña"
          value="dos"
          onChangeText={() => {}}
        />
      </>,
    );

    await fireEvent.press(
      screen.getAllByRole("button", { name: "Mostrar contraseña" })[0],
    );

    expect(screen.getByDisplayValue("uno").props.secureTextEntry).toBe(false);
    expect(screen.getByDisplayValue("dos").props.secureTextEntry).toBe(true);
  });
});
