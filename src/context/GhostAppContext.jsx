import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { FALLBACK_CONTRACT_ADDRESS } from '../lib/config'
import { createWriteClient, readClient } from '../lib/genlayerClient'

const GhostAppContext = createContext(null)

const toGen = (weiBigInt) => {
  if (weiBigInt === undefined || weiBigInt === null) return '0'
  const raw = BigInt(weiBigInt)
  const weiStr = raw.toString().padStart(19, '0')
  const integerPart = weiStr.slice(0, -18)
  const fractionalPart = weiStr.slice(-18).replace(/0+$/, '')
  return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart
}

const toWei = (genStr) => {
  try {
    if (!genStr) return 0n
    const parts = String(genStr).split('.')
    const integerPart = parts[0] || '0'
    let fractionalPart = parts[1] || ''
    fractionalPart = fractionalPart.slice(0, 18).padEnd(18, '0')
    return BigInt(integerPart) * 10n ** 18n + BigInt(fractionalPart)
  } catch {
    return 0n
  }
}

const parseJson = (value, fallback) => {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const extractContractResult = (receipt) => {
  const leaderResult = receipt?.consensus_data?.leader_receipt?.[0]?.result
  if (!leaderResult) return null
  return typeof leaderResult === 'string' ? parseJson(leaderResult, leaderResult) : leaderResult
}

export function GhostAppProvider({ children }) {
  const [connectedAddress, setConnectedAddress] = useState(null)
  const [contractAddress] = useState(FALLBACK_CONTRACT_ADDRESS)
  const [contractHealthy, setContractHealthy] = useState(true)
  const [contractError, setContractError] = useState('')
  const [loading, setLoading] = useState(false)
  const [txLoading, setTxLoading] = useState(false)
  const [willSealed, setWillSealed] = useState(false)
  const [vaultBalance, setVaultBalance] = useState(0n)
  const [persona, setPersona] = useState('')
  const [executor, setExecutor] = useState('')
  const [heirStatus, setHeirStatus] = useState(null)
  const [convoMessages, setConvoMessages] = useState([])
  const [lastPetitionResult, setLastPetitionResult] = useState(() =>
    parseJson(localStorage.getItem('ghost:last-petition') || 'null', null),
  )
  const [lastTxHash, setLastTxHash] = useState('')
  const [demoFamily, setDemoFamily] = useState(null)
  const intervalRef = useRef(null)

  const refreshState = async () => {
    if (!contractAddress) {
      setContractHealthy(false)
      setContractError(
        'Missing contract address. Configure VITE_CONTRACT_ADDRESS or update the fallback address.',
      )
      return
    }
    try {
      const [sealed, vault, pers, execAddr] = await Promise.all([
        readClient.readContract({
          address: contractAddress,
          functionName: 'is_will_sealed',
          args: [],
        }),
        readClient.readContract({
          address: contractAddress,
          functionName: 'get_vault',
          args: [],
        }),
        readClient.readContract({
          address: contractAddress,
          functionName: 'get_persona',
          args: [],
        }),
        readClient.readContract({
          address: contractAddress,
          functionName: 'get_executor',
          args: [],
        }),
      ])

      setWillSealed(Boolean(sealed))
      setVaultBalance(BigInt(vault))
      setPersona(pers || '')
      setExecutor(execAddr || '')
      setContractHealthy(true)
      setContractError('')

      if (connectedAddress) {
        const isRegistered = await readClient.readContract({
          address: contractAddress,
          functionName: 'is_registered_heir',
          args: [connectedAddress],
        })

        if (isRegistered) {
          const [statusStr, logStr] = await Promise.all([
            readClient.readContract({
              address: contractAddress,
              functionName: 'get_heir_status',
              args: [connectedAddress],
            }),
            readClient.readContract({
              address: contractAddress,
              functionName: 'get_convo_log',
              args: [connectedAddress],
            }),
          ])

          const parsedStatus = parseJson(statusStr, null)
          const parsedLog = parseJson(logStr, [])
          setHeirStatus(parsedStatus)
          setConvoMessages(Array.isArray(parsedLog) ? parsedLog : [])
        } else {
          setHeirStatus(null)
          setConvoMessages([])
        }
      } else {
        setHeirStatus(null)
        setConvoMessages([])
      }
    } catch (error) {
      console.error('Failed to refresh contract state', error)
      setContractHealthy(false)
      setContractError(error?.message || 'Contract health check failed.')
    }
  }

  useEffect(() => {
    refreshState()
  }, [connectedAddress])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(refreshState, 8000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [connectedAddress])

  useEffect(() => {
    if (!window.ethereum) return undefined

    const handleAccountsChanged = (accounts) => {
      setConnectedAddress(accounts?.[0] || null)
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
    }
  }, [])

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is required to interact with Ghost.')
      return
    }
    try {
      setLoading(true)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setConnectedAddress(accounts[0])
      toast.success('Wallet connected.')
    } catch (error) {
      toast.error(error?.message || 'Wallet connection was rejected.')
    } finally {
      setLoading(false)
    }
  }

  const disconnectWallet = () => {
    setConnectedAddress(null)
    setHeirStatus(null)
    setConvoMessages([])
  }

  const executeWrite = async (functionName, args = [], valueWei = 0n) => {
    if (!window.ethereum || !connectedAddress) {
      toast.error('Please connect your wallet first.')
      return null
    }
    if (!contractAddress) {
      toast.error('Contract address is missing.')
      return null
    }

    setTxLoading(true)
    try {
      const writeClient = createWriteClient({
        account: connectedAddress,
        provider: window.ethereum,
      })
      await writeClient.connect('studionet')
      const hash = await writeClient.writeContract({
        address: contractAddress,
        functionName,
        args,
        value: valueWei,
      })
      setLastTxHash(hash)
      const receipt = await writeClient.waitForTransactionReceipt({
        hash,
        status: 'finalized',
      })
      await refreshState()
      toast.success(`${functionName} finalized.`)
      return receipt
    } catch (error) {
      console.error(`Failed transaction ${functionName}`, error)
      toast.error(error?.message || `Transaction failed for ${functionName}.`)
      throw error
    } finally {
      setTxLoading(false)
    }
  }

  const actions = {
    connectWallet,
    disconnectWallet,
    refreshState,
    setDemoFamily,
    async addPersona(text) {
      return executeWrite('add_to_persona', [text.trim()])
    },
    async setExecutorAddress(addr) {
      return executeWrite('set_executor', [addr])
    },
    async setLimits({ maxPerRequest, cooldown, inactivity }) {
      return executeWrite('set_limits', [toWei(maxPerRequest), BigInt(cooldown || 0), BigInt(inactivity || 0)])
    },
    async registerHeir({ address, name, socials, allocation }) {
      return executeWrite('register_heir', [address, name, socials, toWei(allocation)])
    },
    async deposit(amount) {
      return executeWrite('deposit', [], toWei(amount))
    },
    async heartbeat() {
      return executeWrite('heartbeat', [])
    },
    async sealWill() {
      return executeWrite('seal_will', [])
    },
    async forceSeal() {
      return executeWrite('force_seal_if_inactive', [])
    },
    async converse(message) {
      setConvoMessages((prev) => [...prev, { role: 'heir', text: message }])
      const receipt = await executeWrite('converse', [message])
      const result = extractContractResult(receipt)
      if (result?.soul_message) {
        setLastPetitionResult(null)
      }
      return receipt
    },
    async petition(message, amount) {
      const receipt = await executeWrite('petition', [message, toWei(amount)])
      const result = extractContractResult(receipt)
      if (result) {
        const normalized = {
          ...result,
          requested_amount: amount,
          txHash: receipt?.hash || '',
          createdAt: new Date().toISOString(),
        }
        setLastPetitionResult(normalized)
        localStorage.setItem('ghost:last-petition', JSON.stringify(normalized))
      }
      return receipt
    },
    async withdraw() {
      return executeWrite('withdraw', [])
    },
  }

  const derived = useMemo(
    () => ({
      canWithdraw: BigInt(heirStatus?.withdrawable || '0') > 0n,
      guardrailPreview(requestedAmount) {
        const requested = toWei(requestedAmount || '0')
        const remaining = BigInt(heirStatus?.remaining || '0')
        const withdrawable = BigInt(heirStatus?.withdrawable || '0')
        return {
          requested,
          remaining,
          withdrawable,
          maxPerRequest: null,
        }
      },
      toGen,
      toWei,
    }),
    [heirStatus],
  )

  const value = {
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
    lastTxHash,
    demoFamily,
    actions,
    derived,
  }

  return <GhostAppContext.Provider value={value}>{children}</GhostAppContext.Provider>
}

export function useGhostApp() {
  const context = useContext(GhostAppContext)
  if (!context) {
    throw new Error('useGhostApp must be used inside GhostAppProvider')
  }
  return context
}
