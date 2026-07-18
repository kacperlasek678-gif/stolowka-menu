export interface Kierowca {
  id: string;
  imie: string;
  telefon?: string;
  aktywny: boolean;
  pinUstawiony: boolean;
  utworzono?: Date;
}