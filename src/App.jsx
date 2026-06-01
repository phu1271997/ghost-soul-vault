import React, { useState, useEffect, useRef } from 'react';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { 
  Lock, 
  Unlock, 
  Send, 
  Coins, 
  Heart, 
  FileText, 
  UserCheck, 
  Settings, 
  Activity, 
  User, 
  Compass, 
  ShieldAlert,
  Loader2
} from 'lucide-react';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0xd7E043e3dcF9E96209E117627CB68f73E42bef69";

// Format BigInt wei to GEN string
const toGen = (weiBigInt) => {
  if (!weiBigInt) return "0";
  const weiStr = weiBigInt.toString().padStart(19, '0');
  const integerPart = weiStr.slice(0, -18);
  const fractionalPart = weiStr.slice(-18).replace(/0+$/, '');
  return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
};

// Format GEN string to BigInt wei
const toWei = (genStr) => {
  try {
    if (!genStr) return 0n;
    const parts = genStr.split('.');
    let integerPart = parts[0];
    let fractionalPart = parts[1] || '';
    fractionalPart = fractionalPart.slice(0, 18).padEnd(18, '0');
    return BigInt(integerPart) * 10n**18n + BigInt(fractionalPart);
  } catch (err) {
    return 0n;
  }
};

export default function App() {
  // Wallet state
  const [connectedAddress, setConnectedAddress] = useState(null);
  
  // Contract state
  const [willSealed, setWillSealed] = useState(false);
  const [vaultBalance, setVaultBalance] = useState(0n);
  const [persona, setPersona] = useState("");
  const [heirStatus, setHeirStatus] = useState(null);
  const [convoMessages, setConvoMessages] = useState([]);
  
  // UI Control state
  const [activeTab, setActiveTab] = useState("overview"); // overview, heir, owner
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  
  // Owner Form States
  const [personaInput, setPersonaInput] = useState("");
  const [executorInput, setExecutorInput] = useState("");
  const [limitMaxRequest, setLimitMaxRequest] = useState("");
  const [limitCooldown, setLimitCooldown] = useState("");
  const [limitInactivity, setLimitInactivity] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  
  // Heir Register States
  const [heirAddr, setHeirAddr] = useState("");
  const [heirNameInput, setHeirNameInput] = useState("");
  const [heirSocials, setHeirSocials] = useState('["https://api.github.com/users/octocat"]');
  const [heirAlloc, setHeirAlloc] = useState("");

  // Heir Action States
  const [chatMsg, setChatMsg] = useState("");
  const [petitionMsg, setPetitionMsg] = useState("");
  const [petitionAmt, setPetitionAmt] = useState("");

  // Chat scroll anchor
  const messagesEndRef = useRef(null);

  // Initialize readClient
  const readClient = createClient({ chain: studionet });

  // Connect user wallet via MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setLoading(true);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setConnectedAddress(accounts[0]);
      } catch (err) {
        console.error("Denied account access", err);
        alert("Could not connect to wallet: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    } else {
      alert("No Ethereum browser extension detected. Please install MetaMask to interact with this dApp.");
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setConnectedAddress(null);
    setHeirStatus(null);
    setConvoMessages([]);
  };

  // Fetch all public views
  const refreshState = async () => {
    if (!CONTRACT_ADDRESS) return;
    try {
      // 1. is_will_sealed
      const sealed = await readClient.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "is_will_sealed",
        args: []
      });
      setWillSealed(sealed);

      // 2. get_vault
      const vault = await readClient.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_vault",
        args: []
      });
      setVaultBalance(BigInt(vault));

      // 3. get_persona
      const pers = await readClient.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_persona",
        args: []
      });
      setPersona(pers);

      // 4. If wallet connected, get heir status & convo log
      if (connectedAddress) {
        try {
          const statusStr = await readClient.readContract({
            address: CONTRACT_ADDRESS,
            functionName: "get_heir_status",
            args: [connectedAddress]
          });
          const parsedStatus = JSON.parse(statusStr);
          setHeirStatus(parsedStatus);

          const logStr = await readClient.readContract({
            address: CONTRACT_ADDRESS,
            functionName: "get_convo_log",
            args: [connectedAddress]
          });
          setConvoMessages(JSON.parse(logStr));
        } catch (err) {
          // Connected address is not registered as an heir
          setHeirStatus(null);
          setConvoMessages([]);
        }
      }
    } catch (err) {
      console.error("Error loading contract views:", err);
    }
  };

  useEffect(() => {
    refreshState();
    // Auto-update if address changes
    if (window.ethereum) {
      const handleAccountsChange = (accounts) => {
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0]);
        } else {
          setConnectedAddress(null);
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChange);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChange);
      };
    }
  }, [connectedAddress]);

  // Periodic updates
  useEffect(() => {
    const interval = setInterval(refreshState, 8000);
    return () => clearInterval(interval);
  }, [connectedAddress]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convoMessages]);

  // Execute write transactions
  const executeWrite = async (functionName, args = [], valueWei = 0n) => {
    if (!window.ethereum || !connectedAddress) {
      alert("Please connect your wallet first!");
      return;
    }
    
    setTxLoading(true);
    try {
      const writeClient = createClient({
        chain: studionet,
        account: connectedAddress,
        provider: window.ethereum
      });

      // Confirm or trigger switch to correct chain
      await writeClient.connect("studionet");

      const txHash = await writeClient.writeContract({
        address: CONTRACT_ADDRESS,
        functionName,
        args,
        value: valueWei
      });

      await writeClient.waitForTransactionReceipt({
        hash: txHash,
        status: "finalized"
      });

      await refreshState();
      alert(`Transaction for '${functionName}' completed successfully!`);
    } catch (err) {
      console.error(`Transaction failed for ${functionName}:`, err);
      alert(`Transaction failed: ${err.message || err}`);
    } finally {
      setTxLoading(false);
    }
  };

  // Form Handlers
  const handleAddPersona = () => {
    if (!personaInput.trim()) return;
    executeWrite("add_to_persona", [personaInput.trim()]);
    setPersonaInput("");
  };

  const handleSetExecutor = () => {
    if (!executorInput) return;
    executeWrite("set_executor", [executorInput]);
    setExecutorInput("");
  };

  const handleSetLimits = () => {
    const maxVal = toWei(limitMaxRequest);
    const cooldownVal = BigInt(limitCooldown || 0);
    const inactivityVal = BigInt(limitInactivity || 0);
    executeWrite("set_limits", [maxVal, cooldownVal, inactivityVal]);
  };

  const handleRegisterHeir = () => {
    if (!heirAddr || !heirNameInput) return;
    const allocVal = toWei(heirAlloc);
    executeWrite("register_heir", [heirAddr, heirNameInput, heirSocials, allocVal]);
  };

  const handleDeposit = () => {
    const depVal = toWei(depositAmount);
    if (depVal <= 0n) return;
    executeWrite("deposit", [], depVal);
    setDepositAmount("");
  };

  const handleHeartbeat = () => {
    executeWrite("heartbeat", []);
  };

  const handleSealWill = () => {
    if (confirm("Are you sure you want to SEAL the will? The persona and heir configurations will be locked forever!")) {
      executeWrite("seal_will", []);
    }
  };

  const handleForceSeal = () => {
    executeWrite("force_seal_if_inactive", []);
  };

  // Heir Action Handlers
  const handleConverse = () => {
    if (!chatMsg.trim()) return;
    const msg = chatMsg.trim();
    setChatMsg("");
    // Optimistic insert
    setConvoMessages(prev => [...prev, { role: "heir", text: msg }]);
    executeWrite("converse", [msg]);
  };

  const handlePetition = () => {
    if (!petitionMsg.trim() || !petitionAmt) return;
    const msg = petitionMsg.trim();
    const amtVal = toWei(petitionAmt);
    setPetitionMsg("");
    setPetitionAmt("");
    executeWrite("petition", [msg, amtVal]);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="navbar">
        <a href="#" className="nav-brand">
          <Lock size={22} style={{ color: 'var(--color-gold)' }} />
          <span>GHOST</span> — Soul Vault
        </a>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {connectedAddress ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-teal flex-center" style={{ gap: '0.25rem' }}>
                <User size={12} />
                {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
              </span>
              <button className="btn btn-secondary" onClick={disconnectWallet}>
                Disconnect
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={connectWallet} disabled={loading}>
              {loading && <Loader2 size={16} className="spinner" />}
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {/* Main dashboard content */}
      <main className="container">
        {/* Status indicator bar */}
        <div className="status-bar">
          <div className="status-item">
            <span className="status-label">Will Status</span>
            <div className="status-value flex-center" style={{ gap: '0.4rem', justifyContent: 'flex-start' }}>
              {willSealed ? (
                <>
                  <Lock size={16} style={{ color: 'var(--success)' }} />
                  <span style={{ color: 'var(--success)' }}>SEALED (Deceased)</span>
                </>
              ) : (
                <>
                  <Unlock size={16} style={{ color: 'var(--warning)' }} />
                  <span style={{ color: 'var(--warning)' }}>SETUP (Alive)</span>
                </>
              )}
            </div>
          </div>
          
          <div className="status-item">
            <span className="status-label">Vault Balance</span>
            <span className="status-value" style={{ color: 'var(--color-gold)' }}>
              {toGen(vaultBalance)} GEN
            </span>
          </div>

          <div className="status-item" style={{ flex: 1 }}>
            <span className="status-label">Contract Address</span>
            <span className="status-value" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              {CONTRACT_ADDRESS || "No contract loaded"}
            </span>
          </div>

          {heirStatus && (
            <div className="status-item">
              <span className="status-label">Heir Identity</span>
              <span className="status-value" style={{ color: 'var(--color-teal)' }}>
                {heirStatus.name}
              </span>
            </div>
          )}
        </div>

        {/* Global transaction loading overlay */}
        {txLoading && (
          <div className="alert-box alert-warning flex-center" style={{ gap: '0.5rem' }}>
            <Loader2 className="spinner" size={18} />
            <span>Processing Intelligent Consensus Transaction on GenLayer network. Please wait...</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="view-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab("overview")}
          >
            <Compass size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
            Will Overview
          </button>
          
          <button 
            className={`tab-btn ${activeTab === 'heir' ? 'active' : ''}`}
            onClick={() => setActiveTab("heir")}
          >
            <Heart size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
            Conversational Portal (Heir)
          </button>

          <button 
            className={`tab-btn ${activeTab === 'owner' ? 'active' : ''}`}
            onClick={() => setActiveTab("owner")}
          >
            <Settings size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
            Will Custody (Owner)
          </button>
        </div>

        {/* 1. WILL OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid-2">
            <div className="glass-panel">
              <h2>Family Legacy & Value Persona</h2>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '10px', minHeight: '150px', border: '1px solid var(--border-light)', whiteSpace: 'pre-wrap' }}>
                {persona || "No values added to this persona yet. The owner can record diary notes in the Owner tab."}
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  * The legacy values are written permanently into the Intelligent Contract storage and evaluated on-chain by the validator consensus.
                </p>
              </div>
            </div>

            <div className="glass-panel">
              <h2>Emergency Seals</h2>
              <p style={{ marginBottom: '1.25rem' }}>
                If the owner passes away and has not sealed the will, the dead-man's switch allows any user to seal it if the inactivity period limit has expired.
              </p>
              <button 
                className="btn btn-secondary flex-center" 
                style={{ width: '100%', gap: '0.5rem', border: '1px solid var(--error)', color: 'var(--error)' }}
                onClick={handleForceSeal}
                disabled={willSealed}
              >
                <ShieldAlert size={18} />
                Force Seal (Dead-Man's Switch)
              </button>
              
              <div style={{ marginTop: '2rem' }}>
                <h2>How It Works</h2>
                <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.25rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li><strong>Setup</strong>: Owner configures legacy values, limits, and addresses for heirs.</li>
                  <li><strong>Seal</strong>: The owner seals the will. From this point, no values can be updated.</li>
                  <li><strong>Conversation</strong>: Heirs chat with the AI Spirit to build context.</li>
                  <li><strong>Petition</strong>: Heirs submit payout requests. The consensus engine renders the heir's social profiles and evaluates whether their lifestyle aligns with the values to unlock GEN tokens.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 2. CONVERSATIONAL PORTAL (HEIR) */}
        {activeTab === 'heir' && (
          <div>
            {!willSealed ? (
              <div className="glass-panel flex-center" style={{ flexDirection: 'column', padding: '4rem 2rem', gap: '1.25rem' }}>
                <Unlock size={64} style={{ color: 'var(--warning)' }} />
                <h3>Will is Not Active Yet</h3>
                <p style={{ textAlign: 'center', maxWidth: '500px' }}>
                  This conversational portal and inheritance evaluation process are only unlocked once the owner has sealed the contract (post-mortem phase).
                </p>
              </div>
            ) : !heirStatus ? (
              <div className="glass-panel flex-center" style={{ flexDirection: 'column', padding: '4rem 2rem', gap: '1.25rem' }}>
                <UserCheck size={64} style={{ color: 'var(--text-muted)' }} />
                <h3>Not a Registered Heir</h3>
                <p style={{ textAlign: 'center', maxWidth: '500px' }}>
                  Your connected address ({connectedAddress || "no wallet connected"}) is not registered as an heir in this Intelligent Contract. Please connect the registered heir account.
                </p>
                {!connectedAddress && (
                  <button className="btn btn-primary" onClick={connectWallet}>Connect Wallet</button>
                )}
              </div>
            ) : (
              <div className="grid-2">
                {/* Chat Panel */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="flex-between">
                    <h2>Chat with Legacy Soul</h2>
                    <span className="badge badge-gold">Spiritual Connection</span>
                  </div>
                  <p style={{ fontSize: '0.85rem' }}>Trò chuyện tâm sự để ông/cha hiểu thêm về cuộc sống của bạn trước khi xin thừa kế.</p>
                  
                  <div className="chat-container">
                    <div className="chat-messages">
                      {convoMessages.length === 0 ? (
                        <div className="flex-center" style={{ height: '100%', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
                          <Activity size={24} />
                          <span>No conversation records. Say hello to start connecting.</span>
                        </div>
                      ) : (
                        convoMessages.map((msg, idx) => {
                          if (msg.role === "release") {
                            return (
                              <div key={idx} className="chat-bubble-release">
                                💸 Released: {toGen(BigInt(msg.text))} GEN to heir
                              </div>
                            );
                          }
                          return (
                            <div key={idx} className={`chat-bubble ${msg.role === 'soul' ? 'chat-bubble-soul' : 'chat-bubble-heir'}`}>
                              <div className="chat-bubble-role">{msg.role === 'soul' ? 'Soul' : 'You'}</div>
                              <div>{msg.text}</div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="chat-input-bar">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Tâm sự điều gì đó..." 
                        value={chatMsg}
                        onChange={(e) => setChatMsg(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConverse()}
                      />
                      <button className="btn btn-teal" onClick={handleConverse}>
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Petition Panel */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h2>Petition Legacy Vault</h2>
                  
                  {/* Heir Metrics */}
                  <div className="grid-3" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                    <div>
                      <span className="status-label">Total Allocated</span>
                      <div style={{ fontWeight: '700' }}>{toGen(BigInt(heirStatus.allocation))} GEN</div>
                    </div>
                    <div>
                      <span className="status-label">Released</span>
                      <div style={{ fontWeight: '700', color: 'var(--success)' }}>{toGen(BigInt(heirStatus.released))} GEN</div>
                    </div>
                    <div>
                      <span className="status-label">Remaining</span>
                      <div style={{ fontWeight: '700', color: 'var(--color-gold)' }}>{toGen(BigInt(heirStatus.remaining))} GEN</div>
                    </div>
                  </div>

                  <div className="alert-box alert-info">
                    <span>
                      Khi bạn xin giải ngân, AI Agent sẽ quét các mạng xã hội đã đăng ký của bạn để đánh giá lối sống thực tế và sự phù hợp với các giá trị gia đình.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Requested Payout (GEN)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      className="form-control" 
                      placeholder="e.g. 0.5" 
                      value={petitionAmt}
                      onChange={(e) => setPetitionAmt(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reason / Statement to the Soul</label>
                    <textarea 
                      className="form-control" 
                      placeholder="Explain what this allocation will be used for..." 
                      value={petitionMsg}
                      onChange={(e) => setPetitionMsg(e.target.value)}
                    />
                  </div>

                  <button className="btn btn-primary flex-center" onClick={handlePetition} style={{ width: '100%', gap: '0.5rem' }}>
                    <Coins size={18} />
                    Submit Petition
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. WILL CUSTODY (OWNER) */}
        {activeTab === 'owner' && (
          <div>
            {willSealed ? (
              <div className="glass-panel flex-center" style={{ flexDirection: 'column', padding: '4rem 2rem', gap: '1.25rem' }}>
                <Lock size={64} style={{ color: 'var(--success)' }} />
                <h3>Will is Sealed</h3>
                <p style={{ textAlign: 'center', maxWidth: '500px' }}>
                  The will has been finalized and sealed. Owner configuration tools are permanently disabled to guarantee the integrity of the legacy.
                </p>
              </div>
            ) : (
              <div className="grid-2">
                {/* Setup settings */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2>Will Customization</h2>

                  <div className="form-group">
                    <label className="form-label">Record Legacy Diary Note / Value</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Nạp nhật ký / châm ngôn sống của bạn..." 
                        value={personaInput}
                        onChange={(e) => setPersonaInput(e.target.value)}
                      />
                      <button className="btn btn-teal" onClick={handleAddPersona}>Record</button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Set Executor Address</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="0x..." 
                        value={executorInput}
                        onChange={(e) => setExecutorInput(e.target.value)}
                      />
                      <button className="btn btn-secondary" onClick={handleSetExecutor}>Set</button>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Vault Payout Rules</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Max Release Per Request (GEN)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="e.g. 2.5" 
                        value={limitMaxRequest}
                        onChange={(e) => setLimitMaxRequest(e.target.value)}
                      />
                    </div>

                    <div className="grid-2" style={{ gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Cooldown Between Requests (Seconds)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="e.g. 60" 
                          value={limitCooldown}
                          onChange={(e) => setLimitCooldown(e.target.value)}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Inactivity Trigger (Seconds)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="e.g. 3600" 
                          value={limitInactivity}
                          onChange={(e) => setLimitInactivity(e.target.value)}
                        />
                      </div>
                    </div>

                    <button className="btn btn-primary" onClick={handleSetLimits} style={{ width: '100%' }}>
                      Apply Payout Rules
                    </button>
                  </div>
                </div>

                {/* Heir registration & assets */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2>Asset Funding & Beneficiaries</h2>

                  <div className="form-group">
                    <label className="form-label">Deposit Fund to Vault (GEN)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="e.g. 10" 
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                      />
                      <button className="btn btn-teal" onClick={handleDeposit}>Deposit</button>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Register Beneficiary (Heir)</h3>

                    <div className="form-group">
                      <label className="form-label">Heir Wallet Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="0x..." 
                        value={heirAddr}
                        onChange={(e) => setHeirAddr(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Heir Name / Relationship</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. Con trai cả" 
                        value={heirNameInput}
                        onChange={(e) => setHeirNameInput(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Social Media Scrape Profiles (JSON list of URLs)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder='["https://api.github.com/users/octocat"]' 
                        value={heirSocials}
                        onChange={(e) => setHeirSocials(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Total Heir Allocation Limit (GEN)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="e.g. 50" 
                        value={heirAlloc}
                        onChange={(e) => setHeirAlloc(e.target.value)}
                      />
                    </div>

                    <button className="btn btn-secondary" onClick={handleRegisterHeir} style={{ width: '100%', borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}>
                      Register Heir
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-teal flex-center" onClick={handleHeartbeat} style={{ flex: 1, gap: '0.4rem' }}>
                      <Heart size={16} />
                      Keep-Alive Heartbeat
                    </button>

                    <button className="btn btn-danger flex-center" onClick={handleSealWill} style={{ flex: 1, gap: '0.4rem' }}>
                      <Lock size={16} />
                      Seal Will Forever
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
