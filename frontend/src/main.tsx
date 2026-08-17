import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserQRCodeReader } from '@zxing/browser'
import './styles.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type ScanResult = any

function App() {
  const [tab, setTab] = useState<'receive'|'admin'>('receive')
  const [scan, setScan] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const refresh = async (sessionId = session?.id) => {
    try { setStatus(await (await fetch(`${API}/api/dashboard`)).json()) } catch {}
    if (sessionId) {
      try { setSession(await (await fetch(`${API}/api/receiving-sessions/${sessionId}`)).json()) } catch {}
    }
  }

  useEffect(() => { refresh(); inputRef.current?.focus() }, [])

  const startSession = async () => {
    const r = await fetch(`${API}/api/receiving-sessions`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({opened_by:'MSH staff'})
    })
    const data = await r.json()
    setSession(data)
    setResult({kind:'session_started'})
    setTimeout(()=>inputRef.current?.focus(), 0)
  }

  const submitScan = async (value = scan) => {
    const v = value.trim()
    if (!v) return
    if (!session?.id) {
      setResult({kind:'error', message:'Start a receiving session first.'})
      return
    }
    setBusy(true)
    try {
      const r = await fetch(`${API}/api/scan`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({value:v, session_id:session.id})
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Scan failed')
      if (data.kind === 'shipment_url') {
        const ir = await fetch(`${API}/api/shipments/import-url`, {
          method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url:v})
        })
        const imported = await ir.json()
        if (!ir.ok) throw new Error(imported.detail || 'Shipment import failed')
        setResult({kind:'shipment_imported', ...imported})
      } else setResult(data)
      setScan('')
      await refresh(session.id)
    } catch (e:any) {
      setResult({kind:'error', message:e.message})
    } finally {
      setBusy(false)
      setTimeout(()=>inputRef.current?.focus(), 0)
    }
  }

  const scanQrWithCamera = async () => {
    if (!session?.id) {
      setResult({kind:'error', message:'Start a receiving session first.'})
      return
    }
    setCameraOpen(true)
    setResult(null)
    setTimeout(async () => {
      if (!videoRef.current) return
      try {
        const reader = new BrowserQRCodeReader()
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (decoded) => {
          if (!decoded) return
          controls.stop()
          setCameraOpen(false)
          submitScan(decoded.getText())
        })
      } catch (e:any) {
        setCameraOpen(false)
        setResult({kind:'error', message:`Camera QR scan failed: ${e.message}`})
      }
    }, 60)
  }

  const importFile = async (file: File, endpoint: string) => {
    const form = new FormData(); form.append('file', file)
    setBusy(true)
    try {
      const r = await fetch(`${API}${endpoint}`, {method:'POST', body:form})
      const data = await r.json()
      setResult(r.ok ? {kind:'imported', ...data} : {kind:'error', message:data.detail || 'Import failed'})
      refresh()
    } finally { setBusy(false) }
  }

  const card = (() => {
    if (!result) return <div className="empty">Start receiving, scan a Macron QR to load the shipment, scan the physical box barcode, then scan garments.</div>
    if (result.kind === 'session_started') return <div className="result good"><b>Receiving session started</b><span>Use the phone camera for Macron's square QR, then use the Bluetooth scanner for box and garment barcodes.</span></div>
    if (result.kind === 'product' && result.accepted) {
      return <div className="result good allocation">
        <span className="eyebrow">PUT INTO ORDER</span>
        <b>{result.reference_note || `Macron order ${result.macron_order_id}`}</b>
        <span>{result.name} · {result.size}</span>
        <span className="progress">This box: {result.line_progress.scanned}/{result.line_progress.expected_in_box}</span>
      </div>
    }
    if (result.kind === 'product' && result.needs_box) return <div className="result warn"><b>Scan the box first</b><span>{result.message}</span></div>
    if (result.kind === 'product' && result.reason === 'wrong_box') return <div className="result bad"><span className="eyebrow">WRONG BOX</span><b>Do not allocate this yet</b><span>{result.message}</span></div>
    if (result.kind === 'product' && result.reason === 'over_scan') return <div className="result bad"><span className="eyebrow">EXTRA ITEM</span><b>Expected quantity already reached</b><span>{result.message}</span></div>
    if (result.kind === 'product' && result.reason === 'ambiguous') return <div className="result warn"><b>Needs checking</b><span>{result.message}</span></div>
    if (result.kind === 'box' && result.matched) return <div className="result good"><span className="eyebrow">ACTIVE BOX</span><b>{result.box_code}</b><span>Macron delivery {result.delivery_number}. Garment scans are now checked against this exact box.</span></div>
    if (result.kind === 'shipment_imported') return <div className="result good"><span className="eyebrow">SHIPMENT LOADED</span><b>Delivery {result.delivery_number}</b><span>{result.total_boxes ?? '?'} boxes · {result.total_pieces ?? '?'} pieces · validation passed</span></div>
    if (result.kind === 'imported') return <div className="result good"><b>Import complete</b><span>{result.orders_processed ? `${result.orders_processed} orders · ${result.lines_processed} lines` : 'Packing list loaded'}</span></div>
    if (result.kind === 'error') return <div className="result bad"><b>Something went wrong</b><span>{result.message}</span></div>
    return <div className="result bad"><b>Not recognised</b><span>{result.value || result.derived_box_code || result.message || 'No match found'}</span></div>
  })()

  return <main>
    <header>
      <div><div className="brand">MSH OPS</div><div className="sub">Receiving</div></div>
      <nav><button className={tab==='receive'?'active':''} onClick={()=>setTab('receive')}>Receive</button><button className={tab==='admin'?'active':''} onClick={()=>setTab('admin')}>Admin</button></nav>
    </header>

    {tab==='receive' ? <section className="receive">
      <div className="hero"><h1>Scan & sort</h1><p>A DHL arrival can contain several Macron shipments. MSH Ops keeps the shipment, box and order relationships separate automatically.</p></div>
      {!session?.id ? <button className="primary big" onClick={startSession}>Start receiving</button> : <>
        <div className="sessionLine"><span>Session #{session.id} · {session.verified_items ?? 0} verified</span><b>{session.active_box_code ? `Active: ${session.active_box_code}` : 'No active box'}</b></div>
        <button className="cameraButton" onClick={scanQrWithCamera} disabled={busy}>Scan Macron QR with phone camera</button>
        {cameraOpen && <div className="camera"><video ref={videoRef} /></div>}
        <form onSubmit={e=>{e.preventDefault(); submitScan()}} className="scanbar">
          <input ref={inputRef} value={scan} onChange={e=>setScan(e.target.value)} placeholder="Bluetooth scanner input…" autoComplete="off" autoCapitalize="off" />
          <button disabled={busy}>{busy ? 'Working…' : 'Scan'}</button>
        </form>
        <p className="hint">For garments, aim the scanner at the lower Macron barcode such as <b>80000456090005</b>, not the retail EAN above it.</p>
      </>}
      {card}
      <div className="stats">
        <div><b>{status?.orders ?? 0}</b><span>Orders</span></div>
        <div><b>{status?.shipments ?? 0}</b><span>Shipments</span></div>
        <div><b>{status?.verified_items ?? 0}</b><span>Verified</span></div>
      </div>
    </section> : <section className="admin">
      <h1>Admin</h1>
      <div className="uploadCard"><h2>Import Macron order CSV</h2><p>Upload order exports from the PC as orders are placed. Re-importing an existing Macron order updates the stored lines.</p><input type="file" accept=".csv,text/csv" onChange={e=>e.target.files?.[0] && importFile(e.target.files[0], '/api/orders/import-csv')} /></div>
      <div className="uploadCard"><h2>Packing-list PDF fallback</h2><p>Normal receiving uses the DataDea QR automatically. Manual PDF upload remains available only as a recovery route.</p><input type="file" accept="application/pdf" onChange={e=>e.target.files?.[0] && importFile(e.target.files[0], '/api/shipments/import-pdf')} /></div>
      {card}
    </section>}
  </main>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
