import React, { useState } from 'react'
import { Delete, X, CornerDownLeft, Space, Type } from 'lucide-react'

interface VirtualKeyboardProps {
  isOpen: boolean
  onClose: () => void
  value: string
  onChange: (val: string) => void
  onEnter?: () => void
  title?: string
}

export default function VirtualKeyboard({
  isOpen,
  onClose,
  value,
  onChange,
  onEnter,
  title = 'Touch Screen Keyboard'
}: VirtualKeyboardProps): React.JSX.Element | null {
  const [isCaps, setIsCaps] = useState(false)

  if (!isOpen) return null

  const row1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-']
  const row2 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']
  const row3 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l']
  const row4 = ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.']

  const handleKeyPress = (char: string) => {
    const nextChar = isCaps ? char.toUpperCase() : char
    onChange(value + nextChar)
  }

  const handleBackspace = () => {
    onChange(value.slice(0, -1))
  }

  const handleClear = () => {
    onChange('')
  }

  const handleEnterKey = () => {
    if (onEnter) onEnter()
    onClose()
  }

  return (
    <div className="vk-container" onClick={(e) => e.stopPropagation()}>
      <div className="vk-header">
        <div className="vk-title">
          <Type size={16} color="#ff5252" />
          <span>{title}</span>
        </div>
        <div className="vk-preview">
          <input
            type="text"
            className="vk-preview-input"
            value={value}
            readOnly
            placeholder="Type text using touch..."
          />
        </div>
        <button className="vk-close-btn" onClick={onClose} title="Close Keyboard">
          <X size={18} />
        </button>
      </div>

      <div className="vk-rows">
        {/* Numbers Row */}
        <div className="vk-row">
          {row1.map((key) => (
            <button key={key} type="button" className="vk-key" onClick={() => handleKeyPress(key)}>
              {key}
            </button>
          ))}
          <button type="button" className="vk-key vk-key-action danger" onClick={handleBackspace} title="Backspace">
            <Delete size={18} />
          </button>
        </div>

        {/* Top Row QWERTY */}
        <div className="vk-row">
          {row2.map((key) => (
            <button key={key} type="button" className="vk-key" onClick={() => handleKeyPress(key)}>
              {isCaps ? key.toUpperCase() : key}
            </button>
          ))}
        </div>

        {/* Home Row ASDF */}
        <div className="vk-row" style={{ paddingLeft: '12px', paddingRight: '12px' }}>
          {row3.map((key) => (
            <button key={key} type="button" className="vk-key" onClick={() => handleKeyPress(key)}>
              {isCaps ? key.toUpperCase() : key}
            </button>
          ))}
        </div>

        {/* Bottom Row ZXCV */}
        <div className="vk-row">
          <button
            type="button"
            className={`vk-key vk-key-action ${isCaps ? 'active' : ''}`}
            onClick={() => setIsCaps(!isCaps)}
          >
            Caps
          </button>
          {row4.map((key) => (
            <button key={key} type="button" className="vk-key" onClick={() => handleKeyPress(key)}>
              {isCaps ? key.toUpperCase() : key}
            </button>
          ))}
          <button type="button" className="vk-key vk-key-action" onClick={handleClear}>
            Clear
          </button>
        </div>

        {/* Space & Enter Row */}
        <div className="vk-row">
          <button type="button" className="vk-key vk-key-space" onClick={() => handleKeyPress(' ')}>
            <Space size={18} style={{ marginRight: '6px' }} /> Space
          </button>
          <button type="button" className="vk-key vk-key-enter" onClick={handleEnterKey}>
            <CornerDownLeft size={18} style={{ marginRight: '6px' }} /> Done / Search
          </button>
        </div>
      </div>
    </div>
  )
}
