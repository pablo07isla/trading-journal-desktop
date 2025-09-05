import React from "react";
import { Button } from "@/components/ui/button";

const Settings: React.FC = () => (
  <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 md:px-6 py-4">
    <h1 className="text-2xl font-bold mb-4">Preferencias</h1>
    <form className="bg-card rounded-lg shadow p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Divisa base</label>
        <select className="border rounded-md px-3 py-2 text-sm bg-background w-full">
          <option>USD</option>
          <option>EUR</option>
          <option>ARS</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Huso horario</label>
        <select className="border rounded-md px-3 py-2 text-sm bg-background w-full">
          <option>GMT-3</option>
          <option>GMT-5</option>
          <option>UTC</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tema visual</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="theme" value="light" /> Claro
          </label>{" "}
          <label className="flex items-center gap-2">
            <input type="radio" name="theme" value="dark" defaultChecked />
            Oscuro
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Idioma interfaz
        </label>
        <select className="border rounded-md px-3 py-2 text-sm bg-background w-full">
          <option>Español</option>
          <option>Inglés</option>
        </select>
      </div>
      <div className="pt-2 flex justify-end">
        <Button type="submit">Guardar configuración</Button>
      </div>
    </form>
  </div>
);

export default Settings;
