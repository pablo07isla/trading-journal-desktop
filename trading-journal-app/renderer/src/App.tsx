import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import MT5Dashboard from "@/pages/MT5Dashboard";
import TradeLog from "@/pages/TradeLog";
import Settings from "@/pages/Settings";
import { TradingAccounts } from "@/pages/TradingAccounts";
import { Strategies } from "@/pages/Strategies";
import { TradingPlans } from "@/pages/TradingPlans";
import Layout from "@/components/layout/Layout";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./App.css";
import MT5Import from "./pages/MT5Import";

const App: React.FC = () => (
  <ThemeProvider defaultTheme='system' storageKey='trading-journal-ui-theme'>
    <HashRouter>
      <Routes>
        <Route path='/' element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path='mt5dashboard' element={<MT5Dashboard />} />
          <Route path='trades' element={<TradeLog />} />
          <Route path='accounts' element={<TradingAccounts />} />
          <Route path='mt5import' element={<MT5Import />} />
          <Route path='strategies' element={<Strategies />} />
          <Route path='plans' element={<TradingPlans />} />
          <Route path='settings' element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  </ThemeProvider>
);

export default App;
