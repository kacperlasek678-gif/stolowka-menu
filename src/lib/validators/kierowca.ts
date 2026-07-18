export function validateDriver(imie: string) {
  const nazwa = imie.trim();

  if (!nazwa) {
    throw new Error("Podaj imię kierowcy.");
  }

  return nazwa;
}

export function validatePin(pin: string) {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("PIN musi składać się dokładnie z 4 cyfr.");
  }

  return pin;
}