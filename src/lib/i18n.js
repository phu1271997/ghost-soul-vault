import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      brand: 'Ghost · Soul Vault',
      heroTagline: 'Luxury inheritance, governed by values instead of dead code.',
      heroBody:
        'Ghost turns a legacy vault into a living moral machine. GenLayer lets the deceased inspect live evidence, reason subjectively, and still obey deterministic financial guardrails.',
      setupLegacy: 'Setup Your Legacy',
      tryDemo: 'Try Demo Family',
      demoLabel: 'Demo Mode',
      heirPortal: 'Heir Portal',
      ownerWizard: 'Owner Wizard',
      treasury: 'Treasury',
      executorPanel: 'Executor Panel',
      petitionResults: 'Petition Result',
      contractHealth: 'Contract health',
      healthy: 'Healthy',
      degraded: 'Needs attention',
      connectWallet: 'Connect Wallet',
      disconnect: 'Disconnect',
      withdraw: 'Withdraw Approved GEN',
      demoFamilies: 'Demo Family Gallery',
    },
  },
  vi: {
    translation: {
      brand: 'Ghost · Soul Vault',
      heroTagline: 'Di sản sang trọng, được điều hành bằng giá trị sống thay vì code cứng.',
      heroBody:
        'Ghost biến két di sản thành một cỗ máy đạo đức biết suy xét. GenLayer cho phép “người đã khuất” nhìn dữ liệu sống, đánh giá chủ quan, nhưng vẫn bị khóa bởi guardrail tài chính xác định.',
      setupLegacy: 'Thiết lập di sản',
      tryDemo: 'Xem gia đình mẫu',
      demoLabel: 'Chế độ Demo',
      heirPortal: 'Cổng người thừa kế',
      ownerWizard: 'Trình thiết lập chủ sở hữu',
      treasury: 'Kho quỹ',
      executorPanel: 'Bảng người thực thi',
      petitionResults: 'Kết quả petition',
      contractHealth: 'Tình trạng contract',
      healthy: 'Ổn định',
      degraded: 'Cần kiểm tra',
      connectWallet: 'Kết nối ví',
      disconnect: 'Ngắt kết nối',
      withdraw: 'Rút GEN đã được duyệt',
      demoFamilies: 'Thư viện gia đình mẫu',
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
