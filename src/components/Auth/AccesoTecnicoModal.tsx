'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './AccesoTecnicoModal.module.css';
import { usePanelStore } from '@/store/usePanelStore';

interface AccesoTecnicoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Credenciales predeterminadas de ingeniería (modificables por variables de entorno)
const DEFAULT_PIN = process.env.NEXT_PUBLIC_TECNICO_PIN || '080816';
const DEFAULT_CLAVE = process.env.NEXT_PUBLIC_TECNICO_CLAVE || 'ROSES_FRENZ';

export default function AccesoTecnicoModal({ isOpen, onClose }: AccesoTecnicoModalProps) {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const claveInputRef = useRef<HTMLInputElement | null>(null);

  const setEsGestor = usePanelStore((state) => state.setEsGestor);

  // Reiniciar estado al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setPaso(1);
      setPinDigits(['', '', '', '', '', '']);
      setClave('');
      setError(null);
      setIsShaking(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  // Tecla Escape para salir
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const triggerError = (msg: string) => {
    setError(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  // Manejo de dígitos del PIN
  const handlePinChange = (index: number, value: string) => {
    setError(null);
    const cleaned = value.replace(/\D/g, '');

    // Soporte para pegar los 6 dígitos de golpe
    if (cleaned.length === 6 && index === 0) {
      const arr = cleaned.split('');
      setPinDigits(arr);
      verificarPin(cleaned);
      return;
    }

    const lastChar = cleaned.slice(-1);
    const newArr = [...pinDigits];
    newArr[index] = lastChar;
    setPinDigits(newArr);

    if (lastChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const pinCompleto = newArr.join('');
    if (pinCompleto.length === 6) {
      verificarPin(pinCompleto);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verificarPin = (pin: string) => {
    if (pin === DEFAULT_PIN) {
      setError(null);
      setPaso(2);
      setTimeout(() => claveInputRef.current?.focus(), 150);
    } else {
      triggerError('PIN de identificación incorrecto.');
      setPinDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  };

  const handleClaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clave.trim()) {
      triggerError('Por favor ingresa la clave institucional.');
      return;
    }

    if (clave.trim() === DEFAULT_CLAVE) {
      // Éxito: Doble Llave superada
      setEsGestor(true);
      onClose();
    } else {
      triggerError('Clave institucional incorrecta.');
      setClave('');
      setTimeout(() => claveInputRef.current?.focus(), 100);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`${styles.modalCard} ${isShaking ? styles.modalCardError : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleArea}>
            <div className={styles.iconWrapper}>
              {/* Ícono de Credencial Técnica Oficial (no llave) */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <circle cx="12" cy="10" r="3" />
                <path d="M7 17c0-2 2.2-3 5-3s5 1 5 3" />
                <line x1="9" y1="2" x2="15" y2="2" />
              </svg>
            </div>
            <div>
              <h2 className={styles.titleMain}>Acceso Técnico Municipal</h2>
              <span className={styles.titleSub}>Validación de Seguridad por Doble Llave</span>
            </div>
          </div>

          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar ventana">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Indicador de 2 Pasos */}
        <div className={styles.stepsBar}>
          <div className={`${styles.stepPill} ${paso === 1 ? styles.stepPillActive : styles.stepPillCompleted}`}>
            <span>Paso 1: PIN (6 dígitos)</span>
          </div>
          <div className={styles.stepDivider} />
          <div className={`${styles.stepPill} ${paso === 2 ? styles.stepPillActive : ''}`}>
            <span>Paso 2: Clave Equipo</span>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className={styles.modalBody}>
          {paso === 1 ? (
            <div>
              <p className={styles.promptText}>
                Ingresa el <strong>PIN de Identificación</strong> de 6 dígitos asignado para las operaciones:
              </p>

              <div className={styles.pinContainer}>
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(idx, e)}
                    className={styles.pinInput}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleClaveSubmit}>
              <p className={styles.promptText}>
                PIN validado con éxito. Ahora ingresa la <strong>Clave Institucional</strong> del equipo técnico:
              </p>

              <div className={styles.claveInputWrapper}>
                <label className={styles.claveLabel} htmlFor="clave-institucional">
                  Palabra Clave de Seguridad:
                </label>
                <input
                  id="clave-institucional"
                  ref={claveInputRef}
                  type="password"
                  value={clave}
                  onChange={(e) => {
                    setError(null);
                    setClave(e.target.value);
                  }}
                  placeholder="Escribe la clave institucional..."
                  className={styles.claveInput}
                  autoComplete="current-password"
                />
              </div>

              <div className={styles.actionButtons}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    setPaso(1);
                    setPinDigits(['', '', '', '', '', '']);
                    setTimeout(() => inputRefs.current[0]?.focus(), 100);
                  }}
                >
                  Volver al PIN
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Autenticar Sesión
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className={styles.errorNotice} role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
