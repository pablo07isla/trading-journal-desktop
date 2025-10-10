import sys
import json
import MetaTrader5 as mt5

def get_account_info():
    account = mt5.account_info()
    if account is None:
        return {"error": "No se pudo obtener información de la cuenta"}
    return account._asdict()

def get_closed_trades():
    # Obtener trades cerrados en un rango de fechas amplio
    from datetime import datetime, timedelta
    start_date = datetime(2020, 1, 1)
    
    # Agregar 8 horas para compensar la diferencia de zona horaria del servidor MT5
    end_date = datetime.now() + timedelta(hours=8)
    
    history = mt5.history_deals_get(start_date, end_date)
    if history is None:
        return {"error": "No se pudo obtener historial de trades"}
    
    # Incluir información de debug en la respuesta
    deals_list = [deal._asdict() for deal in history]
    return {
        "debug_info": {
            "start_date": str(start_date),
            "end_date": str(end_date),
            "end_date_local": str(datetime.now()),
            "timezone_offset": "+8 hours",
            "deals_count": len(deals_list)
        },
        "deals": deals_list
    }
   

def main():
    if not mt5.initialize():
        print(json.dumps({"error": "No se pudo inicializar MT5"}))
        sys.exit(1)

    if len(sys.argv) < 2:
        print(json.dumps({"error": "No se especificó tipo de consulta"}))
        sys.exit(1)

    query_type = sys.argv[1]
    if query_type == "account":
        result = get_account_info()
    elif query_type == "trades":
        result = get_closed_trades()
    else:
        result = {"error": "Tipo de consulta no soportado"}

    print(json.dumps(result, default=str))
    mt5.shutdown()

if __name__ == "__main__":
    main()