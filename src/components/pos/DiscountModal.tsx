import { useState } from 'react'
import { Modal } from '../ui'
import { useBasket } from '../../context/BasketContext'

const PRESETS = [5, 10, 15, 20]

export default function DiscountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { basketDiscountPercent, setBasketDiscountPercent } = useBasket()
  const [value, setValue] = useState(basketDiscountPercent || 0)

  function apply() {
    setBasketDiscountPercent(value)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Apply basket discount" width="max-w-sm">
      <p className="text-sm text-ink-500 mb-4">Applies a percentage discount across the whole basket, in addition to any member pricing already applied.</p>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setValue(p)}
            className={`btn ${value === p ? 'btn-primary' : 'btn-secondary'} !py-2.5`}
          >
            {p}%
          </button>
        ))}
      </div>
      <label className="label">Custom percentage</label>
      <input
        type="number"
        min={0}
        max={100}
        className="input mb-5"
        value={value}
        onChange={(e) => setValue(Math.max(0, Math.min(100, Number(e.target.value))))}
      />
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary" onClick={() => { setValue(0); setBasketDiscountPercent(0); onClose() }}>Remove discount</button>
        <button className="btn-primary" onClick={apply}>Apply {value}%</button>
      </div>
    </Modal>
  )
}
