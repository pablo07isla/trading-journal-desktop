// Tipos para datos de cuentas y trades MT5
// ...definición pendiente...

export interface MT5Account {
  id: string;
  broker: string;
  balance: number;
  equity: number;
  // ...otros campos relevantes...
}

export interface MT5Trade {
  id: string;
  accountId: string;
  symbol: string;
  entry: number;
  sl: number;
  tp: number;
  openTime: string;
  closeTime: string;
  result: number;
  // ...otros campos relevantes...
}
