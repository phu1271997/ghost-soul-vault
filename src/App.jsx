import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'sonner'
import { AppShell } from './components/AppShell'
import { ConsensusProgress } from './components/ConsensusProgress'
import { GhostAppProvider, useGhostApp } from './context/GhostAppContext'
import './lib/i18n'
import { DemoFamilyPage } from './pages/DemoFamilyPage'
import { ExecutorPanelPage } from './pages/ExecutorPanelPage'
import { HeirDashboardPage } from './pages/HeirDashboardPage'
import { HomePage } from './pages/HomePage'
import { OwnerSetupPage } from './pages/OwnerSetupPage'
import { PetitionResultPage } from './pages/PetitionResultPage'
import { TreasuryPage } from './pages/TreasuryPage'

function AppRoutes() {
  const { i18n } = useTranslation()
  const {
    connectedAddress,
    contractAddress,
    contractHealthy,
    contractError,
    loading,
    txLoading,
    willSealed,
    vaultBalance,
    persona,
    executor,
    heirStatus,
    convoMessages,
    lastPetitionResult,
    actions,
    derived,
  } = useGhostApp()

  return (
    <AppShell
      connectedAddress={connectedAddress}
      loading={loading}
      onConnect={actions.connectWallet}
      onDisconnect={actions.disconnectWallet}
      contractHealthy={contractHealthy}
      contractError={contractError}
      language={i18n.language}
      onLanguageChange={(lng) => i18n.changeLanguage(lng)}
    >
      <ConsensusProgress active={txLoading} />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              contractAddress={contractAddress}
              persona={persona}
              willSealed={willSealed}
              vaultBalance={vaultBalance}
              toGen={derived.toGen}
            />
          }
        />
        <Route path="/setup" element={<OwnerSetupPage actions={actions} txLoading={txLoading} />} />
        <Route
          path="/heir"
          element={
            <HeirDashboardPage
              heirStatus={heirStatus}
              convoMessages={convoMessages}
              actions={actions}
              toGen={derived.toGen}
              vaultBalance={vaultBalance}
              canWithdraw={derived.canWithdraw}
            />
          }
        />
        <Route
          path="/petition/:id"
          element={<PetitionResultPage result={lastPetitionResult} actions={actions} toGen={derived.toGen} />}
        />
        <Route path="/executor" element={<ExecutorPanelPage lastPetitionResult={lastPetitionResult} executor={executor} />} />
        <Route path="/demo" element={<DemoFamilyPage onPickScenario={actions.setDemoFamily} />} />
        <Route
          path="/treasury"
          element={
            <TreasuryPage
              vaultBalance={vaultBalance}
              heirStatus={heirStatus}
              toGen={derived.toGen}
              willSealed={willSealed}
            />
          }
        />
      </Routes>
      <Toaster theme="dark" />
    </AppShell>
  )
}

export default function App() {
  return (
    <GhostAppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </GhostAppProvider>
  )
}
